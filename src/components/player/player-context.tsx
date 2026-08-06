"use client";

import * as React from "react";

import type { Track } from "@/lib/jamendo";

type RepeatMode = "off" | "all" | "one";

interface PlayerContextValue {
  queue: Track[];
  queueIndex: number;
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  queueOpen: boolean;
  vizEnabled: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  analyserRef: React.RefObject<AnalyserNode | null>;
  playQueue: (tracks: Track[], startIndex?: number) => void;
  playTrack: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setQueueOpen: (open: boolean) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  jumpTo: (index: number) => void;
}

const PlayerContext = React.createContext<PlayerContextValue | null>(null);

const VOLUME_KEY = "phonq:volume";

function shuffledIndex(current: number, length: number): number {
  if (length <= 1) return current;
  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * length);
  }
  return next;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const corsCacheRef = React.useRef(new Map<string, boolean>());
  const pendingUrlRef = React.useRef<string | null>(null);
  const lastReportedRef = React.useRef<string | null>(null);

  const [queue, setQueue] = React.useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = React.useState(-1);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolumeState] = React.useState(() => {
    if (typeof window === "undefined") return 0.8;
    const saved = Number(window.localStorage.getItem(VOLUME_KEY));
    return Number.isFinite(saved) && saved >= 0 && saved <= 1 ? saved : 0.8;
  });
  const [muted, setMuted] = React.useState(false);
  const [shuffle, setShuffle] = React.useState(false);
  const [repeat, setRepeat] = React.useState<RepeatMode>("off");
  const [queueOpen, setQueueOpen] = React.useState(false);
  const [vizEnabled, setVizEnabled] = React.useState(false);

  const queueRef = React.useRef(queue);
  const queueIndexRef = React.useRef(queueIndex);
  const shuffleRef = React.useRef(shuffle);
  const repeatRef = React.useRef(repeat);
  const currentTrackRef = React.useRef<Track | null>(null);

  React.useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  React.useEffect(() => {
    queueIndexRef.current = queueIndex;
  }, [queueIndex]);
  React.useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);
  React.useEffect(() => {
    repeatRef.current = repeat;
  }, [repeat]);

  const currentTrack = queueIndex >= 0 && queueIndex < queue.length ? queue[queueIndex] : null;

  React.useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  /** Probes whether a Jamendo storage origin allows cross-origin audio (per-origin, once). */
  const probeCors = React.useCallback(async (url: string): Promise<boolean> => {
    let origin: string;
    try {
      origin = new URL(url).origin;
    } catch {
      return false;
    }
    const cached = corsCacheRef.current.get(origin);
    if (cached !== undefined) return cached;
    try {
      const res = await fetch(url, { method: "GET", headers: { Range: "bytes=0-1" }, mode: "cors" });
      const allowed = res.headers.get("access-control-allow-origin") !== null;
      corsCacheRef.current.set(origin, allowed);
      return allowed;
    } catch {
      corsCacheRef.current.set(origin, false);
      return false;
    }
  }, []);

  /** Sets up the Web Audio analyser chain once CORS is confirmed. */
  const ensureVisualizer = React.useCallback(async () => {
    if (analyserRef.current || typeof window === "undefined") return;
    const audio = audioRef.current;
    if (!audio) return;
    try {
      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.85;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
      setVizEnabled(true);
      if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
    } catch {
      setVizEnabled(false);
    }
  }, []);

  const reportHistory = React.useCallback(() => {
    const track = currentTrackRef.current;
    if (!track || lastReportedRef.current === track.id) return;
    lastReportedRef.current = track.id;
    void fetch("/api/me/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId: track.id }),
    }).catch(() => undefined);
  }, []);

  const next = React.useCallback(() => {
    const q = queueRef.current;
    const len = q.length;
    if (len === 0) return;
    let idx = queueIndexRef.current;
    if (shuffleRef.current) {
      idx = shuffledIndex(idx, len);
    } else if (idx < len - 1) {
      idx += 1;
    } else if (repeatRef.current === "all") {
      idx = 0;
    } else {
      setIsPlaying(false);
      return;
    }
    setQueueIndex(idx);
  }, []);

  const previous = React.useCallback(() => {
    const audio = audioRef.current;
    const idx = queueIndexRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    if (idx > 0) setQueueIndex(idx - 1);
  }, []);

  const playQueue = React.useCallback((tracks: Track[], startIndex = 0) => {
    if (tracks.length === 0) return;
    setQueue(tracks);
    setQueueIndex(Math.max(0, Math.min(startIndex, tracks.length - 1)));
  }, []);

  const playTrack = React.useCallback(
    (track: Track, contextQueue?: Track[]) => {
      if (contextQueue && contextQueue.length > 0) {
        const idx = contextQueue.findIndex((t) => t.id === track.id);
        playQueue(contextQueue, idx >= 0 ? idx : 0);
      } else {
        playQueue([track], 0);
      }
    },
    [playQueue],
  );

  const jumpTo = React.useCallback((index: number) => {
    const q = queueRef.current;
    if (index < 0 || index >= q.length) return;
    setQueueIndex(index);
  }, []);

  const removeFromQueue = React.useCallback((index: number) => {
    const q = queueRef.current;
    if (index < 0 || index >= q.length) return;
    const current = queueIndexRef.current;
    const nextQueue = q.filter((_, i) => i !== index);
    setQueue(nextQueue);
    if (index < current) {
      setQueueIndex(current - 1);
    } else if (index === current) {
      setQueueIndex(nextQueue.length === 0 ? -1 : Math.min(current, nextQueue.length - 1));
    }
  }, []);

  const clearQueue = React.useCallback(() => {
    setQueue([]);
    setQueueIndex(-1);
  }, []);

  const seek = React.useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = React.useCallback((value: number) => {
    const clamped = Math.max(0, Math.min(1, value));
    setVolumeState(clamped);
    if (audioRef.current) audioRef.current.volume = clamped;
    try {
      window.localStorage.setItem(VOLUME_KEY, String(clamped));
    } catch {
      /* private mode */
    }
    if (clamped > 0) setMuted(false);
  }, []);

  const toggleMute = React.useCallback(() => setMuted((m) => !m), []);

  const toggleShuffle = React.useCallback(() => setShuffle((s) => !s), []);

  const cycleRepeat = React.useCallback(() => {
    setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"));
  }, []);

  const togglePlay = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrackRef.current) return;
    if (audio.paused) {
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, []);

  /** Load and play whenever the current track changes. */
  React.useEffect(() => {
    const audio = audioRef.current;
    const track = currentTrack;
    if (!audio || !track) return;

    const url = track.audioUrl;
    pendingUrlRef.current = url;
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);

    void probeCors(url).then((allowed) => {
      if (pendingUrlRef.current !== url) return;
      const el = audioRef.current;
      if (!el) return;
      if (allowed) el.crossOrigin = "anonymous";
      if (el.src !== url) {
        el.src = url;
        el.load();
      }
      void el.play().catch(() => setIsPlaying(false));
      if (allowed) void ensureVisualizer();
    });
  }, [currentTrack, probeCors, ensureVisualizer]);

  /** Sync volume. */
  React.useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = muted ? 0 : volume;
  }, [volume, muted]);

  /** Wire media events once. */
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onPlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      reportHistory();
    };
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      if (repeatRef.current === "one") {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          void audioRef.current.play().catch(() => undefined);
        }
      } else {
        next();
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [next, reportHistory]);

  const value = React.useMemo<PlayerContextValue>(
    () => ({
      queue,
      queueIndex,
      currentTrack,
      isPlaying,
      isLoading,
      currentTime,
      duration,
      volume,
      muted,
      shuffle,
      repeat,
      queueOpen,
      vizEnabled,
      audioRef,
      analyserRef,
      playQueue,
      playTrack,
      togglePlay,
      next,
      previous,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      setQueueOpen,
      removeFromQueue,
      clearQueue,
      jumpTo,
    }),
    [
      queue,
      queueIndex,
      currentTrack,
      isPlaying,
      isLoading,
      currentTime,
      duration,
      volume,
      muted,
      shuffle,
      repeat,
      queueOpen,
      vizEnabled,
      playQueue,
      playTrack,
      togglePlay,
      next,
      previous,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      removeFromQueue,
      clearQueue,
      jumpTo,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>
      <audio ref={audioRef} preload="none" className="hidden" />
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const ctx = React.useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within a PlayerProvider");
  return ctx;
}

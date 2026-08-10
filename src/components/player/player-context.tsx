"use client";

import * as React from "react";

import { useSession } from "next-auth/react";

import { YouTubeEngine, type YouTubeEngineHandle, type YouTubeEngineState } from "@/components/player/youtube-engine";
import type { Track } from "@/lib/jamendo";
import { reorderWithIndex } from "@/lib/utils";

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
  favoriteIds: Set<string>;
  setFavorite: (trackId: string, liked: boolean) => void;
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
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  jumpTo: (index: number) => void;
}

const PlayerContext = React.createContext<PlayerContextValue | null>(null);

const VOLUME_KEY = "phonq:volume";

const JAMENDO_STREAM_HOSTS = new Set([
  "api.jamendo.com",
  "prod-1.storage.jamendo.com",
  "prod-2.storage.jamendo.com",
  "prod-3.storage.jamendo.com",
  "mp3.jamendo.com",
  "mp3d.jamendo.com",
]);

/**
 * Routes a Jamendo stream through our CORS-safe proxy so the browser can play
 * it (Jamendo's CDN serves tracks without `Access-Control-Allow-Origin`).
 * Non-Jamendo URLs are passed through untouched.
 */
function proxiedAudioUrl(track: Track | null): string {
  if (!track?.audioUrl) return "";
  try {
    const u = new URL(track.audioUrl);
    if (u.protocol === "https:" && JAMENDO_STREAM_HOSTS.has(u.host)) {
      return `/api/audio?url=${encodeURIComponent(track.audioUrl)}`;
    }
  } catch {
    /* fall through */
  }
  return track.audioUrl;
}


function shuffledIndex(current: number, length: number): number {
  if (length <= 1) return current;
  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * length);
  }
  return next;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { status: sessionStatus } = useSession();
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const youtubeRef = React.useRef<YouTubeEngineHandle | null>(null);
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
  const [favoriteIds, setFavoriteIds] = React.useState<Set<string>>(new Set());

  const queueRef = React.useRef(queue);
  const queueIndexRef = React.useRef(queueIndex);
  const shuffleRef = React.useRef(shuffle);
  const repeatRef = React.useRef(repeat);
  const currentTrackRef = React.useRef<Track | null>(null);
  const currentTimeRef = React.useRef(0);
  const durationRef = React.useRef(0);
  const volumeRef = React.useRef(volume);
  const preloadAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const preloadedNextRef = React.useRef<{ index: number; url: string } | null>(null);

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

  React.useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  React.useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  React.useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  /** Refetches the signed-in user's favorite ids so the player-bar heart stays in sync. */
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const refresh = async () => {
      if (sessionStatus !== "authenticated") return;
      try {
        const res = await fetch("/api/me/favorites", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setFavoriteIds(new Set((data.favorites ?? []).map((f: { trackId: string }) => f.trackId)));
      } catch {
        /* ignore */
      }
    };

    void refresh();
    window.addEventListener("focus", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refresh);
    };
  }, [sessionStatus]);

  const setFavorite = React.useCallback((trackId: string, liked: boolean) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (liked) next.add(trackId);
      else next.delete(trackId);
      return next;
    });
  }, []);

  /** Probes whether a Jamendo storage origin allows cross-origin audio (per-origin, once). */
  const probeCors = React.useCallback(async (url: string): Promise<boolean> => {
    // Same-origin (e.g. our `/api/audio` proxy) never needs CORS preflight; the
    // browser can read media from the same origin without an ACAO header.
    if (!url || url.startsWith("/") || (typeof window !== "undefined" && url.startsWith(window.location.origin))) {
      return true;
    }
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
    const preloaded = preloadedNextRef.current;
    if (shuffleRef.current) {
      if (
        preloaded &&
        preloaded.index >= 0 &&
        preloaded.index < len &&
        q[preloaded.index]?.audioUrl === preloaded.url
      ) {
        idx = preloaded.index;
      } else {
        idx = shuffledIndex(idx, len);
      }
    } else if (idx < len - 1) {
      idx += 1;
    } else if (repeatRef.current === "all") {
      idx = 0;
    } else {
      const audio = audioRef.current;
      if (audio) audio.pause();
      setIsPlaying(false);
      return;
    }
    preloadedNextRef.current = null;
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
      if (nextQueue.length === 0) {
        const audio = audioRef.current;
        if (audio) audio.pause();
        youtubeRef.current?.pause();
        setIsPlaying(false);
        setQueueIndex(-1);
      } else {
        setQueueIndex(Math.min(current, nextQueue.length - 1));
      }
    }
  }, []);

  /** Reorder the queue by dragging a track from `from` to `to`. The current
   * track's cursor is re-pointed at its new index (matched by object identity,
   * so duplicate track ids in the queue are handled correctly). */
  const reorderQueue = React.useCallback((from: number, to: number) => {
    const q = queueRef.current;
    const { items: next, index: newIndex } = reorderWithIndex(q, from, to, queueIndexRef.current);
    if (next === q) return; // no-op (out of range or identical indices)
    setQueue(next);
    if (newIndex !== undefined && newIndex !== queueIndexRef.current) setQueueIndex(newIndex);
  }, []);

  const clearQueue = React.useCallback(() => {
    const audio = audioRef.current;
    if (audio) audio.pause();
    youtubeRef.current?.pause();
    setQueue([]);
    setQueueIndex(-1);
    setIsPlaying(false);
  }, []);

  const seek = React.useCallback((time: number) => {
    if (currentTrackRef.current?.source === "youtube") {
      youtubeRef.current?.seekTo(time);
      setCurrentTime(time);
      return;
    }
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
    youtubeRef.current?.setVolume(clamped);
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
    const track = currentTrackRef.current;
    if (!track) return;
    if (track.source === "youtube") {
      if (isPlaying) youtubeRef.current?.pause();
      else youtubeRef.current?.play();
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  /** Load and play whenever the current track changes. */
  React.useEffect(() => {
    const audio = audioRef.current;
    const track = currentTrack;
    const isYouTube = track?.source === "youtube";
    if (!track) return;
    if (!isYouTube && !audio) return;

    // YouTube tracks have no direct stream — the IFrame engine loads the video
    // itself from the `videoId` prop and reports state back through callbacks.
    pendingUrlRef.current = isYouTube ? null : proxiedAudioUrl(track);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    if (isYouTube) {
      // Stop any track still playing through the native audio element (e.g. the
      // previous Jamendo track) so it doesn't continue under the YouTube video.
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
      return;
    }

    const url = proxiedAudioUrl(track);

    void probeCors(url).then((allowed) => {
      if (pendingUrlRef.current !== url) return;
      const el = audioRef.current;
      if (!el) return;
      if (el.src !== url) {
        el.src = url;
        el.load();
      }
      void el.play().catch(() => setIsPlaying(false));
      if (allowed) void ensureVisualizer();
    });
  }, [currentTrack, probeCors, ensureVisualizer]);

  /** Warm the connection/cache for the upcoming track so auto-advance starts fast. */
  React.useEffect(() => {
    const track = currentTrack;
    if (!track) return;
    const q = queueRef.current;
    const len = q.length;
    const idx = queueIndexRef.current;
    let nextIndex = -1;
    if (repeatRef.current === "one") {
      nextIndex = -1;
    } else if (shuffleRef.current) {
      if (len > 0) nextIndex = shuffledIndex(idx, len);
    } else if (idx < len - 1) {
      nextIndex = idx + 1;
    } else if (repeatRef.current === "all") {
      nextIndex = 0;
    }
    if (nextIndex < 0 || nextIndex >= len) return;
    const nextTrack = q[nextIndex];
    if (!nextTrack || nextTrack.id === track.id) return;
    if (nextTrack.source === "youtube") return; // IFrame engine preloads on its own
    const url = proxiedAudioUrl(nextTrack);
    preloadedNextRef.current = { index: nextIndex, url };
    void probeCors(url).then((allowed) => {
      if (preloadedNextRef.current?.url !== url) return;
      const previous = preloadAudioRef.current;
      if (previous) {
        previous.removeAttribute("src");
        previous.load();
      }
      const el = new Audio();
      preloadAudioRef.current = el;
      el.preload = "auto";
      el.src = url;
      el.load();
    });
  }, [currentTrack, probeCors]);

  /** Sync volume. */
  React.useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = muted ? 0 : volume;
  }, [volume, muted]);

  /** Global keyboard shortcuts. */
  React.useEffect(() => {
    function isEditable(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (document.querySelector('[role="dialog"]')) return;

      if (event.key === " " || event.code === "Space") {
        if (isEditable(event.target)) return;
        if (event.target instanceof HTMLElement && event.target.tagName === "BUTTON") return;
        if (!currentTrackRef.current) return;
        event.preventDefault();
        togglePlay();
        return;
      }

      if (isEditable(event.target) || !currentTrackRef.current) return;

      switch (event.key) {
        case "ArrowRight": {
          if (!currentTrackRef.current) return;
          event.preventDefault();
          seek(Math.min(durationRef.current || 0, currentTimeRef.current + 5));
          break;
        }
        case "ArrowLeft": {
          if (!currentTrackRef.current) return;
          event.preventDefault();
          seek(Math.max(0, currentTimeRef.current - 5));
          break;
        }
        case "ArrowUp": {
          event.preventDefault();
          setVolume(volumeRef.current + 0.05);
          break;
        }
        case "ArrowDown": {
          event.preventDefault();
          setVolume(volumeRef.current - 0.05);
          break;
        }
        case "m":
        case "M":
          toggleMute();
          break;
        case "n":
        case "N":
          next();
          break;
        case "p":
        case "P":
          previous();
          break;
        case "s":
        case "S":
          toggleShuffle();
          break;
        case "r":
        case "R":
          cycleRepeat();
          break;
        case "q":
        case "Q":
          setQueueOpen((open) => !open);
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePlay, seek, setVolume, toggleMute, next, previous, toggleShuffle, cycleRepeat, setQueueOpen]);

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

  /** State reported by the YouTube IFrame engine → shared player state. */
  const onYouTubeStateChange = React.useCallback((state: YouTubeEngineState) => {
    if (state.currentTime !== currentTimeRef.current) setCurrentTime(state.currentTime);
    if (state.duration !== durationRef.current) setDuration(state.duration);
    if (state.isLoading) setIsLoading(true);
    else if (state.isPlaying) {
      setIsPlaying(true);
      setIsLoading(false);
      reportHistory();
    } else {
      setIsPlaying(false);
      setIsLoading(false);
    }
  }, [reportHistory]);

  /** Video ended in the YouTube engine — honour repeat, else advance. */
  const onYouTubeEnded = React.useCallback(() => {
    const track = currentTrackRef.current;
    if (repeatRef.current === "one" && track?.source === "youtube") {
      youtubeRef.current?.seekTo(0);
      youtubeRef.current?.play();
      return;
    }
    next();
  }, [next]);

  /** Media Session API — lock-screen / notification controls for mobile. */
  React.useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const track = currentTrack;
    const session = navigator.mediaSession;
    if (track) {
      const artwork = track.image ? [{ src: track.image, sizes: "512x512", type: "image/jpeg" }] : [];
      try {
        session.metadata = new MediaMetadata({
          title: track.name,
          artist: track.artistName,
          album: track.albumName || undefined,
          artwork,
        });
      } catch {
        /* some browsers throw on MediaMetadata construction */
      }
    }
    session.setActionHandler("play", () => togglePlay());
    session.setActionHandler("pause", () => togglePlay());
    session.setActionHandler("previoustrack", () => previous());
    session.setActionHandler("nexttrack", () => next());
    return () => {
      session.setActionHandler("play", null);
      session.setActionHandler("pause", null);
      session.setActionHandler("previoustrack", null);
      session.setActionHandler("nexttrack", null);
    };
  }, [currentTrack, togglePlay, previous, next]);

  /** Keep the lock-screen "playing" flag in sync with actual playback. */
  React.useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    } catch {
      /* ignore */
    }
  }, [isPlaying]);

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
      favoriteIds,
      setFavorite,
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
      reorderQueue,
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
      favoriteIds,
      setFavorite,
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
      reorderQueue,
    ],
  );

  /** Whether the current track plays through the YouTube IFrame engine. */
  const isYouTubeTrack = currentTrack?.source === "youtube";

  return (
    <PlayerContext.Provider value={value}>
      <audio ref={audioRef} preload="none" className="hidden" />
      <YouTubeEngine
        ref={youtubeRef}
        videoId={isYouTubeTrack ? (currentTrack?.videoId ?? null) : null}
        volume={volume}
        muted={muted}
        onStateChange={onYouTubeStateChange}
        onEnded={onYouTubeEnded}
      />
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const ctx = React.useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within a PlayerProvider");
  return ctx;
}

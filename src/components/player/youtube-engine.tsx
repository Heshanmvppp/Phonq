"use client";

import * as React from "react";

/**
 * YouTube IFrame Player engine — fallback playback for hybrid tracks.
 *
 * Jamendo tracks (and most YouTube-sourced tracks) play through the native
 * `<audio>` element owned by `PlayerProvider`; YouTube tracks normally stream
 * through our same-origin `/api/youtube/stream` proxy so the Web Audio analyser
 * can read them. When that stream can't be extracted, `PlayerProvider` flips
 * into fallback mode and this engine plays the video through the official
 * YouTube IFrame Player API instead.
 *
 * YouTube requires the player element to be technically present and ≥ 200×200px
 * — it cannot be hidden with `display:none` or 0×0 dimensions (ToS). We render
 * it at 200×200 fixed in a corner with `pointer-events: none` and near-zero
 * opacity so the custom UI stays unobtrusive while the element stays live.
 *
 * Playback state (playing/paused/buffering, currentTime, duration, ended) is
 * reported up to `PlayerProvider` through `onStateChange` / `onEnded`, so the
 * rest of the app (player bar, queue, history, Media Session) doesn't care
 * which engine is playing.
 */

export interface YouTubeEngineHandle {
  loadVideo: (videoId: string, autoplay?: boolean) => void;
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
}

export interface YouTubeEngineState {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
}

interface YouTubeEngineProps {
  videoId: string | null;
  volume: number;
  muted: boolean;
  onStateChange: (state: YouTubeEngineState) => void;
  onEnded: () => void;
}

interface YTPlayer {
  loadVideoById: (videoId: string, startSeconds?: number) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

interface YTReadyEvent {
  target: YTPlayer;
}

interface YTStateChangeEvent {
  data: number;
  target: YTPlayer;
}

const YT_STATES = { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } as const;

type WindowWithYT = Window & {
  YT?: {
    Player: new (
      element: HTMLElement,
      options: {
        videoId?: string;
        width?: number | string;
        height?: number | string;
        playerVars?: Record<string, string | number>;
        events: {
          onReady?: (e: YTReadyEvent) => void;
          onStateChange?: (e: YTStateChangeEvent) => void;
          onError?: (e: { data: number }) => void;
        };
      },
    ) => YTPlayer;
    PlayerState: typeof YT_STATES;
  };
  onYouTubeIframeAPIReady?: () => void;
};

export const YouTubeEngine = React.forwardRef<YouTubeEngineHandle, YouTubeEngineProps>(
  function YouTubeEngine({ videoId, volume, muted, onStateChange, onEnded }, ref) {
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const playerRef = React.useRef<YTPlayer | null>(null);
    const pollRef = React.useRef<number | null>(null);
    const videoIdRef = React.useRef<string | null>(null);
    const stateRef = React.useRef<YouTubeEngineState>({
      isPlaying: false,
      isLoading: false,
      currentTime: 0,
      duration: 0,
    });
    const volumeRef = React.useRef(volume);
    const mutedRef = React.useRef(muted);

    volumeRef.current = volume;
    mutedRef.current = muted;

    /** Keep the (possibly not-yet-created) player in sync with UI volume/mute. */
    React.useEffect(() => {
      const player = playerRef.current;
      if (!player) return;
      player.setVolume(volume * 100);
      if (muted) player.mute();
      else player.unMute();
    }, [volume, muted]);

    const setState = React.useCallback(
      (patch: Partial<YouTubeEngineState>) => {
        const next = { ...stateRef.current, ...patch };
        stateRef.current = next;
        onStateChange(next);
      },
      [onStateChange],
    );

    /** Polls currentTime/duration while playing (the IFrame API has no timeupdate event). */
    const startPolling = React.useCallback(() => {
      if (pollRef.current !== null) return;
      const tick = () => {
        const player = playerRef.current;
        if (!player) return;
        const currentTime = player.getCurrentTime?.() ?? 0;
        const duration = player.getDuration?.() ?? 0;
        setState({ currentTime, duration });
      };
      tick();
      pollRef.current = window.setInterval(tick, 500);
    }, [setState]);

    const stopPolling = React.useCallback(() => {
      if (pollRef.current !== null) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, []);

    const onStateChangeEvent = React.useCallback(
      (event: YTStateChangeEvent) => {
        const state = event.data;
        if (state === YT_STATES.ENDED) {
          stopPolling();
          setState({ isPlaying: false, isLoading: false, currentTime: 0 });
          onEnded();
        } else if (state === YT_STATES.PLAYING) {
          startPolling();
          setState({ isPlaying: true, isLoading: false });
        } else if (state === YT_STATES.PAUSED || state === YT_STATES.CUED) {
          stopPolling();
          setState({ isPlaying: false, isLoading: false });
        } else if (state === YT_STATES.BUFFERING) {
          setState({ isLoading: true });
        }
      },
      [onEnded, setState, startPolling, stopPolling],
    );

    /** Loads the IFrame API script once, then invokes the callback. */
    const ensureApi = React.useCallback((): Promise<void> => {
      return new Promise((resolve) => {
        const w = window as WindowWithYT;
        if (w.YT?.Player) {
          resolve();
          return;
        }
        const previous = w.onYouTubeIframeAPIReady;
        w.onYouTubeIframeAPIReady = () => {
          previous?.();
          resolve();
        };
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      });
    }, []);

    /** Creates the YT.Player once; subsequent videoId changes just load videos. */
    React.useEffect(() => {
      if (!videoId) return;
      let cancelled = false;
      void ensureApi().then(() => {
        if (cancelled) return;
        const container = containerRef.current;
        const w = window as WindowWithYT;
        if (!container || !w.YT?.Player) return;
        if (!playerRef.current) {
          const player = new w.YT.Player(container, {
            width: 200,
            height: 200,
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              fs: 0,
              playsinline: 1,
              rel: 0,
              iv_load_policy: 3,
              modestbranding: 1,
            },
            events: {
              onReady: (e: YTReadyEvent) => {
                playerRef.current = e.target;
                e.target.setVolume(volumeRef.current * 100);
                if (mutedRef.current) e.target.mute();
                else e.target.unMute();
                if (videoIdRef.current) e.target.loadVideoById(videoIdRef.current);
              },
              onStateChange: onStateChangeEvent,
              onError: () => setState({ isPlaying: false, isLoading: false }),
            },
          });
        } else {
          playerRef.current.loadVideoById(videoId);
          setState({ isPlaying: true, isLoading: true });
        }
        videoIdRef.current = videoId;
      });
      return () => {
        cancelled = true;
      };
    }, [videoId, ensureApi, onStateChangeEvent, setState]);

    /** Destroys the player when the engine is told to stop (videoId → null), so
     * the container/iframe can be re-created fresh for the next YouTube track. */
    React.useEffect(() => {
      if (videoId) return;
      stopPolling();
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      videoIdRef.current = null;
    }, [videoId, stopPolling]);

    React.useImperativeHandle(
      ref,
      (): YouTubeEngineHandle => ({
        loadVideo: (id, autoplay = true) => {
          videoIdRef.current = id;
          const player = playerRef.current;
          if (!player) return;
          player.loadVideoById(id);
          if (autoplay) {
            player.playVideo();
            setState({ isPlaying: true, isLoading: true });
          }
        },
        play: () => {
          playerRef.current?.playVideo();
          setState({ isPlaying: true, isLoading: true });
        },
        pause: () => playerRef.current?.pauseVideo(),
        seekTo: (seconds) => playerRef.current?.seekTo(seconds, true),
        setVolume: (v) => {
          const clamped = Math.max(0, Math.min(1, v));
          playerRef.current?.setVolume(clamped * 100);
        },
        setMuted: (m) => {
          if (m) playerRef.current?.mute();
          else playerRef.current?.unMute();
        },
      }),
      [setState],
    );

    React.useEffect(() => () => {
      stopPolling();
      playerRef.current?.destroy();
      playerRef.current = null;
    }, [stopPolling]);

    if (!videoId) return null;

    return (
      <div className="pointer-events-none fixed bottom-0 right-0 z-0" aria-hidden="true">
        {/* YouTube's ToS requires the player to stay ≥ 200×200 and technically visible. */}
        <div ref={containerRef} className="size-[200px] opacity-[0.04] contrast-[0.6]" />
      </div>
    );
  },
);

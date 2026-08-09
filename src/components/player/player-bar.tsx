"use client";

import * as React from "react";

import Image from "next/image";

import {
  ListMusic,
  Music2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";

import { usePlayer } from "@/components/player/player-context";
import { QueuePanel } from "@/components/player/queue-panel";
import { Waveform } from "@/components/player/waveform";
import { LikeButton } from "@/components/track/like-button";
import { Slider } from "@/components/ui/slider";
import { cn, formatDuration } from "@/lib/utils";
import type { Track } from "@/lib/jamendo";

function PlayPauseIcon({ playing, loading }: { playing: boolean; loading?: boolean }) {
  return (
    <div className="relative flex size-5 items-center justify-center">
      <Play
        className={cn(
          "absolute size-5 transition-all duration-200",
          playing ? "translate-x-1 opacity-0" : "translate-x-0 opacity-100",
        )}
      />
      <Pause
        className={cn(
          "absolute size-5 transition-all duration-200",
          playing ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0",
        )}
      />
      {loading ? <span className="absolute inset-0 flex items-center justify-center">
        <span className="size-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
      </span> : null}
    </div>
  );
}

export function PlayerBar() {
  const {
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
    queue,
    favoriteIds,
    setFavorite,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    setQueueOpen,
  } = usePlayer();

  const iconClass = "text-muted-foreground transition-colors hover:text-foreground";
  const [scrubValue, setScrubValue] = React.useState(currentTime);
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [releasePulse, setReleasePulse] = React.useState(false);
  const [activeTrack, setActiveTrack] = React.useState<Track | null>(currentTrack ?? null);
  const [incomingTrack, setIncomingTrack] = React.useState<Track | null>(null);
  const [isCrossfading, setIsCrossfading] = React.useState(false);

  const volumeRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = volumeRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const delta = -e.deltaY;
      if (Math.abs(delta) < 10) return;
      setVolume(Math.max(0, Math.min(1, volume + delta / 1000)));
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [volume, setVolume]);

  React.useEffect(() => {
    if (!currentTrack) return;
    if (!activeTrack) {
      const id = window.setTimeout(() => setActiveTrack(currentTrack), 0);
      return () => window.clearTimeout(id);
    }
    if (activeTrack.id === currentTrack.id) return;
    const transitionId = window.setTimeout(() => {
      setIncomingTrack(currentTrack);
      setIsCrossfading(true);
    }, 0);
    const id = window.setTimeout(() => {
      setActiveTrack(currentTrack);
      setIncomingTrack(null);
      setIsCrossfading(false);
    }, 160);
    return () => {
      window.clearTimeout(transitionId);
      window.clearTimeout(id);
    };
  }, [activeTrack, currentTrack]);

  const displayValue = isScrubbing ? scrubValue : currentTime;
  const progressPercent = duration > 0 ? Math.max(0, Math.min(100, (displayValue / duration) * 100)) : 0;
  const previewTime = isScrubbing ? scrubValue : currentTime;

  if (!currentTrack) return null;

  return (
    <div key={currentTrack.id} className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-lg transition-all duration-300 animate-slide-up">
      <div className="px-3 pt-1.5 sm:px-6">
        <Waveform className="h-8 sm:h-9 rounded-lg opacity-70" />
      </div>

      <div className="flex items-center gap-2 px-3 pb-1.5 sm:hidden">
        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{formatDuration(currentTime)}</span>
        <Slider
          value={Math.min(currentTime, duration || 1)}
          max={duration || 1}
          step={1}
          onValueChange={seek}
          aria-label="Seek"
          className="flex-1"
        />
        <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{formatDuration(duration)}</span>
      </div>

      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-3 px-3 sm:gap-4 sm:px-6">
        {/* Left: now playing */}
        <div className="flex w-[30%] min-w-0 items-center gap-3">
          <div className="relative aspect-square size-11 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
            <div className={cn("absolute inset-0 transition-opacity duration-150", isCrossfading ? "opacity-0" : "opacity-100")}>
              {activeTrack?.image ? (
                <Image src={activeTrack.image} alt="" fill sizes="44px" className="object-cover" unoptimized={false} />
              ) : (
                <span className="flex size-full items-center justify-center">
                  <Music2 className="size-5 text-muted-foreground" />
                </span>
              )}
            </div>
            {incomingTrack ? (
              <div className={cn("absolute inset-0 transition-opacity duration-150", isCrossfading ? "opacity-100" : "opacity-0")}>
                {incomingTrack.image ? (
                  <Image src={incomingTrack.image} alt="" fill sizes="44px" className="object-cover" unoptimized={false} />
                ) : (
                  <span className="flex size-full items-center justify-center">
                    <Music2 className="size-5 text-muted-foreground" />
                  </span>
                )}
              </div>
            ) : null}
          </div>
          <div className="hidden min-w-0 sm:block">
            <div className="relative h-5 overflow-hidden">
              <p className={cn("truncate text-sm font-medium leading-tight transition-all duration-150", isCrossfading ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100")}>{activeTrack?.name ?? currentTrack.name}</p>
              {incomingTrack ? <p className="absolute inset-0 truncate text-sm font-medium leading-tight transition-all duration-150 translate-y-0 opacity-100">{incomingTrack.name}</p> : null}
            </div>
            <div className="relative h-4 overflow-hidden">
              <p className={cn("truncate text-xs text-muted-foreground transition-all duration-150", isCrossfading ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100")}>{activeTrack?.artistName ?? currentTrack.artistName}</p>
              {incomingTrack ? <p className="absolute inset-0 truncate text-xs text-muted-foreground transition-all duration-150 translate-y-0 opacity-100">{incomingTrack.artistName}</p> : null}
            </div>
          </div>
          <LikeButton
            trackId={currentTrack.id}
            initialLiked={favoriteIds.has(currentTrack.id)}
            onLikedChange={(liked) => setFavorite(currentTrack.id, liked)}
            className="hidden shrink-0 sm:inline-flex"
          />
        </div>

        {/* Center: controls + progress */}
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={toggleShuffle}
              className={cn(iconClass, shuffle && "text-primary hover:text-primary", "active:scale-95")}
              aria-label="Shuffle"
            >
              <Shuffle className="size-4" />
            </button>
            <button type="button" onClick={previous} className={cn(iconClass, "active:scale-95")} aria-label="Previous">
              <SkipBack className="size-5" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              <PlayPauseIcon playing={isPlaying} loading={isLoading} />
            </button>
            <button type="button" onClick={next} className={cn(iconClass, "active:scale-95")} aria-label="Next">
              <SkipForward className="size-5" />
            </button>
            <button
              type="button"
              onClick={cycleRepeat}
              className={cn(iconClass, repeat !== "off" && "text-primary hover:text-primary", "active:scale-95")}
              aria-label="Repeat"
            >
              {repeat === "one" ? <Repeat1 className="size-4" /> : <Repeat className="size-4" />}
            </button>
          </div>
          <div className="hidden w-full max-w-xl items-center gap-2 sm:flex">
            <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {formatDuration(currentTime)}
            </span>
            <div className="relative flex-1">
              <Slider
                value={Math.min(displayValue, duration || 1)}
                max={duration || 1}
                step={1}
                onValueChange={(value) => {
                  setScrubValue(value);
                }}
                onPointerDown={() => {
                  setIsScrubbing(true);
                  setReleasePulse(false);
                }}
                onPointerUp={() => {
                  setIsScrubbing(false);
                  seek(scrubValue);
                  setReleasePulse(true);
                  window.setTimeout(() => setReleasePulse(false), 220);
                }}
                className="flex-1"
              />
              {isScrubbing ? (
                <span
                  className={cn("pointer-events-none absolute -top-8 rounded-full border border-border/60 bg-background/95 px-2 py-1 text-[10px] font-medium text-foreground shadow-lg shadow-black/10 backdrop-blur", releasePulse && "animate-burst")}
                  style={{ left: `${Math.max(0, Math.min(100, progressPercent))}%`, transform: "translateX(-50%)" }}
                >
                  {formatDuration(previewTime)}
                </span>
              ) : null}
            </div>
            <span className="w-9 shrink-0 text-xs tabular-nums text-muted-foreground">{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Right: volume + queue */}
        <div className="flex w-[30%] items-center justify-end gap-1.5 sm:gap-3">
          <div
            ref={volumeRef}
            className="hidden items-center gap-2 md:flex"
            aria-label="Volume control (scroll to adjust)"
            title="Scroll over the speaker icon to change volume"
          >
            <button type="button" onClick={toggleMute} className={cn(iconClass)} aria-label="Mute">
              {muted || volume === 0 ? (
                <VolumeX className="size-5" />
              ) : volume < 0.5 ? (
                <Volume1 className="size-5" />
              ) : (
                <Volume2 className="size-5" />
              )}
            </button>
            <div className="relative w-24">
              <Slider value={muted ? 0 : volume} max={1} step={0.01} onValueChange={setVolume} className="w-24" />
              <div className="mt-2 flex items-center justify-between text-[7px] uppercase tracking-[0.2em] text-muted-foreground/60">
                {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
                  <span key={tick} className="inline-flex flex-col items-center gap-1">
                    <span className="h-1.5 w-px rounded-full bg-muted-foreground/40" />
                    <span>{tick === 1 ? "100%" : tick === 0 ? "0" : `${Math.round(tick * 100)}%`}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setQueueOpen(true)}
            className={cn("relative flex items-center gap-1.5 rounded-md p-1.5 transition-colors", iconClass, queueOpen && "text-primary")}
            aria-label="Open queue"
          >
            <ListMusic className="size-5" />
            <span className="hidden text-xs tabular-nums lg:inline">{queue.length}</span>
          </button>
        </div>

      </div>

      <QueuePanel />
    </div>
  );
}

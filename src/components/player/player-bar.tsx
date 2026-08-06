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

  if (!currentTrack) return null;

  const iconClass = "text-muted-foreground transition-colors hover:text-foreground";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-lg">
      <div className="px-3 pt-1.5 sm:px-6">
        <Waveform className="h-8 sm:h-9 rounded-lg opacity-70" />
      </div>

      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-3 px-3 sm:gap-4 sm:px-6">
        {/* Left: now playing */}
        <div className="flex w-[30%] min-w-0 items-center gap-3">
          <div className="relative aspect-square size-11 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-border">
            {currentTrack.image ? (
              <Image src={currentTrack.image} alt="" fill sizes="44px" className="object-cover" unoptimized={false} />
            ) : (
              <span className="flex size-full items-center justify-center">
                <Music2 className="size-5 text-muted-foreground" />
              </span>
            )}
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-medium leading-tight">{currentTrack.name}</p>
            <p className="truncate text-xs text-muted-foreground">{currentTrack.artistName}</p>
          </div>
          <LikeButton trackId={currentTrack.id} className="hidden shrink-0 sm:inline-flex" />
        </div>

        {/* Center: controls + progress */}
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={toggleShuffle}
              className={cn(iconClass, shuffle && "text-primary hover:text-primary")}
              aria-label="Shuffle"
            >
              <Shuffle className="size-4" />
            </button>
            <button type="button" onClick={previous} className={cn(iconClass)} aria-label="Previous">
              <SkipBack className="size-5" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <span className="flex h-3 items-end gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-0.5 origin-bottom animate-eq rounded-full bg-current" style={{ height: "70%", animationDelay: `${i * 120}ms` }} />
                  ))}
                </span>
              ) : isPlaying ? (
                <Pause className="size-5" />
              ) : (
                <Play className="ml-0.5 size-5" />
              )}
            </button>
            <button type="button" onClick={next} className={cn(iconClass)} aria-label="Next">
              <SkipForward className="size-5" />
            </button>
            <button
              type="button"
              onClick={cycleRepeat}
              className={cn(iconClass, repeat !== "off" && "text-primary hover:text-primary")}
              aria-label="Repeat"
            >
              {repeat === "one" ? <Repeat1 className="size-4" /> : <Repeat className="size-4" />}
            </button>
          </div>
          <div className="hidden w-full max-w-xl items-center gap-2 sm:flex">
            <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {formatDuration(currentTime)}
            </span>
            <Slider value={Math.min(currentTime, duration || 1)} max={duration || 1} step={1} onValueChange={seek} className="flex-1" />
            <span className="w-9 shrink-0 text-xs tabular-nums text-muted-foreground">{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Right: volume + queue */}
        <div className="flex w-[30%] items-center justify-end gap-1.5 sm:gap-3">
          <div className="hidden items-center gap-2 md:flex">
            <button type="button" onClick={toggleMute} className={cn(iconClass)} aria-label="Mute">
              {muted || volume === 0 ? (
                <VolumeX className="size-5" />
              ) : volume < 0.5 ? (
                <Volume1 className="size-5" />
              ) : (
                <Volume2 className="size-5" />
              )}
            </button>
            <Slider value={muted ? 0 : volume} max={1} step={0.01} onValueChange={setVolume} className="w-24" />
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

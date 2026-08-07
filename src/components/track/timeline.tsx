"use client";

import * as React from "react";

import type { Track } from "@/lib/jamendo";
import { cn, formatDuration, timeAgo } from "@/lib/utils";
import { Music2, Pause, Play } from "lucide-react";
import { usePlayer } from "@/components/player/player-context";
import { LikeButton } from "@/components/track/like-button";
import Image from "next/image";

export interface TimelineItem {
  id: string;
  track: Track;
  timestamp: Date | string;
}

interface TimelineProps {
  groups: { label: string; items: TimelineItem[] }[];
  onTrackPlay?: (track: Track) => void;
}

export function Timeline({ groups, onTrackPlay }: TimelineProps) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();

  return (
    <div className="flex flex-col gap-8">
      {groups.map((group) => (
        <div key={group.label}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</h3>
          <div className="flex flex-col gap-1">
            {group.items.map((item) => {
              const isCurrent = currentTrack?.id === item.track.id;
              const isNowPlaying = isCurrent && isPlaying;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted",
                    isCurrent && "bg-muted/70",
                  )}
                >
                  <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                    {item.track.image ? (
                      <Image src={item.track.image} alt="" fill sizes="40px" className="object-cover" />
                    ) : (
                      <Music2 className="size-5 text-muted-foreground" />
                    )}
                    <button
                      onClick={() => {
                        if (isCurrent) {
                          togglePlay();
                          return;
                        }
                        playTrack(item.track, group.items.map((i) => i.track));
                        onTrackPlay?.(item.track);
                      }}
                      className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label={isNowPlaying ? "Pause" : "Play"}
                    >
                      {isNowPlaying ? (
                        <Pause className="size-4 fill-white text-white" />
                      ) : (
                        <Play className="size-4 fill-white text-white" />
                      )}
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm font-medium", isCurrent && "text-primary")}>{item.track.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.track.artistName}</p>
                  </div>

                  <span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:inline">
                    {timeAgo(item.timestamp)}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatDuration(item.track.duration)}</span>
                  <LikeButton trackId={item.track.id} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
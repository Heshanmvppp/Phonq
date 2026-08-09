"use client";

import * as React from "react";

import Image from "next/image";

import { Download, Music2, Pause, Play } from "lucide-react";

import { usePlayer } from "@/components/player/player-context";
import { AddToPlaylistButton } from "@/components/track/add-to-playlist";
import { LikeButton } from "@/components/track/like-button";
import { ShareButton } from "@/components/track/share-button";
import { Badge } from "@/components/ui/badge";
import { cn, formatDuration } from "@/lib/utils";
import type { Track } from "@/lib/jamendo";

interface TrackCardProps {
  track: Track;
  queue?: Track[];
  index?: number;
  liked?: boolean;
  compact?: boolean;
  className?: string;
}

export function TrackCard({ track, queue, index = 0, liked = false, compact = false, className }: TrackCardProps) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const isCurrent = currentTrack?.id === track.id;
  const isNowPlaying = isCurrent && isPlaying;

  function handlePlay() {
    if (!track.audioUrl) return;
    if (isCurrent) {
      togglePlay();
      return;
    }
    if (queue && queue.length > 0) {
      playTrack(track, queue);
    } else {
      playTrack(track);
    }
  }

  const tileClass =
    "flex h-9 flex-1 items-center justify-center rounded-md border border-border/60 transition-colors";
  const actionTileClass = `${tileClass} text-muted-foreground hover:bg-muted hover:text-foreground`;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        compact && "p-2.5",
        className,
      )}
    >
      <div className={cn("relative aspect-square overflow-hidden rounded-lg bg-muted", isNowPlaying && "animate-breathe") }>
        {track.image ? (
          <Image
            src={track.image}
            alt={`${track.name} cover`}
            fill
            sizes="(min-width: 1280px) 240px, (min-width: 1024px) 200px, (min-width: 640px) 180px, 88vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex size-full items-center justify-center">
            <Music2 className="size-10 text-muted-foreground/40" />
          </span>
        )}

        {isCurrent && (
          <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 backdrop-blur-sm">
            <span className="flex h-3 items-end gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-0.5 origin-bottom animate-eq rounded-full bg-primary"
                  style={{ height: "70%", animationDelay: `${i * 120}ms` }}
                />
              ))}
            </span>
          </span>
        )}
      </div>

      <div className={cn("mt-3 flex items-start justify-between gap-2", compact && "mt-2")}>
        <div className="min-w-0">
          <p className={cn("truncate text-sm font-semibold", isCurrent && "text-primary")} title={track.name}>
            {track.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">{track.artistName}</p>
          {!compact && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <Badge variant="secondary" className="font-normal">
                {formatDuration(track.duration)}
              </Badge>
              {track.bpm ? (
                <Badge variant="outline" className="font-normal text-muted-foreground">
                  {track.bpm} BPM
                </Badge>
              ) : null}
            </div>
          )}
        </div>
        <AddToPlaylistButton trackId={track.id} className="-mr-1" />
      </div>

      <div className="mt-2.5 flex items-center gap-1.5">
        {track.audioDownloadAllowed && track.downloadUrl && (
          <a
            href={track.downloadUrl}
            target="_blank"
            rel="noreferrer"
            download
            onClick={(e) => e.stopPropagation()}
            className={actionTileClass}
            aria-label={`Download ${track.name}`}
            title="Download (CC license)"
          >
            <Download className="size-4" />
          </a>
        )}
        <LikeButton trackId={track.id} initialLiked={liked} className={tileClass} />
        <ShareButton
          url={`/track/${track.id}`}
          title={`${track.name} — ${track.artistName}`}
          className={actionTileClass}
        />
        <button
          type="button"
          onClick={handlePlay}
          className="flex h-9 flex-1 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90 active:scale-95"
          aria-label={isNowPlaying ? "Pause" : "Play"}
        >
          {isNowPlaying ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
        </button>
      </div>
    </div>
  );
}

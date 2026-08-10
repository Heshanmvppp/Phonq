"use client";

import * as React from "react";

import Image from "next/image";

import { Download, Music2, Pause, Play, Plus, X } from "lucide-react";

import { usePlayer } from "@/components/player/player-context";
import { ArtistLink } from "@/components/track/artist-link";
import { LikeButton } from "@/components/track/like-button";
import { cn, formatDuration } from "@/lib/utils";
import type { Track } from "@/lib/jamendo";

interface TrackRowProps {
  track: Track;
  queue?: Track[];
  index?: number;
  position?: number;
  liked?: boolean;
  showPosition?: boolean;
  onRemove?: (track: Track) => void;
  onAdd?: (track: Track) => void;
  className?: string;
}

export function TrackRow({
  track,
  queue,
  index = 0,
  position,
  liked = false,
  showPosition = false,
  onRemove,
  onAdd,
  className,
}: TrackRowProps) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const isCurrent = currentTrack?.id === track.id;
  const isNowPlaying = isCurrent && isPlaying;

  function handlePlay() {
    // YouTube tracks have no direct stream URL — they play through the IFrame
    // engine via `videoId`, so don't gate playback on `audioUrl`.
    if (!track.audioUrl && track.source !== "youtube") return;
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

  return (
    <div
      className={cn(
        "group flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 hover:bg-muted hover:shadow-sm",
        isCurrent && "bg-muted/70",
        className,
      )}
    >
      {showPosition && (
        <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
          {position ?? index + 1}
        </span>
      )}

      <button
        type="button"
        onClick={handlePlay}
        className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted"
        aria-label={isNowPlaying ? "Pause" : "Play"}
      >
        {track.image ? (
          <Image src={track.image} alt="" fill sizes="44px" className="object-cover" />
        ) : (
          <Music2 className="size-5 text-muted-foreground" />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
          {isNowPlaying ? <Pause className="size-4 fill-white text-white" /> : <Play className="size-4 fill-white text-white" />}
        </span>
        {isNowPlaying && (
          <span className="absolute bottom-1 right-1 flex h-2.5 items-end gap-0.5 rounded-sm bg-black/70 px-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-0.5 origin-bottom animate-eq rounded-full bg-primary"
                style={{ height: "70%", animationDelay: `${i * 120}ms` }}
              />
            ))}
          </span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", isCurrent && "text-primary")}>{track.name}</p>
        <ArtistLink artistId={track.artistId} artistName={track.artistName} stopPropagation className="truncate text-xs text-muted-foreground" />
      </div>

      {track.bpm ? <span className="hidden text-xs tabular-nums text-muted-foreground sm:inline">{track.bpm} BPM</span> : null}

      <span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground md:inline">
        {formatDuration(track.duration)}
      </span>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 translate-y-1 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
        {track.audioDownloadAllowed && track.downloadUrl && (
          <a
            href={track.downloadUrl}
            target="_blank"
            rel="noreferrer"
            download
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            aria-label={`Download ${track.name}`}
            title="Download (CC license)"
          >
            <Download className="size-4" />
          </a>
        )}
        {onAdd && (
          <button
            type="button"
            onClick={() => onAdd(track)}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            aria-label="Add to playlist"
          >
            <Plus className="size-4" />
          </button>
        )}
        <LikeButton trackId={track.id} initialLiked={liked} />
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(track)}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label="Remove"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

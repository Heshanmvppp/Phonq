"use client";

import * as React from "react";

import Image from "next/image";

import { Download, Music2, Pause, Play } from "lucide-react";

import { usePlayer } from "@/components/player/player-context";
import { AlbumLink } from "@/components/track/album-link";
import { ArtistLink } from "@/components/track/artist-link";
import { LikeButton } from "@/components/track/like-button";
import { Badge } from "@/components/ui/badge";
import { cn, canDownloadTrack, formatDuration, getAlbumHref, trackDownloadHref } from "@/lib/utils";
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

  const downloadHref = trackDownloadHref(track);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        compact && "p-2.5",
        className,
      )}
    >
      <div className={cn("relative aspect-square overflow-hidden rounded-lg bg-muted", isNowPlaying && "animate-breathe")}>
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

        {/* Overlay actions on bottom of cover */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {downloadHref && canDownloadTrack(track) && (
            <a
              href={downloadHref}
              target={track.source === "youtube" ? undefined : "_blank"}
              rel={track.source === "youtube" ? undefined : "noreferrer"}
              download
              onClick={(e) => e.stopPropagation()}
              className="flex size-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
              aria-label={`Download ${track.name}`}
              title={track.source === "youtube" ? "Download (YouTube)" : "Download (CC license)"}
            >
              <Download className="size-4" />
            </a>
          )}
          <LikeButton
            trackId={track.id}
            initialLiked={liked}
            className="flex size-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 [&_svg]:text-white [&_svg]:fill-transparent data-[liked=true]:text-primary [&_svg[data-liked=true]]:fill-primary"
          />
          <button
            type="button"
            onClick={handlePlay}
            className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95"
            aria-label={isNowPlaying ? "Pause" : "Play"}
          >
            {isNowPlaying ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
          </button>
        </div>
      </div>

      <div className={cn("mt-3 flex items-start justify-between gap-2", compact && "mt-2")}>
        <div className="min-w-0">
          <p className={cn("truncate text-sm font-semibold", isCurrent && "text-primary")} title={track.name}>
            {track.name}
          </p>
          <ArtistLink artistId={track.artistId} artistName={track.artistName} className="truncate text-xs text-muted-foreground" />
          {getAlbumHref(track.albumId) ? (
            <AlbumLink albumId={track.albumId} albumName={track.albumName} className="block truncate text-xs text-muted-foreground/70" />
          ) : null}
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
      </div>
    </div>
  );
}

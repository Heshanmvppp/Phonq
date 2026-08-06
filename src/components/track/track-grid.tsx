import * as React from "react";

import { TrackCard } from "@/components/track/track-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Track } from "@/lib/jamendo";
import { cn } from "@/lib/utils";

interface TrackGridProps {
  tracks: Track[];
  likedIds?: Set<string>;
  loading?: boolean;
  className?: string;
}

export function TrackGrid({ tracks, likedIds, loading = false, className }: TrackGridProps) {
  if (loading) {
    return (
      <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5", className)}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-3">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (tracks.length === 0) return null;

  return (
    <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5", className)}>
      {tracks.map((track, index) => (
        <TrackCard key={track.id} track={track} queue={tracks} index={index} liked={likedIds?.has(track.id)} />
      ))}
    </div>
  );
}

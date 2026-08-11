import * as React from "react";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { ArrowRight } from "lucide-react";

import { TrackCard } from "@/components/track/track-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Track } from "@/lib/jamendo";

interface TrackStripProps {
  tracks: Track[];
  title: React.ReactNode;
  eyebrow?: string;
  description?: React.ReactNode;
  icon?: LucideIcon;
  seeAllHref?: string;
  likedIds?: Set<string>;
  loading?: boolean;
  className?: string;
}

export function TrackStrip({
  tracks,
  title,
  eyebrow,
  description,
  icon: Icon,
  seeAllHref,
  likedIds,
  loading = false,
  className,
}: TrackStripProps) {
  if (!loading && tracks.length === 0) return null;

  return (
    <section className={className}>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {Icon ? (
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
            ) : null}
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">{eyebrow}</p>
            ) : null}
          </div>
          <h2 className="mt-1.5 font-display text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {seeAllHref ? (
          <Link
            href={seeAllHref}
            className="group flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            See all
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      <div className="relative mt-4">
        <div className="-mx-4 overflow-x-auto px-4 pb-2 strip-scroll">
          {loading ? (
            <ul className="flex snap-x gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <li key={index} className="w-40 shrink-0 snap-start sm:w-44">
                  <div className="rounded-xl border border-border bg-card p-2.5">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="mt-2.5 h-4 w-3/4" />
                    <Skeleton className="mt-2 h-3 w-1/2" />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="flex snap-x gap-4">
              {tracks.map((track, index) => (
                <li key={track.id} className="w-40 shrink-0 snap-start sm:w-44">
                  <TrackCard track={track} queue={tracks} index={index} liked={likedIds?.has(track.id)} compact />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}

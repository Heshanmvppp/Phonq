import Link from "next/link";

import { Music2, Users } from "lucide-react";

import type { Artist } from "@/lib/jamendo";

import { Card } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";

interface ArtistCardProps {
  artist: Pick<Artist, "id" | "name" | "image" | "imageSmall" | "nbTracks" | "nbFans">;
  className?: string;
}

export function ArtistCard({ artist, className }: ArtistCardProps) {
  const title = artist.name || "Unknown Artist";
  const image = artist.image || artist.imageSmall;

  return (
    <Link href={`/app/artists/${artist.id}`} className={cn("block", className)}>
      <Card className="group flex h-full flex-col overflow-hidden p-0 transition-colors hover:border-primary/40">
        <div className="relative aspect-square bg-muted">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={title} className="size-full object-cover transition-transform group-hover:scale-105" />
          ) : (
            <span className="flex size-full items-center justify-center">
              <Music2 className="size-10 text-muted-foreground/40" />
            </span>
          )}
        </div>
        <div className="p-4">
          <p className="truncate font-display text-sm font-semibold">{title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {artist.nbTracks != null ? <span>{formatNumber(artist.nbTracks)} tracks</span> : null}
            {artist.nbFans != null && artist.nbFans > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Users className="size-3" /> {formatNumber(artist.nbFans)} fans
              </span>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}

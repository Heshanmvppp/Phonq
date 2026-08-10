import Link from "next/link";

import { Album as AlbumIcon, Music2 } from "lucide-react";

import type { Album } from "@/lib/jamendo";

import { Card } from "@/components/ui/card";
import { cn, dateString, formatNumber } from "@/lib/utils";

interface AlbumCardProps {
  album: Album;
  className?: string;
}

/** A single album block. When `album.id` is the sentinel "singles" group (tracks
 * that don't belong to an album), it renders as non-linked since there is no
 * real Jamendo album page for it. */
export function AlbumCard({ album, className }: AlbumCardProps) {
  const title = album.name || "Unknown Album";
  const image = album.image || album.imageSmall;
  const isSingles = album.id === "singles";
  const content = (
    <Card
      className={cn(
        "group flex h-full flex-col overflow-hidden p-0 transition-colors",
        isSingles ? "cursor-default" : "hover:border-primary/40",
        className,
      )}
    >
      <div className="relative aspect-square bg-muted">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={title} className="size-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <span className="flex size-full items-center justify-center">
            <AlbumIcon className="size-10 text-muted-foreground/40" />
          </span>
        )}
        <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white">
          {formatNumber(album.nbTracks ?? 0)}
        </span>
      </div>
      <div className="p-4">
        <p className="truncate font-display text-sm font-semibold">{title}</p>
        {album.artistName ? <p className="truncate text-xs text-muted-foreground">{album.artistName}</p> : null}
        {album.releaseDate ? <p className="mt-1 text-xs text-muted-foreground">{dateString(album.releaseDate)}</p> : null}
      </div>
    </Card>
  );

  if (isSingles) return content;

  return (
    <Link href={`/app/albums/${album.id}`} className="block">
      {content}
    </Link>
  );
}

"use client";

import Link from "next/link";

import { cn, getAlbumHref } from "@/lib/utils";

interface AlbumLinkProps {
  albumId: string;
  albumName: string;
  className?: string;
  stopPropagation?: boolean;
}

/** Renders an album's name as a link to its page, when one exists (numeric
 * Jamendo album ids — YouTube-sourced tracks have no album page). When the
 * album name is unknown (e.g. the static snapshot stores it empty), falls back
 * to `Album {id}` so the album is still reachable. */
export function AlbumLink({ albumId, albumName, className, stopPropagation }: AlbumLinkProps) {
  const href = getAlbumHref(albumId);
  if (!href) {
    return albumName ? <span className={className}>{albumName}</span> : null;
  }
  const label = albumName || `Album ${albumId}`;
  return (
    <Link
      href={href}
      className={cn("transition-colors hover:text-primary", className)}
      onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
    >
      {label}
    </Link>
  );
}

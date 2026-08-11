"use client";

import Link from "next/link";

import { cn, getArtistHref } from "@/lib/utils";

interface ArtistLinkProps {
  artistId: string;
  artistName: string;
  className?: string;
  stopPropagation?: boolean;
}

/** Renders an artist's name as a link to their page, when one exists
 * (Jamendo artists only — YouTube-sourced tracks have no artist page). */
export function ArtistLink({ artistId, artistName, className, stopPropagation }: ArtistLinkProps) {
  const href = getArtistHref(artistId, artistName);
  if (!href || !artistName) {
    return <span className={className}>{artistName}</span>;
  }
  return (
    <Link
      href={href}
      className={cn("transition-colors hover:text-primary", className)}
      onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
    >
      {artistName}
    </Link>
  );
}

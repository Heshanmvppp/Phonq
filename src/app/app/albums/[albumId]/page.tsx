import type { Metadata } from "next";
import { Suspense } from "react";

import { notFound } from "next/navigation";

import Link from "next/link";
import { Calendar, Music2 } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchAlbum, fetchAlbumTracks } from "@/lib/catalog";

import { AlbumPlayAll } from "./album-play-all";
import { TrackRow } from "@/components/track/track-row";
import { SectionHeading } from "@/components/marketing/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { RowListSkeleton } from "@/components/layout/skeletons";
import { formatDuration, dateString, formatNumber, getArtistHref } from "@/lib/utils";

interface AlbumPageProps {
  params: Promise<{ albumId: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  const { albumId } = await params;
  const album = await fetchAlbum(albumId).catch(() => null);
  if (!album) return { title: "Album not found" };
  const title = `${album.name} — ${album.artistName}`;
  return {
    title,
    description: `Listen to “${album.name}” by ${album.artistName} on Phonq.`,
    openGraph: album.image ? { title, images: [{ url: album.image, alt: `${album.name} cover` }] } : { title },
  };
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { albumId } = await params;
  const album = await fetchAlbum(albumId);
  if (!album) notFound();

  const session = await auth();
  const likedIds = session?.user?.id
    ? await prisma.favorite
        .findMany({ where: { userId: session.user.id }, select: { trackId: true } })
        .then((rows) => new Set(rows.map((f) => f.trackId)))
    : new Set<string>();

  return (
    <div className="px-4 pb-16 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end gap-8 pt-6">
        <div className="relative mx-auto -mt-10 mb-4 aspect-square w-40 shrink-0 overflow-hidden rounded-xl bg-muted sm:w-48">
          {album.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={album.image} alt={album.name} className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center">
              <Music2 className="size-16 text-muted-foreground/40" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">Album</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">{album.name}</h1>

          {album.artistName ? (
            getArtistHref(album.artistId, album.artistName) ? (
              <Link href={`/app/artists/${album.artistId}`} className="mt-2 block text-lg text-muted-foreground hover:text-foreground hover:underline">
                {album.artistName}
              </Link>
            ) : (
              <p className="mt-2 text-lg text-muted-foreground">{album.artistName}</p>
            )
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {album.releaseDate ? (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-4" /> {dateString(album.releaseDate)}
              </span>
            ) : null}
            {album.nbTracks != null ? (
              <span className="inline-flex items-center gap-1.5">
                <Music2 className="size-4" /> {formatNumber(album.nbTracks)} track{album.nbTracks === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <Suspense fallback={<RowListSkeleton rows={album.nbTracks ?? 8} />}>
        <AlbumTracks albumId={albumId} likedIds={likedIds} />
      </Suspense>
    </div>
  );
}

async function AlbumTracks({ albumId, likedIds }: { albumId: string; likedIds: Set<string> }) {
  const tracks = await fetchAlbumTracks(albumId, 100).catch(() => []);

  if (tracks.length === 0) {
    return (
      <div className="mt-10">
        <EmptyState
          icon={Music2}
          title="No tracks found"
          description="The album is available on Jamendo, but its track listing couldn't be loaded right now — check back shortly."
        />
      </div>
    );
  }

  const ordered = [...tracks].sort((a, b) => {
    const aN = a.releaseDate ? Date.parse(a.releaseDate) : NaN;
    const bN = b.releaseDate ? Date.parse(b.releaseDate) : NaN;
    if (Number.isFinite(aN) && Number.isFinite(bN)) return aN - bN;
    return 0;
  });

  return (
    <div className="mt-8">
      <AlbumPlayAll tracks={ordered} />
      <SectionHeading
        align="left"
        eyebrow="Track listing"
        title="Tracks"
        description={`${ordered.length} track${ordered.length === 1 ? "" : "s"}`}
      />
      <div className="mt-6 flex flex-col gap-1">
        {ordered.map((track, index) => (
          <TrackRow
            key={track.id}
            track={track}
            queue={ordered}
            index={index}
            liked={likedIds.has(track.id)}
            showPosition
          />
        ))}
      </div>
      <div className="mt-4 flex justify-between text-xs text-muted-foreground">
        <span>{formatDuration(ordered.reduce((sum, t) => sum + t.duration, 0))}</span>
        {ordered.reduce((sum, t) => sum + (t.audioDownloadAllowed ? 1 : 0), 0) > 0 ? (
          <span>Contains downloadable tracks</span>
        ) : null}
      </div>
    </div>
  );
}

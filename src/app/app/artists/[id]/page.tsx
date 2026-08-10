import type { Metadata } from "next";
import { Suspense } from "react";

import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchArtist, fetchArtistTracks } from "@/lib/catalog";

import { DiscographyAlbums } from "./discography-albums";
import { SimilarArtists, SimilarArtistsSkeleton } from "./similar-artists";
import { SectionHeading } from "@/components/marketing/section-heading";
import { TrackGridSkeleton } from "@/components/layout/skeletons";
import { formatNumber, stripHtml } from "@/lib/utils";
import { Calendar, Globe, Music2, Users } from "lucide-react";

interface ArtistPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ArtistPageProps): Promise<Metadata> {
  const { id } = await params;
  const artist = await fetchArtist(id).catch(() => null);
  if (!artist) return { title: "Artist not found" };
  const title = `${artist.name} — Phonq`;
  return {
    title,
    description: artist.bio ? stripHtml(artist.bio).slice(0, 160) : `Listen to ${artist.name} on Phonq.`,
    openGraph: artist.image
      ? { title, images: [{ url: artist.image, alt: `${artist.name} cover` }] }
      : { title },
  };
}

export default async function ArtistPage({ params }: ArtistPageProps) {
  const { id } = await params;
  const artist = await fetchArtist(id);
  if (!artist) notFound();

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
          {artist.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={artist.image} alt={artist.name} className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center">
              <Music2 className="size-16 text-muted-foreground/40" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">Artist</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">{artist.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {artist.location ? (
              <span className="inline-flex items-center gap-1.5">
                <Globe className="size-4" /> {artist.location}
              </span>
            ) : null}
            {artist.nbTracks != null ? (
              <span className="inline-flex items-center gap-1.5">
                <Music2 className="size-4" /> {formatNumber(artist.nbTracks)} tracks
              </span>
            ) : null}
            {artist.nbAlbums != null ? (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-4" />
                {formatNumber(artist.nbAlbums)} album{artist.nbAlbums === 1 ? "" : "s"}
              </span>
            ) : null}
            {artist.nbFans != null && artist.nbFans > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4" /> {formatNumber(artist.nbFans)} fans
              </span>
            ) : null}
            {artist.website ? (
              <a
                href={artist.website.startsWith("http") ? artist.website : `https://${artist.website}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-primary underline underline-offset-2"
              >
                <Globe className="size-4" /> Website
              </a>
            ) : null}
          </div>
        </div>
      </header>

      {artist.bio ? (
        <div className="mt-8 max-w-3xl">
          <SectionHeading align="left" title="Biography" />
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{stripHtml(artist.bio)}</p>
        </div>
      ) : null}

      <Suspense fallback={<TrackGridSkeleton />}>
        <ArtistContent artistId={id} artistName={artist.name} likedIds={likedIds} />
      </Suspense>
    </div>
  );
}

async function ArtistContent({ artistId, artistName, likedIds }: { artistId: string; artistName: string; likedIds: Set<string> }) {
  const tracks = await fetchArtistTracks(artistId, artistName, 100).catch(() => []);

  return (
    <div className="mt-10 space-y-16">
      <Suspense fallback={<SimilarArtistsSkeleton />}>
        <SimilarArtists artistId={artistId} artistName={artistName} tracks={tracks} />
      </Suspense>
      <DiscographyAlbums tracks={tracks} likedIds={likedIds} />
    </div>
  );
}

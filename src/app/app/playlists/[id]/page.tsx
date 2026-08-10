import type { Metadata } from "next";
import { Suspense } from "react";

import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchTracksByIds } from "@/lib/catalog";

import { PlaylistTracks } from "./playlist-tracks";
import { PlaylistActions } from "./playlist-actions";
import { RowListSkeleton } from "@/components/layout/skeletons";

interface PlaylistDetailPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PlaylistDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return { title: "Playlist" };
  const playlist = await prisma.playlist.findFirst({ where: { id, userId: session.user.id } });
  return { title: playlist?.name ?? "Playlist" };
}

export default async function PlaylistDetailPage({ params }: PlaylistDetailPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const [playlist, trackCount] = await Promise.all([
    prisma.playlist.findFirst({ where: { id, userId: session.user.id } }),
    prisma.playlistTrack.count({ where: { playlistId: id } }),
  ]);
  if (!playlist) notFound();

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Playlist</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{playlist.name}</h1>
          {playlist.description && (
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">{playlist.description}</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {trackCount} track{trackCount === 1 ? "" : "s"}
          </p>
        </div>
        <PlaylistActions playlistId={id} name={playlist.name} />
      </div>

      <Suspense fallback={<RowListSkeleton rows={10} />}>
        <PlaylistTracksContent playlistId={id} />
      </Suspense>
    </div>
  );
}

async function PlaylistTracksContent({ playlistId }: { playlistId: string }) {
  const entries = await prisma.playlistTrack.findMany({
    where: { playlistId },
    orderBy: { position: "asc" },
    select: { trackId: true },
  });

  const tracks = await fetchTracksByIds(entries.map((e) => e.trackId));

  return <PlaylistTracks playlistId={playlistId} tracks={tracks} />;
}
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchTracksByIds } from "@/lib/jamendo";

import { PlaylistTracks } from "./playlist-tracks";
import { PlaylistActions } from "./playlist-actions";

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

  const playlist = await prisma.playlist.findFirst({ where: { id, userId: session.user.id } });
  if (!playlist) notFound();

  const entries = await prisma.playlistTrack.findMany({
    where: { playlistId: id },
    orderBy: { position: "asc" },
    select: { trackId: true },
  });

  const tracks = await fetchTracksByIds(entries.map((e) => e.trackId));

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
            {tracks.length} track{tracks.length === 1 ? "" : "s"}
          </p>
        </div>
        <PlaylistActions playlistId={id} name={playlist.name} />
      </div>

      <PlaylistTracks playlistId={id} tracks={tracks} />
    </div>
  );
}

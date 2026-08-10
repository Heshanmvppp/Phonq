import type { Metadata } from "next";
import { Suspense } from "react";

import Link from "next/link";

import { ListMusic } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CardGridSkeleton } from "@/components/layout/skeletons";
import { EditPlaylistDialog } from "./edit-playlist-dialog";

export const metadata: Metadata = {
  title: "Playlists",
};

export const dynamic = "force-dynamic";

interface PlaylistsPageProps {
  searchParams: Promise<{ edit?: string }>;
}

export default function PlaylistsPage({ searchParams }: PlaylistsPageProps) {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<CardGridSkeleton cells={6} />}>
        <PlaylistsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function PlaylistsContent({ searchParams }: PlaylistsPageProps) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const playlists = await prisma.playlist.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { tracks: true } } },
  });

  const { edit } = await searchParams;
  const editPlaylist = edit ? playlists.find((p) => p.id === edit) ?? null : null;

  return (
    <>
      <SectionHeading
        align="left"
        eyebrow="Library"
        title="Your playlists"
        description="Collections you've built, newest first."
      />

      {playlists.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={ListMusic}
            title="No playlists yet"
            description="Use “New playlist” in the sidebar, or add tracks straight from the plus button."
          />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {playlists.map((playlist) => (
            <Link key={playlist.id} href={`/app/playlists/${playlist.id}`}>
              <Card className="group p-5 transition-colors hover:border-primary/40">
                <div className="flex aspect-square items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ListMusic className="size-10 transition-transform group-hover:scale-110" />
                </div>
                <p className="mt-3 truncate text-sm font-semibold">{playlist.name}</p>
                <p className="text-xs text-muted-foreground">
                  {playlist._count.tracks} track{playlist._count.tracks === 1 ? "" : "s"}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <EditPlaylistDialog key={editPlaylist?.id ?? "none"} playlist={editPlaylist} />
    </>
  );
}
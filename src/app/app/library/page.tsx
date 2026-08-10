import type { Metadata } from "next";
import { Suspense } from "react";

import Link from "next/link";

import { Heart, History, ListMusic } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { CardGridSkeleton } from "@/components/layout/skeletons";

export const metadata: Metadata = {
  title: "Library",
};

export const dynamic = "force-dynamic";

export default function LibraryPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<CardGridSkeleton cells={6} />}>
        <LibraryContent />
      </Suspense>
    </div>
  );
}

async function LibraryContent() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [favoriteCount, playlistCount, playlistRows] = await Promise.all([
    prisma.favorite.count({ where: { userId: session.user.id } }),
    prisma.playlist.count({ where: { userId: session.user.id } }),
    prisma.playlist.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 4,
      include: { _count: { select: { tracks: true } } },
    }),
  ]);

  return (
    <>
      <SectionHeading align="left" eyebrow="Your library" title="Everything you saved" />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link href="/app/liked">
          <Card className="group flex items-center gap-4 p-5 transition-colors hover:border-primary/40">
            <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Heart className="size-5" />
            </span>
            <div>
              <p className="font-display text-lg font-bold">{favoriteCount}</p>
              <p className="text-sm text-muted-foreground">Liked songs</p>
            </div>
          </Card>
        </Link>
        <Link href="/app/playlists">
          <Card className="group flex items-center gap-4 p-5 transition-colors hover:border-primary/40">
            <span className="flex size-11 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <ListMusic className="size-5" />
            </span>
            <div>
              <p className="font-display text-lg font-bold">{playlistCount}</p>
              <p className="text-sm text-muted-foreground">Playlists</p>
            </div>
          </Card>
        </Link>
        <Link href="/app/history">
          <Card className="group flex items-center gap-4 p-5 transition-colors hover:border-primary/40">
            <span className="flex size-11 items-center justify-center rounded-lg bg-success/10 text-success">
              <History className="size-5" />
            </span>
            <div>
              <p className="font-display text-lg font-bold">∞</p>
              <p className="text-sm text-muted-foreground">Listening history</p>
            </div>
          </Card>
        </Link>
      </div>

      {playlistRows.length > 0 && (
        <div className="mt-12">
          <div className="flex items-end justify-between">
            <SectionHeading align="left" eyebrow="Recent" title="Recent playlists" />
            <Link href="/app/playlists" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {playlistRows.map((playlist) => (
              <Link key={playlist.id} href={`/app/playlists/${playlist.id}`}>
                <Card className="group p-5 transition-colors hover:border-primary/40">
                  <div className="flex aspect-square items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ListMusic className="size-8 transition-transform group-hover:scale-110" />
                  </div>
                  <p className="mt-3 truncate text-sm font-semibold">{playlist.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {playlist._count.tracks} track{playlist._count.tracks === 1 ? "" : "s"}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
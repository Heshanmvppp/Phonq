import type { Metadata } from "next";

import Link from "next/link";

import { ListMusic } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Playlists",
};

export const dynamic = "force-dynamic";

export default async function PlaylistsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const playlists = await prisma.playlist.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { tracks: true } } },
  });

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <SectionHeading
        align="left"
        eyebrow="Library"
        title="Your playlists"
        description="Collections you've built, newest first."
      />

      {playlists.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <ListMusic className="size-8 text-muted-foreground/50" />
          <p className="font-display text-lg font-semibold">No playlists yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Use “New playlist” in the sidebar, or add tracks straight from the plus button.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {playlists.map((playlist) => (
            <Link key={playlist.id} href={`/app/playlists/${playlist.id}`}>
              <Card className="group p-5 transition-colors hover:border-primary/40">
                <div className="flex aspect-square items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-orange-500/20 text-primary">
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
    </div>
  );
}

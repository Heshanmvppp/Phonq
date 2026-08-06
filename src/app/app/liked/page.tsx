import type { Metadata } from "next";

import { Heart } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchTracksByIds } from "@/lib/jamendo";

import { TrackRow } from "@/components/track/track-row";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "Liked songs",
};

export const dynamic = "force-dynamic";

export default async function LikedPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { trackId: true },
  });

  const tracks = await fetchTracksByIds(favorites.map((f) => f.trackId));

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <SectionHeading
        align="left"
        eyebrow="Library"
        title="Liked songs"
        description={`${tracks.length} track${tracks.length === 1 ? "" : "s"} you've liked.`}
      />

      {tracks.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <Heart className="size-8 text-muted-foreground/50" />
          <p className="font-display text-lg font-semibold">Nothing here yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tap the heart on any track to save it here.
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-1">
          {tracks.map((track, index) => (
            <TrackRow key={track.id} track={track} queue={tracks} index={index} liked showPosition />
          ))}
        </div>
      )}
    </div>
  );
}

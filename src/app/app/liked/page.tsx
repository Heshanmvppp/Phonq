import type { Metadata } from "next";

import { Heart } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchTracksByIds } from "@/lib/jamendo";

import { TrackRow } from "@/components/track/track-row";
import { SectionHeading } from "@/components/marketing/section-heading";
import { EmptyState } from "@/components/ui/empty-state";

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
  const tracksById = new Map(tracks.map((t) => [t.id, t]));
  const orderedTracks = favorites
    .map((f) => tracksById.get(f.trackId))
    .filter((t): t is NonNullable<typeof t> => t != null);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <SectionHeading
        align="left"
        eyebrow="Library"
        title="Liked songs"
        description={`${orderedTracks.length} track${orderedTracks.length === 1 ? "" : "s"} you've liked.`}
      />

      {orderedTracks.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={Heart}
            title="Nothing here yet"
            description="Tap the heart on any track to save it here."
          />
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-1">
          {orderedTracks.map((track, index) => (
            <TrackRow key={track.id} track={track} queue={orderedTracks} index={index} liked showPosition />
          ))}
        </div>
      )}
    </div>
  );
}

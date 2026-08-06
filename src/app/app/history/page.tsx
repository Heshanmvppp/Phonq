import type { Metadata } from "next";

import { History } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchTracksByIds } from "@/lib/jamendo";

import { TrackRow } from "@/components/track/track-row";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: "History",
};

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const listens = await prisma.listen.findMany({
    where: { userId: session.user.id },
    orderBy: { listenedAt: "desc" },
    take: 100,
    select: { trackId: true, listenedAt: true },
  });

  const uniqueIds = [...new Set(listens.map((l) => l.trackId))];
  const tracks = await fetchTracksByIds(uniqueIds);
  const byId = new Map(tracks.map((t) => [t.id, t]));

  const rows = listens
    .map((listen) => ({ track: byId.get(listen.trackId) }))
    .filter((row): row is { track: NonNullable<typeof row.track> } => Boolean(row.track));

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <SectionHeading
        align="left"
        eyebrow="Library"
        title="Listening history"
        description="Everything you've played, most recent first."
      />

      {rows.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-xl border border-dashed p-12 text-center">
          <History className="size-8 text-muted-foreground/50" />
          <p className="font-display text-lg font-semibold">No history yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Play some tracks and they&apos;ll show up here.
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-1">
          {rows.map((row, index) => (
            <TrackRow key={`${row.track.id}-${index}`} track={row.track} queue={rows.map((r) => r.track)} index={index} showPosition />
          ))}
        </div>
      )}
    </div>
  );
}

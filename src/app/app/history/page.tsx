import type { Metadata } from "next";

import { Suspense } from "react";
import { History, Clock, TrendingUp } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchTracksByIds, fetchTrendingPhonk } from "@/lib/catalog";

import { Timeline } from "@/components/track/timeline";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RowListSkeleton } from "@/components/layout/skeletons";
import { groupByDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "History",
};

export const dynamic = "force-dynamic";

export default function HistoryPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<RowListSkeleton rows={6} />}>
        <HistoryContent />
      </Suspense>
    </div>
  );
}

async function HistoryContent() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [listens, recentTrending] = await Promise.all([
    prisma.listen.findMany({
      where: { userId: session.user.id },
      orderBy: { listenedAt: "desc" },
      take: 100,
      select: { trackId: true, listenedAt: true },
    }),
    fetchTrendingPhonk(8).catch(() => []),
  ]);

  const uniqueIds = [...new Set(listens.map((l) => l.trackId))];
  const tracks = await fetchTracksByIds(uniqueIds);
  const byId = new Map(tracks.map((t) => [t.id, t]));

  const timelineItems = listens
    .map((listen) => {
      const track = byId.get(listen.trackId);
      if (!track) return null;
      return {
        id: `${track.id}-${listen.listenedAt.getTime()}`,
        track,
        timestamp: listen.listenedAt,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const groups = groupByDate(timelineItems, (item) => item.timestamp);

  return (
    <>
      <SectionHeading
        align="left"
        eyebrow="Library"
        title="Listening history"
        description="Everything you&apos;ve played, most recent first."
      />

      {groups.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={History}
            title="No history yet"
            description="Play some tracks and they'll show up here. Your recently played list will appear as a visual timeline."
          >
            {recentTrending.length > 0 && (
              <div className="mt-4 w-full">
                <div className="mb-4 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <TrendingUp className="size-4" />
                  <span>Trending now</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {recentTrending.map((track) => (
                    <Card key={track.id} className="p-3">
                      <p className="truncate text-xs font-medium">{track.name}</p>
                      <p className="text-xs text-muted-foreground">{track.artistName}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </EmptyState>
        </div>
      ) : (
        <div className="mt-8">
          <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Clock className="size-4" />
            <span>Recent activity</span>
          </div>
          <Timeline groups={groups} />
        </div>
      )}
    </>
  );
}
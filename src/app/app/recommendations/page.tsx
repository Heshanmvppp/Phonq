import type { Metadata } from "next";
import { Suspense } from "react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchTrendingPhonk, fetchFreshDrops, fetchSubgenreTracks, fetchTracksByIds, searchTracks, fetchTracks } from "@/lib/catalog";
import { buildAffinity, rankForYou } from "@/lib/recommendations";
import { getSubgenre } from "@/lib/phonk-genres";

import { TrackStrip } from "@/components/track/track-strip";
import { TrackGrid } from "@/components/track/track-grid";
import { SectionHeading } from "@/components/marketing/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { TrackGridSkeleton } from "@/components/layout/skeletons";
import { Sparkles } from "lucide-react";

import type { Track } from "@/lib/jamendo";

export const metadata: Metadata = {
  title: "Recommendations",
  description: "Tracks picked for you from your listening history, genres and top artists.",
};

export const dynamic = "force-dynamic";

const SUBGENRE_STRIP_LIMIT = 16;

export default async function RecommendationsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [listenRows, favoriteRows] = await Promise.all([
    prisma.listen.findMany({
      where: { userId: session.user.id },
      orderBy: { listenedAt: "desc" },
      take: 500,
      select: { trackId: true },
    }),
    prisma.favorite.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: { trackId: true },
    }),
  ]);

  const listenedIds = listenRows.map((l) => l.trackId);
  const favoriteTrackIds = favoriteRows.map((f) => f.trackId);
  const likedIds = new Set(favoriteTrackIds);
  const listenedIdSet = new Set(listenedIds);
  const isNewUser = listenedIds.length < 5;

  const [listenedTracks, favoriteTracks] = await Promise.all([
    listenedIds.length > 0 ? fetchTracksByIds([...new Set(listenedIds)]).catch(() => []) : Promise.resolve<Track[]>([]),
    favoriteTrackIds.length > 0 ? fetchTracksByIds([...new Set(favoriteTrackIds)]).catch(() => []) : Promise.resolve<Track[]>([]),
  ]);

  // Preserve recency order for affinity weighting (most recent listen first).
  const listenedOrdered = listenedIds
    .map((id) => listenedTracks.find((t) => t.id === id))
    .filter((t): t is Track => t != null);

  const profile = buildAffinity(listenedOrdered, favoriteTracks);
  const topSubgenres = Array.from(profile.subgenres.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([slug]) => slug);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-10 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">For you</p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {isNewUser ? "Start building your feed" : "Your recommendations"}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          {isNewUser
            ? "Play tracks across the phonk catalog — your history, top artists and favorite subgenres shape every pick here."
            : "Scored from your listening history, favorite subgenres and top artists. New picks appear as you listen."}
        </p>
      </header>

      {isNewUser ? (
        <Suspense fallback={<TrackGridSkeleton cells={8} />}>
          <NewUserDiscovery likedIds={likedIds} listenedIdSet={listenedIdSet} />
        </Suspense>
      ) : (
        <div className="space-y-14">
          <Suspense fallback={<TrackStrip eyebrow="For you" title="Made for you" tracks={[]} loading />}>
            <MadeForYou profile={profile} listenedIdSet={listenedIdSet} likedIds={likedIds} />
          </Suspense>

          {profile.topArtist ? (
            <Suspense fallback={<TrackStrip eyebrow={profile.topArtist} title="Because you like them" tracks={[]} loading />}>
              <ArtistDiscovery artistName={profile.topArtist} profile={profile} likedIds={likedIds} />
            </Suspense>
          ) : null}

          {topSubgenres.map((slug) => {
            const sub = getSubgenre(slug);
            if (!sub) return null;
            const title = sub.aka ? `${sub.name} (${sub.aka})` : sub.name;
            return (
              <Suspense key={slug} fallback={<TrackStrip eyebrow={sub.group} title={title} tracks={[]} loading />}>
                <SubgenreStrip slug={slug} subgenre={sub} likedIds={likedIds} />
              </Suspense>
            );
          })}

          {profile.topTag ? (
            <Suspense fallback={<TrackStrip eyebrow="Vibes" title={`More “${profile.topTag}”`} tracks={[]} loading />}>
              <TagDiscovery tag={profile.topTag} profile={profile} likedIds={likedIds} />
            </Suspense>
          ) : null}
        </div>
      )}
    </div>
  );
}

async function NewUserDiscovery({ likedIds, listenedIdSet }: { likedIds: Set<string>; listenedIdSet: Set<string> }) {
  const trending = await fetchTrendingPhonk(12).catch(() => []);
  const fresh = await fetchFreshDrops(8).catch(() => []);
  const pool = dedupe([...trending, ...fresh], listenedIdSet);

  if (pool.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No recommendations yet"
        description="Play tracks across the catalog and we'll start serving personalized picks."
      />
    );
  }

  return (
    <>
      <SectionHeading align="left" eyebrow="Start here" title="Trending phonk" description="What the community is spinning right now." />
      <div className="mt-6">
        <TrackGrid tracks={pool.slice(0, 12)} likedIds={likedIds} />
      </div>
      <SectionHeading align="left" eyebrow="Start here" title="Fresh drops" description="The newest tracks in the catalog." className="mt-14" />
      <div className="mt-6">
        <TrackGrid tracks={fresh} likedIds={likedIds} />
      </div>
    </>
  );
}

async function MadeForYou({ profile, listenedIdSet, likedIds }: { profile: ReturnType<typeof buildAffinity>; listenedIdSet: Set<string>; likedIds: Set<string> }) {
  const pool = await gatherCandidatePool(profile, listenedIdSet);
  const picks = rankForYou(profile, pool, 20);
  if (picks.length === 0) return null;
  return (
    <TrackStrip
      icon={Sparkles}
      eyebrow="For you"
      title="Made for you"
      description="Tracks ranked from your history, favorite subgenres and top artists."
      tracks={picks}
      likedIds={likedIds}
    />
  );
}

async function SubgenreStrip({ slug, subgenre, likedIds }: { slug: string; subgenre: NonNullable<ReturnType<typeof getSubgenre>>; likedIds: Set<string> }) {
  const tracks = await fetchSubgenreTracks(slug, SUBGENRE_STRIP_LIMIT).catch(() => []);
  if (tracks.length === 0) return null;
  return (
    <TrackStrip
      icon={subgenre.icon}
      eyebrow={subgenre.group}
      title={`More “${subgenre.name}”`}
      description="Deeper into the sound you play the most."
      tracks={tracks}
      likedIds={likedIds}
    />
  );
}

async function ArtistDiscovery({ artistName, profile, likedIds }: { artistName: string; profile: ReturnType<typeof buildAffinity>; likedIds: Set<string> }) {
  const results = await searchTracks(artistName, 24).catch(() => []);
  const ranked = rankForYou(profile, results, 12);
  if (ranked.length === 0) return null;
  return (
    <TrackStrip
      eyebrow="Artists"
      title={`Because you like ${artistName}`}
      description="More from artists who share your top sound."
      tracks={ranked}
      likedIds={likedIds}
    />
  );
}

async function TagDiscovery({ tag, profile, likedIds }: { tag: string; profile: ReturnType<typeof buildAffinity>; likedIds: Set<string> }) {
  const results = await fetchTracks({ tags: [tag], boost: "popularity_week", limit: 24 }).catch(() => []);
  const ranked = rankForYou(profile, results, 12);
  if (ranked.length === 0) return null;
  return (
    <TrackStrip
      eyebrow="Vibes"
      title={`More “${tag}”`}
      description="Tracks carrying your most-played vibe."
      tracks={ranked}
      likedIds={likedIds}
    />
  );
}

async function gatherCandidatePool(profile: ReturnType<typeof buildAffinity>, listenedIdSet: Set<string>): Promise<Track[]> {
  const topSubgenres = Array.from(profile.subgenres.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([slug]) => slug);

  const [trending, fresh, subA, subB, byArtist] = await Promise.all([
    fetchTrendingPhonk(20).catch(() => []),
    fetchFreshDrops(20).catch(() => []),
    topSubgenres[0] ? fetchSubgenreTracks(topSubgenres[0], 30).catch(() => []) : Promise.resolve<Track[]>([]),
    topSubgenres[1] ? fetchSubgenreTracks(topSubgenres[1], 30).catch(() => []) : Promise.resolve<Track[]>([]),
    profile.topArtist ? searchTracks(profile.topArtist, 24).catch(() => []) : Promise.resolve<Track[]>([]),
  ]);

  return dedupe([...trending, ...fresh, ...subA, ...subB, ...byArtist], listenedIdSet);
}

function dedupe(tracks: Track[], exclude: Set<string>): Track[] {
  const seen = new Set<string>();
  const out: Track[] = [];
  for (const track of tracks) {
    if (seen.has(track.id) || exclude.has(track.id)) continue;
    seen.add(track.id);
    out.push(track);
  }
  return out;
}

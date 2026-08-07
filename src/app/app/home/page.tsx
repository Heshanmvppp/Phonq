import type { Metadata } from "next";

import { fetchFreshDrops, fetchRadios, fetchTrendingPhonk, fetchTracksByIds } from "@/lib/catalog";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Track } from "@/lib/jamendo";

import { TrackGrid } from "@/components/track/track-grid";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Home",
};

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  const session = await auth();
  const [trending, fresh, radios] = await Promise.all([
    fetchTrendingPhonk(20).catch(() => []),
    fetchFreshDrops(20).catch(() => []),
    fetchRadios().catch(() => []),
  ]);

  let favoriteCount = 0;
  let listenCount = 0;
  let likedIds: Set<string> | undefined;
  let isNewUser = true;
  let favoriteTracks: Track[] = [];
  const topTags: string[] = [];
  const topArtists: string[] = [];

  if (session?.user?.id) {
    const [listenRows, favoriteRows] = await Promise.all([
      prisma.listen.findMany({
        where: { userId: session.user.id },
        orderBy: { listenedAt: "desc" },
        take: 100,
        select: { trackId: true },
      }),
      prisma.favorite.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        select: { trackId: true },
      }),
    ]);

    listenCount = listenRows.length;
    favoriteCount = favoriteRows.length;
    likedIds = new Set(favoriteRows.map((f) => f.trackId));
    isNewUser = listenCount < 5;

    const [fetchedFavorites, listenedTracks] = await Promise.all([
      favoriteRows.length > 0
        ? fetchTracksByIds(favoriteRows.slice(0, 20).map((f) => f.trackId)).catch(() => [])
        : Promise.resolve<Track[]>([]),
      listenRows.length > 0
        ? fetchTracksByIds(listenRows.map((l) => l.trackId)).catch(() => [])
        : Promise.resolve<Track[]>([]),
    ]);
    favoriteTracks = fetchedFavorites;

    const tagCounts = new Map<string, number>();
    const artistCounts = new Map<string, number>();
    for (const track of listenedTracks) {
      for (const raw of track.tags) {
        const tag = raw.toLowerCase().trim();
        if (!tag || tag === "phonk") continue;
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
      const genre = track.genre?.toLowerCase().trim();
      if (genre && genre !== "phonk") {
        tagCounts.set(genre, (tagCounts.get(genre) ?? 0) + 1);
      }
      if (track.artistName) {
        artistCounts.set(track.artistName, (artistCounts.get(track.artistName) ?? 0) + 1);
      }
    }
    topTags.push(...[...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([tag]) => tag));
    topArtists.push(...[...artistCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([name]) => name));
  }

  const greeting = isNewUser ? "Welcome to Phonq" : "Welcome back";
  const greetingDesc = isNewUser
    ? "Your music journey starts here. Explore the phonk catalog and discover your sound."
    : "Your listening history powers the picks below.";

  return (
    <div className="space-y-12 px-4 py-8 sm:px-6 lg:px-8">
      {!isNewUser && (topTags.length > 0 || topArtists.length > 0) && (
        <div className="mb-6 rounded-lg bg-primary/5 p-4 text-center">
          <p className="text-sm font-medium text-primary">
            {topTags.length > 0
              ? `Based on your listening history, "${topTags[0]}"${topTags[1] ? ` and "${topTags[1]}"` : ""} are your most-played vibes — the fresh drops below should fit right in.`
              : `Your most-played artists: ${topArtists.slice(0, 2).join(" and ")}. Fresh drops are waiting below.`}
          </p>
        </div>
      )}

      <section>
        <div className="flex items-end justify-between gap-4">
          <SectionHeading
            align="left"
            eyebrow={isNewUser ? "Start here" : "Right now"}
            title={isNewUser ? "Trending in phonk" : greeting}
            description={greetingDesc}
          />
        </div>
        <div className="mt-6">
          {isNewUser && session?.user ? (
            <p className="mb-4 max-w-lg text-sm text-muted-foreground">
              Tip: Hover a track and click play to start a queue. Use the &quot;+&quot; button to add it to a playlist.
            </p>
          ) : null}
          <TrackGrid tracks={trending} likedIds={likedIds} />
        </div>
      </section>

      <section>
        <SectionHeading
          align="left"
          eyebrow={isNewUser ? "Discover" : "Just landed"}
          title="Fresh drops"
          description="The newest tracks added to the catalog."
        />
        <div className="mt-6">
          <TrackGrid tracks={fresh} likedIds={likedIds} />
        </div>
      </section>

      {favoriteTracks.length > 0 && (
        <section>
          <SectionHeading
            align="left"
            eyebrow="Made for you"
            title="From your library"
            description={`You've loved ${favoriteCount} tracks — pick up where you left off.`}
          />
          <div className="mt-6">
            <TrackGrid tracks={favoriteTracks.slice(0, 10)} likedIds={likedIds} />
          </div>
        </section>
      )}

      <section>
        <SectionHeading align="left" eyebrow="Radios" title="Tune in" description="Genre radios curated by the Jamendo editorial team." />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {radios.slice(0, 10).map((radio) => (
            <Card key={radio.id} className="flex flex-col items-center gap-3 p-5 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                {radio.displayName.slice(0, 1).toUpperCase()}
              </span>
              <p className="truncate text-sm font-medium">{radio.displayName}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

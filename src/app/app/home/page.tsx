import type { Metadata } from "next";

import {
  fetchFreshDrops,
  fetchRadios,
  fetchSubgenreTracks,
  fetchTrendingPhonk,
  fetchTracks,
  fetchTracksByIds,
} from "@/lib/catalog";
import { getSubgenre, PHONK_SUBGENRES } from "@/lib/phonk-genres";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Track } from "@/lib/jamendo";
import { buildAffinity, rankForYou } from "@/lib/recommendations";

import { TrackStrip } from "@/components/track/track-strip";
import { SectionHeading } from "@/components/marketing/section-heading";
import { RadioCard } from "@/components/radio/radio-card";

export const metadata: Metadata = {
  title: "Home",
};

export const dynamic = "force-dynamic";

const SUBGENRE_STRIP_LIMIT = 12;

export default async function AppHomePage() {
  const session = await auth();

  let favoriteCount = 0;
  let listenCount = 0;
  let likedIds: Set<string> | undefined;
  let isNewUser = true;
  let favoriteTracks: Track[] = [];
  let listenedTracks: Track[] = [];

  const [trending, fresh, radios, subgenreRows, listenRows, favoriteRows] = await Promise.all([
    fetchTrendingPhonk(20).catch(() => []),
    fetchFreshDrops(20).catch(() => []),
    fetchRadios().catch(() => []),
    Promise.all(
      PHONK_SUBGENRES.map(async (subgenre) => ({
        subgenre,
        tracks: (await fetchSubgenreTracks(subgenre.slug, SUBGENRE_STRIP_LIMIT).catch(() => [])) as Track[],
      })),
    ),
    session?.user?.id
      ? prisma.listen.findMany({
          where: { userId: session.user.id },
          orderBy: { listenedAt: "desc" },
          take: 100,
          select: { trackId: true },
        })
      : Promise.resolve([]),
    session?.user?.id
      ? prisma.favorite.findMany({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
          select: { trackId: true },
        })
      : Promise.resolve([]),
  ]);

  if (session?.user?.id) {
    listenCount = listenRows.length;
    favoriteCount = favoriteRows.length;
    likedIds = new Set(favoriteRows.map((f) => f.trackId));
    isNewUser = listenCount < 5;

    const [fetchedFavorites, fetchedListened] = await Promise.all([
      favoriteRows.length > 0
        ? fetchTracksByIds(favoriteRows.slice(0, 20).map((f) => f.trackId)).catch(() => [])
        : Promise.resolve<Track[]>([]),
      listenRows.length > 0
        ? fetchTracksByIds(listenRows.map((l) => l.trackId)).catch(() => [])
        : Promise.resolve<Track[]>([]),
    ]);
    favoriteTracks = fetchedFavorites;
    listenedTracks = fetchedListened;
  }

  const profile = buildAffinity(listenedTracks, favoriteTracks);
  const topTag = profile.topTag;
  const topSubgenreName = profile.topSubgenre ? (getSubgenre(profile.topSubgenre)?.name ?? null) : null;

  // Recently played, in listen order with duplicates collapsed.
  const trackById = new Map(listenedTracks.map((track) => [track.id, track]));
  const recentlyPlayed: Track[] = [];
  const seenRecent = new Set<string>();
  for (const row of listenRows) {
    const track = trackById.get(row.trackId);
    if (!track || seenRecent.has(track.id)) continue;
    seenRecent.add(track.id);
    recentlyPlayed.push(track);
    if (recentlyPlayed.length === 12) break;
  }

  const topTagTracks = !isNewUser && topTag
    ? await fetchTracks({ tags: [topTag], limit: SUBGENRE_STRIP_LIMIT, boost: "popularity_week" }).catch(() => [])
    : [];

  const forYouCandidates = [...trending, ...fresh, ...subgenreRows.flatMap((row) => row.tracks)];
  const forYou = rankForYou(profile, forYouCandidates, 12);

  return (
    <div className="space-y-14 px-4 py-8 sm:px-6 lg:px-8">
      <header className="animate-fade-up space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">
          {isNewUser ? "New here?" : "Welcome back"}
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {isNewUser ? "Start your phonk journey" : "Good to see you"}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          {isNewUser
            ? "Every track here is classified into a phonk subgenre — and nothing else. Hover a card and press play to start a queue; we learn your taste from there."
            : "Your listening history powers the picks below — from your top vibes to what&apos;s hot right now."}
        </p>
      </header>

      <TrackStrip
        eyebrow="For you"
        title={isNewUser ? "Kick off your journey" : "Picked for you"}
        description={
          isNewUser
            ? "Today's phonk ranked by momentum. Play a few tracks and this row starts learning you."
            : topSubgenreName && profile.topArtist
              ? `Scored from your history — ${profile.topArtist} and ${topSubgenreName} lead the mix, cut with what's hot right now.`
              : topSubgenreName
                ? `Scored from your ${listenCount} listens — ${topSubgenreName} leads, plus fresh finds.`
                : "Scored from your listening history, mixed with what's hot right now."
        }
        tracks={forYou}
        likedIds={likedIds}
      />

      {!isNewUser && (
        <div className="space-y-14">
          {recentlyPlayed.length > 0 && (
            <TrackStrip
              eyebrow="Welcome back"
              title="Recently played"
              description="Pick up right where you left off."
              tracks={recentlyPlayed}
              likedIds={likedIds}
            />
          )}

          {favoriteTracks.length > 0 && (
            <TrackStrip
              eyebrow="Welcome back"
              title="From your library"
              description={`You've loved ${favoriteCount} track${favoriteCount === 1 ? "" : "s"} — start here.`}
              tracks={favoriteTracks.slice(0, SUBGENRE_STRIP_LIMIT)}
              likedIds={likedIds}
            />
          )}

          {topTag && topTagTracks.length > 0 && (
            <TrackStrip
              eyebrow="Welcome back"
              title={`More “${topTag}”`}
              description="Your most-played vibe, served fresh."
              tracks={topTagTracks}
              likedIds={likedIds}
            />
          )}
        </div>
      )}

      <TrackStrip
        eyebrow={isNewUser ? "Discover" : "Just landed"}
        title="Fresh drops"
        description="The newest tracks added to the catalog."
        tracks={fresh}
        likedIds={likedIds}
      />

      <section className="space-y-12">
        <SectionHeading
          align="left"
          eyebrow="Explore"
          title="Browse by subgenre"
          description="Every track on Phonq is classified into one of these phonk subgenres. Scroll a row to preview — tap See all to dive in."
        />
        <div className="space-y-12">
          {subgenreRows.map(({ subgenre, tracks }) => (
            <TrackStrip
              key={subgenre.slug}
              icon={subgenre.icon}
              eyebrow={subgenre.group}
              title={subgenre.name}
              description={subgenre.aka}
              tracks={tracks}
              likedIds={likedIds}
              seeAllHref={`/app/genres/${subgenre.slug}`}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading align="left" eyebrow="Radios" title="Tune in" description="Genre radios curated by the Jamendo editorial team." />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {radios.slice(0, 10).map((radio) => (
            <RadioCard key={radio.id} radio={radio} />
          ))}
        </div>
      </section>
    </div>
  );
}

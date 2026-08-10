import {
  fetchFreshDrops,
  fetchRadios,
  fetchSubgenreTracks,
  fetchTracks,
  fetchTrendingPhonk,
  fetchTracksByIds,
} from "@/lib/catalog";
import { getSubgenre, PHONK_SUBGENRES } from "@/lib/phonk-genres";
import type { Track } from "@/lib/jamendo";
import { buildAffinity, rankForYou } from "@/lib/recommendations";

import { TrackStrip } from "@/components/track/track-strip";
import { RadioCard } from "@/components/radio/radio-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Skeleton } from "@/components/ui/skeleton";

export const SUBGENRE_STRIP_LIMIT = 12;

interface PersonalizedProps {
  userId?: string;
  listenedTrackIds: string[];
  favoriteTrackIds: string[];
  likedIds: Set<string>;
  isNewUser: boolean;
  listenCount: number;
  favoriteCount: number;
}

/**
 * Everything derived from a user's listening data (For You, Recently played,
 * From your library, More top-tag). It runs in its own Suspense island so the
 * catalog-independent parts of the page paint instantly while this streams.
 */
export async function PersonalizedContent({
  userId,
  listenedTrackIds,
  favoriteTrackIds,
  likedIds,
  isNewUser,
  listenCount,
  favoriteCount,
}: PersonalizedProps) {
  const [trending, fresh, subgenreRows] = await Promise.all([
    fetchTrendingPhonk(20).catch(() => []),
    fetchFreshDrops(20).catch(() => []),
    Promise.all(
      PHONK_SUBGENRES.map(async (subgenre) => ({
        subgenre,
        tracks: (await fetchSubgenreTracks(subgenre.slug, SUBGENRE_STRIP_LIMIT).catch(() => [])) as Track[],
      })),
    ),
  ]);

  const [fetchedFavorites, fetchedListened] = await Promise.all([
    favoriteTrackIds.length > 0
      ? fetchTracksByIds(favoriteTrackIds.slice(0, 20)).catch(() => [])
      : Promise.resolve<Track[]>([]),
    listenedTrackIds.length > 0
      ? fetchTracksByIds(listenedTrackIds).catch(() => [])
      : Promise.resolve<Track[]>([]),
  ]);

  const favoriteTracks = fetchedFavorites;
  const listenedTracks = fetchedListened;

  const profile = buildAffinity(listenedTracks, favoriteTracks);
  const topTag = profile.topTag;
  const topSubgenreName = profile.topSubgenre ? (getSubgenre(profile.topSubgenre)?.name ?? null) : null;

  const trackById = new Map(listenedTracks.map((track) => [track.id, track]));
  const recentlyPlayed: Track[] = [];
  const seenRecent = new Set<string>();
  for (const trackId of listenedTrackIds) {
    const track = trackById.get(trackId);
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
    <div className="space-y-14">
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
    </div>
  );
}

export async function FreshDropsStrip({ likedIds }: { likedIds: Set<string> }) {
  const fresh = await fetchFreshDrops(20).catch(() => []);
  return (
    <TrackStrip
      eyebrow="Just landed"
      title="Fresh drops"
      description="The newest tracks added to the catalog."
      tracks={fresh}
      likedIds={likedIds}
    />
  );
}

export async function SubgenreRow({ slug, likedIds }: { slug: string; likedIds: Set<string> }) {
  const tracks = (await fetchSubgenreTracks(slug, SUBGENRE_STRIP_LIMIT).catch(() => [])) as Track[];
  const subgenre = getSubgenre(slug);
  return (
    <TrackStrip
      icon={subgenre?.icon}
      eyebrow={subgenre?.group}
      title={subgenre?.name ?? slug}
      description={subgenre?.aka}
      tracks={tracks}
      likedIds={likedIds}
      seeAllHref={`/app/genres/${slug}`}
    />
  );
}

export async function RadioGrid({ limit = 10 }: { limit?: number }) {
  const radios = await fetchRadios().catch(() => []);
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {radios.slice(0, limit).map((radio) => (
        <RadioCard key={radio.id} radio={radio} />
      ))}
    </div>
  );
}

export function RadiosSkeleton({ cards = 10 }: { cards?: number }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function PersonalizedSkeleton() {
  return (
    <div className="space-y-14">
      <TrackStrip eyebrow="For you" title="Picked for you" tracks={[]} loading />
      <TrackStrip eyebrow="Welcome back" title="From your library" tracks={[]} loading />
    </div>
  );
}
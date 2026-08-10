import { groupTracksByAlbum } from "@/lib/catalog";
import { AlbumCard } from "@/components/collection/album-card";
import { TrackGrid } from "@/components/track/track-grid";
import { SectionHeading } from "@/components/marketing/section-heading";
import type { Track } from "@/lib/jamendo";

interface DiscographyAlbumsProps {
  tracks: Track[];
  likedIds: Set<string>;
}

/**
 * Artist page: a "Top tracks" grid plus the full discography grouped into album
 * cards. `tracks` is fetched once by the parent and shared with the similar
 * artists section to avoid duplicate network calls.
 */
export function DiscographyAlbums({ tracks, likedIds }: DiscographyAlbumsProps) {
  if (tracks.length === 0) return null;

  const topTracks = [...tracks]
    .sort((a, b) => (b.popularityWeek ?? 0) - (a.popularityWeek ?? 0) || (b.popularityTotal ?? 0) - (a.popularityTotal ?? 0))
    .slice(0, 12);
  const groups = groupTracksByAlbum(tracks);

  return (
    <div className="space-y-14">
      <section>
        <SectionHeading align="left" eyebrow="Artist" title="Top tracks" description="The most popular songs from this artist." />
        <div className="mt-6">
          <TrackGrid tracks={topTracks} likedIds={likedIds} />
        </div>
      </section>

      <section>
        <SectionHeading align="left" eyebrow="Artist" title="Discography" description={`Albums and releases — ${tracks.length} track${tracks.length === 1 ? "" : "s"}`} />
        <div className="mt-6">
          {groups.length === 0 ? (
            <TrackGrid tracks={tracks} likedIds={likedIds} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {groups.map((group) => {
                if (group.album.id === "singles") {
                  return <TrackGrid key="singles" tracks={group.tracks} likedIds={likedIds} />;
                }
                return <AlbumCard key={group.album.id} album={group.album} />;
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

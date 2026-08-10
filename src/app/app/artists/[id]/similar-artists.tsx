import { fetchSimilarArtists } from "@/lib/catalog";
import { ArtistCard } from "@/components/collection/artist-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { Track } from "@/lib/jamendo";

interface SimilarArtistsProps {
  artistId: string;
  artistName: string;
  tracks: Track[];
  limit?: number;
}

/**
 * Artist page: "Similar artists" — derived from the subgenres an artist's tracks
 * sit in (Jamendo doesn't expose a similar-artists endpoint), surfacing other
 * phonk artists who share those sounds.
 */
export async function SimilarArtists({ artistId, artistName, tracks, limit = 8 }: SimilarArtistsProps) {
  const similar = await fetchSimilarArtists(artistId, artistName, tracks, limit);

  if (similar.length === 0) {
    return null;
  }

  return (
    <section>
      <SectionHeading align="left" eyebrow="Artist" title="Similar artists" description="Other phonk artists sharing this sound." />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {similar.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </div>
    </section>
  );
}

export function SimilarArtistsSkeleton() {
  return (
    <section>
      <SectionHeading align="left" eyebrow="Artist" title="Similar artists" description="Other phonk artists sharing this sound." />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
        ))}
      </div>
    </section>
  );
}

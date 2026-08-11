import type { Metadata } from "next";
import { Suspense } from "react";

import { Music2 } from "lucide-react";

import { fetchBrowseArtists } from "@/lib/catalog";

import { ArtistCard } from "@/components/collection/artist-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { CardGridSkeleton } from "@/components/layout/skeletons";

export const metadata: Metadata = {
  title: "Artists",
};

export const dynamic = "force-dynamic";

export default async function ArtistsBrowsePage() {
  return (
    <div className="space-y-12 px-4 py-8 sm:px-6 lg:px-8">
      <SectionHeading
        align="left"
        eyebrow="Browse"
        title="Artists"
        description="Top artists in the phonk scene — dive into any discography."
      />

      <Suspense fallback={<CardGridSkeleton cells={20} />}>
        <ArtistsGrid />
      </Suspense>
    </div>
  );
}

async function ArtistsGrid() {
  const artists = await fetchBrowseArtists(48).catch(() => []);

  if (artists.length === 0) {
    return (
      <EmptyState
        icon={Music2}
        title="No artists yet"
        description="Artists appear here as the catalog fills up — check back shortly."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {artists.map((artist) => (
        <ArtistCard key={artist.id} artist={artist} />
      ))}
    </div>
  );
}

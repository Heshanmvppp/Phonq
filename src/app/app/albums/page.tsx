import type { Metadata } from "next";
import { Suspense } from "react";

import { Disc3 } from "lucide-react";

import { fetchBrowseAlbums } from "@/lib/catalog";

import { AlbumCard } from "@/components/collection/album-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { CardGridSkeleton } from "@/components/layout/skeletons";

export const metadata: Metadata = {
  title: "Albums",
};

export const dynamic = "force-dynamic";

export default async function AlbumsBrowsePage() {
  return (
    <div className="space-y-12 px-4 py-8 sm:px-6 lg:px-8">
      <SectionHeading
        align="left"
        eyebrow="Browse"
        title="Albums"
        description="Popular albums across the phonk catalog."
      />

      <Suspense fallback={<CardGridSkeleton cells={20} />}>
        <AlbumsGrid />
      </Suspense>
    </div>
  );
}

async function AlbumsGrid() {
  const albums = await fetchBrowseAlbums(48).catch(() => []);

  if (albums.length === 0) {
    return (
      <EmptyState
        icon={Disc3}
        title="No albums yet"
        description="Albums appear here as the catalog fills up — check back shortly."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {albums.map((album) => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </div>
  );
}

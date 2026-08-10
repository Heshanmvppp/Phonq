import type { Metadata } from "next";
import { Suspense } from "react";

import { fetchTrendingPhonk } from "@/lib/catalog";

import { SearchClient } from "./search-client";
import { RowListSkeleton } from "@/components/layout/skeletons";

export const metadata: Metadata = {
  title: "Search",
};

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return (
    <Suspense fallback={<RowListSkeleton rows={6} />}>
      <SearchContent />
    </Suspense>
  );
}

async function SearchContent() {
  const popularTracks = await fetchTrendingPhonk(12).catch(() => []);
  return <SearchClient popularTracks={popularTracks} />;
}
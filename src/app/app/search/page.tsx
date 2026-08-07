import type { Metadata } from "next";

import { fetchTrendingPhonk } from "@/lib/jamendo";

import { SearchClient } from "./search-client";

export const metadata: Metadata = {
  title: "Search",
};

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const popularTracks = await fetchTrendingPhonk(12).catch(() => []);
  return <SearchClient popularTracks={popularTracks} />;
}

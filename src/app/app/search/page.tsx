import type { Metadata } from "next";

import { SearchClient } from "./search-client";

export const metadata: Metadata = {
  title: "Search",
};

export const dynamic = "force-dynamic";

export default function SearchPage() {
  return <SearchClient />;
}

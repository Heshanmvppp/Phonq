import { fetchTracks, searchTracks } from "@/lib/catalog";

import { ok } from "@/lib/api";
import { checkRateLimit, ipKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await checkRateLimit(ipKey(request), 60, 60_000))) {
    return Response.json({ error: "Too many requests, slow down" }, { status: 429 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim();
  const subgenre = url.searchParams.get("subgenre")?.trim() ?? undefined;
  const tags = url.searchParams.get("tags");
  const boost = url.searchParams.get("boost") ?? undefined;
  const order = url.searchParams.get("order") ?? undefined;
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 24, 1), 60);
  const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);

  try {
    const tracks = search
      ? await searchTracks(search, limit, subgenre)
      : await fetchTracks({
          tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
          subgenre,
          boost,
          order,
          limit,
          offset,
        });
    return ok({ tracks });
  } catch {
    // Upstream errors are logged inside the catalog layer. Never leak the raw
    // message or env var names into user-facing copy.
    return ok({ tracks: [], error: "Catalog is refreshing — check back shortly." });
  }
}

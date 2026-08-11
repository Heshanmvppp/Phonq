import { fetchTracks, getCatalogStatus } from "@/lib/catalog";

import { ok } from "@/lib/api";
import { checkRateLimit, ipKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Public, read-only catalog API (v1).
 *
 * GET /api/v1/tracks?tags=phonk&boost=popularity_week&order=…&limit=60&offset=0
 *
 * Rate-limited to 30 requests / minute per IP. See the docs page for usage.
 */
export async function GET(request: Request) {
  if (!(await checkRateLimit(ipKey(request), 30, 60_000))) {
    return Response.json({ error: "Too many requests, slow down" }, { status: 429 });
  }

  const url = new URL(request.url);
  const tags = url.searchParams.get("tags");
  const boost = url.searchParams.get("boost") ?? undefined;
  const order = url.searchParams.get("order") ?? undefined;
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 24, 1), 60);
  const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);

  const tracks = await fetchTracks({
    tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
    boost,
    order,
    limit,
    offset,
  });

  const catalog = await getCatalogStatus().catch(() => null);

  return ok({
    tracks,
    count: tracks.length,
    provider: catalog?.provider ?? "live",
    params: { tags: tags ?? null, boost: boost ?? null, order: order ?? null, limit, offset },
  });
}

import { getCatalogStatus, searchTracks } from "@/lib/catalog";

import { ok } from "@/lib/api";
import { checkRateLimit, ipKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Public, read-only search API (v1).
 *
 * GET /api/v1/search?q=drift&limit=30
 *
 * Rate-limited to 30 requests / minute per IP. See the docs page for usage.
 */
export async function GET(request: Request) {
  if (!checkRateLimit(ipKey(request), 30, 60_000)) {
    return Response.json({ error: "Too many requests, slow down" }, { status: 429 });
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();
  if (!q) {
    return Response.json({ error: "Missing required query parameter: q" }, { status: 400 });
  }

  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 30, 1), 60);
  const tracks = await searchTracks(q, limit);

  const catalog = await getCatalogStatus().catch(() => null);

  return ok({
    query: q,
    tracks,
    count: tracks.length,
    provider: catalog?.provider ?? "live",
  });
}

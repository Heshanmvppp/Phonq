import { fetchYouTubeFill, getYouTubeQuota, resolveYouTubeForTrack } from "@/lib/catalog";

import { notFound, ok } from "@/lib/api";
import { checkRateLimit, ipKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * YouTube hybrid-catalog helpers.
 *
 * GET /api/youtube/quota                                  → daily search budget status
 * GET /api/youtube/fill?subgenre=…&limit=…                → cached YouTube tracks for a genre gap
 * GET /api/youtube/resolve?name=…&artist=…                → resolve a song to a YouTube video
 *
 * All routes are read-only and rate-limited. They degrade gracefully (empty
 * results / zeros) when the YouTube API key is missing or the budget is spent.
 * (A single route.ts only matches its exact path, so each action is served by
 * the [action] segment below rather than a shared base route.)
 */
export async function GET(request: Request, { params }: { params: Promise<{ action: string }> }) {
  if (!(await checkRateLimit(ipKey(request), 60, 60_000))) {
    return Response.json({ error: "Too many requests, slow down" }, { status: 429 });
  }

  const url = new URL(request.url);
  const { action } = await params;

  if (action === "quota") {
    return ok({ quota: await getYouTubeQuota() });
  }

  if (action === "fill") {
    const subgenre = url.searchParams.get("subgenre")?.trim();
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 12, 1), 50);
    if (!subgenre) return Response.json({ error: "Missing subgenre" }, { status: 400 });
    const tracks = await fetchYouTubeFill(subgenre, limit);
    return ok({ tracks, count: tracks.length, subgenre });
  }

  if (action === "resolve") {
    const name = url.searchParams.get("name")?.trim();
    const artist = url.searchParams.get("artist")?.trim() ?? "";
    if (!name) return Response.json({ error: "Missing name" }, { status: 400 });
    const track = await resolveYouTubeForTrack({ name, artistName: artist, source: "jamendo" }, undefined);
    return ok({ track: track ?? null, resolved: track != null });
  }

  return notFound("Unknown endpoint");
}
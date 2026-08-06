import { fetchTracks, searchTracks } from "@/lib/jamendo";

import { ok, serverError } from "@/lib/api";
import { checkRateLimit, ipKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!checkRateLimit(ipKey(request), 60, 60_000)) {
    return Response.json({ error: "Too many requests, slow down" }, { status: 429 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim();
  const tags = url.searchParams.get("tags");
  const boost = url.searchParams.get("boost") ?? undefined;
  const order = url.searchParams.get("order") ?? undefined;
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 24, 1), 60);
  const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);

  try {
    const tracks = search
      ? await searchTracks(search, limit)
      : await fetchTracks({
          tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
          boost,
          order,
          limit,
          offset,
        });
    return ok({ tracks });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Suspended") || message.includes("client_id")) {
      return serverError(
        "The Jamendo catalog is temporarily unavailable. Please set a valid JAMENDO_CLIENT_ID (get one free at devportal.jamendo.com).",
      );
    }
    return serverError("Failed to load tracks from Jamendo.");
  }
}

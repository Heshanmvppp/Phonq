import "server-only";

import { extractStreamUrl } from "@/lib/youtube-stream";
import { checkRateLimit, ipKey } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Same-origin audio proxy for YouTube-sourced tracks.
 *
 * GET /api/youtube/stream?videoId=…
 *
 * Extracts a deciphered audio stream URL (youtube.js, with a yt-dlp fallback —
 * see `@/lib/youtube-stream`) and streams the bytes back through this server.
 * YouTube's media responses no longer send `Access-Control-Allow-Origin`, so a
 * browser can't read them for the Web Audio analyser; proxying keeps the media
 * same-origin (just like the Jamendo `/api/audio` proxy) so the analyser works.
 *
 * Range requests are forwarded upstream so seeking works. Access is bounded by
 * the per-IP rate limit below; playback must never depend on the catalog DB
 * being reachable or the song being cached, or every YouTube track would
 * silently fall back to the IFrame engine.
 */

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const ONE_HOUR = 60 * 60 * 24 * 365;

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders() });
}

export async function GET(request: Request) {
  if (!(await checkRateLimit(ipKey(request), 1200, 60_000))) {
    return new Response("Too many requests, slow down", { status: 429, headers: corsHeaders() });
  }

  const url = new URL(request.url);
  const videoId = url.searchParams.get("videoId")?.trim() ?? "";
  if (!VIDEO_ID_RE.test(videoId)) {
    return new Response("Invalid videoId", { status: 400, headers: corsHeaders() });
  }

  let target: string;
  try {
    target = (await extractStreamUrl(videoId)).url;
  } catch (err) {
    console.warn(`[yt-stream] extraction failed for ${videoId}: ${err instanceof Error ? err.message : err}`);
    return new Response("Stream unavailable", { status: 502, headers: corsHeaders() });
  }

  try {
    const range = request.headers.get("range");
    const upstreamHeaders: HeadersInit = { accept: "audio/*, */*;q=0.8" };
    if (range) upstreamHeaders.range = range;
    const res = await fetch(target, { method: "GET", headers: upstreamHeaders, redirect: "follow" });

    if (!res.ok && res.status !== 416) {
      return new Response(`Upstream error ${res.status}`, { status: 502, headers: corsHeaders() });
    }

    const headers = new Headers(corsHeaders());
    headers.set("content-type", res.headers.get("content-type") || "audio/mp4");
    headers.set("accept-ranges", "bytes");

    const contentLength = res.headers.get("content-length");
    const contentRange = res.headers.get("content-range");
    if (contentRange) {
      headers.set("content-range", contentRange);
      headers.set("content-length", String(Number(contentLength ?? 0)));
      return new Response(res.body, { status: 206, headers });
    }
    if (contentLength) headers.set("content-length", contentLength);

    // Range requested but upstream returned the full body (e.g. 416 with full
    // content): serve as 200 with the full stream.
    if (range && (!contentRange || res.status === 416)) {
      return new Response(res.body, { status: 200, headers });
    }

    return new Response(res.body, { status: 200, headers });
  } catch (err) {
    console.warn(`[yt-stream] proxy failed for ${videoId}: ${err instanceof Error ? err.message : err}`);
    return new Response("Proxy error", { status: 502, headers: corsHeaders() });
  }
}

function corsHeaders(): Record<string, string> {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "range, content-range, content-type, authorization",
    "access-control-expose-headers": "accept-ranges, content-range, content-length, content-type",
    "cache-control": `public, max-age=${ONE_HOUR}`,
  };
}

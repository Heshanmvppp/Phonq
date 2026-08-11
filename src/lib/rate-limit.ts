import "server-only";

import ytRedis from "@/lib/yt-redis";

/**
 * Fixed-window rate limiter.
 *
 * Primary store is Redis (`ratelimit:{bucket}:{key}`, TTL 1h default) so the
 * window is enforced across instances (useful once the app runs on more than
 * one process/Vercel function). When Redis is unconfigured (dev/test) it runs
 * on the in-memory shim, and when the backing Redis goes down it falls back to
 * a per-instance Map so the API degrades, never opens up entirely.
 */

/** Per-instance fallback used only while Redis is offline. */
const store = new Map<string, { count: number; resetAt: number }>();

function memoryCheck(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  if (limit <= 0 || windowMs <= 0) return false;

  // Redis online → fixed-window counter with a per-bucket key. The bucket
  // index changes every `windowMs`, giving natural reset at the boundary.
  if (ytRedis.isOnline()) {
    const bucket = Math.floor(Date.now() / windowMs);
    const ttlSec = Math.max(1, Math.ceil(windowMs / 1000) + 1);
    const count = await ytRedis.incrCounter(`ratelimit:${bucket}:${key}`, 1, ttlSec);
    return count <= limit;
  }

  // Redis down → best-effort in-memory window (per instance).
  return memoryCheck(key, limit, windowMs);
}

/**
 * Returns a stable key for the caller of a request.
 *
 * Prefers `x-real-ip` (set by nginx/caddy and other proxies, overwritten on
 * every hop, so it cannot be spoofed by the client). Falls back to the first
 * `x-forwarded-for` entry, which is only trustworthy when the platform proxy
 * overwrites the header (e.g. Vercel). Best-effort per-instance.
 */
export function ipKey(request: Request): string {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]?.trim() : "unknown";
  return ip || "unknown";
}

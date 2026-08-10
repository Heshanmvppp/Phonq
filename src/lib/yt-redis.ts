import "server-only";

import { Redis } from "@upstash/redis";

/**
 * Layer 2 — the YouTube catalog Redis accelerator.
 *
 * Redis is a *thin accelerator*, never a source of truth: it holds hot search
 * lookups (`search:{query} → videoId`), a negative cache (`neg:{query}`), and
 * per-project quota counters (`quota:{project}:{opType}:{date}`). When it's
 * unreachable the app falls through to Postgres (the dedicated `songs` store)
 * transparently — "Redis unreachable → falls through to Postgres" is a hard
 * requirement of the design.
 *
 * Provider (first match wins):
 *   1. Upstash REST: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
 *   2. In-memory Map shard (single-process dev/test). No TCP support here —
 *      `@upstash/redis` speaks HTTP only. For a local docker redis, front it
 *      with a REST proxy or just let the in-memory shim carry dev.
 *
 * Every method swallows errors and returns a safe default so catalog callers
 * can ignore the failure mode entirely.
 */

interface RedisLike {
  /** Raw string value (no JSON). null when missing/expired. */
  getString(key: string): Promise<string | null>;
  /** Returns "OK" on success, null when NX rejected. */
  setString(key: string, value: string, opts?: SetOptions): Promise<string | null>;
  incr(key: string): Promise<number>;
  incrby(key: string, amount: number): Promise<number>;
  del(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  exists(key: string): Promise<number>;
  ttl(key: string): Promise<number>;
  ping(): Promise<string>;
}

interface SetOptions {
  ex?: number;
  nx?: boolean;
}

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

const upstashUrl = env("UPSTASH_REDIS_REST_URL");
const upstashToken = env("UPSTASH_REDIS_REST_TOKEN");

/** Upstash REST client (http/https, serverless-friendly, no persistent socket). */
class UpstashRedis implements RedisLike {
  private client: Redis;
  constructor() {
    this.client = new Redis({ url: upstashUrl!, token: upstashToken! });
  }
  getString(key: string) {
    return this.client.get<string>(key);
  }
  setString(key: string, value: string, opts?: SetOptions) {
    if (opts?.ex != null) {
      return opts.nx
        ? this.client.set(key, value, { ex: opts.ex, nx: true })
        : this.client.set(key, value, { ex: opts.ex });
    }
    return this.client.set(key, value);
  }
  incr(key: string) {
    return this.client.incr(key);
  }
  incrby(key: string, amount: number) {
    return this.client.incrby(key, amount);
  }
  del(key: string) {
    return this.client.del(key);
  }
  expire(key: string, seconds: number) {
    return this.client.expire(key, seconds);
  }
  ttl(key: string) {
    return this.client.ttl(key);
  }
  exists(key: string) {
    return this.client.exists(key);
  }
  ping() {
    return this.client.ping();
  }
}

/** In-process fallback so the app boots without an external Redis. */
class MemoryRedis implements RedisLike {
  private store = new Map<string, { value: string; expiresAt: number }>();
  private now() {
    return Date.now();
  }
  private alive(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (entry.expiresAt <= this.now()) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async getString(key: string): Promise<string | null> {
    return this.alive(key) ? this.store.get(key)!.value : null;
  }

  async setString(key: string, value: string, opts?: SetOptions): Promise<string | null> {
    if (opts?.nx && this.alive(key)) return null;
    const expiresAt = opts?.ex ? this.now() + opts.ex * 1000 : Infinity;
    this.store.set(key, { value, expiresAt });
    return "OK";
  }

  async incr(key: string): Promise<number> {
    const cur = Number(this.store.get(key)?.value ?? 0) || 0;
    const next = cur + 1;
    this.store.set(key, { value: String(next), expiresAt: Infinity });
    return next;
  }

  async incrby(key: string, amount: number): Promise<number> {
    const cur = Number(this.store.get(key)?.value ?? 0) || 0;
    const next = cur + amount;
    this.store.set(key, { value: String(next), expiresAt: Infinity });
    return next;
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (!this.alive(key)) return 0;
    const entry = this.store.get(key)!;
    entry.expiresAt = this.now() + seconds * 1000;
    return 1;
  }

  async ttl(key: string): Promise<number> {
    if (!this.alive(key)) return -2;
    const entry = this.store.get(key)!;
    return entry.expiresAt === Infinity ? -1 : Math.ceil((entry.expiresAt - this.now()) / 1000);
  }

  async exists(key: string): Promise<number> {
    return this.alive(key) ? 1 : 0;
  }

  async ping(): Promise<string> {
    return "PONG";
  }
}

/** Best-effort Redis facade. Never throws; returns safe defaults on failure. */
export class YtRedis {
  /** True only when a real (networked) Upstash REST endpoint is configured. */
  readonly configured: boolean = Boolean(upstashUrl && upstashToken);
  private online = true;
  private inner: RedisLike;

  constructor() {
    this.inner = this.configured ? new UpstashRedis() : new MemoryRedis();
  }

  private async safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      this.online = false;
      if (upstashUrl) {
        console.warn(`[yt-redis] ${err instanceof Error ? err.message : String(err)}`);
      }
      return fallback;
    }
  }

  /** Health probe — true when the backing Redis answered. */
  async healthy(): Promise<boolean> {
    try {
      await this.inner.ping();
      this.online = true;
      return true;
    } catch {
      this.online = false;
      return false;
    }
  }

  /* ---- JSON caches: hot lookups + negative cache ---- */

  async cacheGet<T = unknown>(key: string): Promise<T | null> {
    return this.safe(async () => {
      const raw = await this.inner.getString(key);
      if (raw === null) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return raw as unknown as T;
      }
    }, null);
  }

  async cacheSet<T>(key: string, value: T, ttlSec?: number): Promise<void> {
    await this.safe(async () => {
      const raw = typeof value === "string" ? value : JSON.stringify(value);
      await this.inner.setString(key, raw, ttlSec ? { ex: ttlSec } : undefined);
    }, undefined);
  }

  async cacheDel(key: string): Promise<void> {
    await this.inner.del(key);
  }

  /* ---- Numeric counters: per-project quota budget ---- */

  async readCounter(key: string): Promise<number> {
    return this.safe(async () => {
      const raw = await this.inner.getString(key);
      if (raw === null) return 0;
      const n = Number(raw);
      return Number.isFinite(n) ? n : 0;
    }, 0);
  }

  /**
   * INCRby with a TTL applied only on first creation (SET NX + EX), then
   * INCRBY. The date-suffixed key pattern (`quota:{project}:{op}:{YYYY-MM-DD}`)
   * gives natural midnight rollover; the 24h TTL is just a cleanup guard.
   */
  async incrCounter(key: string, amount: number, ttlSec: number): Promise<number> {
    return this.safe(async () => {
      const created = await this.inner.setString(key, String(amount), { ex: ttlSec, nx: true });
      if (created === "OK") return amount;
      const next = await this.inner.incrby(key, amount);
      // Renew a TTL if one was lost (e.g. after a restart of an ephemeral store).
      await this.inner.expire(key, ttlSec);
      return next;
    }, amount);
  }
}

const globalForRedis = globalThis as unknown as { __phonqYtRedis?: YtRedis };
export const ytRedis: YtRedis = globalForRedis.__phonqYtRedis ?? new YtRedis();
if (process.env.NODE_ENV !== "production") {
  globalForRedis.__phonqYtRedis = ytRedis;
}

export default ytRedis;

import "server-only";

import { recordApiCall, recordBandwidth, today } from "@/lib/youtube-db";
import ytRedis from "@/lib/yt-redis";

/**
 * Layer 1 — the 10-project YouTube API quota pool.
 *
 * Phonq spreads its YouTube load across `YOUTUBE_API_KEYS` (up to 10 GCP service
 * accounts), each contributing ~10,000 free units/day ⇒ ~100,000 units/day pool.
 * Usage is metered in Redis with 24h TTL counters keyed per project and per
 * operation type (`quota:{projectId}:{opType}:{date}`) so every instance sees the
 * same burn and the router never silently over-spends a suspended project.
 *
 * Allocation:
 *   - `YOUTUBE_SEARCH_PROJECTS` keys (default 2) are reserved for *live* user
 *     searches (search.list = 100 units → ~200 searches/day from the reserved
 *     slice alone). `resolveSongVideo` always draws from this slice.
 *   - The remaining keys serve cheap 1-unit ops (videos.list batched ×50,
 *     playlistItems.list, channels.list) used by nightly seeding + metadata
 *     refresh.
 *
 * When Redis is down, counters fall back to the in-memory shim in `yt-redis`,
 * and `recordApiCall` still writes to Postgres — so the per-project ledger is
 * recoverable and a Redis outage only loses cross-instance sharing, not quota
 * safety.
 */

export type OpType = "search" | "playback";

/** YouTube API quota cost per operation type (units). */
export const UNIT_COST: Record<OpType, number> = {
  search: 100, // search.list
  playback: 1, // videos.list / playlistItems.list / channels.list (batched)
};

/** Human endpoint name (API path basename) for the monitoring log. */
export function endpointFor(path: string): string {
  return path.split("/").pop() ?? path;
}

export interface Project {
  /** Zero-based index into the configured key list. */
  id: number;
  apiKey: string;
  dailyLimit: number;
}

/** Per-project daily quota (YouTube free tier ≈ 10,000 units/day × 10 projects). */
const DEFAULT_DAILY_LIMIT = 10000;

/** Keys reserved for live `search.list` queries (the expensive op). */
export const SEARCH_PROJECT_SLOT = Math.max(1, Number(process.env.YOUTUBE_SEARCH_PROJECTS) || 2);

function readKeys(): string[] {
  const multi = (process.env.YOUTUBE_API_KEYS ?? "")
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (multi.length > 0) return multi;
  // Back-compat: a single legacy key.
  const single = process.env.YOUTUBE_API_KEY;
  return single ? [single] : [];
}

function dailyLimit(): number {
  const fromEnv = Number(process.env.YOUTUBE_DAILY_QUOTA_PER_PROJECT);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? Math.floor(fromEnv) : DEFAULT_DAILY_LIMIT;
}

const globalForPool = globalThis as unknown as { __phonqYtProjects?: Project[] };
function projects(): Project[] {
  if (globalForPool.__phonqYtProjects) return globalForPool.__phonqYtProjects;
  const limit = dailyLimit();
  const list = readKeys().map((apiKey, id) => ({ id, apiKey, dailyLimit: limit }));
  globalForPool.__phonqYtProjects = list;
  return list;
}

/** True when at least one YouTube API key is configured. */
export function hasProjects(): boolean {
  return readKeys().length > 0;
}

export function projectCount(): number {
  return projects().length;
}

/** Number of keys reserved for live searches (used for status reporting). */
export function searchProjectSlot(): number {
  return Math.min(SEARCH_PROJECT_SLOT, Math.max(0, projects().length));
}

export function searchProjects(): Project[] {
  return projects().slice(0, searchProjectSlot());
}

export function playbackProjects(): Project[] {
  const rest = projects().slice(searchProjectSlot());
  // When there's no dedicated playback slice (e.g. a single key), fall back to
  // the whole pool so cheap ops still work.
  return rest.length > 0 ? rest : projects();
}

/** Daily search budget in search.list calls (env override ⇒ reserved slice). */
export function dailySearchBudget(): number {
  const env = Number(process.env.YOUTUBE_DAILY_SEARCH_BUDGET);
  if (Number.isFinite(env) && env > 0) return Math.floor(env);
  const reserved = searchProjects();
  if (reserved.length === 0) return 100;
  const units = reserved.reduce((sum, p) => sum + p.dailyLimit, 0);
  return Math.round(units / UNIT_COST.search);
}

function counterKey(projectId: number, op: OpType): string {
  return `quota:${projectId}:${op}:${today()}`;
}

/** Current units used by a project/op today (Redis counter, 0 if absent). */
export async function usage(projectId: number, op: OpType): Promise<number> {
  return ytRedis.readCounter(counterKey(projectId, op));
}

/**
 * Pick the least-loaded project that still has room for `op`, or null when the
 * pool is exhausted. Reads today's per-project counter and applies a small
 * safety margin so a 403 `quotaExceeded` never stalls the last slot.
 */
export async function getAvailableProject(op: OpType): Promise<Project | null> {
  const pool = op === "search" ? searchProjects() : playbackProjects();
  if (pool.length === 0) return null;
  const cost = UNIT_COST[op];
  const margin = Math.max(0, Math.floor(pool[0].dailyLimit * 0.02));
  const withUsage = await Promise.all(pool.map(async (p) => ({ p, used: await usage(p.id, op) })));
  const usable = withUsage
    .filter(({ p, used }) => used + cost <= p.dailyLimit - margin)
    .sort((a, b) => a.used - b.used);
  return usable[0]?.p ?? null;
}

/** Atomically charge a project/op for a unit cost after a real API call. */
export async function recordUsage(projectId: number, op: OpType, units: number, endpoint: string): Promise<void> {
  await ytRedis.incrCounter(counterKey(projectId, op), units, 24 * 60 * 60);
  await recordApiCall(projectId, endpoint, units);
  // Piggyback: hand the accumulated Redis bandwidth meter to the daily ledger
  // on each API call, so a runaway cache / quota job shows up in the logs
  // before the monthly egress budget is silently spent.
  const usage = ytRedis.flushUsage();
  if (usage.ops > 0) {
    void recordBandwidth(usage);
  }
}

export interface QuotaProjectStat {
  id: number;
  searchUsed: number;
  playbackUsed: number;
  dailyLimit: number;
}

export interface QuotaStatus {
  projects: QuotaProjectStat[];
  /** Aggregate units used across the pool today. */
  unitsUsed: number;
  /** search.list calls charged today. */
  searches: number;
  /** Remaining searches the reserved slice can still perform. */
  searchesRemaining: number;
  /** Total search budget (reserved slice capacity). */
  searchBudget: number;
  /** Whether any keys are configured (and thus the live pool is wired). */
  configured: boolean;
}

export async function getQuotaStatus(): Promise<QuotaStatus> {
  const list = projects();
  const projectsStat: QuotaProjectStat[] = await Promise.all(
    list.map(async (p) => ({
      id: p.id,
      searchUsed: await usage(p.id, "search"),
      playbackUsed: await usage(p.id, "playback"),
      dailyLimit: p.dailyLimit,
    })),
  );

  const reserved = searchProjects();
  const reservedUnits = reserved.reduce((sum, p) => sum + p.dailyLimit, 0);
  const reservedUsed = reserve(list, projectsStat, reserved.length);
  const searchBudget = Math.round(reservedUnits / UNIT_COST.search);
  const searchesRemaining = Math.round(Math.max(0, reservedUnits - reservedUsed) / UNIT_COST.search);

  const searchUnits = sum(projectsStat.map((s) => s.searchUsed));
  const searches = Math.round(searchUnits / UNIT_COST.search);
  const unitsUsed = sum(projectsStat.map((s) => s.searchUsed + s.playbackUsed));

  return {
    projects: projectsStat,
    unitsUsed,
    searches,
    searchesRemaining,
    searchBudget,
    configured: list.length > 0,
  };
}

/** Sum of the first `n` projects' search usage (the reserved slice). */
function reserve(all: Project[], stat: QuotaProjectStat[], n: number): number {
  return sum(stat.slice(0, n).map((s) => s.searchUsed));
}

function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

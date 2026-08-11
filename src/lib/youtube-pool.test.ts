import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const counter = vi.hoisted(() => ({ store: new Map<string, number>() }));

const ytRedisMock = vi.hoisted(() => ({
  readCounter: vi.fn(async (key: string) => counter.store.get(key) ?? 0),
  incrCounter: vi.fn(async (key: string, amount: number) => {
    const next = (counter.store.get(key) ?? 0) + amount;
    counter.store.set(key, next);
    return next;
  }),
  flushUsage: vi.fn(async () => ({ ops: 0, readBytes: 0, writeBytes: 0, hits: 0, misses: 0 })),
}));
vi.mock("@/lib/yt-redis", () => ({ default: ytRedisMock, ytRedis: ytRedisMock, YtRedis: class {} }));

vi.mock("@/lib/youtube-db", () => ({
  today: vi.fn(() => "2026-08-11"),
  recordApiCall: vi.fn(async () => {}),
  recordBandwidth: vi.fn(async () => {}),
}));

const TEN_KEYS = Array.from({ length: 10 }, (_, i) => `key-project-${i + 1}`).join(",");

type PoolModule = typeof import("@/lib/youtube-pool");

/** Fresh-import the pool with a clean env + counters so the module-level
 * `SEARCH_PROJECT_SLOT` and the global project cache reflect the given env. */
async function loadPool(env: Record<string, string> = {}): Promise<PoolModule> {
  vi.resetModules();
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("YOUTUBE_")) delete process.env[key];
  }
  Object.assign(process.env, env);
  counter.store.clear();
  const globalForPool = globalThis as { __phonqYtProjects?: unknown };
  delete globalForPool.__phonqYtProjects;
  return await import("@/lib/youtube-pool");
}

describe("youtube quota pool (all keys participate in search)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    for (const key of Object.keys(process.env)) {
      if (key.startsWith("YOUTUBE_")) delete process.env[key];
    }
  });

  it("uses all 10 keys for live searches by default", async () => {
    const pool = await loadPool({ YOUTUBE_API_KEYS: TEN_KEYS });

    expect(pool.projectCount()).toBe(10);
    expect(pool.searchProjects()).toHaveLength(10);
    expect(pool.playbackProjects()).toHaveLength(10);
    expect(pool.dailySearchBudget()).toBe(1000); // 10 keys × 10,000 units / 100 per search
  });

  it("rotates searches across the pool and skips an exhausted project", async () => {
    const pool = await loadPool({ YOUTUBE_API_KEYS: TEN_KEYS });

    const first = await pool.getAvailableProject("search");
    expect(first?.id).toBe(0);

    // YouTube rejects project 0 → charge it to its daily limit.
    await pool.markProjectExhausted(0, "search");
    expect(await pool.usage(0, "search")).toBe(10000);

    // The next search must land on a different, healthy key.
    const second = await pool.getAvailableProject("search");
    expect(second?.id).toBe(1);

    // Exhaust every remaining key → the pool reports itself spent.
    for (let i = 1; i < 10; i++) await pool.markProjectExhausted(i, "search");
    expect(await pool.getAvailableProject("search")).toBeNull();
  });

  it("still supports a reserved search slice via YOUTUBE_SEARCH_PROJECTS", async () => {
    const pool = await loadPool({ YOUTUBE_API_KEYS: TEN_KEYS, YOUTUBE_SEARCH_PROJECTS: "2" });

    expect(pool.searchProjects()).toHaveLength(2);
    expect(pool.playbackProjects()).toHaveLength(8);
    expect(pool.dailySearchBudget()).toBe(200);
    expect(pool.projectCount()).toBe(10);
  });

  it("budgets for the whole pool when only one key is configured", async () => {
    const pool = await loadPool({ YOUTUBE_API_KEYS: "solo-key" });

    expect(pool.projectCount()).toBe(1);
    expect(pool.searchProjects()).toHaveLength(1);
    expect(pool.dailySearchBudget()).toBe(100);
    // One key exhausted → no search can run, but the pool still reports it.
    await pool.markProjectExhausted(0, "search");
    expect(await pool.getAvailableProject("search")).toBeNull();
  });
});

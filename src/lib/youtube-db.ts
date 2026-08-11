import "server-only";

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { prisma } from "@/lib/prisma";

import type { YouTubeVideo } from "@/lib/youtube";

/**
 * Dedicated YouTube catalog client.
 *
 * Layer 3 holds the *real* catalog: a lean `songs` table (no thumbnail URLs, no
 * raw API dumps) and an `api_call_log` for burn-rate visibility. It lives in a
 * dedicated Neon DB (`YOUTUBE_DATABASE_URL`) to isolate the catalog from user
 * data — a runaway nightly seed can't touch `users`/`playlists`/`favorites`.
 * When that URL is absent we transparently fall back to the main app DB, so the
 * architecture is purely opt-in and existing one-DB deploys keep working.
 *
 * The client is the same generated Prisma client (the schema is identical),
 * just a second instance pointed at the dedicated connection string when one
 * is configured.
 */

const YT_DB_URL = process.env.YOUTUBE_DATABASE_URL;

type DbOrMock = PrismaClient;

const globalForYtDb = globalThis as unknown as { __phonqYtDb?: PrismaClient };

function createYtDb(): PrismaClient {
  if (!YT_DB_URL) {
    // No dedicated catalog DB configured → reuse the shared app DB. The same
    // schema (with the `songs` + `api_call_log` tables) backs it.
    return prisma as DbOrMock;
  }
  const adapter = new PrismaNeon({ connectionString: YT_DB_URL });
  return new PrismaClient({ adapter });
}

export const ytDb: PrismaClient = globalForYtDb.__phonqYtDb ?? createYtDb();
if (process.env.NODE_ENV !== "production") {
  globalForYtDb.__phonqYtDb = ytDb;
}

export const hasDedicatedCatalogDb = Boolean(YT_DB_URL);

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Row shape used for upserts into `songs`. */
export interface SongInput {
  videoId: string;
  title: string;
  artist: string;
  channelId: string | null;
  channelTitle: string | null;
  durationSec: number;
  genreTag: string | null;
  qualityScore: number;
  embedStatus: boolean;
  source: string;
  lastPlayedAt?: Date | null;
}

/** Reconstruct the thumbnail URL from the video id — never stored, per spec. */
export function thumbnailFor(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function songToVideo(row: {
  videoId: string;
  title: string;
  artist: string;
  channelId: string | null;
  channelTitle: string | null;
  durationSec: number;
  genreTag: string | null;
  qualityScore: number;
  embedStatus: boolean;
  source: string;
}): YouTubeVideo {
  return {
    videoId: row.videoId,
    title: row.title,
    artistName: row.artist,
    duration: row.durationSec,
    thumbnail: thumbnailFor(row.videoId),
    channelId: row.channelId,
    channelTitle: row.channelTitle,
    embeddable: Boolean(row.embedStatus),
    subgenre: row.genreTag,
    source: row.source,
  };
}

/** Best-effort: persist a YouTube video into the `songs` catalog. */
export async function upsertSong(input: SongInput): Promise<void> {
  try {
    await ytDb.song.upsert({
      where: { videoId: input.videoId },
      update: {
        title: input.title,
        artist: input.artist,
        channelId: input.channelId,
        channelTitle: input.channelTitle,
        durationSec: input.durationSec,
        genreTag: input.genreTag,
        qualityScore: input.qualityScore,
        embedStatus: input.embedStatus,
        source: input.source,
        ...(input.lastPlayedAt ? { lastPlayedAt: input.lastPlayedAt } : {}),
      },
      create: {
        videoId: input.videoId,
        title: input.title,
        artist: input.artist,
        channelId: input.channelId,
        channelTitle: input.channelTitle,
        durationSec: input.durationSec,
        genreTag: input.genreTag,
        qualityScore: input.qualityScore,
        embedStatus: input.embedStatus,
        source: input.source,
        ...(input.lastPlayedAt ? { lastPlayedAt: input.lastPlayedAt } : {}),
      },
    });
  } catch (err) {
    console.warn(`[yt-db] upsert song ${input.videoId}: ${err instanceof Error ? err.message : err}`);
  }
}

/** Lookup a single song by id (no API cost). */
export async function findSongByVideoId(videoId: string): Promise<YouTubeVideo | null> {
  try {
    const row = await ytDb.song.findUnique({ where: { videoId } });
    return row ? songToVideo(row) : null;
  } catch {
    return null;
  }
}

/** Cached songs for a subgenre (genre gap fill). */
export async function findSongsByGenre(genreTag: string, limit = 24): Promise<YouTubeVideo[]> {
  try {
    const rows = await ytDb.song.findMany({
      where: { genreTag, embedStatus: true },
      orderBy: { cachedAt: "desc" },
      take: limit,
    });
    return rows.map(songToVideo);
  } catch {
    return [];
  }
}

/** Cached subgenre-agnostic songs (the general fill pool). */
export async function findGeneralSongs(limit = 12): Promise<YouTubeVideo[]> {
  try {
    const rows = await ytDb.song.findMany({
      where: { genreTag: null, embedStatus: true },
      orderBy: { cachedAt: "desc" },
      take: Math.max(limit * 2, 20),
    });
    return rows.map(songToVideo);
  } catch {
    return [];
  }
}

/** All cached songs (admin/seeding surface). */
export async function findAllSongs(limit = 100): Promise<YouTubeVideo[]> {
  try {
    const rows = await ytDb.song.findMany({ orderBy: { cachedAt: "desc" }, take: limit });
    return rows.map(songToVideo);
  } catch {
    return [];
  }
}

/** Cached songs by id (no API cost) — for the playback restore path. */
export async function findSongsByIds(videoIds: string[]): Promise<YouTubeVideo[]> {
  const unique = [...new Set(videoIds.filter(Boolean))];
  if (unique.length === 0) return [];
  try {
    const rows = await ytDb.song.findMany({ where: { videoId: { in: unique } } });
    return rows.map(songToVideo);
  } catch {
    return [];
  }
}

/**
 * Postgres trigram fuzzy match against the `songs` catalog (architecture Layer
 * 3, step 2). Uses `pg_trgm` (created in migration 0003) to rank candidates by
 * artist/title similarity. Only used when the Redis hot cache misses — cheap DB
 * reads, never a hot-path full scan on a fresh catalog.
 */
export async function searchSongFuzzy(songKey: string, artistKey: string, limit = 1): Promise<YouTubeVideo[] | null> {
  if (!songKey && !artistKey) return null;
  try {
    const rows = (await ytDb.$queryRaw<
      Array<{
        videoId: string;
        title: string;
        artist: string;
        channelId: string | null;
        channelTitle: string | null;
        durationSec: number;
        genreTag: string | null;
        qualityScore: number;
        embedStatus: boolean;
        source: string;
      }>
    >`
      SELECT "videoId", "title", "artist", "channelId", "channelTitle",
             "durationSec", "genreTag", "qualityScore", "embedStatus", "source"
      FROM "songs"
      WHERE "embedStatus" = true
        AND (
          "title" % ${songKey}
          OR "artist" % ${artistKey}
          OR "title" ILIKE ${`%${songKey}%`}
          OR "artist" ILIKE ${`%${artistKey}%`}
        )
      ORDER BY GREATEST(
        COALESCE(SIMILARITY("artist", ${artistKey}), 0),
        COALESCE(SIMILARITY("title", ${songKey}), 0)
      ) DESC
      LIMIT ${limit}
    `);
    return rows.map(songToVideo);
  } catch {
    return null;
  }
}

/** Record a YouTube API call for burn-rate visibility (best-effort). */
export async function recordApiCall(
  projectId: number | null | undefined,
  endpoint: string,
  unitCost: number,
): Promise<void> {
  try {
    await ytDb.apiCallLog.create({
      data: { projectId, endpoint, unitCost },
    });
  } catch (err) {
    // Never let logging break the catalog path.
    console.warn(`[yt-db] api_call_log: ${err instanceof Error ? err.message : err}`);
  }
}

/** Sum of units used today across recorded API calls (Redis fallback when down). */
export async function unitsUsedToday(): Promise<number> {
  try {
    const agg = await ytDb.apiCallLog.aggregate({
      where: { calledAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      _sum: { unitCost: true },
    });
    return agg._sum.unitCost ?? 0;
  } catch {
    return 0;
  }
}

export interface BandwidthUsage {
  ops: number;
  readBytes: number;
  writeBytes: number;
  hits: number;
  misses: number;
}

/** Accumulate the in-process Redis bandwidth meter into today's ledger row
 * (incrementing, so multiple flushes within a day add up). Best-effort — never
 * breaks the catalog path. */
export async function recordBandwidth(usage: BandwidthUsage): Promise<void> {
  if (!usage || usage.ops <= 0) return;
  try {
    const d = today();
    await ytDb.redisUsageLog.upsert({
      where: { date: d },
      create: { date: d, ...usage },
      update: {
        ops: { increment: usage.ops },
        readBytes: { increment: usage.readBytes },
        writeBytes: { increment: usage.writeBytes },
        hits: { increment: usage.hits },
        misses: { increment: usage.misses },
      },
    });
  } catch (err) {
    console.warn(`[yt-db] redis_usage_log: ${err instanceof Error ? err.message : err}`);
  }
}

/** Today's accumulated Redis usage ledger row (null when nothing recorded). */
export async function redisUsageToday(): Promise<BandwidthUsage | null> {
  try {
    const row = await ytDb.redisUsageLog.findUnique({ where: { date: today() } });
    if (!row) return null;
    return {
      ops: row.ops,
      readBytes: Number(row.readBytes),
      writeBytes: Number(row.writeBytes),
      hits: row.hits,
      misses: row.misses,
    };
  } catch {
    return null;
  }
}

/** Touches `last_played_at` for a song — drives the pruning job's freshness. */
export async function touchLastPlayed(videoId: string): Promise<void> {
  try {
    await ytDb.song.update({ where: { videoId }, data: { lastPlayedAt: new Date() } });
  } catch {
    /* not found / no db — ignore */
  }
}

/**
 * Prune stale, low-quality songs so the 500 MB budget stays sustainable.
 * Drops rows with `qualityScore < minQuality` that haven't been played recently.
 * Returns the count of deleted rows (or a sample when `dryRun` is true).
 */
export async function pruneStaleSongs(minQuality = 30, maxAgeDays = 60, dryRun = false) {
  const cutoff = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);
  const where = {
    qualityScore: { lt: minQuality },
    OR: [{ lastPlayedAt: null }, { lastPlayedAt: { lt: cutoff } }],
  };
  try {
    if (dryRun) {
      return ytDb.song.findMany({
        where,
        select: { videoId: true, title: true, qualityScore: true },
        take: 1000,
      });
    }
    const deleted = await ytDb.song.deleteMany({ where });
    return deleted.count;
  } catch (err) {
    console.error(`[yt-db] prune failed: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

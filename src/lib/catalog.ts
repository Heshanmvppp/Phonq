import "server-only";

/**
 * Catalog layer — a resilient, cache-first wrapper around the live Jamendo API.
 *
 * Failure ladder (never lets the UI break or leak raw upstream errors):
 *
 *   1. Live Jamendo  → on success, metadata is cached in Postgres (`cached_tracks`)
 *      so short outages don't take the app down and live API load is cut.
 *   2. Postgres cache → if the live API fails, serve the cached "smaller catalog".
 *   3. Static snapshot → if both the API and the DB are unavailable, serve the
 *      bundled `featured-tracks.ts` so the homepage never looks empty.
 *
 * Every step is best-effort and individually guarded: if there is no database
 * (fresh clone, broken DATABASE_URL) the layer still degrades to the static
 * snapshot instead of throwing.
 *
 * All upstream errors are logged server-side only (`console.error`); the public
 * API routes translate them into generic copy, never the raw message or env
 * var names.
 */

import type { Prisma } from "@/generated/prisma/client";
import type { Radio, Track, TracksParams } from "@/lib/jamendo";
import * as jamendo from "@/lib/jamendo";
import { prisma } from "@/lib/prisma";
import { classifyTrack, getSubgenre, PHONK_FAMILY_QUERY_TAGS, PHONK_SUBGENRES } from "@/lib/phonk-genres";
import { FEATURED_TRACKS } from "@/content/featured-tracks";
import type { FeaturedTrack } from "@/content/featured-types";

export type CatalogProvider = "live" | "degraded" | "static";

export interface CatalogStatusShape {
  provider: CatalogProvider;
  cacheCount: number;
  lastSuccess: string | null;
  lastFailure: string | null;
  updatedAt: string | null;
}

const CACHE_WRITE_TTL_MS = 5 * 60 * 1000;
const STATUS_THROTTLE_MS = 60 * 1000;
const DEGRADED_WINDOW_MS = 10 * 60 * 1000;

const globalForCatalog = globalThis as unknown as {
  __phonqCacheWrites?: Map<string, number>;
  __phonqStatusAt?: number;
  __phonqDegradedUntil?: number;
};

/* ------------------------------------------------------------------ */
/* Status (single-row health flag)                                     */
/* ------------------------------------------------------------------ */

function nowIso(): string {
  return new Date().toISOString();
}

async function writeStatus(patch: {
  provider: CatalogProvider;
  error?: string | null;
  radios?: unknown;
}): Promise<void> {
  const radios = patch.radios as Prisma.InputJsonValue | undefined;
  try {
    await prisma.catalogStatus.upsert({
      where: { id: 1 },
      update: {
        provider: patch.provider,
        error: patch.error ?? undefined,
        radios,
        lastSuccess: patch.provider === "live" ? new Date() : undefined,
        lastFailure: patch.error ? new Date() : undefined,
      },
      create: {
        id: 1,
        provider: patch.provider,
        error: patch.error ?? null,
        radios,
        lastSuccess: patch.provider === "live" ? new Date() : undefined,
        lastFailure: patch.error ? new Date() : undefined,
      },
    });
  } catch {
    /* no database — status is best-effort only */
  }
}

async function writeSuccessStatus(radios?: unknown): Promise<void> {
  globalForCatalog.__phonqDegradedUntil = 0;
  const now = Date.now();
  if (globalForCatalog.__phonqStatusAt && now - globalForCatalog.__phonqStatusAt < STATUS_THROTTLE_MS) {
    return;
  }
  globalForCatalog.__phonqStatusAt = now;
  await writeStatus({ provider: "live", error: null, radios });
}

async function writeFailureStatus(error: unknown, provider: CatalogProvider = "degraded"): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  globalForCatalog.__phonqDegradedUntil = Date.now() + DEGRADED_WINDOW_MS;
  // Throttle so an expected, persistent outage (e.g. no JAMENDO_CLIENT_ID) only
  // logs once per window instead of on every single catalog request.
  const now = Date.now();
  if (!globalForCatalog.__phonqStatusAt || now - globalForCatalog.__phonqStatusAt >= STATUS_THROTTLE_MS) {
    globalForCatalog.__phonqStatusAt = now;
    console.error(`[catalog] upstream unavailable (${provider}) — falling back to cached static snapshot`);
  }
  await writeStatus({ provider, error: message });
}

export async function getCatalogStatus(): Promise<CatalogStatusShape> {
  let cacheCount = 0;
  let row:
    | {
        provider: string;
        lastSuccess: Date | null;
        lastFailure: Date | null;
        updatedAt: Date;
      }
    | null = null;
  try {
    const [cached, status] = await Promise.all([
      prisma.cachedTrack.count(),
      prisma.catalogStatus.findUnique({ where: { id: 1 } }),
    ]);
    cacheCount = cached;
    row = status;
  } catch {
    /* no database */
  }

  const memoryDegraded = Date.now() < (globalForCatalog.__phonqDegradedUntil ?? 0);
  // The status row is only written throttled, so a stale "degraded" provider in
  // Postgres shouldn't mask a live recovery. Trust the DB flag only when the
  // recorded failure is recent and newer than the last success.
  const lastFailure = row?.lastFailure ? row.lastFailure.getTime() : 0;
  const lastSuccess = row?.lastSuccess ? row.lastSuccess.getTime() : 0;
  const dbRowDegraded = lastFailure > lastSuccess && Date.now() - lastFailure < DEGRADED_WINDOW_MS;
  const provider: CatalogProvider = memoryDegraded || dbRowDegraded ? "degraded" : "live";

  return {
    provider,
    cacheCount,
    lastSuccess: row?.lastSuccess?.toISOString() ?? null,
    lastFailure: row?.lastFailure?.toISOString() ?? null,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* Cache writes (best-effort, throttled)                               */
/* ------------------------------------------------------------------ */

/** Returns the subset of ids that haven't been written to Postgres recently. */
function freshCacheIds(ids: string[]): string[] {
  const map = globalForCatalog.__phonqCacheWrites ?? (globalForCatalog.__phonqCacheWrites = new Map());
  const now = Date.now();
  return ids.filter((id) => {
    const at = map.get(id);
    if (at === undefined || now - at > CACHE_WRITE_TTL_MS) {
      map.set(id, now);
      return true;
    }
    return false;
  });
}

async function cacheTracks(tracks: Track[]): Promise<void> {
  if (tracks.length === 0) return;
  const ids = freshCacheIds(tracks.map((t) => t.id));
  if (ids.length === 0) return;
  const idSet = new Set(ids);
  const rows = tracks.filter((t) => idSet.has(t.id)).map((t) => ({
    id: t.id,
    name: t.name,
    duration: t.duration,
    artistId: t.artistId || null,
    artistName: t.artistName,
    albumId: t.albumId || null,
    albumName: t.albumName,
    audioUrl: t.audioUrl,
    downloadUrl: t.downloadUrl || null,
    image: t.image,
    imageSmall: t.imageSmall,
    licenseName: t.licenseName,
    genre: t.genre,
    bpm: t.bpm,
    speed: t.speed,
    vocalInstrumental: t.vocalInstrumental,
    tags: t.tags.join(" ") || null,
    popularityWeek: t.popularityWeek,
    popularityTotal: t.popularityTotal,
    listensTotal: t.listensTotal,
    downloadsTotal: t.downloadsTotal,
    releaseDate: t.releaseDate,
    audioDownloadAllowed: t.audioDownloadAllowed,
    source: "jamendo",
  }));
  try {
    // Upsert per row so the cache refreshes popularity/licensing over time.
    // Throttled per-id (5 min) by `freshCacheIds`, so this stays cheap.
    await prisma.$transaction(
      rows.map((row) =>
        prisma.cachedTrack.upsert({
          where: { id: row.id },
          update: row,
          create: row,
        }),
      ),
    );
  } catch {
    /* no database — caching is best-effort */
  }
}

/* ------------------------------------------------------------------ */
/* DB + static fallback reads                                          */
/* ------------------------------------------------------------------ */

function dbRowToTrack(row: {
  id: string;
  name: string;
  duration: number;
  artistId: string | null;
  artistName: string;
  albumId: string | null;
  albumName: string;
  audioUrl: string;
  downloadUrl: string | null;
  image: string | null;
  imageSmall: string | null;
  licenseName: string | null;
  genre: string | null;
  bpm: number | null;
  speed: string | null;
  vocalInstrumental: string | null;
  tags: string | null;
  popularityWeek: number;
  popularityTotal: number;
  listensTotal: number;
  downloadsTotal: number;
  releaseDate: string | null;
  audioDownloadAllowed: boolean;
}): Track {
  return {
    id: row.id,
    name: row.name,
    duration: row.duration,
    artistId: row.artistId ?? "",
    artistName: row.artistName,
    albumId: row.albumId ?? "",
    albumName: row.albumName,
    audioUrl: row.audioUrl,
    downloadUrl: row.downloadUrl ?? "",
    image: row.image,
    imageSmall: row.imageSmall,
    licenseName: row.licenseName,
    genre: row.genre,
    bpm: row.bpm,
    speed: row.speed,
    vocalInstrumental: row.vocalInstrumental,
    tags: (row.tags ?? "").split(/\s+/).filter(Boolean),
    popularityWeek: row.popularityWeek,
    popularityTotal: row.popularityTotal,
    listensTotal: row.listensTotal,
    downloadsTotal: row.downloadsTotal,
    releaseDate: row.releaseDate,
    audioDownloadAllowed: row.audioDownloadAllowed,
    subgenre:
      classifyTrack({
        name: row.name,
        artistName: row.artistName,
        genre: row.genre,
        bpm: row.bpm,
        tags: (row.tags ?? "").split(/\s+/).filter(Boolean),
      })?.slug ?? null,
  };
}

function featuredToTrack(t: FeaturedTrack): Track {
  return {
    id: t.id,
    name: t.name,
    duration: t.duration,
    artistId: t.artistId,
    artistName: t.artistName,
    albumId: t.albumId,
    albumName: t.albumName,
    audioUrl: t.audioUrl,
    downloadUrl: t.downloadUrl,
    image: t.image,
    imageSmall: t.imageSmall,
    licenseName: t.licenseName,
    genre: t.genre,
    bpm: t.bpm,
    speed: t.speed,
    vocalInstrumental: t.vocalInstrumental,
    tags: t.tags,
    popularityWeek: t.popularityWeek,
    popularityTotal: t.popularityTotal,
    listensTotal: t.listensTotal,
    downloadsTotal: t.downloadsTotal,
    releaseDate: t.releaseDate,
    audioDownloadAllowed: t.audioDownloadAllowed,
    subgenre:
      classifyTrack({
        name: t.name,
        artistName: t.artistName,
        genre: t.genre,
        bpm: t.bpm,
        tags: t.tags,
        vocalInstrumental: t.vocalInstrumental,
      })?.slug ?? null,
  };
}

const staticTracks = FEATURED_TRACKS.map(featuredToTrack);
/** Fallback radios are the curated phonk subgenres themselves. */
const staticRadios: Radio[] = PHONK_SUBGENRES.map((subgenre) => ({
  id: `phonk-radio-${subgenre.slug}`,
  name: subgenre.slug,
  displayName: subgenre.name,
  image: "",
}));

interface QueryOptions {
  ids?: string[];
  search?: string;
  tags?: string[];
  order?: string;
  limit?: number;
  offset?: number;
  subgenre?: string;
  phonkOnly?: boolean;
}

/**
 * Keep only tracks that belong to the curated phonk catalog — every surfaced
 * track must classify into a phonk subgenre (and optionally a specific one).
 * Tracks loaded by id (favorites, playlists, history) skip this so user
 * libraries never break.
 */
function curatedTracks<T extends Track>(tracks: T[], opts: { subgenre?: string }): T[] {
  return tracks.filter((track) => {
    const slug = track.subgenre ?? classifyTrack(track)?.slug ?? null;
    if (slug == null) return false;
    if (opts.subgenre && slug !== opts.subgenre) return false;
    return true;
  });
}

async function queryDbTracks(opts: QueryOptions): Promise<Track[] | null> {
  try {
    const where: Record<string, unknown> = {};
    if (opts.ids && opts.ids.length > 0) {
      where.id = { in: opts.ids };
    } else if (opts.search) {
      const q = opts.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { artistName: { contains: q, mode: "insensitive" } },
        { tags: { contains: q, mode: "insensitive" } },
      ];
    } else if (opts.tags && opts.tags.length > 0) {
      where.AND = opts.tags.map((tag) => ({ tags: { contains: tag, mode: "insensitive" } }));
    }

    // Phonk-only curation: narrow to tracks tagged with phonk-family (or a
    // specific subgenre's) keywords, then filter the rows by classification.
    const and: Prisma.CachedTrackWhereInput[] = [];
    if (opts.phonkOnly || opts.subgenre) {
      const keywords = opts.subgenre
        ? (getSubgenre(opts.subgenre)?.keywords ?? []).slice(0, 10)
        : PHONK_FAMILY_QUERY_TAGS.slice(0, 12);
      and.push({
        OR: keywords.map((keyword) => ({
          tags: { contains: keyword, mode: "insensitive" as const },
        })),
      });
    }
    if (and.length > 0) {
      const existing = Array.isArray(where.AND) ? (where.AND as Prisma.CachedTrackWhereInput[]) : [];
      where.AND = [...existing, ...and];
    }

    const orderBy =
      opts.order === "dateadded_desc"
        ? { cachedAt: "desc" as const }
        : { popularityWeek: "desc" as const };

    const rows = await prisma.cachedTrack.findMany({
      where,
      orderBy,
      take: opts.limit ?? 24,
      skip: opts.offset ?? 0,
    });
    const tracks = rows.map(dbRowToTrack);
    return opts.subgenre || opts.phonkOnly ? curatedTracks(tracks, { subgenre: opts.subgenre }) : tracks;
  } catch {
    return null;
  }
}

function queryStaticTracks(opts: QueryOptions): Track[] {
  let list = staticTracks;
  if (opts.ids && opts.ids.length > 0) {
    const set = new Set(opts.ids);
    list = list.filter((t) => set.has(t.id));
  } else if (opts.search) {
    const q = opts.search.trim().toLowerCase();
    list = list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.artistName.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  } else if (opts.tags && opts.tags.length > 0) {
    list = list.filter((t) => opts.tags!.every((tag) => t.tags.some((x) => x.toLowerCase().includes(tag.toLowerCase()))));
  }
  if (opts.subgenre) {
    list = list.filter((t) => t.subgenre === opts.subgenre);
  } else if (opts.phonkOnly && !(opts.ids && opts.ids.length > 0)) {
    list = list.filter((t) => t.subgenre != null);
  }
  if (opts.order !== "dateadded_desc") {
    list = [...list].sort((a, b) => b.popularityWeek - a.popularityWeek);
  }
  const start = opts.offset ?? 0;
  const end = start + (opts.limit ?? list.length);
  return list.slice(start, end);
}

/* ------------------------------------------------------------------ */
/* Public catalog functions (same signatures as the jamendo client)    */
/* ------------------------------------------------------------------ */

export async function fetchTracks(params: TracksParams = {}): Promise<Track[]> {
  const byId = Boolean(params.ids && params.ids.length > 0);
  const opts: QueryOptions = {
    ids: params.ids,
    search: params.search,
    tags: params.tags,
    order: params.order,
    limit: params.limit ?? 24,
    offset: params.offset,
    subgenre: params.subgenre,
    phonkOnly: !byId,
  };

  try {
    if (byId) {
      const tracks = await jamendo.fetchTracks({ ids: opts.ids, limit: opts.limit });
      await cacheTracks(tracks);
      await writeSuccessStatus();
      return tracks;
    }
    // Over-fetch from the top so curation (classification) can fill the
    // requested page; the offset window is applied locally after curation so
    // pages stay aligned with the same ranked, curated list.
    const start = opts.offset ?? 0;
    const pageSize = opts.limit ?? 24;
    const scaledLimit = Math.min((start + pageSize) * 5, 100);
    const tags = opts.subgenre
      ? (getSubgenre(opts.subgenre)?.jamendoTags ?? PHONK_FAMILY_QUERY_TAGS)
      : (params.tags && params.tags.length > 0 ? params.tags : PHONK_FAMILY_QUERY_TAGS);
    const tracks = await jamendo.fetchTracks({
      search: opts.search,
      tags,
      boost: params.boost,
      order: params.order,
      limit: scaledLimit,
    });
    await cacheTracks(tracks);
    await writeSuccessStatus();
    return curatedTracks(tracks, { subgenre: opts.subgenre }).slice(start, start + pageSize);
  } catch (err) {
    await writeFailureStatus(err);
    const cached = await queryDbTracks(opts);
    if (cached && cached.length > 0) return cached;
    return queryStaticTracks(opts);
  }
}

export async function fetchTrack(id: string): Promise<Track | null> {
  const [track] = await fetchTracks({ ids: [id], limit: 1 });
  return track ?? null;
}

export async function fetchTracksByIds(ids: string[]): Promise<Track[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return [];
  const tracks: Track[] = [];
  for (let i = 0; i < unique.length; i += 100) {
    const chunk = unique.slice(i, i + 100);
    tracks.push(...(await fetchTracks({ ids: chunk, limit: chunk.length })));
  }
  return tracks;
}

/** Phonk-distinctive words used to recognize phonk radios (unlike
 * `PHONK_FAMILY_QUERY_TAGS`, this deliberately excludes broad words such as
 * "metal", "funk", "wave" or "bass" that also name unrelated radios). */
const PHONK_RADIO_WORDS = new Set([
  "phonk",
  "drift",
  "memphis",
  "cowbell",
  "drill",
  "trap",
  "brazilian",
  "baile",
  "mandelao",
  "g-funk",
  "phonkwave",
  "hyperphonk",
  "hyperpop",
  "plugg",
  "jungle",
  "dnb",
  "breakbeat",
]);

export async function fetchRadios(): Promise<Radio[]> {
  try {
    const radios = await jamendo.fetchRadios();
    await writeSuccessStatus(radios);
    // Keep the platform phonk-only: only surface radios that belong to the
    // curated phonk family. Fall back to the subgenre radios when none do.
    const phonkRadios = radios.filter((radio) =>
      [radio.displayName, radio.name, "type" in radio ? String((radio as Radio & { type?: string }).type) : ""]
        .join(" ")
        .toLowerCase()
        .split(/\s+/)
        .some((word) => PHONK_RADIO_WORDS.has(word) || word.startsWith("phonk")),
    );
    return phonkRadios.length > 0 ? phonkRadios : staticRadios;
  } catch (err) {
    await writeFailureStatus(err);
    try {
      const row = await prisma.catalogStatus.findUnique({ where: { id: 1 } });
      const cached = row?.radios as unknown as Radio[] | undefined;
      if (cached && Array.isArray(cached) && cached.length > 0) {
        const cachedPhonk = cached.filter((radio) =>
          [radio.displayName, radio.name].join(" ").toLowerCase().includes("phonk"),
        );
        if (cachedPhonk.length > 0) return cachedPhonk;
      }
    } catch {
      /* no database */
    }
    return staticRadios;
  }
}

export async function fetchTrendingPhonk(limit = 24): Promise<Track[]> {
  try {
    const tracks = await jamendo.fetchTrendingPhonk(Math.min(limit * 4, 100));
    await cacheTracks(tracks);
    await writeSuccessStatus();
    return curatedTracks(tracks, {}).slice(0, limit);
  } catch (err) {
    await writeFailureStatus(err);
    const cached = await queryDbTracks({ limit, phonkOnly: true });
    if (cached && cached.length > 0) return cached;
    return queryStaticTracks({ limit, phonkOnly: true });
  }
}

export async function fetchFreshDrops(limit = 24): Promise<Track[]> {
  try {
    const tracks = await jamendo.fetchFreshDrops(Math.min(limit * 4, 100));
    await cacheTracks(tracks);
    await writeSuccessStatus();
    return curatedTracks(tracks, {}).slice(0, limit);
  } catch (err) {
    await writeFailureStatus(err);
    const cached = await queryDbTracks({ limit, order: "dateadded_desc", phonkOnly: true });
    if (cached && cached.length > 0) return cached;
    return queryStaticTracks({ limit, order: "dateadded_desc", phonkOnly: true });
  }
}

export async function searchTracks(query: string, limit = 30, subgenre?: string): Promise<Track[]> {
  if (!query.trim()) return [];
  try {
    const tracks = await jamendo.searchTracks(query, Math.min(limit * 4, 100), subgenre);
    await cacheTracks(tracks);
    await writeSuccessStatus();
    return curatedTracks(tracks, { subgenre }).slice(0, limit);
  } catch (err) {
    await writeFailureStatus(err);
    const cached = await queryDbTracks({ search: query.trim(), limit, subgenre, phonkOnly: true });
    if (cached && cached.length > 0) return cached;
    return queryStaticTracks({ search: query.trim(), limit, subgenre, phonkOnly: true });
  }
}

/** Tracks for a single phonk subgenre page. Returns [] for an unknown slug. */
export async function fetchSubgenreTracks(slug: string, limit = 24): Promise<Track[]> {
  if (!getSubgenre(slug)) return [];
  return fetchTracks({ subgenre: slug, limit, boost: "popularity_week" });
}

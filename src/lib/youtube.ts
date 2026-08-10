import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * YouTube Data API v3 client for the hybrid catalog layer.
 *
 * Phonq's primary catalog is Jamendo (legal, direct audio, no quota). YouTube
 * fills genre gaps where Jamendo's CC catalog is thin (e.g. Brazilian funk) and
 * provides a "Play on YouTube" fallback for any track via the IFrame Player API.
 *
 * Quota strategy (free tier ≈ 10,000 units/day, `search.list` = 100 units):
 *
 *   1. **DB-first resolution** — every song lookup checks
 *      `youtube_video_mappings` (song_key + artist_key → video_id) before ever
 *      calling the API. Once a song has been searched once, later lookups only
 *      need a 1-unit `videos.list` refresh (or nothing if the cache is fresh).
 *   2. **Batched metadata** — `videos.list` accepts up to 50 ids per call for a
 *      single unit; we always batch instead of looping single-id calls.
 *   3. **playlistItems seeding** — official / Topic "uploads" playlists are
 *      paged with `playlistItems.list` (1 unit per 50 items) to bulk-backfill a
 *      genre without burning search quota.
 *   4. **Search budget** — the daily `search.list` spend is capped (default 100
 *      searches/day) and tracked in `youtube_quota`; once exhausted, new
 *      lookups fall back to cached mappings / playlist rows instead of hitting
 *      the API.
 *
 * All upstream errors are caught and logged server-side; callers get `null` /
 * empty arrays so the app degrades to Jamendo-only instead of breaking.
 */

export const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3";

/** `search.list` costs 100 units; `videos.list` / `playlistItems.list` cost 1. */
const SEARCH_UNITS = 100;
/** Default daily search budget (free tier ≈ 10,000 units/day). */
const DEFAULT_DAILY_SEARCH_BUDGET = 100;
/** Cached mappings are considered fresh for a week; `videos.list` refresh is cheap. */
const MAPPING_FRESH_MS = 7 * 24 * 60 * 60 * 1000;

const globalForYouTube = globalThis as unknown as {
  __phonqYouTubeSearches?: Map<string, number>;
  __phonqYouTubeBudget?: number;
};

function ytSearches(): Map<string, number> {
  if (!globalForYouTube.__phonqYouTubeSearches) {
    globalForYouTube.__phonqYouTubeSearches = new Map();
  }
  return globalForYouTube.__phonqYouTubeSearches;
}

function dailySearchBudget(): number {
  const fromEnv = Number(process.env.YOUTUBE_DAILY_SEARCH_BUDGET);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return Math.floor(fromEnv);
  const cached = globalForYouTube.__phonqYouTubeBudget;
  if (cached && cached > 0) return cached;
  return DEFAULT_DAILY_SEARCH_BUDGET;
}

export interface YouTubeVideo {
  videoId: string;
  title: string;
  artistName: string;
  duration: number;
  thumbnail: string | null;
  channelId: string | null;
  channelTitle: string | null;
  embeddable: boolean;
  subgenre: string | null;
  /** How the video was discovered: "search" | "playlist" | "channel". */
  source: string;
}

export interface YouTubeQuotaStatus {
  /** Units spent today (all endpoints). */
  unitsUsed: number;
  /** `search.list` calls made today. */
  searches: number;
  /** Remaining search budget for today (0 when exhausted). */
  searchesRemaining: number;
  budget: number;
}

/* ------------------------------------------------------------------ */
/* Prisma row → domain video                                           */
/* ------------------------------------------------------------------ */

function rowToVideo(
  row: {
    videoId: string;
    title: string;
    artistName: string;
    duration: number;
    thumbnail: string | null;
    channelId: string | null;
    channelTitle: string | null;
    embeddable: boolean;
    subgenre: string | null;
    source: string;
  },
): YouTubeVideo {
  return {
    videoId: row.videoId,
    title: row.title,
    artistName: row.artistName,
    duration: row.duration,
    thumbnail: row.thumbnail,
    channelId: row.channelId,
    channelTitle: row.channelTitle,
    embeddable: row.embeddable,
    subgenre: row.subgenre,
    source: row.source,
  };
}

/* ------------------------------------------------------------------ */
/* Quota ledger                                                        */
/* ------------------------------------------------------------------ */

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

async function recordQuota(units: number, searches = 0): Promise<void> {
  try {
    await prisma.youTubeQuota.upsert({
      where: { date: today() },
      update: { unitsUsed: { increment: units }, searches: { increment: searches } },
      create: { date: today(), unitsUsed: units, searches },
    });
  } catch {
    /* no database — quota ledger is best-effort only */
  }
}

export async function getYouTubeQuotaStatus(): Promise<YouTubeQuotaStatus> {
  const budget = dailySearchBudget();
  try {
    const row = await prisma.youTubeQuota.findUnique({ where: { date: today() } });
    const searches = row?.searches ?? 0;
    return {
      unitsUsed: row?.unitsUsed ?? 0,
      searches,
      searchesRemaining: Math.max(0, budget - searches),
      budget,
    };
  } catch {
    return { unitsUsed: 0, searches: 0, searchesRemaining: budget, budget };
  }
}

/**
 * Cheap in-memory per-request dedupe so a burst of lookups for the same song
 * (e.g. a queue that references it twice) doesn't double-spend search quota.
 */
function markSearch(key: string): boolean {
  const map = ytSearches();
  const now = Date.now();
  const last = map.get(key) ?? 0;
  if (now - last < 60 * 1000) return false;
  map.set(key, now);
  return true;
}

/* ------------------------------------------------------------------ */
/* Low-level fetch helpers                                             */
/* ------------------------------------------------------------------ */

interface GoogleApiError extends Error {
  status?: number;
  reason?: string;
}

async function ytGet<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;
  const url = new URL(`${YOUTUBE_BASE_URL}/${path}`);
  url.searchParams.set("key", key);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  let res: Response;
  try {
    res = await fetch(url.toString(), { cache: "no-store" });
  } catch (err) {
    console.error(`[youtube] network error for ${path}: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
  if (!res.ok) {
    const err: GoogleApiError = new Error(`YouTube API returned ${res.status} for ${path}`);
    err.status = res.status;
    try {
      const body = (await res.json()) as { error?: { message?: string; reason?: string } };
      err.reason = body.error?.reason;
      err.message = body.error?.message ?? err.message;
    } catch {
      /* non-JSON error body */
    }
    console.error(`[youtube] ${err.message} (${err.reason ?? "unknown reason"})`);
    return null;
  }
  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ */
/* search.list                                                         */
/* ------------------------------------------------------------------ */

interface SearchItem {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelId?: string;
    channelTitle?: string;
    description?: string;
    thumbnails?: { medium?: { url?: string } };
  };
}

interface SearchResponse {
  items?: SearchItem[];
}

/** Title → (songTitle, artistName). Handles "Artist - Song", "Song by Artist",
 * Topic-channel uploads ("Song" on "Artist - Topic"), "(Official Video)" etc. */
function parseTitle(title: string, channelTitle: string | null): { songTitle: string; artistName: string } {
  let t = title.trim();
  // Strip common suffixes in parentheses.
  t = t
    .replace(/\s*\(official\s*(music\s*)?video.*?\)\s*$/i, "")
    .replace(/\s*\(official\s*audio.*?\)\s*$/i, "")
    .replace(/\s*\(official\s*lyrics?.*?\)\s*$/i, "")
    .replace(/\s*\(lyrics?.*?\)\s*$/i, "")
    .replace(/\s*\(live\s*(session)?.*?\)\s*$/i, "")
    .replace(/\s*\(hd\)\s*$/i, "")
    .replace(/\s*\(4k\)\s*$/i, "")
    .trim();

  // Topic channel: channelTitle = "Artist - Topic", title is just the song.
  if (channelTitle) {
    const topicMatch = channelTitle.match(/^(.*?)\s*-\s*Topic$/i);
    if (topicMatch) {
      const artist = topicMatch[1]?.trim() ?? "";
      if (artist && t) return { songTitle: t, artistName: artist };
    }
  }

  // "Artist - Song" / "Artist – Song" / "Artist | Song"
  const sep = t.match(/^(.*?)\s*(?:-|–|—|:|~)\s+(.*)$/);
  if (sep && sep[1] && sep[2]) {
    return { songTitle: sep[2].trim(), artistName: sep[1].trim() };
  }

  // "Song · Artist" or "Song by Artist"
  const by = t.match(/^(.*?)\s*(?:·|by)\s+(.*)$/i);
  if (by && by[1] && by[2]) {
    return { songTitle: by[1].trim(), artistName: by[2].trim() };
  }

  return { songTitle: t, artistName: "" };
}

/** Normalize a name for keying/matching: lowercase, strip accents+punctuation. */
export function normalizeKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Score how well a search result matches the requested song+artist. */
function scoreMatch(item: SearchItem, songTitle: string, artistName: string): number {
  const title = (item.snippet?.title ?? "").toLowerCase();
  const channel = (item.snippet?.channelTitle ?? "").toLowerCase();
  const song = normalizeKey(songTitle);
  const artist = normalizeKey(artistName);
  let score = 0;

  if (song && title.includes(song)) score += 5;
  if (artist && title.includes(artist)) score += 3;
  if (artist && channel.includes(artist)) score += 2;
  // Prefer auto-generated Topic channels and official/VEVO uploads.
  if (channel.endsWith("- topic")) score += 3;
  if (channel.includes("vevo")) score += 2;
  if (channel.includes("official")) score += 1;
  return score;
}

/** Pick the best candidate for a song search, preferring high-scoring matches. */
function bestSearchResult(items: SearchItem[], songTitle: string, artistName: string): SearchItem | null {
  let best: SearchItem | null = null;
  let bestScore = 0;
  for (const item of items) {
    if (!item.id?.videoId) continue;
    const score = scoreMatch(item, songTitle, artistName);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}

/** Run a real `search.list` call (100 units) for a song, cache the best video. */
async function searchAndCache(
  songTitle: string,
  artistName: string,
  subgenre?: string,
): Promise<YouTubeVideo | null> {
  const key = normalizeKey(songTitle);
  const artist = normalizeKey(artistName);

  // Only one live search per song within a minute (per-process) to avoid
  // double-spending on bursty request patterns.
  const dedupeKey = `${key}|${artist}`;
  if (!markSearch(dedupeKey)) return null;

  const queries = [
    artistName && songTitle ? `${artistName} ${songTitle}` : songTitle,
    songTitle,
  ].filter(Boolean);
  const query = queries[0] ?? "";

  const data = await ytGet<SearchResponse>("search", {
    part: "snippet",
    type: "video",
    q: query,
    maxResults: "10",
    safeSearch: "none",
    relevanceLanguage: "en",
  });
  // Only charge quota when the API actually responded — network failures and
  // missing keys never reach YouTube, so they shouldn't burn the search budget.
  if (data) await recordQuota(SEARCH_UNITS, 1);
  if (!data?.items) return null;

  const best = bestSearchResult(data.items, songTitle, artistName);
  if (!best?.id?.videoId) return null;

  const video: YouTubeVideo = {
    videoId: best.id.videoId,
    title: best.snippet?.title ?? songTitle,
    artistName: parseTitle(best.snippet?.title ?? "", best.snippet?.channelTitle ?? null).artistName || artistName,
    duration: 0, // filled by the 1-unit videos.list refresh below
    thumbnail: best.snippet?.thumbnails?.medium?.url ?? null,
    channelId: best.snippet?.channelId ?? null,
    channelTitle: best.snippet?.channelTitle ?? null,
    embeddable: true,
    subgenre: subgenre ?? null,
    source: "search",
  };

  // Refresh duration + embed status with a 1-unit videos.list call and persist.
  const refreshed = await videosList([video.videoId]);
  const fresh = refreshed[0];
  if (fresh) {
    video.duration = fresh.duration;
    video.embeddable = fresh.embeddable;
    video.thumbnail = fresh.thumbnail ?? video.thumbnail;
    video.channelId = fresh.channelId ?? video.channelId;
    video.channelTitle = fresh.channelTitle ?? video.channelTitle;
  }

  await upsertVideo(video, songTitle, artistName, query);
  return video;
}

/* ------------------------------------------------------------------ */
/* videos.list (batched, 1 unit per 50 ids)                            */
/* ------------------------------------------------------------------ */

interface VideoItem {
  id?: string;
  contentDetails?: { duration?: string };
  status?: { embeddable?: boolean; uploadStatus?: string };
  snippet?: {
    title?: string;
    channelId?: string;
    channelTitle?: string;
    thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
  };
}

interface VideosResponse {
  items?: VideoItem[];
}

/** ISO-8601 duration (PT1M30S) → seconds. */
export function isoDurationToSeconds(iso: string | undefined): number {
  if (!iso) return 0;
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return 0;
  return (Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0)) || 0;
}

function videoItemToVideo(item: VideoItem): YouTubeVideo | null {
  if (!item.id) return null;
  return {
    videoId: item.id,
    title: item.snippet?.title ?? "",
    artistName: item.snippet?.channelTitle ?? "",
    duration: isoDurationToSeconds(item.contentDetails?.duration),
    thumbnail: item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? null,
    channelId: item.snippet?.channelId ?? null,
    channelTitle: item.snippet?.channelTitle ?? null,
    embeddable: item.status?.embeddable ?? true,
    subgenre: null,
    source: "search",
  };
}

/** Fetch fresh metadata for up to 50 videos (1 unit per call, batched). */
async function videosList(ids: string[]): Promise<YouTubeVideo[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return [];
  const out: YouTubeVideo[] = [];
  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50);
    const data = await ytGet<VideosResponse>("videos", {
      part: "snippet,contentDetails,status",
      id: chunk.join(","),
    });
    if (data) await recordQuota(1);
    if (!data?.items) continue;
    for (const item of data.items) {
      const video = videoItemToVideo(item);
      if (video) out.push(video);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Persistence helpers                                                 */
/* ------------------------------------------------------------------ */

async function upsertVideo(
  video: YouTubeVideo,
  songTitle?: string,
  artistName?: string,
  query?: string,
): Promise<void> {
  try {
    const data = {
      title: video.title,
      artistName: video.artistName,
      duration: video.duration,
      thumbnail: video.thumbnail,
      channelId: video.channelId,
      channelTitle: video.channelTitle,
      embeddable: video.embeddable,
      subgenre: video.subgenre,
      source: video.source,
    };
    await prisma.youTubeVideo.upsert({
      where: { videoId: video.videoId },
      update: data,
      create: { videoId: video.videoId, ...data },
    });
    if (songTitle && artistName) {
      await prisma.youTubeVideoMapping.upsert({
        where: { songKey_artistKey: { songKey: normalizeKey(songTitle), artistKey: normalizeKey(artistName) } },
        update: { videoId: video.videoId, query: query ?? `${artistName} ${songTitle}` },
        create: {
          videoId: video.videoId,
          songKey: normalizeKey(songTitle),
          artistKey: normalizeKey(artistName),
          query: query ?? `${artistName} ${songTitle}`,
        },
      });
    }
  } catch {
    /* no database — cache writes are best-effort */
  }
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Resolve a song (title + artist) to a YouTube video.
 *
 * DB-first: a cached mapping hits without any API call. On a cache miss a
 * `search.list` is spent (subject to the daily search budget) and the result is
 * stored permanently so the next lookup is free. Returns null when the song is
 * unresolvable, the API key is missing, or the search budget is exhausted.
 */
export async function resolveSongVideo(
  songTitle: string,
  artistName: string,
  subgenre?: string,
): Promise<YouTubeVideo | null> {
  if (!songTitle.trim()) return null;
  const songKey = normalizeKey(songTitle);
  const artistKey = normalizeKey(artistName);

  if (!process.env.YOUTUBE_API_KEY) return null;

  // 1. DB-first lookup — no API cost on a hit.
  try {
    const mapping = await prisma.youTubeVideoMapping.findUnique({
      where: { songKey_artistKey: { songKey, artistKey } },
      include: { video: true },
    });
    if (mapping) {
      const video = rowToVideo(mapping.video);
      if (!video.embeddable) return null;
      // Refresh cheap metadata once a week (1-unit videos.list call).
      const stale = Date.now() - new Date(mapping.video.updatedAt).getTime() > MAPPING_FRESH_MS;
      if (stale) {
        const fresh = await videosList([video.videoId]);
        const updated = fresh[0];
        if (updated) {
          const merged: YouTubeVideo = {
            ...video,
            ...updated,
            // `videos.list` returns the channel title as artistName (e.g. "Artist -
            // Topic"); keep the parsed artist from the stored mapping instead.
            artistName: video.artistName,
            subgenre: video.subgenre,
            source: video.source,
          };
          await upsertVideo(merged, songTitle, artistName, mapping.query);
          return merged;
        }
      }
      return video;
    }
  } catch {
    /* DB unavailable — fall through to a live search */
  }

  // 2. Cache miss — check the daily search budget before spending 100 units.
  try {
    const quota = await prisma.youTubeQuota.findUnique({ where: { date: today() } });
    const searches = quota?.searches ?? 0;
    if (searches >= dailySearchBudget()) {
      console.warn(`[youtube] daily search budget (${dailySearchBudget()}) exhausted — skipping "${songTitle}"`);
      return null;
    }
  } catch {
    /* no database — allow the search; the memory dedupe still guards bursts */
  }

  return searchAndCache(songTitle, artistName, subgenre);
}

/* ------------------------------------------------------------------ */
/* Runtime genre-gap fill (on-demand, budget-gated)                    */
/* ------------------------------------------------------------------ */

/** Per-process throttle so a burst of page renders doesn't re-search the
 * same genre within a day, and the winners are persisted for free reads. */
const genreFillAt: Map<string, number> = new Map();
const GENRE_FILL_DEDUPE_MS = 24 * 60 * 60 * 1000;

/** Opt out of live searches with `YOUTUBE_RUNTIME_FILL=0`; on by default. */
function runtimeFillEnabled(): boolean {
  const value = (process.env.YOUTUBE_RUNTIME_FILL ?? "1").toLowerCase();
  return !["0", "false", "off", "no"].includes(value);
}

function markGenreFill(subgenre: string): boolean {
  const now = Date.now();
  const last = genreFillAt.get(subgenre) ?? 0;
  if (now - last < GENRE_FILL_DEDUPE_MS) return false;
  genreFillAt.set(subgenre, now);
  return true;
}

/** Skip low-quality "lyrics" results (no audio of their own). */
function isLyricResult(title: string | undefined, channelTitle: string | undefined): boolean {
  return /lyric(s)?/i.test(`${title ?? ""} ${channelTitle ?? ""}`);
}

/** Rank candidates for a genre (not a specific song): prefer auto-generated
 * Topic audio and official/VEVO uploads that carry a thumbnail. */
function genreCandidateScore(item: SearchItem): number {
  const title = item.snippet?.title ?? "";
  const channel = item.snippet?.channelTitle ?? "";
  let score = 0;
  if (title) score += 2;
  if (channel.endsWith("- topic")) score += 4;
  if (channel.includes("vevo")) score += 2;
  if (channel.includes("official")) score += 1;
  if (item.snippet?.thumbnails?.medium?.url) score += 1;
  return score;
}

/**
 * Search YouTube live for a subgenre's tracks (e.g. "Brazilian Funk phonk")
 * to top up a genre that Jamendo's CC catalog can't fill — no manual seeding
 * required. This is the runtime twin of `seedFromPlaylist` +
 * `fetchCachedSubgenreVideos`: each genre is searched at most once per day
 * (per process), the spend is capped by the rolling daily search budget, and
 * the winners are persisted so later page loads are free DB reads.
 *
 * Lyrics videos and non-embeddable/short/long items are dropped; the best
 * candidates are returned as `YouTubeVideo`s tagged with the subgenre.
 */
export async function fetchGenreVideos(
  subgenre: string,
  queries: string[],
  limit = 12,
): Promise<YouTubeVideo[]> {
  if (!process.env.YOUTUBE_API_KEY || !runtimeFillEnabled() || limit <= 0) return [];
  if (queries.length === 0 || !markGenreFill(subgenre)) return [];

  // Respect the rolling daily search budget before spending 100 units.
  try {
    const quota = await prisma.youTubeQuota.findUnique({ where: { date: today() } });
    if ((quota?.searches ?? 0) >= dailySearchBudget()) {
      console.warn(`[youtube] daily search budget (${dailySearchBudget()}) exhausted — skipping genre fill "${subgenre}"`);
      return [];
    }
  } catch {
    /* no database — the per-process throttle still guards bursts */
  }

  const found: YouTubeVideo[] = [];
  const seenIds = new Set<string>();

  for (const query of queries.slice(0, 3)) {
    if (found.length >= limit) break;
    const data = await ytGet<SearchResponse>("search", {
      part: "snippet",
      type: "video",
      q: query,
      maxResults: "25",
      safeSearch: "none",
      relevanceLanguage: "en",
    });
    if (data) await recordQuota(SEARCH_UNITS, 1);
    if (!data?.items) continue;

    const candidates = data.items
      .filter((item) => {
        if (!item.id?.videoId || seenIds.has(item.id.videoId)) return false;
        const title = item.snippet?.title?.trim() ?? "";
        if (!title) return false;
        if (isLyricResult(title, item.snippet?.channelTitle)) return false;
        return true;
      })
      .sort((a, b) => genreCandidateScore(b) - genreCandidateScore(a))
      .slice(0, Math.max(limit * 2, 12));

    const ids = candidates.map((item) => item.id!.videoId!);
    const metas = await videosList(ids);
    for (const meta of metas) {
      if (!meta.embeddable) continue;
      if (meta.duration < 45 || meta.duration > 900) continue;
      if (seenIds.has(meta.videoId)) continue;
      seenIds.add(meta.videoId);
      const track: YouTubeVideo = {
        ...meta,
        // videos.list reports the raw channel title as artist; prefer a parsed
        // "Artist" from the actual video title (handles "- Topic" channels).
        artistName: parseTitle(meta.title, meta.channelTitle).artistName || meta.artistName,
        subgenre,
        source: "search",
      };
      found.push(track);
      await upsertVideo(track);
      if (found.length >= limit) break;
    }
  }

  return found.slice(0, limit);
}

/** Per-process throttle so a burst of identical search queries doesn't re-run
 * the same 100-unit search within a day. */
const queryFillAt: Map<string, number> = new Map();

function markQueryFill(key: string): boolean {
  const now = Date.now();
  const last = queryFillAt.get(key) ?? 0;
  if (now - last < GENRE_FILL_DEDUPE_MS) return false;
  queryFillAt.set(key, now);
  return true;
}

/**
 * Search YouTube live for an arbitrary user-provided query (e.g. "Brodyaga
 * Funk") that Jamendo's CC catalog can't match. Budget-gated like the genre
 * fill: at most once per day per query (per process), capped by the rolling
 * daily search budget, and the winners are persisted so later lookups are free
 * DB reads. Results are ranked by the same quality heuristic as genre fill
 * (Topic/official uploads first), with lyrics and non-embeddable/short/long
 * items dropped.
 */
export async function fetchQueryVideos(query: string, limit = 12, subgenre?: string): Promise<YouTubeVideo[]> {
  const q = query.trim();
  if (!process.env.YOUTUBE_API_KEY || !runtimeFillEnabled() || limit <= 0 || !q) return [];
  if (!markQueryFill(q.toLowerCase())) return [];

  // Respect the rolling daily search budget before spending 100 units.
  try {
    const quota = await prisma.youTubeQuota.findUnique({ where: { date: today() } });
    if ((quota?.searches ?? 0) >= dailySearchBudget()) {
      console.warn(`[youtube] daily search budget (${dailySearchBudget()}) exhausted — skipping search query "${q}"`);
      return [];
    }
  } catch {
    /* no database — the per-process throttle still guards bursts */
  }

  const data = await ytGet<SearchResponse>("search", {
    part: "snippet",
    type: "video",
    q,
    maxResults: "25",
    safeSearch: "none",
  });
  if (data) await recordQuota(SEARCH_UNITS, 1);
  if (!data?.items) return [];

  const seenIds = new Set<string>();
  const candidates = data.items
    .filter((item) => {
      if (!item.id?.videoId || seenIds.has(item.id.videoId)) return false;
      const title = item.snippet?.title?.trim() ?? "";
      if (!title) return false;
      if (isLyricResult(title, item.snippet?.channelTitle)) return false;
      return true;
    })
    .sort((a, b) => genreCandidateScore(b) - genreCandidateScore(a))
    .slice(0, Math.max(limit * 2, 12));

  const metas = await videosList(candidates.map((item) => item.id!.videoId!));

  const found: YouTubeVideo[] = [];
  for (const meta of metas) {
    if (!meta.embeddable) continue;
    if (meta.duration < 45 || meta.duration > 900) continue;
    if (seenIds.has(meta.videoId)) continue;
    seenIds.add(meta.videoId);
    const track: YouTubeVideo = {
      ...meta,
      // `videos.list` reports the channel title as artist; prefer a parsed
      // "Artist" from the real video title (handles "- Topic" channels).
      artistName: parseTitle(meta.title, meta.channelTitle).artistName || meta.artistName,
      subgenre: subgenre ?? null,
      source: "search",
    };
    found.push(track);
    await upsertVideo(track);
    if (found.length >= limit) break;
  }

  return found;
}

/**
 * Backfill a genre by paging an uploads/curated playlist with
 * `playlistItems.list` (1 unit per 50 items). Bulk-seeds the mapping table for
 * hundreds of tracks without burning search quota.
 */
export async function seedFromPlaylist(
  playlistId: string,
  subgenre: string,
  maxItems = 200,
): Promise<YouTubeVideo[]> {
  if (!process.env.YOUTUBE_API_KEY) return [];
  const found: YouTubeVideo[] = [];
  let pageToken: string | undefined;
  let count = 0;

  interface PlaylistResponse {
    nextPageToken?: string;
    items?: Array<{ id?: { videoId?: string }; snippet?: { title?: string } }>;
  }

  do {
    if (count >= maxItems) break;
    const data = await ytGet<PlaylistResponse>("playlistItems", {
      part: "snippet",
      playlistId,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });
    if (data) await recordQuota(1);
    if (!data) break;
    pageToken = data.nextPageToken;
    const ids: string[] = [];
    for (const item of data.items ?? []) {
      const videoId = item.id?.videoId;
      if (videoId) ids.push(videoId);
    }
    count += ids.length;
    // Fetch fresh metadata in batches of 50 (1 unit each).
    for (let i = 0; i < ids.length; i += 50) {
      const chunk = ids.slice(i, i + 50);
      const metas = await videosList(chunk);
      for (const video of metas) {
        const track: YouTubeVideo = {
          ...video,
          // videos.list returns the raw channel title; parse the real artist from
          // the video title (handles "Artist - Topic" channels and "Artist - Song").
          artistName: parseTitle(video.title, video.channelTitle).artistName || video.artistName,
          subgenre,
          source: "playlist",
        };
        found.push(track);
        await upsertVideo(track);
      }
    }
  } while (pageToken);

  return found;
}

/** Cached YouTube videos for a subgenre (from playlist seeding), for genre-gap fills. */
export async function fetchCachedSubgenreVideos(subgenre: string, limit = 24): Promise<YouTubeVideo[]> {
  try {
    const rows = await prisma.youTubeVideo.findMany({
      where: { subgenre, embeddable: true },
      orderBy: { createdAt: "desc" },
      take: Math.max(limit, 50),
    });
    return rows.map(rowToVideo);
  } catch {
    return [];
  }
}

/** All cached YouTube videos, used by the admin/seeding UI and quota page. */
export async function fetchAllCachedVideos(limit = 100): Promise<YouTubeVideo[]> {
  try {
    const rows = await prisma.youTubeVideo.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(rowToVideo);
  } catch {
    return [];
  }
}

/** Cached YouTube videos by their raw video ids (no API calls — DB only). */
export async function fetchVideosByIds(videoIds: string[]): Promise<YouTubeVideo[]> {
  const unique = [...new Set(videoIds.filter(Boolean))];
  if (unique.length === 0) return [];
  try {
    const rows = await prisma.youTubeVideo.findMany({
      where: { videoId: { in: unique } },
    });
    return rows.map(rowToVideo);
  } catch {
    return [];
  }
}

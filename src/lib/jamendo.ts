import "server-only";

/**
 * Jamendo API client (https://developer.jamendo.com/v3.0)
 *
 * Jamendo is the world's largest free music library — every track is
 * Creative Commons licensed, which makes it the only "free" catalog that
 * legally allows full-length streaming. You need a free `client_id` from
 * https://devportal.jamendo.com (set it as `JAMENDO_CLIENT_ID`).
 *
 * All responses are cached in-memory with a TTL to respect the free tier
 * rate limits and to keep serverless cold starts fast.
 */

export interface JamendoTrack {
  id: string | number;
  name: string;
  duration: number;
  artist_id: string | number;
  artist_name: string;
  album_id: string | number;
  album_name: string;
  audio: string;
  audiodownload: string;
  image: string;
  image_small: string;
  license_name?: string;
  license_image?: string;
  tags?: string;
  musicinfo?: {
    bpm?: number;
    genre?: string;
    speed?: string;
    vocalinstrumental?: string;
  };
  stats?: {
    popularity_week?: number;
    popularity_month?: number;
    popularity_total?: number;
    buzzrate?: number;
    listens_total?: number;
    downloads_total?: number;
  };
  releasedate?: string;
  audiodownload_allowed?: boolean;
  shareurl?: string;
}

export interface JamendoRadio {
  id: string | number;
  name: string;
  dispname: string;
  type: string;
  image: string;
}

export interface Track {
  id: string;
  name: string;
  duration: number;
  artistId: string;
  artistName: string;
  albumId: string;
  albumName: string;
  audioUrl: string;
  downloadUrl: string;
  image: string | null;
  imageSmall: string | null;
  licenseName: string | null;
  genre: string | null;
  bpm: number | null;
  speed: string | null;
  vocalInstrumental: string | null;
  tags: string[];
  popularityWeek: number;
  popularityTotal: number;
  listensTotal: number;
  downloadsTotal: number;
  releaseDate: string | null;
  audioDownloadAllowed: boolean;
}

export interface Radio {
  id: string;
  name: string;
  displayName: string;
  image: string;
}

export const JAMENDO_BASE_URL = "https://api.jamendo.com/v3.0";
const CACHE_TTL_MS = 10 * 60 * 1000;

type CacheEntry = { expiresAt: number; data: unknown };

const globalCache = globalThis as unknown as { __phonqJamendoCache?: Map<string, CacheEntry> };

function getCache(): Map<string, CacheEntry> {
  if (!globalCache.__phonqJamendoCache) {
    globalCache.__phonqJamendoCache = new Map();
  }
  return globalCache.__phonqJamendoCache;
}

interface ApiResponse<T> {
  headers: {
    status: string;
    code: number;
    error_message?: string;
    results_count?: number;
  };
  results: T;
}

async function get<T>(
  method: string,
  params: Record<string, string | number | string[] | undefined>,
  opts?: { cache?: boolean; ttlMs?: number },
): Promise<T> {
  // Without a client_id there is nothing to query — bail out early instead of
  // burning network requests (which is also what gets shared keys suspended).
  if (!process.env.JAMENDO_CLIENT_ID) {
    throw new Error("JAMENDO_CLIENT_ID is not configured");
  }

  const url = new URL(`${JAMENDO_BASE_URL}/${method}`);
  url.searchParams.set("client_id", process.env.JAMENDO_CLIENT_ID ?? "");
  url.searchParams.set("format", "json");
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, Array.isArray(value) ? value.join("+") : String(value));
  }

  const shouldCache = opts?.cache ?? true;
  const cacheKey = url.toString();

  if (shouldCache) {
    const entry = getCache().get(cacheKey);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data as T;
    }
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
  } catch (err) {
    throw new Error(`Network error contacting Jamendo: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!res.ok) {
    throw new Error(`Jamendo API returned ${res.status} for ${method}`);
  }

  const body = (await res.json()) as ApiResponse<T>;
  if (body.headers.status !== "success") {
    throw new Error(body.headers.error_message ?? `Jamendo API error (code ${body.headers.code})`);
  }

  if (shouldCache) {
    getCache().set(cacheKey, {
      expiresAt: Date.now() + (opts?.ttlMs ?? CACHE_TTL_MS),
      data: body.results,
    });
  }

  return body.results;
}

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function normalizeTrack(t: JamendoTrack): Track {
  return {
    id: String(t.id),
    name: t.name || "Untitled",
    duration: Math.round(toNumber(t.duration)),
    artistId: String(t.artist_id ?? ""),
    artistName: t.artist_name || "Unknown Artist",
    albumId: String(t.album_id ?? ""),
    albumName: t.album_name || "Unknown Album",
    audioUrl: t.audio ?? "",
    downloadUrl: t.audiodownload ?? "",
    image: t.image || null,
    imageSmall: t.image_small || null,
    licenseName: t.license_name ?? null,
    genre: t.musicinfo?.genre ?? null,
    bpm: typeof t.musicinfo?.bpm === "number" ? t.musicinfo.bpm : null,
    speed: t.musicinfo?.speed ?? null,
    vocalInstrumental: t.musicinfo?.vocalinstrumental ?? null,
    tags: (t.tags ?? "").split(/\s+/).filter(Boolean),
    popularityWeek: toNumber(t.stats?.popularity_week),
    popularityTotal: toNumber(t.stats?.popularity_total),
    listensTotal: toNumber(t.stats?.listens_total),
    downloadsTotal: toNumber(t.stats?.downloads_total),
    releaseDate: t.releasedate ?? null,
    audioDownloadAllowed: Boolean(t.audiodownload_allowed),
  };
}

export interface TracksParams {
  search?: string;
  tags?: string[];
  boost?: string;
  order?: string;
  limit?: number;
  offset?: number;
  ids?: string[];
}

export async function fetchTracks(params: TracksParams = {}): Promise<Track[]> {
  const results = await get<JamendoTrack[]>(
    "tracks",
    {
      search: params.search,
      fuzzytags: params.tags,
      boost: params.boost,
      order: params.order,
      limit: params.limit ?? 24,
      offset: params.offset,
      id: params.ids,
      include: ["musicinfo", "stats"],
    },
    { ttlMs: params.search ? 5 * 60 * 1000 : CACHE_TTL_MS },
  );
  return results.map(normalizeTrack);
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

export async function fetchRadios(): Promise<Radio[]> {
  const results = await get<JamendoRadio[]>("radios", { limit: 50 });
  return results.map((r) => ({
    id: String(r.id),
    name: r.name,
    displayName: r.dispname,
    image: r.image,
    type: r.type,
  }));
}

/** Popular phonk tracks this week — the default "Trending now" feed. */
export async function fetchTrendingPhonk(limit = 24): Promise<Track[]> {
  return fetchTracks({ tags: ["phonk"], boost: "popularity_week", limit });
}

/** Freshly added tracks across the catalog. */
export async function fetchFreshDrops(limit = 24): Promise<Track[]> {
  return fetchTracks({ tags: ["phonk"], order: "dateadded_desc", limit });
}

export async function searchTracks(query: string, limit = 30): Promise<Track[]> {
  if (!query.trim()) return [];
  return fetchTracks({ search: query.trim(), tags: ["phonk"], limit });
}

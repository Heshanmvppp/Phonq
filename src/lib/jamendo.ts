import "server-only";

import { classifyTrack, getSubgenre, PHONK_FAMILY_QUERY_TAGS } from "@/lib/phonk-genres";

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

export interface JamendoArtist {
  id: string | number;
  name: string;
  image?: string;
  image_small?: string;
  website?: string;
  joindate?: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  nb_tracks?: number;
  nb_albums?: number;
  nb_fans?: number;
  bioid?: string;
}

export interface JamendoArtistBio {
  artist_id: string | number;
  bioid: string;
  languages?: string[];
  text: string;
}

export interface JamendoAlbum {
  id: string | number;
  name: string;
  artist_id: string | number;
  artist_name: string;
  image?: string;
  image_small?: string;
  releasedate?: string;
  joindate?: string;
  zip?: string;
  nb_tracks?: number;
  website?: string;
}

export interface Artist {
  id: string;
  name: string;
  image: string | null;
  imageSmall: string | null;
  website: string | null;
  location: string | null;
  joindate: string | null;
  nbTracks: number | null;
  nbAlbums: number | null;
  nbFans: number | null;
  bio: string | null;
}

export interface Album {
  id: string;
  name: string;
  artistId: string;
  artistName: string;
  image: string | null;
  imageSmall: string | null;
  releaseDate: string | null;
  nbTracks: number | null;
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
  /**
   * Phonk subgenre this track was classified into (e.g. "drift",
   * "phonk-trap"), or null when it isn't part of the curated phonk catalog.
   * Populated by `normalizeTrack`; the catalog layer relies on it to keep the
   * platform phonk-only.
   */
  subgenre?: string | null;
  /**
   * Where the track's audio comes from. "jamendo" (default) tracks play through
   * the proxied `<audio>` element; "youtube" tracks have no direct stream and
   * play through the YouTube IFrame Player API.
   */
  source?: "jamendo" | "youtube";
  /** YouTube video id when `source` is "youtube". */
  videoId?: string | null;
  /** Thumbnail for a YouTube-sourced track (maps to `image` when present). */
  videoThumbnail?: string | null;
}

export interface Radio {
  id: string;
  name: string;
  displayName: string;
  image: string;
  /** Phonk subgenre slug when this radio maps to one of the curated subgenres
   * (set on the fallback radios) — lets clients queue tracks for that sound. */
  subgenre?: string;
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
    subgenre: classifyTrack({
      name: t.name,
      artistName: t.artist_name,
      genre: t.musicinfo?.genre ?? null,
      bpm: typeof t.musicinfo?.bpm === "number" ? t.musicinfo.bpm : null,
      tags: (t.tags ?? "").split(/\s+/).filter(Boolean),
      vocalInstrumental: t.musicinfo?.vocalinstrumental ?? null,
    })?.slug ?? null,
    source: "jamendo",
    videoId: null,
    videoThumbnail: null,
  };
}

export function normalizeArtist(a: JamendoArtist, bio: string | null = null): Artist {
  return {
    id: String(a.id),
    name: a.name || "Unknown Artist",
    image: a.image || null,
    imageSmall: a.image_small || a.image || null,
    website: a.website || null,
    location: a.location || null,
    joindate: a.joindate || null,
    nbTracks: typeof a.nb_tracks === "number" ? a.nb_tracks : null,
    nbAlbums: typeof a.nb_albums === "number" ? a.nb_albums : null,
    nbFans: typeof a.nb_fans === "number" ? a.nb_fans : null,
    bio,
  };
}

export function normalizeAlbum(a: JamendoAlbum): Album {
  return {
    id: String(a.id),
    name: a.name || "Unknown Album",
    artistId: String(a.artist_id ?? ""),
    artistName: a.artist_name || "Unknown Artist",
    image: a.image || null,
    imageSmall: a.image_small || a.image || null,
    releaseDate: a.releasedate || null,
    nbTracks: typeof a.nb_tracks === "number" ? a.nb_tracks : null,
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
  artistId?: string;
  albumId?: string;
  /** Curate results to a single phonk subgenre (handled by the catalog layer). */
  subgenre?: string;
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
      artist_id: params.artistId,
      album_id: params.albumId,
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

/**
 * Popular phonk tracks this week — the default "Trending now" feed.
 * The broad tag set surfaces subgenre tracks that Jamendo tags differently
 * (drift, trap, drill, bass…); the catalog layer classifies + filters them.
 */
export async function fetchTrendingPhonk(limit = 24): Promise<Track[]> {
  return fetchTracks({ tags: PHONK_FAMILY_QUERY_TAGS, boost: "popularity_week", limit });
}

/** Freshly added tracks across the phonk catalog. */
export async function fetchFreshDrops(limit = 24): Promise<Track[]> {
  return fetchTracks({ tags: PHONK_FAMILY_QUERY_TAGS, order: "dateadded_desc", limit });
}

export async function searchTracks(query: string, limit = 30, subgenre?: string): Promise<Track[]> {
  if (!query.trim()) return [];
  const tags = subgenre ? (getSubgenre(subgenre)?.jamendoTags ?? PHONK_FAMILY_QUERY_TAGS) : PHONK_FAMILY_QUERY_TAGS;
  return fetchTracks({ search: query.trim(), tags, limit });
}

/**
 * Fetch a single artist's metadata (name, image, bio, stats). The bio lives on
 * a separate endpoint (`/artists/bio`) keyed by the artist's `bioid`, so it's
 * fetched lazily only when Jamendo returns one.
 */
export async function fetchArtist(artistId: string): Promise<Artist | null> {
  const results = await get<JamendoArtist[]>("artists", { id: artistId });
  if (!results || results.length === 0) return null;
  const a = results[0]!;
  let bio: string | null = null;
  if (a.bioid) {
    try {
      const bios = await get<JamendoArtistBio[]>("artists/bio", { id: artistId, bioid: a.bioid });
      if (bios && bios.length > 0 && bios[0] && bios[0]!.text) bio = bios[0]!.text;
    } catch {
      bio = null;
    }
  }
  return normalizeArtist(a, bio);
}

/** Fetch a single album's metadata (name, artist, cover, release date) from Jamendo. */
export async function fetchAlbum(albumId: string): Promise<Album | null> {
  const results = await get<JamendoAlbum[]>("albums", { id: albumId });
  if (!results || results.length === 0) return null;
  return normalizeAlbum(results[0]!);
}

/** Popular artists across the catalog (top-level "browse artists" list). */
export async function fetchArtists(limit = 48, offset = 0): Promise<Artist[]> {
  const results = await get<JamendoArtist[]>(
    "artists",
    { order: "popularity_total", limit, offset, imagesize: 300 },
    { ttlMs: 5 * 60 * 1000 },
  );
  return results.map((a) => normalizeArtist(a));
}

/** Popular albums across the catalog (top-level "browse albums" list). */
export async function fetchAlbums(limit = 48, offset = 0): Promise<Album[]> {
  const results = await get<JamendoAlbum[]>(
    "albums",
    { order: "popularity_total", limit, offset, imagesize: 300 },
    { ttlMs: 5 * 60 * 1000 },
  );
  return results.map(normalizeAlbum);
}

/** All tracks belonging to an artist (no curation — full discography). */
export async function fetchTracksByArtist(artistId: string, limit = 50, offset = 0): Promise<Track[]> {
  const results = await get<JamendoTrack[]>("tracks", {
    artist_id: artistId,
    limit,
    offset,
    include: ["musicinfo", "stats"],
  });
  return results.map(normalizeTrack);
}

/** All tracks belonging to an album (track listing for an album page). */
export async function fetchTracksByAlbum(albumId: string, limit = 50, offset = 0): Promise<Track[]> {
  const results = await get<JamendoTrack[]>("tracks", {
    album_id: albumId,
    limit,
    offset,
    include: ["musicinfo", "stats"],
  });
  return results.map(normalizeTrack);
}

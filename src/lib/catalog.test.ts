import { beforeEach, describe, expect, it, vi } from "vitest";

import { FEATURED_TRACKS } from "@/content/featured-tracks";
import { PHONK_SUBGENRES } from "@/lib/phonk-genres";

const mocks = vi.hoisted(() => ({
  jamendo: {
    fetchTracks: vi.fn(),
    fetchTrack: vi.fn(),
    fetchTracksByIds: vi.fn(),
    fetchRadios: vi.fn(),
    fetchTrendingPhonk: vi.fn(),
    fetchFreshDrops: vi.fn(),
    searchTracks: vi.fn(),
  },
  youtube: {
    fetchVideosByIds: vi.fn(),
    fetchCachedSubgenreVideos: vi.fn().mockResolvedValue([]),
    fetchGenreVideos: vi.fn().mockResolvedValue([]),
    fetchQueryVideos: vi.fn().mockResolvedValue([]),
    resolveSongVideo: vi.fn().mockResolvedValue(null),
  },
  prisma: {
    catalogStatus: {
      upsert: vi.fn().mockResolvedValue(undefined),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    cachedTrack: {
      count: vi.fn().mockResolvedValue(0),
      upsert: vi.fn().mockResolvedValue({}),
      findMany: vi.fn().mockResolvedValue([]),
    },
    youTubeVideo: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    youTubeQuota: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({}),
    },
    youTubeVideoMapping: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn(async (ops: unknown[]) => {
      await Promise.all((ops as (() => Promise<unknown>)[]).map((op) => op()));
      return [];
    }),
  },
}));

vi.mock("@/lib/jamendo", () => mocks.jamendo);
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/youtube", () => ({
  ...mocks.youtube,
  __esModule: true,
}));

import * as jamendo from "@/lib/jamendo";
import * as youtube from "@/lib/youtube";
import { fetchTracksByIds, fetchTrack, fetchFreshDrops, fetchRadios, fetchSubgenreTracks, fetchTracks, fetchTrendingPhonk, getCatalogStatus, searchTracks } from "@/lib/catalog";

const liveTracks = [
  {
    id: "100",
    name: "Live Track",
    duration: 120,
    artistId: "1",
    artistName: "Artist One",
    albumId: "1",
    albumName: "Album One",
    audioUrl: "https://cdn.example/100.mp3",
    downloadUrl: "https://cdn.example/100.mp3",
    image: null,
    imageSmall: null,
    licenseName: "CC BY",
    genre: "phonk",
    bpm: 120,
    speed: "medium",
    vocalInstrumental: "instrumental",
    tags: ["phonk"],
    popularityWeek: 100,
    popularityTotal: 1000,
    listensTotal: 5000,
    downloadsTotal: 100,
    releaseDate: "2024-01-01",
    audioDownloadAllowed: true,
  },
];

describe("catalog fallback ladder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.catalogStatus.upsert.mockResolvedValue(undefined);
    mocks.prisma.catalogStatus.findUnique.mockResolvedValue(null);
    mocks.prisma.cachedTrack.findMany.mockResolvedValue([]);
    mocks.prisma.cachedTrack.count.mockResolvedValue(0);
  });

  it("serves live tracks when the upstream API works", async () => {
    vi.mocked(jamendo.fetchFreshDrops).mockResolvedValue(liveTracks);
    const result = await fetchFreshDrops(1);
    expect(result).toEqual(liveTracks);
    expect(mocks.prisma.cachedTrack.upsert).toHaveBeenCalled();
  });

  it("serves cached tracks from the database when the API is down", async () => {
    vi.mocked(jamendo.fetchFreshDrops).mockRejectedValue(new Error("Jamendo Api Suspended Application Error"));
    mocks.prisma.cachedTrack.findMany.mockResolvedValue([
      {
        id: "50",
        name: "Cached Track",
        duration: 100,
        artistId: "2",
        artistName: "Artist Two",
        albumId: "2",
        albumName: "Album Two",
        audioUrl: "https://cdn.example/50.mp3",
        downloadUrl: null,
        image: null,
        imageSmall: null,
        licenseName: "CC BY-NC",
        genre: "phonk",
        bpm: null,
        speed: null,
        vocalInstrumental: null,
        tags: "phonk cached",
        popularityWeek: 10,
        popularityTotal: 100,
        listensTotal: 500,
        downloadsTotal: 50,
        releaseDate: null,
        audioDownloadAllowed: false,
      },
    ]);

    const result = await fetchFreshDrops(1);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Cached Track");
    expect(result[0].artistName).toBe("Artist Two");
  });

  it("serves only phonk-classified tracks from the static snapshot", async () => {
    vi.mocked(jamendo.fetchFreshDrops).mockRejectedValue(new Error("network down"));
    mocks.prisma.cachedTrack.findMany.mockRejectedValue(new Error("no database"));

    const result = await fetchFreshDrops(FEATURED_TRACKS.length);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThan(FEATURED_TRACKS.length);
    expect(result.every((t) => t.subgenre != null)).toBe(true);
    const featuredIds = new Set(FEATURED_TRACKS.map((t) => t.id));
    expect(result.every((t) => featuredIds.has(t.id))).toBe(true);
  });

  it("never leaks the raw upstream error message to callers", async () => {
    vi.mocked(jamendo.fetchFreshDrops).mockRejectedValue(
      new Error("Jamendo Api Suspended Application Error: your application has been suspended"),
    );
    mocks.prisma.cachedTrack.findMany.mockRejectedValue(new Error("no database"));
    const result = await fetchFreshDrops(5);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((t) => t.name.length > 0)).toBe(true);
  });

  it("falls back to the curated phonk subgenre radios when the radios endpoint fails", async () => {
    vi.mocked(jamendo.fetchRadios).mockRejectedValue(new Error("boom"));
    const result = await fetchRadios();
    expect(result).toHaveLength(PHONK_SUBGENRES.length);
    expect(result[0].displayName).toBe(PHONK_SUBGENRES[0].name);
  });

  it("keeps only phonk radios from the live radios endpoint", async () => {
    vi.mocked(jamendo.fetchRadios).mockResolvedValue([
      { id: "1", name: "phonk", displayName: "Phonk", image: "" },
      { id: "2", name: "drift-phonk", displayName: "Drift Phonk", image: "" },
      { id: "3", name: "lofi", displayName: "Lo-Fi", image: "" },
      { id: "4", name: "rock", displayName: "Rock", image: "" },
      { id: "5", name: "metal", displayName: "Metal", image: "" },
      { id: "6", name: "funk", displayName: "Funk", image: "" },
    ]);
    const result = await fetchRadios();
    expect(result.map((r) => r.id)).toEqual(["1", "2"]);
  });

  it("paginates through the curated list by offset", async () => {
    const phonkTracks = Array.from({ length: 6 }, (_, i) => ({
      ...liveTracks[0],
      id: `p${i}`,
      name: `Drift Track ${i}`,
    }));
    const nonPhonk = { ...liveTracks[0], id: "x", name: "Lo Fi Beat", tags: ["lofi"], genre: "lofi", bpm: 90 };
    vi.mocked(jamendo.fetchTracks).mockResolvedValue([...phonkTracks, nonPhonk]);

    const page = await fetchTracks({ limit: 2, offset: 2 });
    expect(page.map((t) => t.id)).toEqual(["p2", "p3"]);
  });

  it("curates live feeds down to phonk-classified tracks", async () => {
    vi.mocked(jamendo.fetchFreshDrops).mockResolvedValue([
      ...liveTracks,
      {
        ...liveTracks[0],
        id: "101",
        name: "Ambient Field Recording",
        tags: ["ambient", "field recording"],
        genre: "ambient",
        bpm: 60,
      },
    ]);
    const result = await fetchFreshDrops(5);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("100");
  });

  it("curates search results to a single phonk subgenre", async () => {
    vi.mocked(jamendo.searchTracks).mockResolvedValue([
      { ...liveTracks[0], id: "200", name: "Drift Phonk Banger", tags: ["drift", "phonk"], bpm: 145 },
      { ...liveTracks[0], id: "201", name: "Lo Fi Beat", tags: ["lofi"], genre: "lofi", bpm: 90 },
      { ...liveTracks[0], id: "202", name: "Classic Memphis", tags: ["memphis", "cowbell"], bpm: 80 },
    ]);
    const result = await searchTracks("phonk", 10, "drift");
    expect(result.map((t) => t.id)).toEqual(["200"]);
  });

  it("surfaces a previously-cached track even when name-search returns sparse tags", async () => {
    // Live name-search comes back thin: "funk" alone fails the phonk gate.
    vi.mocked(jamendo.searchTracks).mockResolvedValue([
      { ...liveTracks[0], id: "300", name: "Brasil Funk", tags: ["funk"], bpm: 145 },
    ]);
    // The cache (written during a prior tag-query browse) holds the full tags.
    mocks.prisma.cachedTrack.findMany.mockResolvedValue([
      { id: "300", tags: "phonk brazilian funk baile" },
    ]);

    const result = await searchTracks("brasil funk", 10);
    expect(result.map((t) => t.id)).toEqual(["300"]);
    expect(result[0].subgenre).toBe("brazilian");
  });

  it("drops genuinely non-phonk tracks even when name-search is sparse", async () => {
    vi.mocked(jamendo.searchTracks).mockResolvedValue([
      { ...liveTracks[0], id: "400", name: "Summer Vibes", tags: ["funk"], genre: "funk", bpm: 120 },
      { ...liveTracks[0], id: "401", name: "Another Funk", tags: ["funk"], genre: "funk", bpm: 125 },
    ]);
    // No cache entries -> nothing to enrich with -> both stay below the gate.
    mocks.prisma.cachedTrack.findMany.mockResolvedValue([]);
    const result = await searchTracks("funk", 10);
    expect(result).toHaveLength(0);
  });

  it("searches the static snapshot when search fails", async () => {
    vi.mocked(jamendo.searchTracks).mockRejectedValue(new Error("boom"));
    mocks.prisma.cachedTrack.findMany.mockRejectedValue(new Error("no database"));
    const result = await searchTracks("trap", 10);
    expect(result.length).toBeGreaterThan(0);
  });

  it("reports degraded status after an upstream failure", async () => {
    vi.mocked(jamendo.fetchTrendingPhonk).mockRejectedValue(new Error("boom"));
    await fetchTrendingPhonk(5).catch(() => undefined);
    const status = await getCatalogStatus();
    expect(status.provider).toBe("degraded");
  });
});

describe("YouTube id resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.cachedTrack.findMany.mockResolvedValue([]);
    mocks.youtube.fetchVideosByIds.mockResolvedValue([]);
  });

  const ytVideo = {
    videoId: "dQw4w9WgXcQ",
    title: "Never Gonna Give You Up",
    artistName: "Rick Astley",
    duration: 213,
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
    channelId: "UCE_M8A5yxnLfW0KghEeajjw",
    channelTitle: "RickAstley",
    embeddable: true,
    subgenre: "brazilian",
    source: "playlist",
  };

  it("resolves yt: ids through the YouTube table for favorites/history/playlists", async () => {
    mocks.youtube.fetchVideosByIds.mockResolvedValue([ytVideo]);
    vi.mocked(jamendo.fetchTracks).mockResolvedValue([]);

    const tracks = await fetchTracksByIds(["1", "yt:dQw4w9WgXcQ"]);
    expect(mocks.youtube.fetchVideosByIds).toHaveBeenCalledWith(["dQw4w9WgXcQ"]);
    expect(tracks).toContainEqual(
      expect.objectContaining({ id: "yt:dQw4w9WgXcQ", name: "Never Gonna Give You Up", source: "youtube", videoId: "dQw4w9WgXcQ" }),
    );
  });

  it("fetchTrack resolves a YouTube track id with no upstream call", async () => {
    mocks.youtube.fetchVideosByIds.mockResolvedValue([ytVideo]);
    vi.mocked(jamendo.fetchTracks).mockResolvedValue([]);

    const track = await fetchTrack("yt:dQw4w9WgXcQ");
    expect(track).not.toBeNull();
    expect(track?.id).toBe("yt:dQw4w9WgXcQ");
    expect(track?.source).toBe("youtube");
    expect(mocks.youtube.fetchVideosByIds).toHaveBeenCalledWith(["dQw4w9WgXcQ"]);
    expect(jamendo.fetchTracks).not.toHaveBeenCalled();
  });

  it("fetchTrack returns null when the YouTube video is gone", async () => {
    mocks.youtube.fetchVideosByIds.mockResolvedValue([]);
    const track = await fetchTrack("yt:missing123");
    expect(track).toBeNull();
  });
});

describe("subgenre genre-gap fill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.catalogStatus.upsert.mockResolvedValue(undefined);
    mocks.prisma.cachedTrack.findMany.mockResolvedValue([]);
    mocks.youtube.fetchCachedSubgenreVideos.mockResolvedValue([]);
    mocks.youtube.fetchGenreVideos.mockResolvedValue([]);
  });

  const ytVideo = {
    videoId: "gW1",
    title: "Brazilian Drift Banger",
    artistName: "MC Drift",
    duration: 210,
    thumbnail: "https://i.ytimg.com/vi/gW1/mqdefault.jpg",
    channelId: "c1",
    channelTitle: "MC Drift - Topic",
    embeddable: true,
    subgenre: "brazilian",
    source: "search",
  };

  it("returns Jamendo tracks directly when the genre is full", async () => {
    vi.mocked(jamendo.fetchTracks).mockResolvedValue([{ ...liveTracks[0], name: "Drift Phonk" }]);
    const tracks = await fetchSubgenreTracks("drift", 1);
    expect(tracks.map((t) => t.id)).toEqual(["100"]);
    expect(mocks.youtube.fetchGenreVideos).not.toHaveBeenCalled();
  });

  it("tops up a thin genre from the cached YouTube seed", async () => {
    vi.mocked(jamendo.fetchTracks).mockResolvedValue([]);
    mocks.youtube.fetchCachedSubgenreVideos.mockResolvedValue([ytVideo]);
    const tracks = await fetchSubgenreTracks("brazilian", 12);
    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toMatchObject({ id: "yt:gW1", source: "youtube", subgenre: "brazilian" });
    // Still short of the window, so the runtime filler is asked for the remainder.
    expect(mocks.youtube.fetchGenreVideos).toHaveBeenCalledWith("brazilian", expect.any(Array), 11);
  });

  it("falls back to a live YouTube search when the cached seed is empty", async () => {
    vi.mocked(jamendo.fetchTracks).mockResolvedValue([]);
    mocks.youtube.fetchGenreVideos.mockResolvedValue([ytVideo]);
    const tracks = await fetchSubgenreTracks("brazilian", 12);
    expect(mocks.youtube.fetchGenreVideos).toHaveBeenCalledWith("brazilian", expect.any(Array), 12);
    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toMatchObject({ id: "yt:gW1", source: "youtube", videoId: "gW1" });
  });

  it("does not double-list the same video across cached and live fill", async () => {
    const same = { ...ytVideo };
    vi.mocked(jamendo.fetchTracks).mockResolvedValue([]);
    mocks.youtube.fetchCachedSubgenreVideos.mockResolvedValue([same]);
    mocks.youtube.fetchGenreVideos.mockResolvedValue([same]);
    const tracks = await fetchSubgenreTracks("brazilian", 12);
    expect(tracks).toHaveLength(1);
  });
});

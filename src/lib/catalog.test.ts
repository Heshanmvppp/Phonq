import { beforeEach, describe, expect, it, vi } from "vitest";

import { FEATURED_RADIOS } from "@/content/featured-radios";
import { FEATURED_TRACKS } from "@/content/featured-tracks";

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
    $transaction: vi.fn(async (ops: unknown[]) => {
      await Promise.all((ops as (() => Promise<unknown>)[]).map((op) => op()));
      return [];
    }),
  },
}));

vi.mock("@/lib/jamendo", () => mocks.jamendo);
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));

import * as jamendo from "@/lib/jamendo";
import { fetchFreshDrops, fetchRadios, fetchTrendingPhonk, getCatalogStatus, searchTracks } from "@/lib/catalog";

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

  it("serves the static snapshot when both the API and the DB are unavailable", async () => {
    vi.mocked(jamendo.fetchFreshDrops).mockRejectedValue(new Error("network down"));
    mocks.prisma.cachedTrack.findMany.mockRejectedValue(new Error("no database"));

    const result = await fetchFreshDrops(FEATURED_TRACKS.length);
    expect(result).toHaveLength(FEATURED_TRACKS.length);
    expect(result[0].id).toBe(FEATURED_TRACKS[0].id);
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

  it("falls back to curated radios when the radios endpoint fails", async () => {
    vi.mocked(jamendo.fetchRadios).mockRejectedValue(new Error("boom"));
    const result = await fetchRadios();
    expect(result).toHaveLength(FEATURED_RADIOS.length);
    expect(result[0].displayName).toBe(FEATURED_RADIOS[0].displayName);
  });

  it("searches the static snapshot when search fails", async () => {
    vi.mocked(jamendo.searchTracks).mockRejectedValue(new Error("boom"));
    mocks.prisma.cachedTrack.findMany.mockRejectedValue(new Error("no database"));
    const result = await searchTracks("drift", 10);
    expect(result.length).toBeGreaterThan(0);
  });

  it("reports degraded status after an upstream failure", async () => {
    vi.mocked(jamendo.fetchTrendingPhonk).mockRejectedValue(new Error("boom"));
    await fetchTrendingPhonk(5).catch(() => undefined);
    const status = await getCatalogStatus();
    expect(status.provider).toBe("degraded");
  });
});

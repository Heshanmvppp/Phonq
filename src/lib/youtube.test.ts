import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  youTubeQuota: { findUnique: vi.fn(), upsert: vi.fn() },
  youTubeVideo: { upsert: vi.fn(), findMany: vi.fn() },
  youTubeVideoMapping: { upsert: vi.fn(), findUnique: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { fetchGenreVideos, isoDurationToSeconds, normalizeKey } from "@/lib/youtube";

describe("normalizeKey", () => {
  it("lowercases and strips accents + punctuation", () => {
    expect(normalizeKey("Anitta Envolver")).toBe("anitta envolver");
    expect(normalizeKey("  MC   Kevinho  ")).toBe("mc kevinho");
    expect(normalizeKey("Mc Don Juan — Tudo Ok")).toBe("mc don juan tudo ok");
    expect(normalizeKey("DJ Boy & MC Smith (Ao Vivo)")).toBe("dj boy mc smith ao vivo");
    expect(normalizeKey("Café, 123!")).toBe("cafe 123");
  });

  it("handles empty input", () => {
    expect(normalizeKey("")).toBe("");
    expect(normalizeKey("   ")).toBe("");
  });
});

describe("isoDurationToSeconds", () => {
  it("parses ISO-8601 YouTube durations", () => {
    expect(isoDurationToSeconds("PT3M45S")).toBe(225);
    expect(isoDurationToSeconds("PT1H2M3S")).toBe(3723);
    expect(isoDurationToSeconds("PT1M")).toBe(60);
    expect(isoDurationToSeconds("PT30S")).toBe(30);
    expect(isoDurationToSeconds("PT2H")).toBe(7200);
  });

  it("returns 0 for missing or malformed input", () => {
    expect(isoDurationToSeconds(undefined)).toBe(0);
    expect(isoDurationToSeconds("")).toBe(0);
    expect(isoDurationToSeconds("3:45")).toBe(0);
    expect(isoDurationToSeconds("PT")).toBe(0);
  });
});

describe("fetchGenreVideos", () => {
  beforeEach(() => {
    process.env.YOUTUBE_API_KEY = "test-key";
    process.env.YOUTUBE_RUNTIME_FILL = "1";
    prismaMock.youTubeQuota.findUnique.mockReset().mockResolvedValue(null);
    prismaMock.youTubeQuota.upsert.mockReset().mockResolvedValue({});
    prismaMock.youTubeVideo.upsert.mockReset().mockResolvedValue({});
    prismaMock.youTubeVideoMapping.upsert.mockReset().mockResolvedValue({});
  });

  afterEach(() => {
    delete process.env.YOUTUBE_API_KEY;
    delete process.env.YOUTUBE_RUNTIME_FILL;
    vi.unstubAllGlobals();
  });

  function stubYouTube() {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL) => {
        const url = new URL(String(input));
        const isSearch = url.pathname.endsWith("/search");
        const body = isSearch
          ? {
              items: [
                {
                  id: { videoId: "g1" },
                  snippet: {
                    title: "Brasil Funk Banger",
                    channelId: "c1",
                    channelTitle: "Br Funk - Topic",
                    thumbnails: { medium: { url: "https://i.ytimg.com/vi/g1/mqdefault.jpg" } },
                  },
                },
                {
                  id: { videoId: "g2" },
                  snippet: {
                    title: "Brasil Funk Banger (Lyrics)",
                    channelId: "c2",
                    channelTitle: "Lyrics Channel",
                    thumbnails: { medium: { url: "https://i.ytimg.com/vi/g2/mqdefault.jpg" } },
                  },
                },
                {
                  id: { videoId: "g3" },
                  snippet: {
                    title: "Drift Jean Challenge",
                    channelId: "c3",
                    channelTitle: "Random Uploader",
                    thumbnails: { medium: { url: "https://i.ytimg.com/vi/g3/mqdefault.jpg" } },
                  },
                },
              ],
            }
          : {
              items: [
                {
                  id: "g1",
                  snippet: { title: "Brasil Funk Banger", channelId: "c1", channelTitle: "Br Funk - Topic" },
                  contentDetails: { duration: "PT3M10S" },
                  status: { embeddable: true },
                },
                {
                  id: "g3",
                  snippet: { title: "Drift Jean Challenge", channelId: "c3", channelTitle: "Random Uploader" },
                  contentDetails: { duration: "PT2M5S" },
                  status: { embeddable: true },
                },
              ],
            };
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );
  }

  it("returns embeddable genre videos (skipping lyrics) and persists them", async () => {
    stubYouTube();
    const videos = await fetchGenreVideos("brazilian-fill-1", ["Brazilian Funk phonk"], 12);

    expect(videos).toHaveLength(2);
    expect(videos.map((v) => v.videoId)).toEqual(["g1", "g3"]);
    expect(videos.every((v) => v.subgenre === "brazilian-fill-1")).toBe(true);
    expect(videos.every((v) => v.embeddable)).toBe(true);
    expect(videos[0].artistName).toBe("Br Funk"); // parsed from "- Topic" channel
    expect(prismaMock.youTubeVideo.upsert).toHaveBeenCalledTimes(2);
    expect(prismaMock.youTubeQuota.upsert).toHaveBeenCalled(); // search + videos.list ledger
  });

  it("does not search when the daily search budget is exhausted", async () => {
    prismaMock.youTubeQuota.findUnique.mockResolvedValue({
      id: 1,
      date: "2026-08-10",
      unitsUsed: 10000,
      searches: 100,
    });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));

    const videos = await fetchGenreVideos("brazilian-fill-2", ["Brazilian Funk phonk"], 12);
    expect(videos).toHaveLength(0);
    expect(prismaMock.youTubeQuota.upsert).not.toHaveBeenCalled();
  });

  it("no-ops without an API key or when runtime fill is disabled", async () => {
    delete process.env.YOUTUBE_API_KEY;
    expect(await fetchGenreVideos("fill-x", ["brasil phonk"], 5)).toEqual([]);

    process.env.YOUTUBE_API_KEY = "k";
    process.env.YOUTUBE_RUNTIME_FILL = "0";
    expect(await fetchGenreVideos("fill-x2", ["brasil phonk"], 5)).toEqual([]);
  });
});

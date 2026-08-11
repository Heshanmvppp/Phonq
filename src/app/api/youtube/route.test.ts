import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchYouTubeFill: vi.fn(),
  getYouTubeQuota: vi.fn(),
  resolveYouTubeForTrack: vi.fn(),
}));

vi.mock("@/lib/catalog", () => mocks);

import { GET } from "@/app/api/youtube/[action]/route";

const track = {
  id: "yt:dQw4w9WgXcQ",
  name: "Never Gonna Give You Up",
  duration: 213,
  artistId: "UCE_M8A5yxnLfW0KghEeajjw",
  artistName: "Rick Astley",
  albumId: "",
  albumName: "",
  audioUrl: "",
  downloadUrl: "",
  image: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
  imageSmall: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
  licenseName: "YouTube",
  genre: null,
  bpm: null,
  speed: null,
  vocalInstrumental: null,
  tags: [],
  popularityWeek: 0,
  popularityTotal: 0,
  listensTotal: 0,
  downloadsTotal: 0,
  releaseDate: null,
  audioDownloadAllowed: false,
  subgenre: null,
  source: "youtube",
  videoId: "dQw4w9WgXcQ",
  videoThumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
};

const params = (action: string) => Promise.resolve({ action });

describe("GET /api/youtube/:action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the daily search-quota status", async () => {
    mocks.getYouTubeQuota.mockResolvedValue({
      unitsUsed: 1200,
      searches: 12,
      searchesRemaining: 88,
      budget: 100,
      redis: {
        configured: true,
        healthy: true,
        dbSize: 4321,
        ops: 55,
        readBytes: 12345,
        writeBytes: 678,
        hits: 40,
        misses: 15,
        today: null,
      },
    });
    const res = await GET(new Request("http://localhost/api/youtube/quota"), { params: params("quota") });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.quota).toMatchObject({ unitsUsed: 1200, searchesRemaining: 88, budget: 100 });
    expect(body.quota.redis).toMatchObject({ configured: true, dbSize: 4321, readBytes: 12345, hits: 40 });
  });

  it("returns cached genre-gap fill tracks for a subgenre", async () => {
    mocks.fetchYouTubeFill.mockResolvedValue([track]);
    const res = await GET(new Request("http://localhost/api/youtube/fill?subgenre=brazilian&limit=5"), {
      params: params("fill"),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(1);
    expect(body.subgenre).toBe("brazilian");
    expect(mocks.fetchYouTubeFill).toHaveBeenCalledWith("brazilian", 5);
    expect(body.tracks[0].videoId).toBe("dQw4w9WgXcQ");
  });

  it("requires a subgenre for fill", async () => {
    const res = await GET(new Request("http://localhost/api/youtube/fill"), { params: params("fill") });
    expect(res.status).toBe(400);
    expect(mocks.fetchYouTubeFill).not.toHaveBeenCalled();
  });

  it("clamps fill limit to the allowed range", async () => {
    mocks.fetchYouTubeFill.mockResolvedValue([]);
    await GET(new Request("http://localhost/api/youtube/fill?subgenre=drift&limit=9999"), { params: params("fill") });
    expect(mocks.fetchYouTubeFill).toHaveBeenCalledWith("drift", 50);
  });

  it("resolves a song to a YouTube track", async () => {
    mocks.resolveYouTubeForTrack.mockResolvedValue(track);
    const res = await GET(new Request("http://localhost/api/youtube/resolve?name=Never%20Gonna&artist=Rick"), {
      params: params("resolve"),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resolved).toBe(true);
    expect(mocks.resolveYouTubeForTrack).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Never Gonna", artistName: "Rick", source: "jamendo" }),
      undefined,
    );
  });

  it("requires a name for resolve", async () => {
    const res = await GET(new Request("http://localhost/api/youtube/resolve?artist=Rick"), { params: params("resolve") });
    expect(res.status).toBe(400);
    expect(mocks.resolveYouTubeForTrack).not.toHaveBeenCalled();
  });

  it("returns 404 json for unknown actions", async () => {
    const res = await GET(new Request("http://localhost/api/youtube/nope"), { params: params("nope") });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Unknown endpoint");
  });
});
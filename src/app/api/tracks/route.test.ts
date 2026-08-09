import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchTracks: vi.fn(),
  searchTracks: vi.fn(),
}));

vi.mock("@/lib/catalog", () => mocks);

import { GET } from "@/app/api/tracks/route";

const track = {
  id: "1",
  name: "Midnight Drift",
  duration: 178,
  artistId: "9",
  artistName: "Night Shift",
  albumId: "7",
  albumName: "Street Signals",
  audioUrl: "https://cdn.example/a.mp3",
  downloadUrl: "",
  image: null,
  imageSmall: null,
  licenseName: "CC BY",
  genre: "phonk",
  bpm: 112,
  speed: "medium",
  vocalInstrumental: "instrumental",
  tags: ["phonk"],
  popularityWeek: 1,
  popularityTotal: 1,
  listensTotal: 1,
  downloadsTotal: 1,
  releaseDate: null,
  audioDownloadAllowed: false,
};

describe("GET /api/tracks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns tracks for a plain browse request", async () => {
    mocks.fetchTracks.mockResolvedValue([track]);
    const res = await GET(new Request("http://localhost/api/tracks?limit=10"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tracks).toHaveLength(1);
    expect(body.tracks[0].name).toBe("Midnight Drift");
  });

  it("routes search queries to searchTracks", async () => {
    mocks.searchTracks.mockResolvedValue([track]);
    const res = await GET(new Request("http://localhost/api/tracks?search=drift&limit=5"));
    expect(res.status).toBe(200);
    expect(mocks.searchTracks).toHaveBeenCalledWith("drift", 5, undefined);
  });

  it("passes a subgenre to searchTracks", async () => {
    mocks.searchTracks.mockResolvedValue([track]);
    await GET(new Request("http://localhost/api/tracks?search=drift&subgenre=drift&limit=5"));
    expect(mocks.searchTracks).toHaveBeenCalledWith("drift", 5, "drift");
  });

  it("passes a subgenre to fetchTracks for browse requests", async () => {
    mocks.fetchTracks.mockResolvedValue([track]);
    await GET(new Request("http://localhost/api/tracks?subgenre=rare-phonk&limit=5"));
    expect(mocks.fetchTracks).toHaveBeenCalledWith(
      expect.objectContaining({ subgenre: "rare-phonk" }),
    );
  });

  it("returns a generic, safe message instead of a raw upstream error", async () => {
    mocks.fetchTracks.mockRejectedValue(
      new Error("Jamendo Api Suspended Application Error: set a valid JAMENDO_CLIENT_ID"),
    );
    const res = await GET(new Request("http://localhost/api/tracks"));
    const body = await res.json();
    expect(body.tracks).toEqual([]);
    expect(body.error).toBe("Catalog is refreshing — check back shortly.");
    expect(JSON.stringify(body)).not.toMatch(/JAMENDO|client_id|Suspended/i);
  });

  it("clamps limit to the allowed range", async () => {
    mocks.fetchTracks.mockResolvedValue([]);
    await GET(new Request("http://localhost/api/tracks?limit=9999"));
    expect(mocks.fetchTracks).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 60 }),
    );
  });
});

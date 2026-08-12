import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  extractStreamUrl: vi.fn(),
  invalidateStreamCache: vi.fn(),
  checkRateLimit: vi.fn(async () => true),
  ipKey: vi.fn(() => "test-ip"),
  fetch: vi.fn(),
}));

vi.mock("@/lib/youtube-stream", () => ({
  extractStreamUrl: mocks.extractStreamUrl,
  invalidateStreamCache: mocks.invalidateStreamCache,
}));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocks.checkRateLimit, ipKey: mocks.ipKey }));

import { GET } from "@/app/api/youtube/stream/route";

const VALID = "dQw4w9WgXcQ";
const EXTRACT_FAIL = "BBBBBBBBBBB";

const request = (videoId: string, init?: RequestInit) =>
  new Request(`http://localhost/api/youtube/stream?videoId=${videoId}`, init);

describe("GET /api/youtube/stream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkRateLimit.mockResolvedValue(true);
    vi.stubGlobal("fetch", mocks.fetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects malformed video ids", async () => {
    const res = await GET(request("abc"));
    expect(res.status).toBe(400);
    expect(mocks.extractStreamUrl).not.toHaveBeenCalled();
  });

  it("rejects requests over the rate limit", async () => {
    mocks.checkRateLimit.mockResolvedValue(false);
    const res = await GET(request(VALID));
    expect(res.status).toBe(429);
    expect(mocks.extractStreamUrl).not.toHaveBeenCalled();
  });

  it("returns 502 when the stream cannot be extracted", async () => {
    mocks.extractStreamUrl.mockRejectedValue(new Error("bot check"));
    const res = await GET(request(EXTRACT_FAIL));
    expect(res.status).toBe(502);
  });

  it("streams the extracted audio back to the client", async () => {
    mocks.extractStreamUrl.mockResolvedValue({ url: "https://rr.googlevideo.com/videoplayback?x=1" });
    mocks.fetch.mockResolvedValue(
      new Response("audio-bytes", {
        status: 200,
        headers: { "content-type": "audio/mp4", "content-length": "11" },
      }),
    );

    const res = await GET(request(VALID));

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("audio/mp4");
    expect(res.headers.get("accept-ranges")).toBe("bytes");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(await res.text()).toBe("audio-bytes");
    expect(mocks.extractStreamUrl).toHaveBeenCalledWith(VALID);
    expect(mocks.fetch).toHaveBeenCalledWith(
      "https://rr.googlevideo.com/videoplayback?x=1",
      expect.objectContaining({ method: "GET", redirect: "follow" }),
    );
  });

  it("forwards Range requests upstream and serves 206", async () => {
    mocks.extractStreamUrl.mockResolvedValue({ url: "https://rr.googlevideo.com/videoplayback?x=1" });
    mocks.fetch.mockResolvedValue(
      new Response("audio", {
        status: 206,
        headers: {
          "content-type": "audio/mp4",
          "content-range": "bytes 0-4/309288",
          "content-length": "5",
        },
      }),
    );

    const res = await GET(request(VALID, { headers: { Range: "bytes=0-4" } }));

    expect(res.status).toBe(206);
    expect(res.headers.get("content-range")).toBe("bytes 0-4/309288");
    expect(res.headers.get("content-length")).toBe("5");
    expect(await res.text()).toBe("audio");
    expect(mocks.fetch).toHaveBeenCalledWith(
      "https://rr.googlevideo.com/videoplayback?x=1",
      expect.objectContaining({ headers: expect.objectContaining({ range: "bytes=0-4" }) }),
    );
  });

  it("returns 502 when the upstream fails", async () => {
    mocks.extractStreamUrl.mockResolvedValue({ url: "https://rr.googlevideo.com/videoplayback?x=1" });
    mocks.fetch.mockResolvedValue(new Response("upstream error", { status: 403 }));

    const res = await GET(request(VALID));
    expect(res.status).toBe(502);
    expect(mocks.invalidateStreamCache).toHaveBeenCalledWith(VALID);
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
  });

  it("re-extracts and recovers when the cached stream URL went stale", async () => {
    mocks.extractStreamUrl
      .mockResolvedValueOnce({ url: "https://rr.googlevideo.com/old?x=1" })
      .mockResolvedValueOnce({ url: "https://rr.googlevideo.com/fresh?x=1" });
    mocks.fetch
      .mockResolvedValueOnce(new Response("stale", { status: 403 }))
      .mockResolvedValueOnce(
        new Response("audio-bytes", {
          status: 200,
          headers: { "content-type": "audio/mp4", "content-length": "11" },
        }),
      );

    const res = await GET(request(VALID));

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("audio-bytes");
    expect(mocks.invalidateStreamCache).toHaveBeenCalledWith(VALID);
    expect(mocks.extractStreamUrl).toHaveBeenCalledTimes(2);
    expect(mocks.fetch).toHaveBeenNthCalledWith(1, "https://rr.googlevideo.com/old?x=1", expect.anything());
    expect(mocks.fetch).toHaveBeenNthCalledWith(2, "https://rr.googlevideo.com/fresh?x=1", expect.anything());
  });
});

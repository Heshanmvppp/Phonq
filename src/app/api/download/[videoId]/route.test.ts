import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findSongByVideoId: vi.fn(),
  downloadYouTubeAudio: vi.fn(),
  checkRateLimit: vi.fn(async () => true),
  ipKey: vi.fn(() => "test-ip"),
}));

vi.mock("@/lib/youtube-db", () => ({ findSongByVideoId: mocks.findSongByVideoId }));
vi.mock("@/lib/ytdlp", () => ({ downloadYouTubeAudio: mocks.downloadYouTubeAudio }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocks.checkRateLimit, ipKey: mocks.ipKey }));

import { GET } from "@/app/api/download/[videoId]/route";

const VIDEO_ID = "dQw4w9WgXcQ";
const params = (videoId: string) => Promise.resolve({ videoId });

async function makeFakeAudio(bytes = "audio-bytes") {
  const dir = await mkdtemp(join(tmpdir(), "phonq-test-"));
  const path = join(dir, "audio.m4a");
  await writeFile(path, Buffer.from(bytes));
  mocks.downloadYouTubeAudio.mockResolvedValue({
    path,
    cleanup: () => rm(dir, { recursive: true, force: true }),
  });
}

describe("GET /api/download/:videoId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkRateLimit.mockResolvedValue(true);
  });

  it("rejects malformed video ids", async () => {
    const res = await GET(new Request("http://localhost/api/download/abc"), { params: params("abc") });
    expect(res.status).toBe(400);
    expect(mocks.findSongByVideoId).not.toHaveBeenCalled();
  });

  it("rejects downloads over the rate limit", async () => {
    mocks.checkRateLimit.mockResolvedValue(false);
    const res = await GET(new Request(`http://localhost/api/download/${VIDEO_ID}`), { params: params(VIDEO_ID) });
    expect(res.status).toBe(429);
    expect(mocks.findSongByVideoId).not.toHaveBeenCalled();
  });

  it("returns 404 for videos outside the catalog", async () => {
    mocks.findSongByVideoId.mockResolvedValue(null);
    const res = await GET(new Request(`http://localhost/api/download/${VIDEO_ID}`), { params: params(VIDEO_ID) });
    expect(res.status).toBe(404);
    expect(mocks.downloadYouTubeAudio).not.toHaveBeenCalled();
  });

  it("streams the extracted audio as an attachment", async () => {
    mocks.findSongByVideoId.mockResolvedValue({ videoId: VIDEO_ID, title: "Never Gonna Give You Up" });
    await makeFakeAudio();

    const res = await GET(new Request(`http://localhost/api/download/${VIDEO_ID}?title=Never%20Gonna%20Give%20You%20Up`), {
      params: params(VIDEO_ID),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("audio/mp4");
    expect(res.headers.get("content-length")).toBe(String(Buffer.byteLength("audio-bytes")));
    expect(res.headers.get("content-disposition")).toBe(
      `attachment; filename="Never Gonna Give You Up.m4a"; filename*=UTF-8''Never%20Gonna%20Give%20You%20Up.m4a`,
    );
    expect(mocks.downloadYouTubeAudio).toHaveBeenCalledWith(VIDEO_ID);

    const reader = res.body!.getReader();
    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(Buffer.from(value!).toString()).toBe("audio-bytes");
    expect((await reader.read()).done).toBe(true);
  });

  it("returns 502 when extraction fails", async () => {
    mocks.findSongByVideoId.mockResolvedValue({ videoId: VIDEO_ID, title: "Nope" });
    mocks.downloadYouTubeAudio.mockRejectedValue(new Error("yt-dlp exited 1"));

    const res = await GET(new Request(`http://localhost/api/download/${VIDEO_ID}`), { params: params(VIDEO_ID) });
    expect(res.status).toBe(502);
  });

  it("returns 502 when the extracted file is missing", async () => {
    mocks.findSongByVideoId.mockResolvedValue({ videoId: VIDEO_ID, title: "Nope" });
    mocks.downloadYouTubeAudio.mockResolvedValue({
      path: "/nonexistent/audio.m4a",
      cleanup: async () => {},
    });

    const res = await GET(new Request(`http://localhost/api/download/${VIDEO_ID}`), { params: params(VIDEO_ID) });
    expect(res.status).toBe(502);
  });
});

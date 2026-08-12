import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  upsertSong: vi.fn(async () => {}),
  touchLastPlayed: vi.fn(async () => {}),
  listenFindFirst: vi.fn(),
  listenUpdate: vi.fn(),
  listenCreate: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/youtube-db", () => ({
  upsertSong: mocks.upsertSong,
  touchLastPlayed: mocks.touchLastPlayed,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    listen: {
      findFirst: mocks.listenFindFirst,
      update: mocks.listenUpdate,
      create: mocks.listenCreate,
    },
  },
}));

import { POST } from "@/app/api/me/history/route";

const USER_ID = "user-1";
const params = (body: unknown) =>
  new Request("http://localhost/api/me/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /api/me/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: USER_ID } });
    mocks.listenFindFirst.mockResolvedValue(null);
  });

  it("requires authentication", async () => {
    mocks.auth.mockResolvedValue(null);
    const res = await POST(params({ trackId: "123" }));
    expect(res.status).toBe(401);
    expect(mocks.listenCreate).not.toHaveBeenCalled();
  });

  it("rejects a missing trackId", async () => {
    const res = await POST(params({}));
    expect(res.status).toBe(400);
    expect(mocks.listenCreate).not.toHaveBeenCalled();
  });

  it("creates a listen for a Jamendo track without touching the catalog", async () => {
    mocks.listenFindFirst.mockResolvedValue(null);
    const res = await POST(params({ trackId: "12345" }));

    expect(res.status).toBe(200);
    expect(mocks.listenCreate).toHaveBeenCalledWith({
      data: { userId: USER_ID, trackId: "12345", progress: 0, completed: false },
    });
    expect(mocks.upsertSong).not.toHaveBeenCalled();
    expect(mocks.touchLastPlayed).not.toHaveBeenCalled();
  });

  it("upserts the YouTube video into the songs catalog on playback", async () => {
    const res = await POST(
      params({
        trackId: "yt:dQw4w9WgXcQ",
        youtube: {
          videoId: "dQw4w9WgXcQ",
          title: "Never Gonna Give You Up",
          artist: "Rick Astley",
          durationSec: 212,
          channelId: null,
          channelTitle: "Rick Astley",
        },
      }),
    );

    expect(res.status).toBe(200);
    expect(mocks.listenCreate).toHaveBeenCalledWith({
      data: { userId: USER_ID, trackId: "yt:dQw4w9WgXcQ", progress: 0, completed: false },
    });
    expect(mocks.upsertSong).toHaveBeenCalledWith(
      expect.objectContaining({
        videoId: "dQw4w9WgXcQ",
        title: "Never Gonna Give You Up",
        artist: "Rick Astley",
        qualityScore: 30,
        lastPlayedAt: expect.any(Date),
      }),
    );
    expect(mocks.touchLastPlayed).toHaveBeenCalledWith("dQw4w9WgXcQ");
  });

  it("updates an existing listen instead of creating a duplicate", async () => {
    mocks.listenFindFirst.mockResolvedValue({ id: "listen-1", progress: 0.5, completed: false });

    const res = await POST(params({ trackId: "12345", progress: 0.8, completed: true }));
    expect(res.status).toBe(200);
    expect(mocks.listenUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "listen-1" } }),
    );
    expect(mocks.listenCreate).not.toHaveBeenCalled();
  });
});

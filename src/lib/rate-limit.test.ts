import { afterEach, describe, expect, it, vi } from "vitest";

import { checkRateLimit, ipKey } from "@/lib/rate-limit";

afterEach(() => {
  vi.useRealTimers();
});

describe("checkRateLimit", () => {
  it("allows requests within the limit", async () => {
    const key = `test-${Math.random()}`;
    expect(await checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(await checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(await checkRateLimit(key, 3, 60_000)).toBe(true);
  });

  it("blocks requests beyond the limit", async () => {
    const key = `test-${Math.random()}`;
    expect(await checkRateLimit(key, 2, 60_000)).toBe(true);
    expect(await checkRateLimit(key, 2, 60_000)).toBe(true);
    expect(await checkRateLimit(key, 2, 60_000)).toBe(false);
  });

  it("resets after the window elapses", async () => {
    vi.useFakeTimers();
    const key = `test-${Math.random()}`;
    expect(await checkRateLimit(key, 1, 60_000)).toBe(true);
    expect(await checkRateLimit(key, 1, 60_000)).toBe(false);
    // A new fixed-window bucket opens once the window boundary passes.
    vi.advanceTimersByTime(60_001);
    expect(await checkRateLimit(key, 1, 60_000)).toBe(true);
  });
});

describe("ipKey", () => {
  it("prefers x-real-ip", () => {
    const request = new Request("http://localhost/api", {
      headers: { "x-real-ip": "203.0.113.7", "x-forwarded-for": "198.51.100.1" },
    });
    expect(ipKey(request)).toBe("203.0.113.7");
  });

  it("falls back to the first x-forwarded-for entry", () => {
    const request = new Request("http://localhost/api", {
      headers: { "x-forwarded-for": "198.51.100.1, 203.0.113.9" },
    });
    expect(ipKey(request)).toBe("198.51.100.1");
  });

  it("defaults to unknown when no headers are present", () => {
    const request = new Request("http://localhost/api");
    expect(ipKey(request)).toBe("unknown");
  });
});

import { describe, expect, it } from "vitest";

import { checkRateLimit, ipKey } from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests within the limit", () => {
    const key = `test-${Math.random()}`;
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
  });

  it("blocks requests beyond the limit", () => {
    const key = `test-${Math.random()}`;
    expect(checkRateLimit(key, 2, 60_000)).toBe(true);
    expect(checkRateLimit(key, 2, 60_000)).toBe(true);
    expect(checkRateLimit(key, 2, 60_000)).toBe(false);
  });

  it("resets after the window elapses", () => {
    const key = `test-${Math.random()}`;
    expect(checkRateLimit(key, 1, 1)).toBe(true);
    expect(checkRateLimit(key, 1, 1)).toBe(false);
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

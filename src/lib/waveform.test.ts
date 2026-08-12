import { describe, expect, it } from "vitest";

import { decorativeWaveform, hashTrackId, mediaErrorName } from "@/lib/waveform";

describe("hashTrackId", () => {
  it("is deterministic for the same id", () => {
    expect(hashTrackId("dQw4w9WgXcQ")).toBe(hashTrackId("dQw4w9WgXcQ"));
  });

  it("differs for different ids", () => {
    expect(hashTrackId("dQw4w9WgXcQ")).not.toBe(hashTrackId("9bZkpYNgRfg"));
  });

  it("handles null/undefined/empty", () => {
    expect(hashTrackId(null)).toBe(hashTrackId(""));
    expect(hashTrackId(undefined)).toBe(hashTrackId(undefined));
  });

  it("always returns a non-negative 32-bit integer", () => {
    for (const id of ["a", "abc", "x".repeat(100), "", null as unknown as string]) {
      const h = hashTrackId(id);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(0xffffffff);
    }
  });
});

describe("decorativeWaveform", () => {
  it("returns the requested number of bars", () => {
    expect(decorativeWaveform("dQw4w9WgXcQ")).toHaveLength(64);
    expect(decorativeWaveform("dQw4w9WgXcQ", 48)).toHaveLength(48);
    expect(decorativeWaveform("dQw4w9WgXcQ", 1)).toHaveLength(1);
  });

  it("produces values within the byte range", () => {
    const values = decorativeWaveform("dQw4w9WgXcQ");
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(255);
    }
  });

  it("is fully deterministic (no time dependency)", () => {
    const a = decorativeWaveform("dQw4w9WgXcQ");
    const b = decorativeWaveform("dQw4w9WgXcQ");
    const c = decorativeWaveform("dQw4w9WgXcQ", 64);
    expect(b).toEqual(a);
    expect(c).toEqual(a);
  });

  it("varies the shape per track id", () => {
    const a = decorativeWaveform("dQw4w9WgXcQ");
    const b = decorativeWaveform("9bZkpYNgRfg");
    const c = decorativeWaveform("kJQP7f_YB5k");
    expect(a).not.toEqual(b);
    expect(a).not.toEqual(c);
    expect(b).not.toEqual(c);
  });

  it("has a non-flat profile (some variation between bars)", () => {
    const values = decorativeWaveform("dQw4w9WgXcQ");
    const max = Math.max(...values);
    const min = Math.min(...values);
    expect(max).toBeGreaterThan(min);
  });
});

describe("mediaErrorName", () => {
  it("maps known codes", () => {
    expect(mediaErrorName(1)).toBe("MEDIA_ERR_ABORTED");
    expect(mediaErrorName(2)).toBe("MEDIA_ERR_NETWORK");
    expect(mediaErrorName(3)).toBe("MEDIA_ERR_DECODE");
    expect(mediaErrorName(4)).toBe("MEDIA_ERR_SRC_NOT_SUPPORTED");
  });

  it("returns UNKNOWN for unknown/null/undefined", () => {
    expect(mediaErrorName(null)).toBe("MEDIA_ERR_UNKNOWN");
    expect(mediaErrorName(undefined)).toBe("MEDIA_ERR_UNKNOWN");
    expect(mediaErrorName(0)).toBe("MEDIA_ERR_UNKNOWN");
    expect(mediaErrorName(99)).toBe("MEDIA_ERR_UNKNOWN");
  });
});

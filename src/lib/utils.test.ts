import { describe, expect, it } from "vitest";

import { formatDuration, formatNumber, truncate, initials } from "@/lib/utils";

describe("formatDuration", () => {
  it("formats minutes and zero-padded seconds", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(3599)).toBe("59:59");
    expect(formatDuration(7200)).toBe("120:00");
  });

  it("handles invalid input gracefully", () => {
    expect(formatDuration(Number.NaN)).toBe("0:00");
    expect(formatDuration(-1)).toBe("0:00");
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe("0:00");
  });
});

describe("formatNumber", () => {
  it("formats thousands, millions and billions", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(1000)).toBe("1K");
    expect(formatNumber(1500)).toBe("1.5K");
    expect(formatNumber(1_000_000)).toBe("1M");
    expect(formatNumber(2_500_000)).toBe("2.5M");
    expect(formatNumber(1_000_000_000)).toBe("1B");
  });

  it("handles null and NaN", () => {
    expect(formatNumber(null)).toBe("0");
    expect(formatNumber(undefined)).toBe("0");
    expect(formatNumber(Number.NaN)).toBe("0");
  });
});

describe("truncate", () => {
  it("truncates long strings with an ellipsis", () => {
    expect(truncate("abcdef", 3)).toBe("ab…");
    expect(truncate("short", 10)).toBe("short");
  });
});

describe("initials", () => {
  it("builds up to two initials", () => {
    expect(initials("Jane Doe")).toBe("JD");
    expect(initials("jay z")).toBe("JZ");
    expect(initials(null)).toBe("P");
  });
});

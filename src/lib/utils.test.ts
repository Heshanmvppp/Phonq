import { describe, expect, it } from "vitest";

import { formatDuration, formatNumber, truncate, initials, reorderArray, reorderWithIndex } from "@/lib/utils";

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

describe("reorderArray", () => {
  it("moves an item forward", () => {
    expect(reorderArray(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
  });

  it("moves an item backward", () => {
    expect(reorderArray(["a", "b", "c", "d"], 3, 0)).toEqual(["d", "a", "b", "c"]);
  });

  it("returns the same reference on a no-op", () => {
    const items = ["a", "b"];
    expect(reorderArray(items, 0, 0)).toBe(items);
  });

  it("returns the same reference when indices are out of range", () => {
    const items = ["a", "b"];
    expect(reorderArray(items, -1, 0)).toBe(items);
    expect(reorderArray(items, 0, 5)).toBe(items);
    const empty = [] as string[];
    expect(reorderArray(empty, 0, 0)).toBe(empty);
  });

  it("does not mutate the original array", () => {
    const items = ["a", "b", "c"];
    reorderArray(items, 0, 2);
    expect(items).toEqual(["a", "b", "c"]);
  });
});

describe("reorderWithIndex", () => {
  it("reports the new current-track index after a move", () => {
    const items = [{ id: "x" }, { id: "y" }, { id: "z" }];
    const { items: next, index } = reorderWithIndex(items, 0, 2, 0);
    expect(next).toEqual([{ id: "y" }, { id: "z" }, { id: "x" }]);
    expect(index).toBe(2);
  });

  it("tracks a different current index through a backward move", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
    const { index } = reorderWithIndex(items, 3, 0, 1); // move last → front; b was idx 1
    expect(index).toBe(2);
  });

  it("handles duplicate ids by reference", () => {
    const dup = { id: "d" };
    const items = [dup, { id: "b" }, dup];
    const { index } = reorderWithIndex(items, 0, 2, 0);
    // move dup (idx 0) → end: [b, dup, dup]; indexOf(dup) === 1 (first hit)
    expect(index).toBe(1);
    expect(items).toHaveLength(3);
  });

  it("returns undefined index on a no-op move", () => {
    const items = ["a", "b"];
    const { index } = reorderWithIndex(items, 0, 0, 0);
    expect(index).toBeUndefined();
  });
});

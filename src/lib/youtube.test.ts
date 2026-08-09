import { describe, expect, it } from "vitest";

import { isoDurationToSeconds, normalizeKey } from "@/lib/youtube";

describe("normalizeKey", () => {
  it("lowercases and strips accents + punctuation", () => {
    expect(normalizeKey("Anitta Envolver")).toBe("anitta envolver");
    expect(normalizeKey("  MC   Kevinho  ")).toBe("mc kevinho");
    expect(normalizeKey("Mc Don Juan — Tudo Ok")).toBe("mc don juan tudo ok");
    expect(normalizeKey("DJ Boy & MC Smith (Ao Vivo)")).toBe("dj boy mc smith ao vivo");
    expect(normalizeKey("Café, 123!")).toBe("cafe 123");
  });

  it("handles empty input", () => {
    expect(normalizeKey("")).toBe("");
    expect(normalizeKey("   ")).toBe("");
  });
});

describe("isoDurationToSeconds", () => {
  it("parses ISO-8601 YouTube durations", () => {
    expect(isoDurationToSeconds("PT3M45S")).toBe(225);
    expect(isoDurationToSeconds("PT1H2M3S")).toBe(3723);
    expect(isoDurationToSeconds("PT1M")).toBe(60);
    expect(isoDurationToSeconds("PT30S")).toBe(30);
    expect(isoDurationToSeconds("PT2H")).toBe(7200);
  });

  it("returns 0 for missing or malformed input", () => {
    expect(isoDurationToSeconds(undefined)).toBe(0);
    expect(isoDurationToSeconds("")).toBe(0);
    expect(isoDurationToSeconds("3:45")).toBe(0);
    expect(isoDurationToSeconds("PT")).toBe(0);
  });
});

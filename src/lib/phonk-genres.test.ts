import { describe, it, expect } from "vitest";

import { classifyTrack, PHONK_SUBGENRES } from "@/lib/phonk-genres";

describe("classifyTrack", () => {
  describe("Brazilian phonk (Portuguese signals)", () => {
    it.each([
      ["Brasil Funk", ["funk"], "brazilian"],
      ["Bossa Brasil", ["funk", "baile"], "brazilian"],
      ["Carioca Funk Heat", ["funk"], "brazilian"],
      ["Brasileiro Bass", ["phonk"], "brazilian"],
      ["Manel é o Favo", ["phonk", "funk"], "brazilian"],
      ["Funk Carioca 2024", ["phonk", "brazilian"], "brazilian"],
    ])('classifies "%s" %j -> %s', (name, tags, want) => {
      expect(classifyTrack({ name, tags })?.slug).toBe(want);
    });

    it("does NOT let generic non-phonk funk through the gate", () => {
      expect(classifyTrack({ name: "Generic Funk", tags: ["funk", "house"] })).toBeNull();
      expect(classifyTrack({ name: "Funk de Verão", tags: ["funk"] })).toBeNull();
      expect(classifyTrack({ name: "Deep House Groove", tags: ["house", "deep"] })).toBeNull();
    });
  });

  describe("gate exclusions (no false positives)", () => {
    it.each([
      ["Smooth Jazz", ["jazz", "smooth"]],
      ["Synthwave Dreams", ["wave", "synthwave"]],
      ["Chill Vibes", ["chill", "ambient"]],
    ])('rejects "%s" %j', (name, tags) => {
      expect(classifyTrack({ name, tags })).toBeNull();
    });
  });

  it("still classifies core subgenres correctly", () => {
    expect(classifyTrack({ name: "Drift", tags: ["phonk", "drift"] })?.slug).toBe("drift");
    expect(classifyTrack({ name: "Cowbell", tags: ["phonk", "cowbell"] })?.slug).toBe("classic-og");
    expect(classifyTrack({ name: "Dark Trap", tags: ["phonk", "dark trap"] })?.slug).toBe("phonk-trap");
  });

  it("every PHONK_SUBGENRE slug is unique and non-empty", () => {
    const slugs = PHONK_SUBGENRES.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every((s) => s.length > 0)).toBe(true);
  });
});

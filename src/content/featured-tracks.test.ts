import { describe, expect, it } from "vitest";

import { FEATURED_TRACKS } from "@/content/featured-tracks";
import { FEATURED_RADIOS } from "@/content/featured-radios";

describe("featured tracks snapshot", () => {
  it("has at least a starter set of curated tracks", () => {
    expect(FEATURED_TRACKS.length).toBeGreaterThan(0);
  });

  it("has unique ids and the required fields on every track", () => {
    const ids = new Set<string>();
    for (const track of FEATURED_TRACKS) {
      expect(ids.has(track.id)).toBe(false);
      ids.add(track.id);
      expect(track.name).toBeTruthy();
      expect(track.artistName).toBeTruthy();
      expect(typeof track.duration).toBe("number");
      expect(Array.isArray(track.tags)).toBe(true);
    }
  });

  it("ships curated fallback radios", () => {
    expect(FEATURED_RADIOS.length).toBeGreaterThan(0);
    for (const radio of FEATURED_RADIOS) {
      expect(radio.id).toBeTruthy();
      expect(radio.displayName).toBeTruthy();
    }
  });
});

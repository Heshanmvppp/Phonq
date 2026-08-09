import { describe, expect, it } from "vitest";

import type { Track } from "@/lib/jamendo";
import { buildAffinity, rankForYou } from "@/lib/recommendations";

function track(overrides: Partial<Track>): Track {
  return {
    id: `t${Math.random().toString(36).slice(2, 7)}`,
    name: "Track",
    duration: 180,
    artistId: "a1",
    artistName: "Artist",
    albumId: "al1",
    albumName: "Album",
    audioUrl: "https://example.com/a.mp3",
    downloadUrl: "https://example.com/d.mp3",
    image: null,
    imageSmall: null,
    licenseName: null,
    genre: null,
    bpm: null,
    speed: null,
    vocalInstrumental: null,
    tags: [],
    popularityWeek: 50,
    popularityTotal: 50,
    listensTotal: 100,
    downloadsTotal: 10,
    releaseDate: null,
    audioDownloadAllowed: true,
    subgenre: "drift",
    ...overrides,
  };
}

describe("buildAffinity", () => {
  it("aggregates subgenres, artists and tags with recency decay", () => {
    const listened = [
      track({ artistName: "Drifterz", tags: ["cowbell", "drift"], subgenre: "drift" }),
      track({ artistName: "Drifterz", tags: ["cowbell"], subgenre: "drift" }),
      track({ artistName: "Memphis God", tags: ["memphis"], subgenre: "classic-og" }),
    ];
    const profile = buildAffinity(listened, []);
    expect(profile.hasHistory).toBe(true);
    expect(profile.topSubgenre).toBe("drift");
    expect(profile.topArtist).toBe("Drifterz");
    expect(profile.topTag).toBe("cowbell");
    expect(profile.subgenres.get("classic-og")).toBeGreaterThan(0);
    expect(profile.subgenres.get("drift")).toBeGreaterThan(profile.subgenres.get("classic-og") ?? 0);
  });

  it("counts favorites toward the profile", () => {
    const profile = buildAffinity([], [track({ artistName: "Fav Artist", tags: ["rare"], subgenre: "rare-phonk" })]);
    expect(profile.topArtist).toBe("Fav Artist");
    expect(profile.topSubgenre).toBe("rare-phonk");
    expect(profile.favoriteIds.size).toBe(1);
  });

  it("reports no history for a fresh profile", () => {
    expect(buildAffinity([], []).hasHistory).toBe(false);
  });
});

describe("rankForYou", () => {
  it("surfaces the candidate matching the user's top artist first", () => {
    const profile = buildAffinity(
      [track({ artistName: "Beloved", tags: ["drift"], subgenre: "drift" })],
      [],
    );
    const candidates = [
      track({ artistName: "Stranger", tags: ["drift"], subgenre: "drift" }),
      track({ artistName: "Beloved", tags: ["drift"], subgenre: "drift" }),
    ];
    const ranked = rankForYou(profile, candidates, 2);
    expect(ranked[0].artistName).toBe("Beloved");
  });

  it("boosts favorites into the row", () => {
    const favorite = track({ name: "Loved One", tags: ["phonk"] });
    const profile = buildAffinity([], [favorite]);
    const candidates = [favorite, track({ name: "Mystery", tags: ["phonk"] })];
    const ranked = rankForYou(profile, candidates, 2);
    expect(ranked[0].id).toBe(favorite.id);
  });

  it("diversifies so one subgenre does not dominate", () => {
    const profile = buildAffinity(
      Array.from({ length: 10 }, () => track({ artistName: "Same", tags: ["cowbell"], subgenre: "drift" })),
      [],
    );
    const candidates = [
      ...Array.from({ length: 20 }, () => track({ artistName: "A", tags: ["cowbell"], subgenre: "drift" })),
      ...Array.from({ length: 20 }, () => track({ artistName: "B", tags: ["memphis"], subgenre: "classic-og" })),
      ...Array.from({ length: 20 }, () => track({ artistName: "C", tags: ["house"], subgenre: "drift-house" })),
    ];
    const ranked = rankForYou(profile, candidates, 12);
    const driftCount = ranked.filter((t) => t.subgenre === "drift").length;
    expect(driftCount).toBeLessThanOrEqual(6);
    const subgenres = new Set(ranked.map((t) => t.subgenre));
    expect(subgenres.size).toBe(3);
    expect(ranked).toHaveLength(12);
  });

  it("falls back to popularity for a fresh profile", () => {
    const profile = buildAffinity([], []);
    const candidates = [
      track({ name: "Cold", popularityWeek: 1 }),
      track({ name: "Hot", popularityWeek: 99 }),
    ];
    const ranked = rankForYou(profile, candidates, 2);
    expect(ranked[0].name).toBe("Hot");
  });

  it("dedupes candidates by id", () => {
    const dup = track({ name: "Dup" });
    const ranked = rankForYou(buildAffinity([], []), [dup, dup, { ...dup }], 10);
    expect(ranked.filter((t) => t.id === dup.id)).toHaveLength(1);
  });
});

import { describe, expect, it } from "vitest";

import { genreGroups, genres } from "@/content/genres";

describe("genres content", () => {
  it("ships every phonk subgenre from the guide", () => {
    expect(genres.length).toBeGreaterThan(0);
  });

  it("has unique names and required fields on every genre", () => {
    const names = new Set<string>();
    for (const genre of genres) {
      expect(names.has(genre.name)).toBe(false);
      names.add(genre.name);
      expect(genre.description).toBeTruthy();
      expect(genre.icon).toBeTruthy();
      expect(genreGroups).toContain(genre.group);
    }
  });

  it("maps every group to at least one genre", () => {
    for (const group of genreGroups) {
      expect(genres.some((genre) => genre.group === group)).toBe(true);
    }
  });
});

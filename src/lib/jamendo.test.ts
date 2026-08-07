import { describe, expect, it } from "vitest";

import { normalizeTrack, type JamendoTrack } from "@/lib/jamendo";

const base: JamendoTrack = {
  id: 1234,
  name: "Midnight Drift",
  duration: 178.2,
  artist_id: 99,
  artist_name: "Night Shift",
  album_id: 77,
  album_name: "Street Signals",
  audio: "https://cdns.example/midnight.mp3",
  audiodownload: "https://cdns.example/midnight-download.mp3",
  image: "https://images.example/cover.jpg",
  image_small: "https://images.example/cover-small.jpg",
  license_name: "CC BY-NC",
  tags: "phonk drift night",
  musicinfo: { bpm: 112, genre: "phonk", speed: "medium", vocalinstrumental: "instrumental" },
  stats: {
    popularity_week: 4200,
    popularity_total: 86000,
    listens_total: 340000,
    downloads_total: 41000,
  },
  releasedate: "2023-09-14",
  audiodownload_allowed: true,
};

describe("normalizeTrack", () => {
  it("maps all fields into the internal Track shape", () => {
    const track = normalizeTrack(base);
    expect(track.id).toBe("1234");
    expect(track.name).toBe("Midnight Drift");
    expect(track.duration).toBe(178);
    expect(track.artistId).toBe("99");
    expect(track.artistName).toBe("Night Shift");
    expect(track.albumName).toBe("Street Signals");
    expect(track.audioUrl).toBe("https://cdns.example/midnight.mp3");
    expect(track.licenseName).toBe("CC BY-NC");
    expect(track.genre).toBe("phonk");
    expect(track.bpm).toBe(112);
    expect(track.tags).toEqual(["phonk", "drift", "night"]);
    expect(track.popularityWeek).toBe(4200);
    expect(track.listensTotal).toBe(340000);
    expect(track.audioDownloadAllowed).toBe(true);
  });

  it("falls back for missing optional fields", () => {
    const track = normalizeTrack({
      id: 1,
      name: "",
      duration: undefined as unknown as number,
      artist_id: undefined as unknown as number,
      artist_name: "",
      album_id: undefined as unknown as number,
      album_name: "",
      audio: "",
      audiodownload: "",
      image: "",
      image_small: "",
    });
    expect(track.name).toBe("Untitled");
    expect(track.artistName).toBe("Unknown Artist");
    expect(track.albumName).toBe("Unknown Album");
    expect(track.bpm).toBeNull();
    expect(track.tags).toEqual([]);
    expect(track.duration).toBe(0);
    expect(track.audioDownloadAllowed).toBe(false);
  });
});

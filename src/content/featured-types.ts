/**
 * Shared types for the static fallback catalog.
 * Kept separate from the snapshot data so the sync script can overwrite
 * `featured-tracks.ts` without touching these.
 */

export interface FeaturedTrack {
  id: string;
  name: string;
  duration: number;
  artistId: string;
  artistName: string;
  albumId: string;
  albumName: string;
  audioUrl: string;
  downloadUrl: string;
  image: string | null;
  imageSmall: string | null;
  licenseName: string | null;
  genre: string | null;
  bpm: number | null;
  speed: string | null;
  vocalInstrumental: string | null;
  tags: string[];
  popularityWeek: number;
  popularityTotal: number;
  listensTotal: number;
  downloadsTotal: number;
  releaseDate: string | null;
  audioDownloadAllowed: boolean;
}

export interface FeaturedRadio {
  id: string;
  name: string;
  displayName: string;
  image: string;
}

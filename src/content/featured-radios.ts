import type { FeaturedRadio } from "@/content/featured-types";

/**
 * Curated fallback radios, used only when the live Jamendo radios endpoint is
 * unreachable. Kept separate from the track snapshot so `sync:featured` can
 * overwrite tracks without clobbering these.
 */
export const FEATURED_RADIOS: FeaturedRadio[] = [
  { id: "feat-radio-drift", name: "driftphonk", displayName: "Drift Phonk", image: "" },
  { id: "feat-radio-house", name: "phonkhouse", displayName: "Phonk House", image: "" },
  { id: "feat-radio-cowbell", name: "memphis", displayName: "Memphis", image: "" },
  { id: "feat-radio-dark", name: "darkphonk", displayName: "Dark Phonk", image: "" },
  { id: "feat-radio-chill", name: "chillphonk", displayName: "Chill Phonk", image: "" },
  { id: "feat-radio-brazilian", name: "brazilianphonk", displayName: "Brazilian Funk", image: "" },
];

import type { LucideIcon } from "lucide-react";
import { genreGroups, genres } from "@/content/genres";
import type { GenreGroup } from "@/content/genres";

/**
 * Operational phonk subgenre taxonomy.
 *
 * Phonq curates its catalog to the major phonk subgenres / microgenres and
 * nothing else. Every track that surfaces in feeds, search and the genre
 * pages is classified into exactly one subgenre (or rejected as non-phonk)
 * by `classifyTrack`. The taxonomy here drives three things:
 *
 *   1. The live Jamendo queries (`jamendoTags` → `fuzzytags`).
 *   2. The Postgres cache filter (`keywords` → `tags` contains).
 *   3. The static snapshot filter + client-side subgenre labels.
 *
 * The display content (name, aka, description, group, icon) is pulled from
 * `@/content/genres` so the marketing guide and the app stay in sync.
 */

export interface PhonkSubgenre {
  /** URL slug, also used as the stable identifier. */
  slug: string;
  name: string;
  aka?: string;
  description: string;
  group: GenreGroup;
  icon: LucideIcon;
  /** Distinctive signals used to classify a track into this subgenre. */
  keywords: string[];
  /** Short tag list used for the live Jamendo `fuzzytags` query. */
  jamendoTags: string[];
  /** Typical tempo range in BPM — used only as a tiebreaker. */
  bpmRange?: [number, number];
}

const contentByName = new Map(genres.map((genre) => [genre.name, genre]));

function define(
  name: string,
  slug: string,
  opts: {
    keywords: string[];
    jamendoTags: string[];
    bpmRange?: [number, number];
  },
): PhonkSubgenre {
  const content = contentByName.get(name);
  if (!content) {
    throw new Error(`phonk-genres: no content entry for "${name}"`);
  }
  return {
    slug,
    name: content.name,
    aka: content.aka,
    description: content.description,
    group: content.group,
    icon: content.icon,
    keywords: opts.keywords,
    jamendoTags: opts.jamendoTags,
    bpmRange: opts.bpmRange,
  };
}

export const PHONK_SUBGENRES: PhonkSubgenre[] = [
  define("Classic / OG Phonk", "classic-og", {
    keywords: ["memphis", "cowbell", "chopped", "screwed", "triple six", "horrorcore", "og phonk", "classic phonk"],
    jamendoTags: ["phonk", "memphis", "cowbell"],
    bpmRange: [60, 110],
  }),
  define("Rare Phonk", "rare-phonk", {
    keywords: ["rare phonk", "rare groove", "groove", "soul", "70s", "80s", "jazz", "clean phonk"],
    jamendoTags: ["phonk", "funk", "soul"],
    bpmRange: [70, 100],
  }),
  define("Dirt Phonk / Vapor Phonk", "dirt-vapor", {
    keywords: ["dirt phonk", "vapor phonk", "dirt", "vaporwave", "lofi", "lo-fi", "tape", "static", "distorted", "murky", "degraded"],
    jamendoTags: ["phonk", "lofi", "vaporwave", "dark"],
    bpmRange: [60, 100],
  }),
  define("Drift Phonk", "drift", {
    keywords: ["drift", "drifting", "jdm", "cowbell", "killa", "murda", "bounce", "race", "slav", "russian", "night drive", "phonk bass"],
    jamendoTags: ["phonk", "drift", "bass", "cowbell", "bounce"],
    bpmRange: [120, 165],
  }),
  define("Drift House / House Phonk", "drift-house", {
    keywords: ["phonk house", "house phonk", "drift house", "4x4", "four on the floor", "club phonk"],
    jamendoTags: ["phonk", "house", "dance", "electronic"],
    bpmRange: [120, 135],
  }),
  define("Brazilian Phonk / Funk Phonk", "brazilian", {
    keywords: [
      "brazilian",
      "brazil",
      "brazil phonk",
      "br phonk",
      "baile",
      "baile funk",
      "mandelao",
      "tamborzão",
      "tamborzao",
      "funk carioca",
      "favela",
      "funk phonk",
      "phonk brasileiro",
      "funk",
    ],
    jamendoTags: ["phonk", "brazilian", "brazil", "funk", "baile"],
    bpmRange: [125, 165],
  }),
  define("Hard Phonk / Aggressive Phonk", "hard", {
    keywords: ["hard phonk", "aggressive phonk", "hardstyle", "industrial", "hardcore", "hard trap", "raw phonk"],
    jamendoTags: ["phonk", "hardstyle", "industrial", "aggressive"],
    bpmRange: [150, 200],
  }),
  define("Metal Phonk", "metal", {
    keywords: ["metal phonk", "metal", "guitar", "breakdown", "screaming", "screamo", "rock phonk"],
    jamendoTags: ["phonk", "metal", "rock", "guitar"],
    bpmRange: [90, 175],
  }),
  define("Wave Phonk / Phonkwave", "wave", {
    keywords: ["wave phonk", "phonkwave", "wave", "synthwave", "atmospheric pads", "ethereal"],
    jamendoTags: ["phonk", "wave", "synthwave", "atmospheric"],
    bpmRange: [70, 110],
  }),
  define("Ambient Phonk / Chill Phonk", "ambient-chill", {
    keywords: ["chill phonk", "ambient phonk", "chill", "ambient", "lofi", "lo-fi", "calm", "relax", "sleep", "dreamy", "spacey", "slow"],
    jamendoTags: ["phonk", "chill", "ambient", "lofi"],
    bpmRange: [60, 95],
  }),
  define("Cloud Phonk / Plugg Phonk", "cloud", {
    keywords: ["cloud phonk", "cloud rap", "plugg", "plugg phonk", "dreamy", "floating", "spacey"],
    jamendoTags: ["phonk", "cloud", "plugg", "rap"],
    bpmRange: [60, 115],
  }),
  define("Hyperphonk", "hyperphonk", {
    keywords: ["hyperphonk", "hyperpop", "hyper", "colorful", "chaotic", "pitch", "nightcore"],
    jamendoTags: ["phonk", "hyperpop", "hyper"],
    bpmRange: [140, 200],
  }),
  define("G-Phonk", "g-phonk", {
    keywords: ["g-phonk", "g-funk", "gfonk", "west coast", "westcoast", "california", "wack"],
    jamendoTags: ["phonk", "g-funk", "westcoast", "funk"],
    bpmRange: [80, 110],
  }),
  define("Street Phonk", "street", {
    keywords: ["street phonk", "street", "memphis", "raw", "atmospheric", "dark", "slow"],
    jamendoTags: ["phonk", "street", "memphis", "dark"],
    bpmRange: [65, 105],
  }),
  define("Jungle Phonk / DnB Phonk", "jungle-dnb", {
    keywords: ["jungle phonk", "jungle", "drum and bass", "drum & bass", "dnb", "breakbeat", "breakcore"],
    jamendoTags: ["phonk", "jungle", "dnb", "breakbeat"],
    bpmRange: [160, 185],
  }),
  define("Phonk Trap / Dark Trap", "phonk-trap", {
    keywords: ["phonk trap", "dark trap", "trap", "808", "drill", "sub-bass", "suicideboys", "memphis trap"],
    jamendoTags: ["phonk", "trap", "drill", "dark", "bass"],
    bpmRange: [110, 165],
  }),
];

export const PHONK_GROUPS: GenreGroup[] = genreGroups;

const subgenreBySlug = new Map(PHONK_SUBGENRES.map((subgenre) => [subgenre.slug, subgenre]));

export function getSubgenre(slug: string): PhonkSubgenre | undefined {
  return subgenreBySlug.get(slug);
}

/**
 * Tags used to broaden the live Jamendo `fuzzytags` query beyond the literal
 * "phonk" tag so subgenre tracks that Jamendo tags differently (drift, trap,
 * bass, drill …) still surface. `fuzzytags` matches any of the given tags.
 */
export const PHONK_FAMILY_QUERY_TAGS: string[] = [
  "phonk",
  "drift",
  "trap",
  "bass",
  "drill",
  "dark",
  "urban",
  "memphis",
  "cowbell",
  "brazilian",
  "brazil",
  "baile",
  "funk",
  "wave",
  "hyperpop",
  "jungle",
  "dnb",
  "metal",
];

/**
 * Phonk-family signals. A track must match one of these (in its name, genre or
 * tags) before it can be classified into a subgenre at all — this is what
 * stops the platform from surfacing generic house / synthwave / lofi / metal /
 * ambient tracks that merely share a tag with a phonk subgenre but aren't
 * actually phonk. The terms are deliberately phonk-distinctive: bare "trap",
 * "jungle" and "dnb" qualify (they are phonk subgenres — "Phonk Trap / Dark
 * Trap", "Jungle Phonk / DnB Phonk"), while bare "house", "wave", "funk",
 * "dark", "chill", "metal", "soul" or "jazz" do not.
 */
const PHONK_GATE_TERMS: string[] = [
  "phonk",
  "phonkwave",
  "memphis",
  "cowbell",
  "drift",
  "bounce",
  "drill",
  "trap",
  "dark trap",
  "trap phonk",
  "vapor phonk",
  "dirt phonk",
  "vaporwave",
  "hyperphonk",
  "hyperpop",
  "brazilian",
  "brazil phonk",
  "br phonk",
  "phonk br",
  "baile",
  "baile funk",
  "funk carioca",
  "tamborzão",
  "tamborzao",
  "phonk brasileiro",
  "brazilian funk",
  "mandelao",
  "funk phonk",
  "phonk trap",
  "g-phonk",
  "g fonk",
  "g-funk",
  "gfonk",
  "house phonk",
  "phonk house",
  "chill phonk",
  "ambient phonk",
  "cloud phonk",
  "plugg",
  "jungle",
  "dnb",
  "drum and bass",
  "breakbeat",
  "metal phonk",
  "hard phonk",
  "rare phonk",
  "street phonk",
  "suicideboys",
  "808",
  "night drive",
  "wack",
];

interface ClassifyInput {
  name: string;
  artistName?: string;
  genre?: string | null;
  bpm?: number | null;
  tags?: string[];
  vocalInstrumental?: string | null;
}

/** Lowercased searchable blob built from a track's descriptive fields. */
function trackBlob(track: ClassifyInput): string {
  const name = (track.name ?? "").toLowerCase();
  const genre = (track.genre ?? "").toLowerCase();
  const tags = (track.tags ?? []).map((tag) => tag.toLowerCase()).join(" ");
  return [name, genre, tags].join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Classify a track into exactly one phonk subgenre, or `null` if it doesn't
 * belong to any of the platform's curated phonk subgenres.
 *
 * Signals are matched against the track's name, genre and tags (weighted in
 * that order). If only a generic "phonk" signal exists with no distinctive
 * subgenre keyword, the tempo decides the bucket.
 */
export function classifyTrack(track: ClassifyInput): PhonkSubgenre | null {
  const blob = trackBlob(track);
  if (!blob) return null;

  const passesGate = PHONK_GATE_TERMS.some((term) => blob.includes(term));
  if (!passesGate) return null;

  const name = (track.name ?? "").toLowerCase();
  const genre = (track.genre ?? "").toLowerCase();
  const tags = (track.tags ?? []).map((tag) => tag.toLowerCase());

  let best: PhonkSubgenre | null = null;
  let bestScore = 0;
  for (const subgenre of PHONK_SUBGENRES) {
    let score = 0;
    for (const keyword of subgenre.keywords) {
      if (name.includes(keyword)) score += 3;
      else if (genre.includes(keyword)) score += 2;
      else if (tags.some((tag) => tag.includes(keyword))) score += 1;
    }
    if (score > bestScore) {
      best = subgenre;
      bestScore = score;
    }
  }

  if (best) return best;

  // Generic "phonk" track with no distinctive subgenre signal — default by tempo.
  const bpm = track.bpm ?? null;
  if (bpm != null && bpm >= 150) return subgenreBySlug.get("hard") ?? null;
  if (bpm != null && bpm >= 115) return subgenreBySlug.get("drift") ?? null;
  if (tags.some((tag) => ["chill", "lofi", "ambient", "calm"].includes(tag))) {
    return subgenreBySlug.get("ambient-chill") ?? null;
  }
  return subgenreBySlug.get("classic-og") ?? null;
}

import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Car,
  CassetteTape,
  Cloud,
  Compass,
  Disc3,
  Flame,
  Ghost,
  Guitar,
  House,
  Moon,
  Skull,
  Sparkles,
  Waves,
  Zap,
} from "lucide-react";

export type GenreGroup =
  | "Traditional & Core Phonk"
  | "High-Energy & EDM-Infused"
  | "Melodic & Atmospheric"
  | "Regional & Hybrid Styles";

export interface Genre {
  name: string;
  aka?: string;
  description: string;
  group: GenreGroup;
  icon: LucideIcon;
}

export const genres: Genre[] = [
  {
    name: "Classic / OG Phonk",
    aka: "Traditional phonk",
    description:
      "The foundational 2010s sound. 90s Memphis rap acapellas, heavily pitched and chopped funk, jazz and soul samples, 808 cowbells, cassette tape warmth and slow-to-mid tempos.",
    group: "Traditional & Core Phonk",
    icon: CassetteTape,
  },
  {
    name: "Rare Phonk",
    description:
      "A cleaner, higher-fidelity evolution of OG phonk that leans heavily on soul, funk and 70s/80s rare-groove samples rather than gritty horrorcore.",
    group: "Traditional & Core Phonk",
    icon: Disc3,
  },
  {
    name: "Dirt Phonk / Vapor Phonk",
    description:
      "Intentionally degraded, lo-fi audio mixing, heavy tape distortion and a murky 90s Memphis atmosphere.",
    group: "Traditional & Core Phonk",
    icon: Skull,
  },
  {
    name: "Drift Phonk",
    description:
      "The most mainstream iteration. Born largely in Russia, it pairs fast tempos, aggressive distorted 808 cowbell melodies and heavy bass with automotive culture.",
    group: "High-Energy & EDM-Infused",
    icon: Car,
  },
  {
    name: "Drift House / House Phonk",
    description:
      "Combines drift phonk's distorted cowbell melodies and Memphis vocal chops with a classic 4-on-the-floor house drum rhythm.",
    group: "High-Energy & EDM-Infused",
    icon: House,
  },
  {
    name: "Brazilian Phonk / Funk Phonk",
    description:
      "Blends drift phonk cowbell patterns and distortion with Brazilian Funk Mandelão or Baile Funk polyrhythms and vocal chops.",
    group: "High-Energy & EDM-Infused",
    icon: Compass,
  },
  {
    name: "Hard Phonk / Aggressive Phonk",
    description:
      "Pushes drift phonk to extreme tempos and heavy distortion, bordering on industrial or hardstyle energy.",
    group: "High-Energy & EDM-Infused",
    icon: Flame,
  },
  {
    name: "Metal Phonk",
    description:
      "Combines drift or dirt phonk with heavy metal — electric guitar riffs, screaming vocals and breakdown beats.",
    group: "High-Energy & EDM-Infused",
    icon: Guitar,
  },
  {
    name: "Wave Phonk / Phonkwave",
    description:
      "Blends phonk vocals and drum structures with the sprawling, synth-heavy, atmospheric pads of wave music.",
    group: "Melodic & Atmospheric",
    icon: Waves,
  },
  {
    name: "Ambient Phonk / Chill Phonk",
    description:
      "Strips back aggressive drums in favor of lush, ethereal synth pads, heavy reverb and relaxed, spacey atmospheres.",
    group: "Melodic & Atmospheric",
    icon: Moon,
  },
  {
    name: "Cloud Phonk / Plugg Phonk",
    description:
      "Merges phonk elements with the dreamlike, ambient aesthetics of cloud rap and plugg beat production.",
    group: "Melodic & Atmospheric",
    icon: Cloud,
  },
  {
    name: "Hyperphonk",
    description:
      "Infuses phonk drum patterns and vocals with the chaotic, high-pitched synths, colorful sound design and fast tempos of hyperpop.",
    group: "Melodic & Atmospheric",
    icon: Sparkles,
  },
  {
    name: "G-Phonk",
    description:
      "Merges classic phonk structures with West Coast G-Funk — synth leads, West Coast basslines and 90s California hip-hop samples.",
    group: "Regional & Hybrid Styles",
    icon: Building2,
  },
  {
    name: "Street Phonk",
    description:
      "A bridge between traditional Memphis phonk and drift phonk that uses slower, atmospheric tempos without relying on distorted cowbells.",
    group: "Regional & Hybrid Styles",
    icon: Car,
  },
  {
    name: "Jungle Phonk / DnB Phonk",
    description:
      "Pairs Memphis vocal chops and phonk melodies with high-speed breakbeats, drum & bass patterns or jungle rhythms.",
    group: "Regional & Hybrid Styles",
    icon: Zap,
  },
  {
    name: "Phonk Trap / Dark Trap",
    description:
      "Overlaps heavily with suicideboys-style production, prioritizing heavy sub-bass, dark trap 808s and dark cinematic samples.",
    group: "Regional & Hybrid Styles",
    icon: Ghost,
  },
];

export const genreGroups: GenreGroup[] = [
  "Traditional & Core Phonk",
  "High-Energy & EDM-Infused",
  "Melodic & Atmospheric",
  "Regional & Hybrid Styles",
];

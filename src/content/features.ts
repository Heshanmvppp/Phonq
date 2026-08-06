import type { LucideIcon } from "lucide-react";
import {
  AudioLines,
  BarChart3,
  Download,
  Gift,
  Heart,
  ListMusic,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";

export interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
  group: "Player" | "Discovery" | "Community" | "Open source";
}

export const features: Feature[] = [
  {
    title: "High-fidelity streaming",
    description:
      "Stream full-length tracks at up to VBR MP3 quality through a custom audio engine with seek, gapless queueing and volume control.",
    icon: AudioLines,
    group: "Player",
  },
  {
    title: "Live waveform visualization",
    description:
      "A real-time frequency analyser renders an animated waveform as you listen — powered by the Web Audio API, with graceful fallbacks on every browser.",
    icon: Waves,
    group: "Player",
  },
  {
    title: "Smart queue management",
    description:
      "Shuffle, repeat and rearrange a persistent queue. Your listening session survives page navigation and reloads.",
    icon: ListMusic,
    group: "Player",
  },
  {
    title: "Curated radio channels",
    description:
      "Tune into genre radios curated by the Jamendo editorial team — from phonk to electronic, rock and lo-fi.",
    icon: Radio,
    group: "Discovery",
  },
  {
    title: "Trending and fresh drops",
    description:
      "Live popularity charts and recently-added feeds keep the home screen always moving. No stale, hand-picked playlists.",
    icon: BarChart3,
    group: "Discovery",
  },
  {
    title: "Powerful search",
    description:
      "Search hundreds of thousands of tracks, artists and albums by name, tag, genre or BPM from the global catalog.",
    icon: Search,
    group: "Discovery",
  },
  {
    title: "Favorites and playlists",
    description:
      "Like the tracks you love and organize them into playlists that sync across every device through your account.",
    icon: Heart,
    group: "Community",
  },
  {
    title: "Listening history",
    description:
      "Phonq remembers what you play so you can pick up right where you left off, anytime.",
    icon: Sparkles,
    group: "Community",
  },
  {
    title: "Legal downloads",
    description:
      "Every track ships with its Creative Commons license. Where the artist allows it, you can download tracks legally and forever.",
    icon: Download,
    group: "Community",
  },
  {
    title: "Open source, MIT",
    description:
      "The entire platform is MIT-licensed on GitHub. Fork it, self-host it, audit it, or build your own Phonq.",
    icon: Gift,
    group: "Open source",
  },
  {
    title: "Privacy by design",
    description:
      "No ads, no trackers, no data selling. Google OAuth is the only login, and your listening data belongs to you.",
    icon: ShieldCheck,
    group: "Open source",
  },
  {
    title: "Built for the community",
    description:
      "Phonq exists because the phonk scene needed a legal, free home. Contribute on GitHub and shape what we build.",
    icon: Heart,
    group: "Open source",
  },
];

export const featureGroups = ["Player", "Discovery", "Community", "Open source"] as const;

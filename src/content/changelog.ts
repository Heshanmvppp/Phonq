export type ChangelogType = "feature" | "fix" | "breaking" | "improvement";

export interface ChangelogEntry {
  version: string;
  date: string;
  type: ChangelogType;
  title: string;
  description: string;
}

export const changelog: ChangelogEntry[] = [
  {
    version: "1.0.0",
    date: "2026-08-06",
    type: "feature",
    title: "Phonq 1.0 — The full rewrite",
    description:
      "Phonq is rebuilt from the ground up as a modern Next.js platform. Global audio player with live waveform, favorites, playlists, listening history, Google OAuth sign-in, a live 500K+ track catalog from Jamendo, and a complete public website.",
  },
  {
    version: "0.2.0",
    date: "2025-06-21",
    type: "feature",
    title: "Custom audio player & visualization",
    description:
      "The original prototype shipped a hand-rolled HTML5 player with canvas waveform rendering, queue management, playback modes and localStorage-backed stats.",
  },
  {
    version: "0.1.0",
    date: "2025-06-20",
    type: "breaking",
    title: "Project paused & archived",
    description:
      "The legacy static build was archived. Development resumes later as a full rewrite. This page tracks the entire journey.",
  },
];

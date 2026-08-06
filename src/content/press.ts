export interface PressItem {
  date: string;
  outlet: string;
  title: string;
  summary: string;
  href?: string;
}

export const press: PressItem[] = [
  {
    date: "2026-08-06",
    outlet: "Phonq",
    title: "Phonq 1.0 launches as the free, open-source home of phonk",
    summary:
      "The fully rebuilt streaming platform brings a live 500K+ track catalog, Google OAuth accounts, legal downloads and zero ads to the phonk community.",
  },
  {
    date: "2026-07-28",
    outlet: "Phonq Engineering",
    title: "Inside the Phonq player: Web Audio, CORS and graceful degradation",
    summary:
      "A technical walkthrough of how the waveform visualizer and resilient audio engine work under the hood.",
  },
];

export const pressKit = {
  logos: [
    { name: "Phonq logo (dark)", path: "/logos/phonq-dark.svg" },
    { name: "Phonq logo (light)", path: "/logos/phonq-light.svg" },
    { name: "Phonq mark", path: "/logos/phonq-mark.svg" },
  ],
  colors: [
    { name: "Violet", value: "oklch(0.62 0.19 300)" },
    { name: "Fuchsia", value: "oklch(0.65 0.22 330)" },
    { name: "Orange", value: "oklch(0.74 0.15 45)" },
  ],
};

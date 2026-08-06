export interface Job {
  title: string;
  type: "Full-time" | "Part-time" | "Contract" | "Open source";
  location: string;
  description: string;
  role: string;
}

export const jobs: Job[] = [
  {
    title: "Open Source Contributor",
    type: "Open source",
    location: "Remote, worldwide",
    description:
      "Phonq is open source and community-driven. Pick up issues on GitHub, improve the player, the docs or the API, and ship to thousands of listeners.",
    role: "Contribution",
  },
  {
    title: "Frontend Engineer",
    type: "Part-time",
    location: "Remote",
    description:
      "We're looking for a React engineer to help polish the player experience, improve the waveform visualizer, and build artist and album pages.",
    role: "Hiring",
  },
  {
    title: "Community Lead",
    type: "Part-time",
    location: "Remote",
    description:
      "Help grow the phonk community: run the Discord, curate what we build next, and connect with artists on Jamendo.",
    role: "Hiring",
  },
];

export const roles = ["Open source", "Hiring"] as const;

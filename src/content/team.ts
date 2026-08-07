export interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  bio: string;
  github?: string;
}

export const team: TeamMember[] = [
  {
    name: "Heshan",
    role: "Founder & Lead Developer",
    avatar: "/images/team/heshan.jpg",
    bio: "Started Phonq in 2025 as a way to give the phonk scene a legal, free home. Builds the platform and most of the frontend.",
    github: "hexsyro",
  },
  {
    name: "Contributors",
    role: "Open Source Community",
    avatar: "/images/team/contributors.jpg",
    bio: "The MIT license means anyone can help — and people do. Docs, translations, fixes and ideas all come from the community.",
  },
];

export type RoadmapStatus = "In progress" | "Planned" | "Under consideration" | "Shipped";

export interface RoadmapItem {
  title: string;
  description: string;
  status: RoadmapStatus;
  label: string;
}

export const roadmap: RoadmapItem[] = [
  {
    title: "Global search",
    description: "Search across the full Jamendo catalog with tag, genre and BPM filters.",
    status: "Shipped",
    label: "v1.0",
  },
  {
    title: "Favorites & playlists",
    description: "Account-synced liked songs and playlists with drag-to-reorder.",
    status: "Shipped",
    label: "v1.0",
  },
  {
    title: "Listening history",
    description: "Recently played feed, powered by your listening session.",
    status: "Shipped",
    label: "v1.0",
  },
  {
    title: "Artist pages",
    description: "Browse an artist's full discography with their bio and similar artists.",
    status: "Shipped",
    label: "v1.1",
  },
  {
    title: "Album pages & discography",
    description: "Album views with track listings, release date and cover art.",
    status: "Shipped",
    label: "v1.1",
  },
  {
    title: "Queue drag & reorder",
    description: "Drag tracks inside the queue to change playback order.",
    status: "Shipped",
    label: "v1.2",
  },
  {
    title: "Personalized recommendations",
    description: "Suggest tracks based on your history, genres and listening patterns.",
    status: "Shipped",
    label: "v1.2",
  },
  {
    title: "Listening statistics",
    description: "Time spent listening, top artists and tracks, wrapped-style summaries.",
    status: "Under consideration",
    label: "v1.3",
  },
  {
    title: "Mobile apps",
    description: "PWA with offline queue, followed by native apps if demand grows.",
    status: "Under consideration",
    label: "v2.0",
  },
];

export const roadmapGroups: RoadmapStatus[] = ["In progress", "Planned", "Under consideration", "Shipped"];

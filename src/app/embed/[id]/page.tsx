import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { fetchTrack } from "@/lib/catalog";

import { EmbedPlayer } from "@/components/embed/embed-player";

interface EmbedPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: EmbedPageProps): Promise<Metadata> {
  const { id } = await params;
  const track = await fetchTrack(id);
  return {
    title: track ? `${track.name} — ${track.artistName} on Phonq` : "Phonq",
    description: "Free, legal, Creative Commons streaming player.",
    robots: { index: false, follow: false },
  };
}

export default async function EmbedPage({ params }: EmbedPageProps) {
  const { id } = await params;
  const track = await fetchTrack(id);
  if (!track) notFound();

  return <EmbedPlayer track={track} />;
}

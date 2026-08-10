"use client";

import { Play } from "lucide-react";

import { usePlayer } from "@/components/player/player-context";
import { Button } from "@/components/ui/button";
import type { Track } from "@/lib/jamendo";

interface AlbumPlayAllProps {
  tracks: Track[];
}

/** "Play all" button for an album page — queues the album's tracks in order. */
export function AlbumPlayAll({ tracks }: AlbumPlayAllProps) {
  const { playQueue } = usePlayer();

  if (!tracks || tracks.length === 0) return null;

  return (
    <Button
      onClick={() => playQueue(tracks, 0)}
      className="mt-2 inline-flex w-auto items-center justify-center gap-2"
    >
      <Play className="size-4" /> Play all
    </Button>
  );
}

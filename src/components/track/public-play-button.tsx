"use client";

import { Pause, Play, PauseCircle } from "lucide-react";

import { usePlayer } from "@/components/player/player-context";
import { Button } from "@/components/ui/button";
import type { Track } from "@/lib/jamendo";

export function PublicPlayButton({ track }: { track: Track }) {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const isCurrent = currentTrack?.id === track.id;
  const isNowPlaying = isCurrent && isPlaying;

  function handlePlay() {
    if (isCurrent) {
      togglePlay();
      return;
    }
    playTrack(track);
  }

  if (!track.audioUrl) {
    return (
      <Button size="lg" variant="outline" disabled>
        <PauseCircle className="size-5" /> Streaming paused
      </Button>
    );
  }

  return (
    <Button size="lg" onClick={handlePlay}>
      {isNowPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
      {isNowPlaying ? "Pause" : "Play"}
    </Button>
  );
}

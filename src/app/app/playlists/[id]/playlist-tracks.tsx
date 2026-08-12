"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { ListMusic, Play, Shuffle } from "lucide-react";

import { usePlayer } from "@/components/player/player-context";
import { TrackRow } from "@/components/track/track-row";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { Track } from "@/lib/jamendo";

interface PlaylistTracksProps {
  playlistId: string;
  tracks: Track[];
}

function shuffled<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function PlaylistTracks({ playlistId, tracks }: PlaylistTracksProps) {
  const router = useRouter();
  const { playQueue } = usePlayer();
  const [busy, setBusy] = React.useState<string | null>(null);

  async function removeTrack(track: Track) {
    setBusy(track.id);
    try {
      await fetch(`/api/me/playlists/${playlistId}/tracks`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track.id }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (tracks.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState
          icon={ListMusic}
          title="This playlist is empty"
          description="Add tracks from search or any track list using the plus button."
        />
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => playQueue(tracks, 0)}>
          <Play className="size-4" /> Play all
        </Button>
        <Button variant="outline" onClick={() => playQueue(shuffled(tracks), 0)}>
          <Shuffle className="size-4" /> Shuffle
        </Button>
      </div>
      <div className="mt-6 flex flex-col gap-1">
        {tracks.map((track, index) => (
          <TrackRow
            key={track.id}
            track={track}
            queue={tracks}
            index={index}
            onRemove={busy === track.id ? undefined : removeTrack}
            showPosition
          />
        ))}
      </div>
    </div>
  );
}

"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { ListMusic } from "lucide-react";

import { TrackRow } from "@/components/track/track-row";
import { EmptyState } from "@/components/ui/empty-state";
import type { Track } from "@/lib/jamendo";

interface PlaylistTracksProps {
  playlistId: string;
  tracks: Track[];
}

export function PlaylistTracks({ playlistId, tracks }: PlaylistTracksProps) {
  const router = useRouter();
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
    <div className="mt-8 flex flex-col gap-1">
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
  );
}

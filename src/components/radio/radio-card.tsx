"use client";

import * as React from "react";

import Image from "next/image";

import { Loader2, Play } from "lucide-react";

import { usePlayer } from "@/components/player/player-context";
import type { Radio, Track } from "@/lib/jamendo";

interface RadioCardProps {
  radio: Radio;
}

export function RadioCard({ radio }: RadioCardProps) {
  const { playTrack } = usePlayer();
  const [loading, setLoading] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  async function handlePlay() {
    if (loading) return;
    setLoading(true);
    setFailed(false);
    try {
      // Static radios map to a curated subgenre — queue tracks for that sound.
      // Live Jamendo radios don't, so fall back to a name search. Try the
      // more precise path first, then relax.
      const attempts = radio.subgenre ? ["subgenre", "search"] : ["search"];
      let tracks: Track[] = [];
      for (const mode of attempts) {
        const params = new URLSearchParams({ limit: "20", boost: "popularity_week" });
        params.set(mode === "subgenre" ? "subgenre" : "search", mode === "subgenre" ? radio.subgenre! : radio.name);
        const res = await fetch(`/api/tracks?${params.toString()}`);
        const data = (await res.json()) as { tracks?: Track[] };
        tracks = data?.tracks ?? [];
        if (tracks.length > 0) break;
      }
      if (tracks.length === 0) {
        setFailed(true);
        return;
      }
      playTrack(tracks[0], tracks);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handlePlay}
      disabled={loading}
      className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 text-center transition-colors hover:border-primary/50 hover:bg-muted/30 disabled:opacity-60"
      aria-label={`Play ${radio.displayName} radio`}
      title={`Play ${radio.displayName}`}
    >
      <span className="relative flex size-12 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-base font-semibold text-primary transition-colors group-hover:bg-primary/20">
        {radio.image ? (
          <Image src={radio.image} alt="" fill sizes="48px" className="object-cover" />
        ) : (
          radio.displayName.slice(0, 1).toUpperCase()
        )}
        {loading ? (
          <Loader2 className="absolute bottom-0 right-0 size-4 animate-spin rounded-full bg-background p-0.5 text-primary" />
        ) : (
          <span className="absolute bottom-0 right-0 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
            <Play className="size-2.5 fill-current" />
          </span>
        )}
      </span>
      <p className="truncate text-sm font-medium">{radio.displayName}</p>
      {failed && <p className="text-xs text-muted-foreground">Channel is quiet right now</p>}
    </button>
  );
}

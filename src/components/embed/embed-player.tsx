"use client";

import * as React from "react";

import Image from "next/image";

import { Music2, Pause, Play } from "lucide-react";

import { formatDuration } from "@/lib/utils";
import type { Track } from "@/lib/jamendo";

export function EmbedPlayer({ track }: { track: Track }) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  const hasAudio = Boolean(track.audioUrl);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play().catch(() => setLoading(false));
    } else {
      audio.pause();
    }
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  }

  return (
    <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40">
      <div className="relative aspect-square w-full bg-muted">
        {track.image ? (
          <Image
            src={track.image}
            alt={`${track.name} cover`}
            fill
            sizes="384px"
            className="object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center">
            <Music2 className="size-14 text-muted-foreground/40" />
          </span>
        )}
        {playing && (
          <span className="absolute left-3 top-3 flex h-3 items-end gap-0.5 rounded-full bg-black/60 px-2 py-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-0.5 origin-bottom animate-eq rounded-full bg-primary"
                style={{ height: "70%", animationDelay: `${i * 120}ms` }}
              />
            ))}
          </span>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{track.name}</p>
          <p className="truncate text-xs text-muted-foreground">{track.artistName}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            disabled={!hasAudio}
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="size-5" /> : <Play className="ml-0.5 size-5" />}
          </button>

          <input
            type="range"
            min={0}
            max={Math.max(duration || track.duration, 1)}
            step={1}
            value={Math.min(currentTime, duration || track.duration)}
            onChange={(e) => seek(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer accent-[var(--color-primary)]"
            aria-label="Seek"
          />

          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatDuration(currentTime)} / {formatDuration(duration || track.duration)}
          </span>
        </div>

        {!hasAudio && (
          <p className="text-center text-xs text-muted-foreground">
            Streaming is paused — the catalog is refreshing.
          </p>
        )}

        <audio
          ref={audioRef}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onWaiting={() => setLoading(true)}
          onCanPlay={() => setLoading(false)}
          onLoadedMetadata={(e) => setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          src={hasAudio ? track.audioUrl : undefined}
        />
      </div>

      <div className="flex items-center justify-between border-t border-border px-4 py-2">
        <p className="text-[10px] text-muted-foreground">Streaming on Phonq</p>
        {loading && <p className="text-[10px] text-primary">Buffering…</p>}
      </div>
    </div>
  );
}

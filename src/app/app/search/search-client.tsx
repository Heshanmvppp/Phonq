"use client";

import * as React from "react";

import { useSearchParams } from "next/navigation";

import { Search as SearchIcon, X } from "lucide-react";

import { TrackRow } from "@/components/track/track-row";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Track } from "@/lib/jamendo";

export function SearchClient() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = React.useState(initialQuery);
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(null);

  React.useEffect(() => {
    const q = query.trim();

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(
      () => {
        if (!q) {
          setTracks([]);
          setLoading(false);
          setError(null);
          return;
        }

        setLoading(true);
        setError(null);

        fetch(`/api/tracks?search=${encodeURIComponent(q)}&limit=40`)
          .then(async (res) => {
            const data = await res.json();
            if (!res.ok) {
              setError(data.error ?? "Search failed");
              setTracks([]);
            } else {
              setTracks(data.tracks ?? []);
            }
          })
          .catch(() => {
            setError("Search failed. Please try again.");
            setTracks([]);
          })
          .finally(() => setLoading(false));
      },
      q ? 300 : 0,
    );

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold">Search</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Search the full Jamendo catalog for tracks, artists and albums.
      </p>

      <div className="relative mt-6 max-w-xl">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try: drift phonk, vox, cowbell…"
          className="pl-9"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="mt-8">
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</p>
        )}

        {!loading && !error && query.trim() && tracks.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No results for “{query.trim()}”. Try a different spelling or fewer words.
          </p>
        )}

        {!loading && !error && tracks.length > 0 && (
          <div className="flex flex-col gap-1">
            {tracks.map((track, index) => (
              <TrackRow key={track.id} track={track} queue={tracks} index={index} showPosition />
            ))}
          </div>
        )}

        {!loading && !query.trim() && (
          <p className={cn("text-sm text-muted-foreground")}>
            Start typing to search. Results appear as you type.
          </p>
        )}
      </div>
    </div>
  );
}

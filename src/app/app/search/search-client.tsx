"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Search as SearchIcon, X, Clock, TrendingUp, SearchX, WifiOff } from "lucide-react";
import { TrackRow } from "@/components/track/track-row";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Track } from "@/lib/jamendo";

const RECENT_SEARCHES_KEY = "phonq-recent-searches";
const MAX_RECENT = 5;
type SearchTab = "tracks" | "artists" | "albums" | "tags";

const SEARCH_TABS: Array<{ value: SearchTab; label: string }> = [
  { value: "tracks", label: "Tracks" },
  { value: "artists", label: "Artists" },
  { value: "albums", label: "Albums" },
  { value: "tags", label: "Tags" },
];

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (typeof window === "undefined" || !query.trim()) return;
  try {
    const existing = getRecentSearches();
    const updated = [query, ...existing.filter((s) => s !== query)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    /* ignore */
  }
}

export function SearchClient({ popularTracks }: { popularTracks: Track[] }) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = React.useState(initialQuery);
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [recentSearches] = React.useState<string[]>(() => getRecentSearches());
  const [attempt, setAttempt] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState<SearchTab>("tracks");
  const [retryCount, setRetryCount] = React.useState(0);
  const [bannerOpen, setBannerOpen] = React.useState(true);
  const debounceRef = React.useRef<number>(null);
  const requestIdRef = React.useRef(0);

  React.useEffect(() => {
    const q = query.trim();

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const clearAndReset = () => {
      requestIdRef.current += 1;
      setTracks([]);
      setLoading(false);
      setError(null);
    };

    if (!q) {
      const resetId = window.setTimeout(clearAndReset, 0);
      return () => {
        window.clearTimeout(resetId);
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }

    const stateId = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      setBannerOpen(true);

      debounceRef.current = window.setTimeout(() => {
        const requestId = ++requestIdRef.current;

        fetch(`/api/tracks?search=${encodeURIComponent(q)}&limit=40`)
          .then(async (res) => {
            if (requestIdRef.current !== requestId) return;
            const data = await res.json();
            if (!res.ok) {
              setError(data.error ?? "Search failed");
              setTracks([]);
            } else {
              setTracks(data.tracks ?? []);
            }
          })
          .catch(() => {
            if (requestIdRef.current !== requestId) return;
            setError("Search failed. Please try again.");
            setTracks([]);
          })
          .finally(() => {
            if (requestIdRef.current === requestId) setLoading(false);
          });
      }, 300);
    }, 0);

    return () => {
      window.clearTimeout(stateId);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, attempt]);

  const suggestedSearches = React.useMemo(
    () => ["drift", "lofi", "vaporwave", "cowbell", "trap", "chill", "nostalgia", "vibes", "underground", "classic"].slice(0, 6),
    [],
  );

  const visibleSuggestions = !query.trim() && showSuggestions;

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
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveRecentSearch(query.trim());
          }}
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

        {visibleSuggestions && (
          <div className="absolute top-full mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
            <div className="p-2">
              {recentSearches.length > 0 && (
                <>
                  <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent</p>
                  {recentSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => setQuery(search)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <Clock className="size-3 text-muted-foreground" />
                      <span>{search}</span>
                    </button>
                  ))}
                  <div className="my-1 border-t border-border" />
                </>
              )}

              <p className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Popular searches</p>
              {suggestedSearches.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    saveRecentSearch(suggestion);
                    setQuery(suggestion);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
                >
                  <TrendingUp className="size-3 text-muted-foreground" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {SEARCH_TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "relative rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="relative mt-2 h-0.5 overflow-hidden rounded-full bg-muted">
        <span
          className="absolute bottom-0 h-0.5 rounded-full bg-primary transition-all duration-200"
          style={{ left: `${SEARCH_TABS.findIndex((tab) => tab.value === activeTab) * 25}%`, width: "25%" }}
        />
      </div>

      <div className="mt-8">
        {!loading && !query.trim() && popularTracks.length > 0 && !visibleSuggestions && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trending in phonk</p>
            <div className="space-y-2">
              {popularTracks.slice(0, 6).map((track, index) => (
                <TrackRow key={track.id} track={track} queue={popularTracks} index={index} showPosition />
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        )}

        {!loading && error && query.trim() && bannerOpen ? (
          <div className="mb-4 flex items-start justify-between rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <div>
              <p className="font-medium">The signal dropped</p>
              <p className="text-xs text-destructive/80">We couldn’t reach the catalog just yet — try again and the next drop should land.</p>
            </div>
            <button type="button" onClick={() => setBannerOpen(false)} className="rounded-full p-1 transition-colors hover:bg-destructive/20" aria-label="Dismiss banner">
              <X className="size-4" />
            </button>
          </div>
        ) : null}

        {!loading && error && query.trim() && (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <EmptyState
              icon={WifiOff}
              title="Search failed"
              description={error}
              className="w-full"
            >
              <Button
                variant="outline"
                className={cn(retryCount > 1 && "animate-shake")}
                onClick={() => {
                  setRetryCount((count) => count + 1);
                  setAttempt((a) => a + 1);
                }}
              >
                Try again
              </Button>
            </EmptyState>
          </div>
        )}

        {!loading && !error && query.trim() && tracks.length === 0 && (
          <EmptyState
            icon={SearchX}
            title={activeTab === "tracks" ? `No results for “${query.trim()}”` : `The bassline is quiet for ${activeTab}`}
            description={
              activeTab === "tracks"
                ? "Try a different spelling or fewer words."
                : "This section is still warming up — switch to tracks to keep the search moving."
            }
            className="mt-4"
          />
        )}

        {!loading && !error && activeTab !== "tracks" && query.trim() && tracks.length > 0 && (
          <div className="mt-4 rounded-xl border border-border bg-card/70 p-6 text-center">
            <p className="text-sm font-semibold text-foreground">The next layer is still loading</p>
            <p className="mt-2 text-sm text-muted-foreground">Artists, albums, and tags are on the same signal path as tracks — tap Tracks to browse the live catalog while the rest catches up.</p>
          </div>
        )}

        {!loading && !error && activeTab === "tracks" && tracks.length > 0 && (
          <div className="flex flex-col gap-1">
            {tracks.map((track, index) => (
              <TrackRow key={track.id} track={track} queue={tracks} index={index} showPosition />
            ))}
          </div>
        )}

        {!loading && !error && !query.trim() && popularTracks.length === 0 && (
          <p className={cn("text-sm text-muted-foreground")}>
            Start typing to search. Popular tracks will appear as suggestions.
          </p>
        )}
      </div>
    </div>
  );
}

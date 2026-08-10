"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search as SearchIcon, X, Clock, TrendingUp, SearchX, WifiOff } from "lucide-react";
import { TrackRow } from "@/components/track/track-row";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { cn, getAlbumHref, getArtistHref } from "@/lib/utils";
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
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
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
      setSelectedTag(null);
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

  const grouped = React.useMemo(() => {
    const artists = new Map<string, Track[]>();
    const albums = new Map<string, Track[]>();
    const tagCounts = new Map<string, number>();
    for (const track of tracks) {
      const artist = track.artistName || "Unknown Artist";
      const artistList = artists.get(artist) ?? [];
      artistList.push(track);
      artists.set(artist, artistList);

      const albumKey = `${track.albumId ?? track.albumName}`;
      const albumList = albums.get(albumKey) ?? [];
      albumList.push(track);
      albums.set(albumKey, albumList);

      for (const tag of track.tags) {
        const lower = tag.toLowerCase();
        tagCounts.set(lower, (tagCounts.get(lower) ?? 0) + 1);
      }
    }
    const sortedArtists = [...artists.entries()].sort((a, b) => b[1].length - a[1].length);
    const sortedAlbums = [...albums.entries()].sort((a, b) => b[1].length - a[1].length);
    const sortedTags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 24)
      .map(([tag]) => tag);
    return { sortedArtists, sortedAlbums, sortedTags };
  }, [tracks]);

  const filteredTracks = React.useMemo(() => {
    if (!selectedTag) return tracks;
    return tracks.filter((track) => track.tags.some((tag) => tag.toLowerCase() === selectedTag));
  }, [tracks, selectedTag]);

  const hasResults = tracks.length > 0;

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
          <div className="absolute top-full mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-card text-card-foreground shadow-lg">
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

      <div className="mt-6 flex items-center gap-1 rounded-xl border border-border bg-card p-1">
        {SEARCH_TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium transition-all duration-200",
                isActive ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {hasResults
            ? `${tracks.length} result${tracks.length === 1 ? "" : "s"}${selectedTag ? ` filtered by “${selectedTag}”` : ""}`
            : "Browse the full phonk catalog"}
        </span>
        {selectedTag && (
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className="rounded-md px-2 py-0.5 font-medium text-primary transition-colors hover:bg-primary/10"
          >
            Clear filter
          </button>
        )}
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
            title={
              activeTab === "tracks"
                ? `No results for “${query.trim()}”`
                : `Nothing matches “${query.trim()}” yet`
            }
            description={
              activeTab === "tracks"
                ? "Try a different spelling or fewer words."
                : "Artists, albums and tags are built from the same results — try a different search."
            }
            className="mt-4"
          />
        )}

        {!loading && !error && hasResults && activeTab === "tracks" && (
          <div className="flex flex-col gap-1">
            {filteredTracks.map((track, index) => (
              <TrackRow key={track.id} track={track} queue={filteredTracks} index={index} showPosition />
            ))}
          </div>
        )}

        {!loading && !error && hasResults && activeTab === "artists" && (
          <div className="space-y-6">
            {grouped.sortedArtists.map(([artist, artistTracks]) => {
              const artistHref = getArtistHref(artistTracks[0]?.artistId ?? "", artist);
              const label = artistHref ? (
                <Link href={artistHref} className="hover:text-primary hover:underline">
                  {artist}
                </Link>
              ) : (
                artist
              );
              return (
                <section key={artist}>
                  <h2 className="mb-2 flex items-baseline justify-between text-sm font-semibold">
                    <span>{label}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {artistTracks.length} track{artistTracks.length === 1 ? "" : "s"}
                    </span>
                  </h2>
                  <div className="flex flex-col gap-1">
                    {artistTracks.map((track, index) => (
                      <TrackRow key={track.id} track={track} queue={artistTracks} index={index} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {!loading && !error && hasResults && activeTab === "albums" && (
          <div className="space-y-6">
            {grouped.sortedAlbums.map(([album, albumTracks]) => {
              const albumHref = getAlbumHref(albumTracks[0]?.albumId ?? "");
              const albumName = albumTracks[0]?.albumName ?? "Unknown album";
              const label = albumHref ? (
                <Link href={albumHref} className="hover:text-primary hover:underline">
                  {albumName}
                </Link>
              ) : (
                albumName
              );
              return (
                <section key={album}>
                  <h2 className="mb-2 flex items-baseline justify-between text-sm font-semibold">
                    <span>{label}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {albumTracks.length} track{albumTracks.length === 1 ? "" : "s"}
                    </span>
                  </h2>
                  <div className="flex flex-col gap-1">
                    {albumTracks.map((track, index) => (
                      <TrackRow key={track.id} track={track} queue={albumTracks} index={index} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {!loading && !error && hasResults && activeTab === "tags" && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {grouped.sortedTags.map((tag) => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(isSelected ? null : tag)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      isSelected
                        ? "border-primary/50 bg-primary/10 font-medium text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            {filteredTracks.length > 0 ? (
              <div className="flex flex-col gap-1">
                {filteredTracks.map((track, index) => (
                  <TrackRow key={track.id} track={track} queue={filteredTracks} index={index} showPosition />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Pick a tag to filter the results.</p>
            )}
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

"use client";

import * as React from "react";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Heart } from "lucide-react";

import { usePlayer } from "@/components/player/player-context";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  trackId: string;
  initialLiked?: boolean;
  onLikedChange?: (liked: boolean) => void;
  className?: string;
}

export function LikeButton({ trackId, initialLiked = false, onLikedChange, className }: LikeButtonProps) {
  const { status } = useSession();
  const router = useRouter();
  const { setFavorite } = usePlayer();
  const [liked, setLiked] = React.useState(initialLiked);
  const [prevInitialLiked, setPrevInitialLiked] = React.useState(initialLiked);
  const [pending, setPending] = React.useState(false);
  const [burst, setBurst] = React.useState(false);

  // The button can outlive a single track (player bar) or a server refresh
  // (rows), so re-sync state during render when the prop changes instead of
  // freezing on the initial value.
  if (prevInitialLiked !== initialLiked) {
    setPrevInitialLiked(initialLiked);
    setLiked(initialLiked);
  }

  async function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (pending) return;

    const next = !liked;
    setLiked(next);
    setBurst(true);
    setPending(true);
    try {
      const res = await fetch("/api/me/favorites", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      });
      if (!res.ok) {
        setLiked(!next);
        return;
      }
      onLikedChange?.(next);
      setFavorite(trackId, next);
      router.refresh();
    } catch {
      setLiked(!next);
    } finally {
      setPending(false);
      window.setTimeout(() => setBurst(false), 420);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group relative inline-flex items-center justify-center rounded-full p-1.5 transition-colors",
        liked ? "text-primary" : "text-muted-foreground hover:text-foreground",
        className,
      )}
      aria-label={liked ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={liked}
    >
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {burst ? (
          <span className="absolute inset-0 rounded-full bg-primary/20 animate-burst" />
        ) : null}
      </span>
      <Heart className={cn("relative size-4 transition-all duration-200", liked && "fill-primary scale-110", burst && "scale-110")} />
      {burst ? (
        <>
          <span className="pointer-events-none absolute -left-1 top-0 size-1.5 rounded-full bg-primary/70 animate-burst" />
          <span className="pointer-events-none absolute -right-1 top-0 size-1.5 rounded-full bg-primary/70 animate-burst" style={{ animationDelay: "90ms" }} />
          <span className="pointer-events-none absolute -left-1 bottom-0 size-1.5 rounded-full bg-primary/70 animate-burst" style={{ animationDelay: "180ms" }} />
          <span className="pointer-events-none absolute -right-1 bottom-0 size-1.5 rounded-full bg-primary/70 animate-burst" style={{ animationDelay: "260ms" }} />
        </>
      ) : null}
    </button>
  );
}

"use client";

import * as React from "react";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Heart } from "lucide-react";

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
  const [liked, setLiked] = React.useState(initialLiked);
  const [pending, setPending] = React.useState(false);

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
      router.refresh();
    } catch {
      setLiked(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center rounded-full p-1.5 transition-colors",
        liked ? "text-primary" : "text-muted-foreground hover:text-foreground",
        className,
      )}
      aria-label={liked ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={liked}
    >
      <Heart className={cn("size-4 transition-transform", liked && "fill-primary scale-110")} />
    </button>
  );
}

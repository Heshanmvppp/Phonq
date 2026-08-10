import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "0";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(Math.round(n));
}

export function initials(name?: string | null): string {
  if (!name) return "P";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]!)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function absoluteUrl(path = ""): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}

export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

export function dateString(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function timeAgo(date: Date | string): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

export function groupByDate<T>(items: T[], dateKey: (item: T) => Date | string): { label: string; items: T[] }[] {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const rawDate = dateKey(item);
    const date = rawDate instanceof Date ? rawDate : new Date(rawDate);
    let label: string;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (itemDate.getTime() === today.getTime()) {
      label = "Today";
    } else if (itemDate.getTime() === yesterday.getTime()) {
      label = "Yesterday";
    } else if (itemDate.getTime() > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).getTime()) {
      label = date.toLocaleDateString("en-US", { weekday: "long" });
    } else {
      label = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }

    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(item);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

/** Strip HTML tags from a Jamendo bio string so it can be rendered as text
 * safely (no sanitizer dependency shipped with the repo). */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Build a link to an artist's page, or null when no page exists (e.g.
 * YouTube-sourced tracks whose artist id isn't a Jamendo id). */
export function getArtistHref(artistId: string, artistName: string): string | null {
  if (!artistId || !/^\d+$/.test(artistId) || !artistName) return null;
  return `/app/artists/${encodeURIComponent(artistId)}`;
}

/** Build a link to an album's page, or null when the album id is unknown. */
export function getAlbumHref(albumId: string): string | null {
  if (!albumId || !/^\d+$/.test(albumId)) return null;
  return `/app/albums/${encodeURIComponent(albumId)}`;
}

/**
 * Pure helper for the queue "drag to reorder" feature: returns a new array with
 * the item at `from` moved to `to`. Out-of-range or no-op indices return the
 * input unchanged.
 */
export function reorderArray<T>(items: T[], from: number, to: number): T[] {
  const len = items.length;
  if (from === to || from < 0 || from >= len || to < 0 || to >= len) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Like `reorderArray`, but also reports the new index of the element that
 * lived at `currentIndex` after the move (matched by reference, so duplicate
 * track ids in the queue are tracked correctly). `index` is `undefined` when
 * the move is a no-op or the index can't be resolved. */
export function reorderWithIndex<T>(items: T[], from: number, to: number, currentIndex: number): { items: T[]; index: number | undefined } {
  const next = reorderArray(items, from, to);
  if (next === items) return { items, index: undefined };
  let index: number | undefined;
  if (currentIndex >= 0 && currentIndex < items.length) {
    const current = items[currentIndex];
    const newIndex = next.indexOf(current);
    if (newIndex !== -1) index = newIndex;
  }
  return { items: next, index };
}

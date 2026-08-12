"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { GripVertical, ListMusic, Play, Trash2, X } from "lucide-react";

import { usePlayer } from "@/components/player/player-context";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatDuration } from "@/lib/utils";

export function QueuePanel() {
  const {
    queue,
    queueIndex,
    queueOpen,
    setQueueOpen,
    jumpTo,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    togglePlay,
    isPlaying,
  } = usePlayer();
  const [removingIndexes, setRemovingIndexes] = React.useState<number[]>([]);
  const [dragIndex, setDragIndex] = React.useState<number>(-1);
  const [dragOverIndex, setDragOverIndex] = React.useState<number>(-1);

  if (!queueOpen) return null;

  const canDrag = queue.length > 1;

  const panel = (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setQueueOpen(false)} aria-hidden="true" />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-popover shadow-2xl animate-fade-up">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ListMusic className="size-4 text-primary" />
            <h2 className="font-display text-sm font-semibold">Up next</h2>
            <span className="text-xs text-muted-foreground">{queue.length} tracks</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={clearQueue}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Clear queue"
            >
              <Trash2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setQueueOpen(false)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close queue"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {queue.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState
              icon={ListMusic}
              title="Nothing in the queue"
              description="Hit play on any track to start listening."
              className="border-none p-6"
            />
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto p-2">
            {queue.map((track, index) => {
              const isCurrent = index === queueIndex;
              const isNowPlaying = isCurrent && isPlaying;
              const isRemoving = removingIndexes.includes(index);
              const isDragging = dragIndex === index;
              const isDragOver = dragOverIndex === index && dragIndex !== index;
              return (
                <li
                  key={`${track.id}-${index}`}
                  draggable={canDrag}
                  onDragStart={(e) => {
                    setDragIndex(index);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", String(index));
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragIndex !== index) setDragOverIndex(index);
                  }}
                  onDragEnter={() => {
                    if (dragIndex !== index) setDragOverIndex(index);
                  }}
                  onDragLeave={(e) => {
                    // Only clear when leaving the row entirely (not its children).
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX;
                    const y = e.clientY;
                    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                      setDragOverIndex(-1);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = dragIndex;
                    const to = dragOverIndex;
                    setDragIndex(-1);
                    setDragOverIndex(-1);
                    if (from >= 0 && to >= 0 && from !== to) reorderQueue(from, to);
                  }}
                  onDragEnd={() => {
                    setDragIndex(-1);
                    setDragOverIndex(-1);
                  }}
                  className={cn(
                    "relative group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-all duration-200 hover:bg-muted",
                    isCurrent && "bg-muted/70",
                    isRemoving && "animate-slide-out-left",
                    !isRemoving && !isCurrent && "hover:translate-x-0.5",
                    isDragging && "opacity-40",
                  )}
                >
                  {isDragOver && (
                    <span
                      className="absolute inset-x-1 -top-px h-0.5 bg-primary"
                      aria-hidden="true"
                    />
                  )}
                  {canDrag && (
                    <span
                      className="hidden size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-opacity hover:bg-muted sm:flex sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
                      aria-hidden="true"
                    >
                      <GripVertical className="size-4" />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => (isCurrent ? togglePlay() : jumpTo(index))}
                    className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted"
                    aria-label={isNowPlaying ? "Pause" : "Play"}
                  >
                    {track.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={track.image} alt="" className="size-full object-cover" loading="lazy" />
                    ) : null}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                      {isNowPlaying ? <span className="size-3 rounded-full bg-white" /> : <Play className="size-4 fill-white text-white" />}
                    </span>
                    {isCurrent && (
                      <span className="absolute bottom-0.5 right-0.5 flex h-3 items-end gap-0.5 rounded-sm bg-black/70 px-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-0.5 origin-bottom animate-eq rounded-full bg-primary"
                            style={{ height: "60%", animationDelay: `${i * 120}ms` }}
                          />
                        ))}
                      </span>
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm font-medium", isCurrent ? "text-primary" : "text-foreground")}>
                      {track.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{track.artistName}</p>
                  </div>

                  <span className="text-xs tabular-nums text-muted-foreground">{formatDuration(track.duration)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setRemovingIndexes((prev) => (prev.includes(index) ? prev : [...prev, index]));
                      window.setTimeout(() => {
                        removeFromQueue(index);
                        setRemovingIndexes((prev) => prev.filter((value) => value !== index));
                      }, 220);
                    }}
                    className="rounded-md p-1 text-muted-foreground sm:opacity-0 sm:transition-opacity hover:bg-background hover:text-destructive focus-visible:opacity-100 sm:group-hover:opacity-100"
                    aria-label="Remove from queue"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
    </div>
  );

  return typeof document === "undefined" ? null : createPortal(panel, document.body);
}

"use client";

import * as React from "react";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Check, ChevronLeft, Clock, Heart, ListPlus, Pencil, Plus, Sparkles } from "lucide-react";

import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  _count?: { tracks: number };
}

interface AddToPlaylistButtonProps {
  trackId: string;
  className?: string;
}

const SAMPLE_NAMES = [
  "Late night drives",
  "Workout fuel",
  "Chill study session",
  "Road trip phonk",
  "Focus flow",
];

const SUGGESTED_NAMES = ["Midnight phonk", "Workout vibes", "Road trip mix", "Focus session"];

function timeBasedName(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Midnight phonk";
  if (hour < 12) return "Morning phonk";
  if (hour < 17) return "Afternoon phonk";
  if (hour < 21) return "Evening phonk";
  return "Night drive phonk";
}

function randomSampleName(): string {
  return SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];
}

function QuickOption({
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 rounded-lg border border-input/50 px-3 py-2.5 text-left transition-all hover:border-primary/40 hover:bg-muted/50"
    >
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {hint ? <span className="block truncate text-xs text-muted-foreground">{hint}</span> : null}
      </span>
    </button>
  );
}

function StepProgress({ step }: { step: number }) {
  const labels = ["Choose a name", "Fine-tune it", "Review & create"];
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Step {step} of 3</span>
        <span>{labels[step - 1]}</span>
      </div>
      <div className="mt-1.5 flex gap-1">
        {[1, 2, 3].map((s) => (
          <span key={s} className={cn("h-1 flex-1 rounded-full", step >= s ? "bg-primary" : "bg-muted")} />
        ))}
      </div>
    </div>
  );
}

export function AddToPlaylistButton({ trackId, className }: AddToPlaylistButtonProps) {
  const { status } = useSession();
  const router = useRouter();
  const [playlists, setPlaylists] = React.useState<Playlist[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [addedId, setAddedId] = React.useState<string | null>(null);
  const [feedbackActive, setFeedbackActive] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [formStep, setFormStep] = React.useState(1);

  async function loadPlaylists() {
    if (loaded) return;
    try {
      const res = await fetch("/api/me/playlists");
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data.playlists ?? []);
        setLoaded(true);
      }
    } catch {
      /* ignore */
    }
  }

  async function addToPlaylist(playlistId: string) {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/me/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      });
      if (res.status === 409) {
        setNotice("This track is already in that playlist.");
        return;
      }
      if (!res.ok) {
        setNotice("Couldn't add the track. Please try again.");
        return;
      }
      setAddedId(playlistId);
      setFeedbackActive(true);
      window.setTimeout(() => {
        setAddedId(null);
        setFeedbackActive(false);
      }, 600);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function createAndAdd() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/me/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: "" }),
      });
      const data = await res.json();
      setCreateOpen(false);
      setName("");
      setFormStep(1);
      if (data.playlist?.id) {
        setPlaylists((prev) => (prev.some((p) => p.id === data.playlist.id) ? prev : [data.playlist, ...prev]));
        await addToPlaylist(data.playlist.id);
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function openCreate() {
    setName("");
    setFormStep(1);
    setCreateOpen(true);
  }

  function pickName(next: string) {
    setName(next);
    setFormStep(3);
  }

  return (
    <>
      <DropdownMenu
        trigger={
          <span className={cn("inline-flex items-center gap-1.5 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", className)}>
            <span className={cn("transition-transform duration-200", feedbackActive && "scale-110") }>
              {feedbackActive ? <Check className="size-4 text-success" /> : <ListPlus className="size-4" />}
            </span>
          </span>
        }
        onOpenChange={(open) => {
          if (open) {
            setNotice(null);
            if (status !== "authenticated") {
              router.push("/login");
              return;
            }
            void loadPlaylists();
          }
        }}
      >
        <div className="max-h-72 overflow-y-auto">
          {playlists.length > 0 ? (
            <>
              <DropdownMenuLabel>Add to playlist</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {playlists.map((playlist) => (
                <DropdownMenuItem key={playlist.id} onClick={() => addToPlaylist(playlist.id)} disabled={busy}>
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="truncate">{playlist.name}</span>
                    {addedId === playlist.id && <Check className="size-4 text-success" />}
                  </span>
                </DropdownMenuItem>
              ))}
            </>
          ) : (
            <DropdownMenuLabel>{loaded ? "No playlists yet" : "Loading playlists…"}</DropdownMenuLabel>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={openCreate}>
            <Plus className="text-muted-foreground" />
            New playlist
          </DropdownMenuItem>
          {notice && <p className="px-2.5 py-1.5 text-xs text-destructive">{notice}</p>}
        </div>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen} title="New playlist" description="A new home for the tracks you love.">
        {formStep === 1 && (
          <div className="flex flex-col gap-2">
            <StepProgress step={1} />
            <QuickOption icon={Heart} label="My favorites" hint="A clean home for every track you love" onClick={() => pickName("My favorites")} />
            <QuickOption icon={Clock} label="Time of day" hint={`Suggested: ${timeBasedName()}`} onClick={() => pickName(timeBasedName())} />
            <QuickOption icon={Sparkles} label="Random sample" hint="Let us pick a name for you" onClick={() => pickName(randomSampleName())} />
            <QuickOption icon={Pencil} label="Name it yourself" hint="Custom name or pick a suggestion" onClick={() => setFormStep(2)} />
            <p className="mt-2 text-xs text-muted-foreground">
              Playlists help you rediscover tracks you loved — and stumble onto new favorites faster.
            </p>
          </div>
        )}

        {formStep === 2 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) setFormStep(3);
            }}
            className="flex flex-col gap-4"
          >
            <StepProgress step={2} />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Suggestions</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_NAMES.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => pickName(suggestion)}
                    className="rounded-md border border-input/50 px-2.5 py-1.5 text-xs transition-all hover:border-primary/40 hover:bg-muted/50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Type a custom name"
              autoFocus
              maxLength={60}
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setFormStep(1)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronLeft className="size-3.5" />
                Back
              </button>
              <button
                type="submit"
                className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                disabled={!name.trim()}
              >
                Continue
              </button>
            </div>
          </form>
        )}

        {formStep === 3 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void createAndAdd();
            }}
            className="flex flex-col gap-4"
          >
            <StepProgress step={3} />
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <ListPlus className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{name.trim()}</p>
                <p className="text-xs text-muted-foreground">Ready to create and add this track</p>
              </div>
            </div>
            <button
              type="submit"
              className="flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              disabled={busy || !name.trim()}
            >
              <Check className="size-4" />
              {busy ? "Creating…" : "Create and add"}
            </button>
            <button
              type="button"
              onClick={() => setFormStep(2)}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Change name
            </button>
          </form>
        )}
      </Dialog>
    </>
  );
}

"use client";

import * as React from "react";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Check, ListPlus, Plus } from "lucide-react";

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

export function AddToPlaylistButton({ trackId, className }: AddToPlaylistButtonProps) {
  const { status } = useSession();
  const router = useRouter();
  const [playlists, setPlaylists] = React.useState<Playlist[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [addedId, setAddedId] = React.useState<string | null>(null);

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
    try {
      const res = await fetch(`/api/me/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      });
      if (res.ok) {
        setAddedId(playlistId);
        window.setTimeout(() => setAddedId(null), 1500);
      }
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
      if (data.playlist?.id) {
        setPlaylists((prev) => (prev.some((p) => p.id === data.playlist.id) ? prev : [data.playlist, ...prev]));
        await addToPlaylist(data.playlist.id);
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <DropdownMenu
        trigger={
          <span className={cn("inline-flex items-center gap-1.5 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground", className)}>
            <ListPlus className="size-4" />
          </span>
        }
        onOpenChange={(open) => {
          if (open) {
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
          <DropdownMenuItem onClick={() => setCreateOpen(true)}>
            <Plus className="text-muted-foreground" />
            New playlist
          </DropdownMenuItem>
        </div>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen} title="New playlist" description="A new home for the tracks you love.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void createAndAdd();
          }}
          className="flex flex-col gap-4"
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Midnight phonk"
            autoFocus
            maxLength={60}
          />
          <button type="submit" className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50" disabled={busy || !name.trim()}>
            Create and add
          </button>
        </form>
      </Dialog>
    </>
  );
}

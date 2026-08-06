"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Pencil, Trash2 } from "lucide-react";

import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface PlaylistActionsProps {
  playlistId: string;
  name: string;
}

export function PlaylistActions({ playlistId, name }: PlaylistActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function deletePlaylist() {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await fetch(`/api/me/playlists/${playlistId}`, { method: "DELETE" });
      router.push("/app/playlists");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu
      trigger={
        <span className="inline-flex cursor-pointer items-center rounded-md border border-input px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted">
          More
        </span>
      }
    >
      <DropdownMenuLabel>Playlist</DropdownMenuLabel>
      <DropdownMenuItem onClick={() => router.push(`/app/playlists?edit=${playlistId}`)} disabled={busy}>
        <Pencil className="text-muted-foreground" /> Edit details
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={deletePlaylist} disabled={busy} className="text-destructive">
        <Trash2 className="text-destructive" /> Delete playlist
      </DropdownMenuItem>
    </DropdownMenu>
  );
}

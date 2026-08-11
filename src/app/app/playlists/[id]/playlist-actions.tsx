"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface PlaylistActionsProps {
  playlistId: string;
  name: string;
}

export function PlaylistActions({ playlistId, name }: PlaylistActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function deletePlaylist() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/me/playlists/${playlistId}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Couldn't delete the playlist. Please try again.");
        return;
      }
      setConfirmOpen(false);
      router.push("/app/playlists");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <DropdownMenu
        trigger={
          <span className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted">
            More <MoreHorizontal className="size-4" />
          </span>
        }
      >
        <DropdownMenuLabel>Playlist</DropdownMenuLabel>
        <DropdownMenuItem icon={<Pencil />} onClick={() => router.push(`/app/playlists?edit=${playlistId}`)} disabled={busy}>
          Edit details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={<Trash2 />} onClick={() => { setError(null); setConfirmOpen(true); }} disabled={busy} destructive>
          Delete playlist
        </DropdownMenuItem>
      </DropdownMenu>

      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete playlist?"
        description={`“${name}” will be permanently deleted. This cannot be undone.`}
      >
        <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => void deletePlaylist()} disabled={busy}>
            {busy ? <><span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Deleting…</> : "Delete playlist"}
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </Dialog>
    </>
  );
}

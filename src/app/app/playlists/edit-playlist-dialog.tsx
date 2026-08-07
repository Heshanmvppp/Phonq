"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface PlaylistToEdit {
  id: string;
  name: string;
  description: string | null;
}

interface EditPlaylistDialogProps {
  playlist: PlaylistToEdit | null;
}

export function EditPlaylistDialog({ playlist }: EditPlaylistDialogProps) {
  const router = useRouter();
  const [name, setName] = React.useState(playlist?.name ?? "");
  const [description, setDescription] = React.useState(playlist?.description ?? "");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function close() {
    router.replace("/app/playlists");
  }

  async function save() {
    if (!playlist || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/me/playlists/${playlist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      if (!res.ok) {
        setError("Couldn't save changes. Please try again.");
        return;
      }
      close();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={!!playlist}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      title="Edit playlist"
      description={playlist ? `Update the details of “${playlist.name}”.` : undefined}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="flex flex-col gap-4"
      >
        <div className="space-y-1.5">
          <label htmlFor="playlist-name" className="text-xs font-medium text-muted-foreground">
            Name
          </label>
          <Input
            id="playlist-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="playlist-description" className="text-xs font-medium text-muted-foreground">
            Description
          </label>
          <textarea
            id="playlist-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            rows={3}
            className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
            placeholder="What's this playlist about?"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !name.trim()}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

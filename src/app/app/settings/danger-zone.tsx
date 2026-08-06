"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { signOut } from "next-auth/react";

import { AlertTriangle, Trash2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DangerZone() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  async function deleteData() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/me/delete", { method: "POST" });
      await signOut({ callbackUrl: "/" });
    } catch {
      setBusy(false);
    }
  }

  return (
    <Card className="border-destructive/30 p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold text-destructive">Danger zone</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently delete all your library data — favorites, playlists and listening history. Your
            Google account and profile are unaffected.
          </p>
        </div>
      </div>

      {confirmOpen ? (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-foreground">
            Are you absolutely sure? This deletes everything and signs you out. It cannot be undone.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button size="sm" variant="destructive" onClick={deleteData} disabled={busy}>
              <Trash2 className="size-4" />
              {busy ? "Deleting…" : "Yes, delete everything"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmOpen(false)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="destructive" className="mt-4" onClick={() => setConfirmOpen(true)}>
          Delete my data
        </Button>
      )}
    </Card>
  );
}

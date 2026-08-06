"use client";

import * as React from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Heart, History, Home, Library, ListMusic, Plus, Search, Settings } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/app/home", label: "Home", icon: Home },
  { href: "/app/search", label: "Search", icon: Search },
  { href: "/app/library", label: "Library", icon: Library },
  { href: "/app/liked", label: "Liked songs", icon: Heart },
  { href: "/app/history", label: "History", icon: History },
  { href: "/app/playlists", label: "Playlists", icon: ListMusic },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function createPlaylist() {
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
      router.refresh();
      if (data.playlist?.id) router.push(`/app/playlists/${data.playlist.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 flex w-16 flex-col border-r border-border bg-background md:w-60">
        <div className="flex h-16 items-center justify-center md:justify-start md:px-5">
          <Logo showWordmark={false} className="md:hidden" />
          <Logo className="hidden md:flex" />
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-2 md:px-3">
          {navigation.map((item) => {
            const active =
              pathname === item.href || (item.href !== "/app/home" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:justify-start",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-5 shrink-0" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-border p-2 md:p-3">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:justify-start"
          >
            <Plus className="size-5 shrink-0" />
            <span className="hidden md:inline">New playlist</span>
          </button>
          <Link
            href="/app/settings"
            className={cn(
              "flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:justify-start",
              pathname === "/app/settings"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Settings className="size-5 shrink-0" />
            <span className="hidden md:inline">Settings</span>
          </Link>
        </div>
      </aside>

      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="New playlist"
        description="Name your collection of tracks."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void createPlaylist();
          }}
          className="flex flex-col gap-4"
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Midnight drive" autoFocus maxLength={60} />
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            Create playlist
          </button>
        </form>
      </Dialog>
    </>
  );
}

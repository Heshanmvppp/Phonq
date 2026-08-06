"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Search } from "lucide-react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

interface AppHeaderProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function AppHeader({ name, email, image }: AppHeaderProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/app/search?q=${encodeURIComponent(q)}` : "/app/search");
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-lg sm:px-6">
      <form onSubmit={handleSubmit} className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists, albums…"
          className="h-9 w-full rounded-full border border-input bg-muted/50 pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-2 focus:ring-ring/40"
        />
      </form>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <UserMenu name={name} email={email} image={image} />
      </div>
    </header>
  );
}

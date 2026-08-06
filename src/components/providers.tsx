"use client";

import { SessionProvider } from "next-auth/react";

import { ThemeProvider } from "next-themes";

import { PlayerProvider } from "@/components/player/player-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <PlayerProvider>{children}</PlayerProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

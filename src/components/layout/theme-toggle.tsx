"use client";

import * as React from "react";

import { useTheme } from "next-themes";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // `resolvedTheme` is undefined during SSR and until the ThemeProvider hydrates,
  // so rendering the icon from it before mount would mismatch server/client HTML.
  const [mounted, setMounted] = React.useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- mount guard to prevent SSR hydration mismatch
  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  function handleToggle() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="flex cursor-pointer items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? <Moon key="moon" className="size-4 animate-theme-spin" /> : <Sun key="sun" className="size-4 animate-theme-spin" />}
    </button>
  );
}

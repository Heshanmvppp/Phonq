"use client";

import * as React from "react";

import { useTheme } from "next-themes";

import { Laptop, Moon, Sun } from "lucide-react";

import { DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu
      trigger={
        <span className="flex cursor-pointer items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Sun className="size-4 dark:hidden" />
          <Moon className="hidden size-4 dark:block" />
        </span>
      }
    >
      <DropdownMenuLabel>Theme</DropdownMenuLabel>
      <DropdownMenuItem onClick={() => setTheme("dark")}>
        <Sun className="text-muted-foreground" /> Dark
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme("light")}>
        <Moon className="text-muted-foreground" /> Light
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => setTheme("system")}>
        <Laptop className="text-muted-foreground" /> System
      </DropdownMenuItem>
    </DropdownMenu>
  );
}

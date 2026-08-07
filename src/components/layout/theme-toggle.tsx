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
      <DropdownMenuItem icon={<Sun />} onClick={() => setTheme("dark")}>
        Dark
      </DropdownMenuItem>
      <DropdownMenuItem icon={<Moon />} onClick={() => setTheme("light")}>
        Light
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem icon={<Laptop />} onClick={() => setTheme("system")}>
        System
      </DropdownMenuItem>
    </DropdownMenu>
  );
}

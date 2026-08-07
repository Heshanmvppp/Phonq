import * as React from "react";

import Link from "next/link";

import { AudioLines } from "lucide-react";

import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string;
  className?: string;
  showWordmark?: boolean;
}

export function Logo({ href = "/", className, showWordmark = true }: LogoProps) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 font-display text-lg font-bold tracking-tight", className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground ring-1 ring-inset ring-black/5 shadow-sm">
        <AudioLines className="size-5" />
      </span>
      {showWordmark && <span>Phonq</span>}
    </Link>
  );
}

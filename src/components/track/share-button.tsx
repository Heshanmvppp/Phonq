"use client";

import * as React from "react";

import { Check, Link2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface ShareButtonProps {
  url: string;
  title?: string;
  className?: string;
}

export function ShareButton({ url, title, className }: ShareButtonProps) {
  const [copied, setCopied] = React.useState(false);

  async function handleShare(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const absoluteUrl = new URL(url, window.location.href).toString();
    if (navigator.share) {
      try {
        await navigator.share({ title: title ?? document.title, url: absoluteUrl });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={cn(
        "inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
      aria-label={copied ? "Link copied" : "Share track"}
      title="Share"
    >
      {copied ? <Check className="size-4 text-success" /> : <Link2 className="size-4" />}
    </button>
  );
}

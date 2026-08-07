"use client";

import * as React from "react";

import { Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ShareTrackButton() {
  const [copied, setCopied] = React.useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <Button variant="outline" size="lg" onClick={handleShare}>
      <Link2 className="size-4" />
      {copied ? "Link copied!" : "Share"}
    </Button>
  );
}

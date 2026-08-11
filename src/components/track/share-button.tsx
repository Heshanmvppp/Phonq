"use client";

import * as React from "react";

import { Link2 } from "lucide-react";

import { ShareModal } from "@/components/track/share-modal";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  url: string;
  title?: string;
  image?: string | null;
  className?: string;
}

export function ShareButton({ url, title, image, className }: ShareButtonProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          "inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground active:scale-90",
          className,
        )}
        aria-label="Share track"
        title="Share"
      >
        <Link2 className="size-4" />
      </button>
      <ShareModal
        open={open}
        onOpenChange={setOpen}
        url={url}
        title={title}
        image={image}
      />
    </>
  );
}

"use client";

import * as React from "react";

import { Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ShareModal } from "@/components/track/share-modal";

interface ShareTrackButtonProps {
  title?: string;
  image?: string | null;
}

export function ShareTrackButton({ title, image }: ShareTrackButtonProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="outline" size="lg" onClick={() => setOpen(true)}>
        <Link2 className="size-4" />
        Share
      </Button>
      <ShareModal
        open={open}
        onOpenChange={setOpen}
        url={typeof window !== "undefined" ? window.location.href : ""}
        title={title}
        image={image}
      />
    </>
  );
}

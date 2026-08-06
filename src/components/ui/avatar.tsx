import * as React from "react";

import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
}

export function Avatar({ src, alt = "", fallback = "P", className, ...props }: AvatarProps) {
  return (
    <span
      className={cn(
        "relative inline-flex size-9 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border",
        className,
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatars come from OAuth providers
        <img src={src} alt={alt} className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-xs font-semibold text-muted-foreground">
          {fallback}
        </span>
      )}
    </span>
  );
}

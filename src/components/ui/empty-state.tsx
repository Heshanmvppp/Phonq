import type { ComponentType, ReactNode, SVGProps } from "react";

import { cn } from "@/lib/utils";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface EmptyStateProps {
  icon: IconComponent;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, children, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-xl border border-dashed p-12 text-center",
        className,
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground/70 animate-fade-up">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <div>
        <p className="font-display text-lg font-semibold">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

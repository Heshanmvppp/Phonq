import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}

export function PageHero({ eyebrow, title, description, children, align = "center", className }: PageHeroProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/[0.06] to-background px-6 py-16 sm:py-24",
        align === "center" && "text-center",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_-20%,color-mix(in_oklab,var(--color-primary)_14%,transparent),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-5xl">
        {eyebrow && (
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary/80">{eyebrow}</p>
        )}
        <h1 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{description}</p>
        )}
        {children && <div className={cn("mt-8", align === "center" && "flex flex-wrap justify-center gap-3")}>{children}</div>}
      </div>
    </div>
  );
}

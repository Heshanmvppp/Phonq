import type { Metadata } from "next";

import { changelog } from "@/content/changelog";

import { PageHero } from "@/components/marketing/page-hero";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Changelog",
  description: "What's new in Phonq — releases, fixes and improvements.",
};

const badgeStyles: Record<string, string> = {
  feature: "bg-primary/10 text-primary",
  fix: "bg-success/10 text-success",
  breaking: "bg-destructive/10 text-destructive",
  improvement: "bg-accent/10 text-accent",
};

export default function ChangelogPage() {
  return (
    <>
      <PageHero
        eyebrow="Changelog"
        title="What's new in Phonq"
        description="Every release, bug fix and improvement — in one place."
      />

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="relative space-y-8 before:absolute before:left-3 before:top-2 before:h-full before:w-px before:bg-border sm:space-y-10">
          {changelog.map((entry) => (
            <div key={entry.version} className="relative flex gap-6">
              <div className="relative z-10 mt-1 size-6 shrink-0 rounded-full border border-primary/40 bg-background">
                <div className="absolute inset-1.5 rounded-full bg-primary/70" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={badgeStyles[entry.type]}>{entry.version}</Badge>
                  <time className="text-xs text-muted-foreground">{entry.date}</time>
                  <Badge variant="outline">{entry.type}</Badge>
                </div>
                <Card className="mt-3 p-5">
                  <h2 className="font-display text-lg font-semibold">{entry.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{entry.description}</p>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

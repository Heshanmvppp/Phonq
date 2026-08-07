import type { Metadata } from "next";

import { roadmap, roadmapGroups } from "@/content/roadmap";

import { PageHero } from "@/components/marketing/page-hero";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Phonq Roadmap — Future Features & Development Plans",
  description: "See what's coming next for Phonq: artist pages, album discographies, queue drag-and-drop, personalized recommendations, and more free music features.",
};

const statusStyles: Record<string, string> = {
  "In progress": "bg-primary/10 text-primary",
  Planned: "bg-accent/10 text-accent",
  "Under consideration": "bg-muted text-muted-foreground",
  Shipped: "bg-success/10 text-success",
};

export default function RoadmapPage() {
  return (
    <>
      <PageHero
        eyebrow="Roadmap"
        title="Where Phonq is headed"
        description="Open source means the roadmap is public. Vote with issues, build with pull requests, or just follow along."
      />

      <div className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6">
        {roadmapGroups.map((group) => {
          const items = roadmap.filter((item) => item.status === group);
          if (items.length === 0) return null;
          return (
            <section key={group} className="mb-14 last:mb-0">
              <div className="flex items-center gap-3">
                <SectionHeading align="left" title={group} />
                <Badge variant="outline">{items.length}</Badge>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <Card key={item.title} className="flex flex-col p-5">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <Badge className={statusStyles[item.status]}>{item.status}</Badge>
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                    <h3 className="font-display text-base font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

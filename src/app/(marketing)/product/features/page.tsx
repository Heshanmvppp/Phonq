import type { Metadata } from "next";

import { featureGroups, features } from "@/content/features";

import { PageHero } from "@/components/marketing/page-hero";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Phonq Features — Free Music Player with Live Waveform Visualization",
  description: "Explore Phonq's complete free music player features: full-length streaming, live waveform visualization, playlist management, genre radio, and open source. No ads, no cost.",
};

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title="Everything you need. Nothing you pay for."
        description="Phonq bundles a polished player, live discovery tools and a synced library into one free, open-source package."
      />

      <div className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6">
        {featureGroups.map((group) => (
          <section key={group} className="mb-16 last:mb-0">
            <SectionHeading align="left" eyebrow="Group" title={group} />
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features
                .filter((feature) => feature.group === group)
                .map((feature) => (
                  <Card key={feature.title} className="group p-6 transition-colors hover:border-primary/40">
                    <div className="flex items-start justify-between">
                      <div className="inline-flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
                        <feature.icon className="size-5" />
                      </div>
                      <Badge variant="outline">{group}</Badge>
                    </div>
                    <h3 className="mt-4 font-display text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                  </Card>
                ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

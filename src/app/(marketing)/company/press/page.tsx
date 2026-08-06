import type { Metadata } from "next";

import { press, pressKit } from "@/content/press";

import { PageHero } from "@/components/marketing/page-hero";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Press",
  description: "Newsroom and press kit for Phonq.",
};

export default function PressPage() {
  return (
    <>
      <PageHero
        eyebrow="Company"
        title="Press & newsroom"
        description="Coverage, announcements and assets for journalists and creators."
      />

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <SectionHeading align="left" eyebrow="News" title="Latest coverage" />
        <div className="mt-8 space-y-5">
          {press.map((item) => (
            <Card key={item.title} className="p-6">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="font-semibold text-primary">{item.outlet}</span>
                <span>{item.date}</span>
              </div>
              <h2 className="mt-2 font-display text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
            </Card>
          ))}
        </div>

        <div className="mt-16">
          <SectionHeading align="left" eyebrow="Press kit" title="Assets & brand" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <Card className="p-6">
              <h3 className="font-display text-base font-semibold">Logos</h3>
              <ul className="mt-3 space-y-2">
                {pressKit.logos.map((logo) => (
                  <li key={logo.name} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{logo.name}</span>
                    <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{logo.path}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="p-6">
              <h3 className="font-display text-base font-semibold">Brand colors</h3>
              <ul className="mt-3 space-y-2">
                {pressKit.colors.map((color) => (
                  <li key={color.name} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{color.name}</span>
                    <span className="inline-flex items-center gap-2 font-mono text-xs">
                      <span className="size-3 rounded-full" style={{ backgroundColor: color.value }} />
                      {color.value}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            For interviews or quotes, email{" "}
            <a href="mailto:hello@phonq.app" className="text-primary underline underline-offset-2">
              hello@phonq.app
            </a>
            .
          </p>
        </div>
      </div>
    </>
  );
}

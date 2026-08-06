import type { Metadata } from "next";

import Link from "next/link";

import { ArrowRight, Music2 } from "lucide-react";

import { site } from "@/content/site";
import { GithubIcon } from "@/components/brand/icons";

import { PageHero } from "@/components/marketing/page-hero";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description: "The mission and story behind Phonq.",
};

const milestones = [
  {
    year: "2025",
    title: "The prototype",
    body: "Phonq started as a weekend experiment: a hand-rolled HTML5 audio player with canvas waveforms and a local library of phonk tracks. It worked, and people liked it.",
  },
  {
    year: "2025",
    title: "The reset",
    body: "We realized the future was a legal, scalable platform — not a folder of local MP3s. We paused development and planned a full rewrite around the Jamendo Creative Commons catalog.",
  },
  {
    year: "2026",
    title: "Phonq 1.0",
    body: "A from-scratch Next.js platform: global player, live waveform, accounts, favorites, playlists, history and a 500K+ track catalog. Fully open source under MIT.",
  },
];

const principles = [
  {
    title: "Free means free",
    body: "No hidden tiers. No 'premium' features. The catalog is legally free to stream, so we keep it that way for everyone.",
  },
  {
    title: "Open by default",
    body: "The code is open, the roadmap is public, and the decisions are made in the open. Anyone can contribute or fork.",
  },
  {
    title: "Artists first",
    body: "We stream only licensed music, credit artists everywhere, and drive listeners back to their pages on Jamendo.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Company"
        title="Music shouldn't be locked up"
        description="Phonq exists to give phonk — and the artists who make it — a free, legal, open home."
      />

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <SectionHeading
          align="left"
          eyebrow="Our story"
          title="How Phonq came to be"
          description="From a weekend prototype to a full open-source platform — in three short chapters."
        />

        <div className="mt-10 space-y-6">
          {milestones.map((milestone) => (
            <div key={milestone.year} className="relative flex gap-6">
              <div className="text-sm font-bold text-primary">{milestone.year}</div>
              <Card className="flex-1 p-5">
                <h3 className="font-display text-base font-semibold">{milestone.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{milestone.body}</p>
              </Card>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <SectionHeading align="left" eyebrow="Principles" title="What we believe" />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {principles.map((principle) => (
              <Card key={principle.title} className="p-5">
                <h3 className="font-display text-base font-semibold">{principle.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{principle.body}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-16 rounded-2xl border border-primary/20 bg-gradient-to-br from-violet-950/60 to-background p-8 text-center">
          <Music2 className="mx-auto size-8 text-primary" />
          <h2 className="mt-3 font-display text-2xl font-bold">Want to be part of it?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            We&apos;re always looking for contributors. Start with an issue, or just hang out.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href={site.github} target="_blank" rel="noreferrer">
                <GithubIcon /> Contribute on GitHub
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">
                Start listening <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

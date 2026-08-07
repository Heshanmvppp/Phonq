import type { Metadata } from "next";

import Link from "next/link";

import { Check, Heart, Music2 } from "lucide-react";

import { PageHero } from "@/components/marketing/page-hero";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Phonq is free now and free always. No tiers, no trials, no tricks.",
};

const included = [
  "Full-length streaming of 500K+ CC-licensed tracks",
  "Unlimited favorites and playlists",
  "Synced library across devices",
  "Live waveform visualizer",
  "Trending charts and fresh drops",
  "Legal downloads where artists allow",
  "No ads, no trackers, no data selling",
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Free. That's the whole plan."
        description="Phonq has exactly one price: zero. We're open source, community-run, and proud of it."
      />

      <div className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-lg">
          <Card className="relative overflow-hidden border-primary/30 p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <Heart className="size-4" />
              For everyone
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-6xl font-bold">$0</span>
              <span className="text-muted-foreground">/ forever</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              No subscription. No premium tier. No hidden features behind a paywall.
            </p>

            <ul className="mt-8 space-y-3">
              {included.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Button className="mt-8 w-full" size="lg" asChild>
              <Link href="/login">
                <Music2 className="size-5" />
                Start listening for free
              </Link>
            </Button>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Costs are covered by the open-source community. Hosting stays lean by design.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}

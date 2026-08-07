import type { Metadata } from "next";

import Link from "next/link";

import { ArrowRight, AudioLines, Heart, ListMusic, Music2, Radio, RefreshCw, Waves } from "lucide-react";

import { fetchFreshDrops, getCatalogStatus } from "@/lib/catalog";

import { site } from "@/content/site";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrackCard } from "@/components/track/track-card";
import { SectionHeading } from "@/components/marketing/section-heading";

export const metadata: Metadata = {
  title: site.tagline,
};

export const revalidate = 600;

const valueProps = [
  {
    icon: AudioLines,
    title: "A player you'll love",
    description: "Live waveform visualization, a persistent queue, shuffle and repeat — all free and ad-free.",
    span: "lg:col-span-4",
    points: ["Live waveform visualizer", "Queue, shuffle and repeat", "Works everywhere"],
  },
  {
    icon: Waves,
    title: "Full-length streaming",
    description: "Not 30-second previews — complete tracks, streamed legally.",
    span: "lg:col-span-2",
  },
  {
    icon: Radio,
    title: "A live catalog",
    description: "Trending phonk charts, fresh drops and genre radios from Jamendo's 500K+ library.",
    span: "lg:col-span-3",
  },
  {
    icon: Heart,
    title: "Your library",
    description: "Favorites, playlists and history that sync across devices when you sign in.",
    span: "lg:col-span-3",
  },
];

export default async function HomePage() {
  let fresh: Awaited<ReturnType<typeof fetchFreshDrops>> | null = null;
  let catalogStatus: Awaited<ReturnType<typeof getCatalogStatus>> | null = null;

  try {
    fresh = await fetchFreshDrops(12);
  } catch {
    fresh = [];
  }
  try {
    catalogStatus = await getCatalogStatus();
  } catch {
    catalogStatus = null;
  }

  const degraded = catalogStatus?.provider !== "live";

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_0%,color-mix(in_oklab,var(--color-primary)_16%,transparent),transparent)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-screen-2xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              <span className="size-2 animate-pulse rounded-full bg-primary" />
              Free. Legal. Open source.
            </p>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl">
              The free home of phonk
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Stream hundreds of thousands of Creative Commons tracks — in full, forever free. No ads,
              no paywalls, no previews. Just music.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/login">
                  Start listening <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/product/features">Explore features</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto grid max-w-screen-2xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4">
          {[
            { value: "100%", label: "Free, forever" },
            { value: "500K+", label: "CC-licensed tracks" },
            { value: "0", label: "Ads. Really." },
            { value: "MIT", label: "Open source" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-display text-3xl font-bold text-primary sm:text-4xl">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fresh drops */}
      <section className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            align="left"
            eyebrow="Just landed"
            title="Fresh phonk drops"
            description="The newest tracks added to the catalog. Start a queue and let it ride."
          />
          <Button variant="ghost" asChild>
            <Link href="/login">
              Open the app <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-8">
          {fresh.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-sm text-muted-foreground">
                The catalog is refreshing — check back shortly.
              </p>
            </Card>
          ) : (
            <>
              {degraded && (
                <p className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-center text-xs text-amber-700 dark:text-amber-400">
                  <RefreshCw className="size-3.5" />
                  We&apos;re serving a cached catalog while the live feed catches up. Streaming may be
                  limited until it&apos;s back.
                </p>
              )}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {fresh.map((track) => <TrackCard key={track.id} track={track} />)}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow="Why Phonq"
          title="Built for listeners, not for ads"
          description="Every feature exists because it makes listening better. Nothing exists to make money from you."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {valueProps.map((prop) => (
            <Card key={prop.title} className={`p-6 ${prop.span}`}>
              <div className="inline-flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <prop.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{prop.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{prop.description}</p>
              {prop.points && (
                <ul className="mt-4 space-y-2 border-t border-border pt-4">
                  {prop.points.map((point) => (
                    <li key={point} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="size-1.5 rounded-full bg-primary/60" />
                      {point}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-screen-2xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/[0.04] px-6 py-16 text-center sm:py-20">
          <Music2 className="pointer-events-none absolute -left-8 -top-8 size-40 rotate-12 text-primary/10" />
          <h2 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Your next favorite song is waiting
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Create a free account, build your library, and stream the whole catalog without spending a cent.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/login">
                Save your library <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={site.github} target="_blank" rel="noreferrer">
                <ListMusic className="size-4" /> Star us on GitHub
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

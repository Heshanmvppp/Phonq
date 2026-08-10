import type { Metadata } from "next";
import { Suspense } from "react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PHONK_SUBGENRES } from "@/lib/phonk-genres";

import { TrackStrip } from "@/components/track/track-strip";
import { SectionHeading } from "@/components/marketing/section-heading";

import {
  FreshDropsStrip,
  PersonalizedContent,
  PersonalizedSkeleton,
  RadioGrid,
  RadiosSkeleton,
  SubgenreRow,
} from "./sections";

export const metadata: Metadata = {
  title: "Home",
};

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [listenRows, favoriteRows] = await Promise.all([
    userId
      ? prisma.listen.findMany({
          where: { userId },
          orderBy: { listenedAt: "desc" },
          take: 100,
          select: { trackId: true },
        })
      : Promise.resolve<{ trackId: string }[]>([]),
    userId
      ? prisma.favorite.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: { trackId: true },
        })
      : Promise.resolve<{ trackId: string }[]>([]),
  ]);

  const listenedTrackIds = listenRows.map((row) => row.trackId);
  const favoriteTrackIds = favoriteRows.map((row) => row.trackId);
  const likedIds = new Set(favoriteTrackIds);
  const isNewUser = userId ? listenedTrackIds.length < 5 : true;
  const favoriteCount = favoriteTrackIds.length;

  return (
    <div className="space-y-14 px-4 py-8 sm:px-6 lg:px-8">
      <header className="animate-fade-up space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">
          {isNewUser ? "New here?" : "Welcome back"}
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {isNewUser ? "Start your phonk journey" : "Good to see you"}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          {isNewUser
            ? "Every track here is classified into a phonk subgenre — and nothing else. Hover a card and press play to start a queue; we learn your taste from there."
            : "Your listening history powers the picks below — from your top vibes to what&apos;s hot right now."}
        </p>
      </header>

      <Suspense
        fallback={
          <PersonalizedSkeleton />
        }
      >
        <PersonalizedContent
          userId={userId}
          listenedTrackIds={listenedTrackIds}
          favoriteTrackIds={favoriteTrackIds}
          likedIds={likedIds}
          isNewUser={isNewUser}
          listenCount={listenedTrackIds.length}
          favoriteCount={favoriteCount}
        />
      </Suspense>

      <Suspense fallback={<TrackStrip eyebrow="Just landed" title="Fresh drops" tracks={[]} loading />}>
        <FreshDropsStrip likedIds={likedIds} />
      </Suspense>

      <section className="space-y-12">
        <SectionHeading
          align="left"
          eyebrow="Explore"
          title="Browse by subgenre"
          description="Every track on Phonq is classified into one of these phonk subgenres. Scroll a row to preview — tap See all to dive in."
        />
        <div className="space-y-12">
          {PHONK_SUBGENRES.map((subgenre) => (
            <Suspense
              key={subgenre.slug}
              fallback={
                <TrackStrip
                  icon={subgenre.icon}
                  eyebrow={subgenre.group}
                  title={subgenre.name}
                  description={subgenre.aka}
                  tracks={[]}
                  loading
                />
              }
            >
              <SubgenreRow slug={subgenre.slug} likedIds={likedIds} />
            </Suspense>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          align="left"
          eyebrow="Radios"
          title="Tune in"
          description="Genre radios curated by the Jamendo editorial team."
        />
        <Suspense fallback={<RadiosSkeleton />}>
          <RadioGrid />
        </Suspense>
      </section>
    </div>
  );
}
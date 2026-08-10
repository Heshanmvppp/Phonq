import type { Metadata } from "next";
import { Suspense } from "react";

import { notFound } from "next/navigation";
import { Compass } from "lucide-react";

import { getSubgenre } from "@/lib/phonk-genres";
import { fetchSubgenreTracks } from "@/lib/catalog";

import { TrackGrid } from "@/components/track/track-grid";
import { SectionHeading } from "@/components/marketing/section-heading";
import { EmptyState } from "@/components/ui/empty-state";
import { TrackGridSkeleton } from "@/components/layout/skeletons";

interface GenrePageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: GenrePageProps): Promise<Metadata> {
  const { slug } = await params;
  const subgenre = getSubgenre(slug);
  return { title: subgenre ? subgenre.name : "Genre" };
}

export default async function GenrePage({ params }: GenrePageProps) {
  const { slug } = await params;
  const subgenre = getSubgenre(slug);
  if (!subgenre) notFound();

  const Icon = subgenre.icon;

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-7" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{subgenre.group}</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{subgenre.name}</h1>
            {subgenre.aka && <p className="mt-1 text-sm text-muted-foreground">{subgenre.aka}</p>}
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{subgenre.description}</p>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <Suspense fallback={<TrackGridSkeleton />}>
          <GenreTracks slug={slug} />
        </Suspense>
      </div>
    </div>
  );
}

async function GenreTracks({ slug }: { slug: string }) {
  const tracks = await fetchSubgenreTracks(slug, 40).catch(() => []);

  if (tracks.length === 0) {
    return (
      <EmptyState
        icon={Compass}
        title="No tracks yet"
        description="We couldn't find tracks for this subgenre right now — check back soon."
      />
    );
  }

  const subgenre = getSubgenre(slug);
  return (
    <>
      <SectionHeading
        align="left"
        eyebrow={subgenre?.name}
        title="Top tracks"
        description="The most popular tracks classified into this subgenre."
      />
      <div className="mt-6">
        <TrackGrid tracks={tracks} />
      </div>
    </>
  );
}
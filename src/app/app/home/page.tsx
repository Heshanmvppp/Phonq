import type { Metadata } from "next";

import { fetchFreshDrops, fetchRadios, fetchTrendingPhonk } from "@/lib/jamendo";

import { TrackGrid } from "@/components/track/track-grid";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Home",
};

export const dynamic = "force-dynamic";

export default async function AppHomePage() {
  const [trending, fresh] = await Promise.all([
    fetchTrendingPhonk(20).catch(() => []),
    fetchFreshDrops(20).catch(() => []),
  ]);

  const radios = await fetchRadios().catch(() => []);

  return (
    <div className="space-y-12 px-4 py-8 sm:px-6 lg:px-8">
      <section>
        <div className="flex items-end justify-between gap-4">
          <SectionHeading
            align="left"
            eyebrow="Right now"
            title="Trending in phonk"
            description="The most-played phonk tracks this week across the Jamendo catalog."
          />
        </div>
        <div className="mt-6">
          <TrackGrid tracks={trending} />
        </div>
      </section>

      <section>
        <SectionHeading
          align="left"
          eyebrow="Just landed"
          title="Fresh drops"
          description="The newest tracks added to the catalog."
        />
        <div className="mt-6">
          <TrackGrid tracks={fresh} />
        </div>
      </section>

      <section>
        <SectionHeading align="left" eyebrow="Radios" title="Tune in" description="Genre radios curated by the Jamendo editorial team." />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {radios.slice(0, 10).map((radio) => (
            <Card key={radio.id} className="flex flex-col items-center gap-3 p-5 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                {radio.displayName.slice(0, 1).toUpperCase()}
              </span>
              <p className="truncate text-sm font-medium">{radio.displayName}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

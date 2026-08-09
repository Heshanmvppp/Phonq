import type { Metadata } from "next";

import { genreGroups, genres } from "@/content/genres";

import { PageHero } from "@/components/marketing/page-hero";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Phonk Genres — A Guide to Every Phonk Subgenre",
  description:
    "From OG Memphis phonk to drift, house, Brazilian, wave, hyperphonk and dark trap — a complete breakdown of every phonk subgenre and microgenre on Phonq.",
};

export default function GenresPage() {
  return (
    <>
      <PageHero
        eyebrow="Genres"
        title="Every corner of phonk"
        description="Phonk began in the early 2010s as a hip-hop subgenre built on 90s Memphis rap, Houston chopped-and-screwed and vintage funk and jazz samples. Since then, internet micro-scenes, TikTok and global producers have fragmented it into dozens of distinct styles — here is the map."
      />

      <div className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6">
        {genreGroups.map((group) => {
          const items = genres.filter((genre) => genre.group === group);
          return (
            <section key={group} className="mb-16 last:mb-0">
              <div className="flex items-center gap-3">
                <SectionHeading align="left" title={group} />
                <Badge variant="outline">{items.length}</Badge>
              </div>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((genre) => (
                  <Card
                    key={genre.name}
                    className="group flex flex-col p-6 transition-colors hover:border-primary/40"
                  >
                    <div className="mb-4 inline-flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
                      <genre.icon className="size-5" />
                    </div>
                    <h3 className="font-display text-lg font-semibold">{genre.name}</h3>
                    {genre.aka && <p className="mt-0.5 text-xs text-muted-foreground">{genre.aka}</p>}
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {genre.description}
                    </p>
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

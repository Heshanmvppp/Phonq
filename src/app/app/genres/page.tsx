import type { Metadata } from "next";

import Link from "next/link";

import { PHONK_GROUPS, PHONK_SUBGENRES } from "@/lib/phonk-genres";

import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Genres",
};

export default function GenresIndexPage() {
  return (
    <div className="space-y-12 px-4 py-8 sm:px-6 lg:px-8">
      <SectionHeading
        align="left"
        eyebrow="Browse"
        title="Phonk subgenres"
        description="Phonq curates its catalog to the major phonk subgenres and microgenres — and nothing else. Pick a sound to dive in."
      />

      {PHONK_GROUPS.map((group) => {
        const members = PHONK_SUBGENRES.filter((subgenre) => subgenre.group === group);
        if (members.length === 0) return null;
        return (
          <section key={group}>
            <h2 className="font-display text-lg font-semibold tracking-tight">{group}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {members.map((subgenre) => {
                const Icon = subgenre.icon;
                return (
                  <Link key={subgenre.slug} href={`/app/genres/${subgenre.slug}`} className="group block">
                    <Card className="flex h-full flex-col justify-between gap-3 p-5 transition-colors hover:border-primary/50 hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                          <Icon className="size-5" aria-hidden="true" />
                        </span>
                        <p className="font-medium leading-tight">{subgenre.name}</p>
                      </div>
                      <p className="line-clamp-3 text-sm text-muted-foreground">{subgenre.description}</p>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

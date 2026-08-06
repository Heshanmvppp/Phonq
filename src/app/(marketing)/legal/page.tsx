import type { Metadata } from "next";

import Link from "next/link";

import { legalDocs } from "@/content/legal";

import { PageHero } from "@/components/marketing/page-hero";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Legal",
  description: "Legal information for Phonq — privacy, terms, licenses and more.",
};

export default function LegalIndexPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Legal"
        description="The fine print, written in plain language."
      />

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {legalDocs.map((doc) => (
            <Link key={doc.slug} href={`/legal/${doc.slug}`}>
              <Card className="h-full p-6 transition-colors hover:border-primary/40">
                <h2 className="font-display text-lg font-semibold">{doc.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{doc.intro}</p>
                <p className="mt-4 text-xs text-muted-foreground">Updated {doc.updated}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

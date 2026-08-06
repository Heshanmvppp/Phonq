import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Link from "next/link";

import { legalDocs } from "@/content/legal";

import { PageHero } from "@/components/marketing/page-hero";
import { Prose } from "@/components/marketing/prose";

interface LegalPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = legalDocs.find((d) => d.slug === slug);
  if (!doc) return { title: "Document not found" };
  return { title: doc.title, description: doc.intro };
}

export function generateStaticParams() {
  return legalDocs.map((doc) => ({ slug: doc.slug }));
}

export default async function LegalPage({ params }: LegalPageProps) {
  const { slug } = await params;
  const doc = legalDocs.find((d) => d.slug === slug);
  if (!doc) notFound();

  return (
    <>
      <PageHero
        eyebrow="Legal"
        title={doc.title}
        align="left"
        className="py-14 sm:py-20"
      >
        <p className="text-sm text-muted-foreground">
          Updated {doc.updated} ·{" "}
          <Link href="/legal" className="text-primary underline underline-offset-2">
            All legal documents
          </Link>
        </p>
      </PageHero>

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Prose>
          <p className="text-lg text-foreground">{doc.intro}</p>
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="pt-6 font-display text-xl font-semibold text-foreground">{section.heading}</h2>
              {section.body.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </section>
          ))}
        </Prose>
      </article>
    </>
  );
}

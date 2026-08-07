import type { Metadata } from "next";

import { faqCategories, faqs } from "@/content/faqs";

import { PageHero } from "@/components/marketing/page-hero";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Phonq FAQ — Answers to Common Questions",
  description: "Find answers to frequently asked questions about Phonq: streaming, licensing, downloads, account setup, technical issues, and how to contribute.",
}

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Frequently asked questions"
        description="Everything you might want to know about Phonq. Can't find an answer? Check the help center."
      />

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        {faqCategories.map((category) => {
          const items = faqs.filter((faq) => faq.category === category);
          return (
            <section key={category} className="mb-14 last:mb-0">
              <div className="flex items-center gap-3">
                <SectionHeading align="left" title={category} />
                <Badge variant="outline">{items.length}</Badge>
              </div>
              <div className="mt-6 space-y-3">
                {items.map((faq) => (
                  <Card key={faq.question} className="p-5">
                    <h3 className="font-display text-base font-semibold">{faq.question}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
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

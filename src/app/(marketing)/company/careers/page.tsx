import type { Metadata } from "next";

import Link from "next/link";

import { ArrowRight, Rocket } from "lucide-react";

import { jobs } from "@/content/careers";

import { PageHero } from "@/components/marketing/page-hero";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the team building the free home of phonk.",
};

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Company"
        title="Build the free home of phonk"
        description="Whether you want to contribute part-time or run a whole project, there's a place for you on the Phonq team."
      />

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="space-y-5">
          {jobs.map((job) => (
            <Card key={job.title} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg font-semibold">{job.title}</h2>
                  <Badge variant="outline">{job.type}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{job.location}</p>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{job.description}</p>
              </div>
              {job.role === "Hiring" ? (
                <Link
                  href="/company/contact"
                  className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Apply <ArrowRight className="size-4" />
                </Link>
              ) : (
                <Link
                  href="https://github.com/hexsyro/Phonq"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-2 rounded-md border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <Rocket className="size-4" /> Start contributing
                </Link>
              )}
            </Card>
          ))}
        </div>

        <Card className="mt-10 p-6">
          <h2 className="font-display text-lg font-semibold">Don&apos;t see your role?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The best way to join Phonq is to show up with work. Open a pull request, translate the app,
            or write a guide. We review everything with open arms.
          </p>
          <Link
            href="/resources/docs"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary underline underline-offset-2"
          >
            Read the contributor docs <ArrowRight className="size-4" />
          </Link>
        </Card>
      </div>
    </>
  );
}

import type { Metadata } from "next";

import Link from "next/link";

import { Mail } from "lucide-react";

import { team } from "@/content/team";
import { GithubIcon } from "@/components/brand/icons";

import { PageHero } from "@/components/marketing/page-hero";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Team",
  description: "The people behind Phonq.",
};

export default function TeamPage() {
  return (
    <>
      <PageHero
        eyebrow="Company"
        title="The people behind Phonq"
        description="A small founder, a large community, and one shared goal: free music for everyone."
      />

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {team.map((member) => (
            <Card key={member.name} className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
                  <span className="font-display text-lg font-bold">
                    {member.name
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </span>
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold">{member.name}</h2>
                  <p className="text-sm text-primary">{member.role}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{member.bio}</p>
              {member.github && (
                <a
                  href={`https://github.com/${member.github}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <GithubIcon className="size-4" /> @{member.github}
                </a>
              )}
            </Card>
          ))}
        </div>

        <div className="mt-16">
          <SectionHeading align="left" eyebrow="Community" title="Everyone is on the team" />
          <Card className="mt-6 p-6 text-center">
            <p className="mx-auto max-w-lg text-sm text-muted-foreground">
              Phonq is built in the open. Every contributor, reviewer and bug-reporter has a permanent
              place in this story. Want yours?
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <a
                href="https://github.com/hexsyro/Phonq"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <GithubIcon className="size-4" /> Join us on GitHub
              </a>
              <Link
                href="/company/careers"
                className="inline-flex items-center gap-2 rounded-md border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Mail className="size-4" /> See open roles
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

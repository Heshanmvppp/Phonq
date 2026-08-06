import type { Metadata } from "next";

import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { blogPosts } from "@/content/blog";

import { PageHero } from "@/components/marketing/page-hero";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Blog",
  description: "Stories, releases and guides from the Phonq team.",
};

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="The Phonq blog"
        description="Announcements, engineering deep dives and thoughts on the future of free music."
      />

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="space-y-6">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/resources/blog/${post.slug}`}>
              <Card className="group p-6 transition-colors hover:border-primary/40">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-primary/10 text-primary">{post.tag}</Badge>
                  <time className="text-xs text-muted-foreground">{post.date}</time>
                  <span className="text-xs text-muted-foreground">{post.readingTime}</span>
                </div>
                <h2 className="mt-3 font-display text-xl font-semibold group-hover:text-primary">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Read more <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

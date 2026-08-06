import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { blogPosts } from "@/content/blog";

import { PageHero } from "@/components/marketing/page-hero";
import { Prose } from "@/components/marketing/prose";
import { Badge } from "@/components/ui/badge";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return { title: "Post not found" };
  return { title: post.title, description: post.excerpt };
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title={post.title}
        align="left"
        className="py-14 sm:py-20"
      >
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Badge className="bg-primary/10 text-primary">{post.tag}</Badge>
          <span>{post.author}</span>
          <span aria-hidden>·</span>
          <time>{post.date}</time>
          <span aria-hidden>·</span>
          <span>{post.readingTime}</span>
        </div>
      </PageHero>

      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Prose>
          {post.body.map((paragraph, index) => (
            <p key={index} className={index === 0 ? "text-lg first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-5xl first-letter:font-bold first-letter:text-primary" : undefined}>
              {paragraph}
            </p>
          ))}
        </Prose>
      </article>
    </>
  );
}

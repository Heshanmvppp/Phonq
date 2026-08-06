import type { Metadata } from "next";

import Link from "next/link";

import { Server, Terminal, Upload, Wand2 } from "lucide-react";

import { site } from "@/content/site";
import { GithubIcon } from "@/components/brand/icons";

import { PageHero } from "@/components/marketing/page-hero";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Developer docs",
  description: "Phonq is open source. Learn how it's built, how the API works, and how to self-host it.",
};

const codeBlocks: { title: string; icon: typeof Server; code: string }[] = [
  {
    title: "Get a Jamendo client ID",
    icon: Wand2,
    code: `1. Create a free account at devportal.jamendo.com
2. Register a new application (any name)
3. Copy your client_id into .env:

JAMENDO_CLIENT_ID=your_client_id_here`,
  },
  {
    title: "Configure the database",
    icon: Server,
    code: `# .env
DATABASE_URL="postgresql://user:pass@your-neon-host/neondb?sslmode=require"
AUTH_SECRET="$(npx auth secret)"   # or any long random string
AUTH_GOOGLE_ID="your_google_client_id"
AUTH_GOOGLE_SECRET="your_google_client_secret"

npx prisma migrate dev
npx prisma generate`,
  },
  {
    title: "Run locally",
    icon: Terminal,
    code: `npm install
npm run dev
# → http://localhost:3000
# API health check:
curl http://localhost:3000/api/health`,
  },
  {
    title: "Deploy to Vercel",
    icon: Upload,
    code: `1. Push to GitHub and import into Vercel
2. Add the same env vars in Project → Settings → Environment
3. Deploy. That's it — the schema auto-migrates with prisma migrate deploy`,
  },
];

const endpoints = [
  { method: "GET", path: "/api/health", description: "Service health check" },
  { method: "GET", path: "/api/tracks?search=…&tags=…&boost=…", description: "Search and browse the Jamendo catalog" },
  { method: "GET", path: "/api/radios", description: "Genre radios from Jamendo" },
  { method: "GET", path: "/api/me/favorites", description: "Your favorites (requires session cookie)" },
  { method: "POST", path: "/api/me/favorites", description: "Add a favorite — body { trackId }" },
  { method: "DELETE", path: "/api/me/favorites?trackId=…", description: "Remove a favorite" },
  { method: "POST", path: "/api/me/history", description: "Record a listen — body { trackId, progress, completed }" },
  { method: "GET", path: "/api/me/playlists", description: "List your playlists" },
  { method: "POST", path: "/api/me/playlists", description: "Create a playlist — body { name, description }" },
  { method: "GET", path: "/api/me/playlists/:id", description: "Playlist with its tracks" },
  { method: "POST", path: "/api/me/playlists/:id/tracks", description: "Add a track — body { trackId }" },
];

export default function DocsPage() {
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Developer docs"
        description="Phonq is fully open source under the MIT license. Build on it, contribute to it, or run your own instance."
      />

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <SectionHeading
          align="left"
          eyebrow="Architecture"
          title="How Phonq works"
          description="A Next.js App Router frontend streams audio from the Jamendo API, while a Neon PostgreSQL database (via Prisma) powers your library."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {codeBlocks.map((block) => (
            <Card key={block.title} className="p-5">
              <div className="flex items-center gap-2">
                <block.icon className="size-4 text-primary" />
                <h3 className="font-display text-sm font-semibold">{block.title}</h3>
              </div>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-muted/60 p-4 text-xs leading-relaxed text-foreground">
                {block.code}
              </pre>
            </Card>
          ))}
        </div>

        <div className="mt-16">
          <div className="flex items-center justify-between">
            <SectionHeading align="left" eyebrow="API reference" title="REST endpoints" />
            <Badge variant="outline">v1 · JSON</Badge>
          </div>
          <Card className="mt-6 divide-y divide-border">
            {endpoints.map((endpoint) => (
              <div key={endpoint.path} className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-4">
                <span
                  className={`inline-flex w-16 shrink-0 justify-center rounded px-1.5 py-0.5 text-center text-xs font-bold ${
                    endpoint.method === "GET"
                      ? "bg-success/10 text-success"
                      : endpoint.method === "POST"
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {endpoint.method}
                </span>
                <code className="text-xs text-foreground">{endpoint.path}</code>
                <span className="text-sm text-muted-foreground sm:ml-auto">{endpoint.description}</span>
              </div>
            ))}
          </Card>
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-muted/30 p-6">
          <h3 className="font-display text-lg font-semibold">Want to contribute?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The full source is on GitHub. Pick an issue, submit a PR, or open a discussion. We review
            everything and ship fast.
          </p>
          <a
            href={site.github}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <GithubIcon className="size-4" />
            View the repository
          </a>
        </div>
      </div>
    </>
  );
}

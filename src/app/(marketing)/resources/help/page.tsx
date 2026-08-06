import type { Metadata } from "next";

import Link from "next/link";

import { BookOpen, CheckCircle2, Mail, MessageSquare, PlayCircle } from "lucide-react";

import { PageHero } from "@/components/marketing/page-hero";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Help center",
  description: "Troubleshooting and support for Phonq.",
};

const helpTopics = [
  {
    icon: PlayCircle,
    title: "Audio won't play",
    body: "Phonq streams full-length tracks, so buffering is normal on slow connections. Try pausing for a moment, skipping ahead, or switching to a lower-quality network. If a specific track fails, it may be unavailable on Jamendo's side — try another one.",
  },
  {
    icon: CheckCircle2,
    title: "Waveform isn't animating",
    body: "The live visualizer uses the Web Audio API, which some browsers restrict for security when a stream's CORS headers aren't present. Phonq automatically falls back to a decorative visualizer. Playback is never affected.",
  },
  {
    icon: MessageSquare,
    title: "Favorites not saving",
    body: "Favorites, playlists and history require sign-in. If you're signed in and still see issues, refresh the page. If it persists, your session may have expired — sign out and back in.",
  },
  {
    icon: BookOpen,
    title: "How do I download a track?",
    body: "Open the track and look for the download button. It only appears when the artist has enabled downloads. Downloaded tracks are yours to keep, subject to the Creative Commons license shown on the track.",
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Help center"
        description="Troubleshooting guides for the most common questions."
      />

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {helpTopics.map((topic) => (
            <Card key={topic.title} className="p-6">
              <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <topic.icon className="size-5" />
              </div>
              <h2 className="mt-4 font-display text-lg font-semibold">{topic.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{topic.body}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-10 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Still need help?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Check the FAQ first, or email us and we&apos;ll get back to you.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/resources/faq"
              className="rounded-md border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              View FAQ
            </Link>
            <a
              href="mailto:hello@phonq.app"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Mail className="size-4" />
              Email support
            </a>
          </div>
        </Card>
      </div>
    </>
  );
}

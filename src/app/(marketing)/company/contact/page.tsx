import type { Metadata } from "next";

import { Mail } from "lucide-react";

import { PageHero } from "@/components/marketing/page-hero";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Phonq team.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Company"
        title="Talk to us"
        description="Questions, feedback, partnerships or press — we read everything."
      />

      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Card className="p-6 sm:p-8">
          <form
            action="mailto:hello@phonq.app"
            method="get"
            className="space-y-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                  Name
                </label>
                <Input id="name" name="subject" placeholder="Your name" required />
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                  Email
                </label>
                <Input id="email" name="cc" type="email" placeholder="you@example.com" required />
              </div>
            </div>
            <div>
              <label htmlFor="message" className="mb-1.5 block text-sm font-medium">
                Message
              </label>
              <textarea
                id="message"
                name="body"
                rows={6}
                required
                placeholder="How can we help?"
                className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Mail className="size-4" />
              Send message
            </button>
            <p className="text-xs text-muted-foreground">
              This opens your email client. We reply within 7 days.
            </p>
          </form>
        </Card>
      </div>
    </>
  );
}

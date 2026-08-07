import * as React from "react";

import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, CheckCircle2, Mail } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { EmailSignInForm } from "@/components/auth/email-sign-in-form";
import { Logo } from "@/components/brand/logo";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign in",
};

const faqItems = [
  {
    q: "Is it really free forever?",
    a: "Yes. No credit card. No trials. No hidden costs. Phonq is sustained by the open-source community.",
  },
  {
    q: "What happens after I sign in?",
    a: "Your favorites, playlists and listening history sync instantly across every device. No setup needed.",
  },
  {
    q: "Do you store my listening data?",
    a: "Only what you choose to save — favorites, playlists, history. We never sell or track you.",
  },
];

export default function LoginPage() {
  const emailEnabled = Boolean(process.env.AUTH_RESEND_KEY);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at-50%_0%,color-mix(in_oklab,var(--color-primary)_14%,transparent),transparent)]"
        aria-hidden
      />
      <div className="relative flex w-full max-w-md flex-col items-center">
        <Logo />
        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight">Your music, everywhere</h1>
        <p className="mt-2 text-center text-muted-foreground">
          Sign in with Google or an email link to sync your library. Takes 5 seconds, costs nothing.
        </p>

        <Card className="mt-8 w-full p-6">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-success" />
              <span>Start listening immediately — no setup required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-success" />
              <span>Loved tracks and playlists sync across all devices</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-success" />
              <span>Cancel anytime. Forever free, no questions asked</span>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Here&apos;s what happens in 3 steps</p>
            <ol className="mt-2 space-y-2 text-sm">
              <li className="flex items-center gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
                <span>Sign in with Google — we never see your password</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
                <span>Your library loads instantly from Day 1</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
                <span>Stream the full phonk catalog, ad-free forever</span>
              </li>
            </ol>
          </div>

          <React.Suspense fallback={<div className="h-11 animate-pulse rounded-md bg-muted" />}>
            <GoogleSignInButton />
          </React.Suspense>

          {emailEnabled ? (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-3.5" /> or with email
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <React.Suspense fallback={<div className="h-11 animate-pulse rounded-md bg-muted" />}>
                <EmailSignInForm />
              </React.Suspense>
            </>
          ) : (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Email sign-in isn&apos;t enabled on this instance.
            </p>
          )}

          <div className="mt-6 flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <ShieldCheck className="size-4" />
            <span>We only use Google to verify your identity. Never your password.</span>
          </div>
        </Card>

        <div className="mt-8 space-y-4">
          {faqItems.map((item) => (
            <details key={item.q} className="text-sm">
              <summary className="cursor-pointer list-none font-medium text-foreground">
                {item.q}
              </summary>
              <p className="mt-1 text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>

        <p className="mt-8 max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
          No account needed to listen — browsing and streaming are always free. Sign in only unlocks
          your saved library.{" "}
          <Link href="/product/features" className="text-primary underline underline-offset-2">
            See what&apos;s included
          </Link>
        </p>
      </div>
    </div>
  );
}

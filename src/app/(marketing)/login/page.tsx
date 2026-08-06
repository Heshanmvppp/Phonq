import * as React from "react";

import type { Metadata } from "next";

import Link from "next/link";

import { ShieldCheck } from "lucide-react";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Logo } from "@/components/brand/logo";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_0%,rgba(168,85,247,0.25),transparent)]"
        aria-hidden
      />
      <div className="relative flex w-full max-w-md flex-col items-center">
        <Logo />
        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight">Welcome to Phonq</h1>
        <p className="mt-2 text-center text-muted-foreground">
          Sign in to sync your favorites, playlists and listening history across devices.
        </p>

        <Card className="mt-8 w-full p-6">
          <React.Suspense fallback={<div className="h-11 animate-pulse rounded-md bg-muted" />}>
            <GoogleSignInButton />
          </React.Suspense>

          <div className="mt-6 flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <ShieldCheck className="size-4" />
            <span>We only use Google to verify your identity. We never see your password.</span>
          </div>
        </Card>

        <p className="mt-8 max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
          No account needed to listen — browsing and streaming are always free. Sign in only unlocks
          your saved library.{" "}
          <Link href="/product/features" className="text-primary underline underline-offset-2">
            Learn more
          </Link>
        </p>
      </div>
    </div>
  );
}

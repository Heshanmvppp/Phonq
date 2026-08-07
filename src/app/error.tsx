"use client";

import * as React from "react";

import Link from "next/link";

import { AudioLines } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center px-4 py-24 text-center">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_0%,color-mix(in_oklab,var(--color-primary)_12%,transparent),transparent)]"
        aria-hidden
      />
      <div className="relative flex flex-col items-center">
        <AudioLines className="size-12 text-primary" aria-hidden="true" />
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          The speakers blew
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Something went wrong on our end while loading this page. Try again — if it keeps happening,
          it&apos;s probably us, not you.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </div>
        {error.digest ? (
          <p className="mt-6 text-xs text-muted-foreground">Error reference: {error.digest}</p>
        ) : null}
      </div>
    </div>
  );
}

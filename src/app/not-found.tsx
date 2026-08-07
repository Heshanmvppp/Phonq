import Link from "next/link";

import { AudioLines } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center px-4 py-24 text-center">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_0%,color-mix(in_oklab,var(--color-primary)_12%,transparent),transparent)]"
        aria-hidden
      />
      <div className="relative flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <AudioLines className="size-24 text-primary/15" aria-hidden="true" />
          <span className="absolute font-display text-5xl font-bold tracking-tight text-primary">404</span>
        </div>
        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          This track fell off the record
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          The page you&apos;re after doesn&apos;t exist, moved, or was never pressed. Head back to the
          homepage and keep listening.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/product/features">See what&apos;s included</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import { MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function EmailSignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/app/home";
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const result = await signIn("email", { email: email.trim(), callbackUrl, redirect: false });
      if (result?.error) {
        setError("We couldn't send that link. Check the address and try again.");
      } else {
        setSent(true);
      }
    } catch {
      setError("We couldn't send that link. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg bg-success/10 p-4 text-center text-sm text-success">
        <MailCheck className="size-5" />
        <p className="font-medium">Check your inbox</p>
        <p className="text-xs text-muted-foreground">
          We&apos;ve sent a sign-in link to <span className="text-foreground">{email}</span>. It
          expires in 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-11"
        aria-label="Email address"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="submit" className="w-full" variant="outline" size="lg" disabled={busy}>
        {busy ? "Sending…" : "Email me a sign-in link"}
      </Button>
    </form>
  );
}

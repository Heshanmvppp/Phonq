"use client";

import * as React from "react";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/brand/icons";

export function GoogleSignInButton() {
  const searchParams = useSearchParams();
  const [busy, setBusy] = React.useState(false);

  async function handleSignIn() {
    setBusy(true);
    const callbackUrl = searchParams.get("callbackUrl") ?? "/app/home";
    await signIn("google", { callbackUrl });
  }

  return (
    <Button className="w-full" size="lg" onClick={handleSignIn} disabled={busy}>
      <span className="flex min-w-0 items-center justify-center gap-2">
        {busy ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <GoogleIcon size={18} />}
        <span>{busy ? "Redirecting…" : "Continue with Google"}</span>
      </span>
    </Button>
  );
}

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
      <GoogleIcon size={18} />
      {busy ? "Redirecting…" : "Continue with Google"}
    </Button>
  );
}

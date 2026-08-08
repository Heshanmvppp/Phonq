import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Email from "next-auth/providers/email";

import { PrismaAdapter } from "@auth/prisma-adapter";

import { prisma } from "@/lib/prisma";

if (!process.env.AUTH_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET is not set. Generate one with: openssl rand -base64 32"
    );
  }
  process.env.AUTH_SECRET = "dev-only-fallback-secret-change-me";
}

/**
 * Email magic-link provider using the Resend HTTP API directly (no nodemailer).
 * Enabled only when `AUTH_RESEND_KEY` is set, so a clone without it still boots
 * with just Google (or with no providers at all — browsing stays free).
 */
const emailProvider = process.env.AUTH_RESEND_KEY
  ? [
      Email({
        from: process.env.AUTH_EMAIL_FROM ?? "noreply@phonq.app",
        sendVerificationRequest: async ({ identifier, url, provider }) => {
          const apiKey = process.env.AUTH_RESEND_KEY;
          if (!apiKey) throw new Error("AUTH_RESEND_KEY is not set");
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: provider.from ?? process.env.AUTH_EMAIL_FROM,
              to: identifier,
              subject: "Your Phonq sign-in link",
              html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
  <h2 style="margin-top:0">Sign in to Phonq</h2>
  <p>Click the button below to sign in. It expires in 24 hours and works once.</p>
  <p style="text-align:center;margin:32px 0">
    <a href="${url}" style="background:#9d67e9;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">Sign in to Phonq</a>
  </p>
  <p style="color:#6b7280;font-size:12px">If you didn't request this, you can safely ignore this email.</p>
</div>`,
              text: `Sign in to Phonq: ${url}`,
            }),
          });
          if (!res.ok) {
            throw new Error("Failed to send verification email");
          }
        },
      }),
    ]
  : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      authorization: { params: { scope: "openid email profile" } },
    }),
    ...emailProvider,
  ],
  callbacks: {
    session: ({ session, token }) => {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});

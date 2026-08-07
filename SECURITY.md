# Security Policy

## Reporting a vulnerability

Please report security issues by emailing **hello@phonq.app**.

We ask you not to open a public issue for vulnerabilities — give us a chance to
fix and release before details go public.

**Please include:**

- A description of the vulnerability and the impact you observed
- Steps to reproduce (or a minimal proof of concept)
- Which versions / commits are affected

We aim to acknowledge reports within **48 hours** and to ship a fix as soon as
we can reasonably reproduce and validate it. We'll keep you updated on progress
and credit you in the changelog if you'd like.

## Scope

In scope:

- The Phonq web app and API (`src/`), including auth, the catalog layer and
  database access
- Any credentials, secrets, or data-handling logic
- The Prisma schema and migrations

Out of scope:

- The upstream Jamendo API, its CDN, or the music itself
- Third-party services (Neon, Vercel, Google, Resend)

## Things we take seriously

- Account or data leaks (favorites, playlists, history, PII)
- Auth bypasses (Google or email sign-in)
- Injection or SSRF issues in the API
- Anything that would let an attacker impersonate the service

## Safe harbor

We will not pursue legal action against researchers who report issues
responsibly, in good faith, and within the scope above.

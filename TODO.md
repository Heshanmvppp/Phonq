# TODO — Phonq

> Open tasks and ideas. Check [ROADMAP.md](ROADMAP.md) for the high-level direction and
> [ARCHITECTURE.md](ARCHITECTURE.md) for how the code is organized.

## Testing

- [x] Set up Vitest and test the API route handlers, catalog fallback ladder, utils, rate limiter.
- [ ] Unit-test the player state machine (queue, shuffle, repeat, seek).
- [ ] Component tests for LikeButton, AddToPlaylist, Dialog.
- [ ] Integration tests for `/api/v1/*` against the static snapshot fallback.

## Features

- [ ] Artist pages: discography, bio, similar artists (Jamendo `/artists`).
- [ ] Album pages: track listing, release date, cover.
- [ ] Queue drag-and-drop reordering.
- [ ] Personalized recommendations from listening history.
- [x] Download button with license badge where `audioDownloadAllowed`.
- [ ] PWA manifest + offline queue.
- [ ] i18n (next-intl or similar).

## Sharing & API

- [x] Public shareable track page (`/track/[id]`) with OG tags.
- [x] Embed player (`/embed/[id]`, frame-ancestors relaxed so it can be iframed).
- [x] Public read-only API (`/api/v1/tracks`, `/api/v1/search`) — rate-limited, no key.
- [ ] API tokens / OAuth for third-party apps; pagination cursors.
- [ ] Webhooks or RSS for new releases.

## Polish

- [ ] Skeleton loaders on server pages (library, playlists).
- [ ] Empty/error states with retry buttons on all app pages.
- [ ] Keyboard shortcuts (space = play/pause, arrows = seek).
- [ ] Better mobile layout for the player bar and queue panel.
- [ ] OG image generation for blog posts and pages.

## Infrastructure

- [x] Database migrations committed to `prisma/migrations` (`0000_init`).
- [x] GitHub Actions: lint, typecheck, tests, production build on CI.
- [x] Self-hosting: `Dockerfile` + `docker-compose.yml` (migrate on boot).
- [ ] Analytics: privacy-friendly, self-hosted (e.g. Plausible/Umami) — no third-party cookies.
- [ ] Rate limiting on a shared store (Upstash Redis) for multi-instance deploys.

## Repository / community

- [ ] Enable GitHub Discussions, create "good first issue" labels on real issues.
- [ ] Add real screenshots to `docs/screenshots/` (currently referenced as placeholders in README).
- [ ] Move the second live provider (Free Music Archive / ccMixter) past the interface stub in `catalog.ts`.

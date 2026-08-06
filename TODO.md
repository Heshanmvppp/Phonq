# TODO — Phonq

> Open tasks and ideas. Check [ROADMAP.md](ROADMAP.md) for the high-level direction and
> [ARCHITECTURE.md](ARCHITECTURE.md) for how the code is organized.

## Testing

- [ ] Set up Vitest and test the API route handlers (favorites, playlists, history).
- [ ] Unit-test the player state machine (queue, shuffle, repeat, seek).
- [ ] Component tests for LikeButton, AddToPlaylist, Dialog.

## Features

- [ ] Artist pages: discography, bio, similar artists (Jamendo `/artists`).
- [ ] Album pages: track listing, release date, cover.
- [ ] Queue drag-and-drop reordering.
- [ ] Personalized recommendations from listening history.
- [ ] Download button with license badge where `audioDownloadAllowed`.
- [ ] PWA manifest + offline queue.
- [ ] i18n (next-intl or similar).

## Polish

- [ ] Skeleton loaders on server pages (library, playlists).
- [ ] Empty/error states with retry buttons on all app pages.
- [ ] Keyboard shortcuts (space = play/pause, arrows = seek).
- [ ] Better mobile layout for the player bar and queue panel.
- [ ] OG image generation for blog posts and pages.

## Infrastructure

- [ ] Database migrations committed to `prisma/migrations` (run `npx prisma migrate dev`).
- [ ] GitHub Actions: also run `prisma migrate deploy`-style checks on CI.
- [ ] Analytics: privacy-friendly, self-hosted (e.g. Plausible/Umami) — no third-party cookies.
- [ ] Rate limiting on a shared store (Upstash Redis) for multi-instance deploys.

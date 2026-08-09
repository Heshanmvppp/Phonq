# Phonq — Architecture

This document describes how Phonq is built. It is intentionally short — the goal is to give a
new contributor a mental model in five minutes.

## High level

```
Browser
   │
   ├─ Public site (App Router) ─── /, /login, /product/*, /resources/*, /company/*, /legal/*
   ├─ Public share/embed ───────── /track/[id], /embed/[id]
   ├─ Authenticated app ────────── /app/*  (requires Google OAuth or email magic link)
   └─ REST API ─────────────────── /api/*, /api/v1/*
            │
            ├─ Catalog layer (src/lib/catalog.ts)
            │     ├─ Jamendo API (https://api.jamendo.com/v3.0) ── audio streams + metadata (default)
            │     ├─ YouTube Data API (src/lib/youtube.ts) ── genre-gap fill via IFrame Player
            │     │     ├─ Postgres `youtube_videos` + `youtube_video_mappings` ── search cache
            │     │     └─ Postgres `youtube_quota` ── daily search budget ledger
            │     ├─ Postgres `cached_tracks` ── cache when upstream fails
            │     └─ Bundled static snapshot ── always-on fallback
            └─ Neon PostgreSQL (via Prisma + @prisma/adapter-neon) ── user data
```

Music never touches our servers. Jamendo streams are fetched directly from their CDN
(which is what makes serving the whole catalog free); YouTube-sourced tracks play through
the official IFrame Player API (a 200×200 hidden-but-live element + our custom UI on top).
Playback therefore survives upstream outages — only the metadata feed degrades, falling
back in a ladder (below).

## Folders

| Path                | Responsibility                                            |
| ------------------- | --------------------------------------------------------- |
| `src/app/(marketing)`| Public pages. Split into `product`, `resources`, `company`, `legal` groups. |
| `src/app/app`       | The authenticated player app (`/app/…`). Protected by `layout.tsx` via `auth()`. |
| `src/app/track` / `src/app/embed` | Public shareable track page (OG tags) and iframe-able embed player. |
| `src/app/api`       | Route handlers. Public: `v1/tracks`, `v1/search`, `tracks`, `radios`, `health`. Authenticated: `me/*`. |
| `src/components/player` | Global audio engine. `PlayerProvider` owns the `<audio>` element and queue state. |
| `src/components/embed` | Minimal client player used by the `/embed/[id]` route. |
| `src/components/track`  | Track cards/rows + favorite/playlist/share actions. |
| `src/components/ui`     | Minimal design-system primitives (no component library). |
| `src/lib`           | `catalog.ts` (resilient catalog layer), `jamendo.ts` (upstream client), `auth.ts`, `prisma.ts`, `rate-limit.ts`, `api.ts`, `utils.ts`. |
| `src/content`       | Typed content for the marketing site + the bundled `featured-tracks`/`featured-radios` fallback. |

## Data model

`prisma/schema.prisma` uses `@@map` (snake_case tables) and a `prisma-client` generator that
outputs to `src/generated/prisma`. Tables:

- `users` — from Google OAuth or email magic link (name, email, image)
- `accounts` / `sessions` / `verification_tokens` — Auth.js standard
- `playlists` + `playlist_tracks` — user collections, ordered by `position`
- `favorites` — liked tracks
- `listens` — history (one row per user+track, updated with progress)
- `cached_tracks` — last successful catalog responses (track lists), for the cache tier
- `catalog_status` — single row recording last success/failure and the current provider
- `youtube_videos` — YouTube videos cached for genre-gap fill (metadata + `source` = search|playlist)
- `youtube_video_mappings` — song_title + artist → video_id cache; a hit skips `search.list`
- `youtube_quota` — daily YouTube API quota ledger (units + search count), for the search budget

The catalog is **not** a primary store. It lives on Jamendo (with YouTube filling genre
gaps), and Phonq degrades in a ladder: live Jamendo → `cached_tracks` (Postgres, written
throttled on success) → bundled static snapshot in `src/content/featured-tracks.ts`.
`getCatalogStatus()` reflects the active provider and never lets upstream error strings
reach the UI (errors are logged server-side only).

## The player (`player-context.tsx`)

- One `<audio>` element for Jamendo tracks, owned by `PlayerProvider` (wrapped in the root layout).
- A `<YouTubeEngine>` (200×200 IFrame Player, `src/components/player/youtube-engine.tsx`) handles
  YouTube-sourced tracks (no direct stream). Its state/time is reported back into the same shared
  player state, so the UI doesn't care which engine is playing.
- Queue state: `queue: Track[]`, `queueIndex`, `shuffle`, `repeat` (`off|all|one`).
- `playTrack(track, queue?)` — plays a track with an optional queue context, so "next" works in any list.
- **CORS probe**: before wiring the Web Audio analyser, we probe the stream origin once with a
  ranged request. If the CDN allows CORS, we connect `createMediaElementSource` → `AnalyserNode`
  and render a live waveform to a canvas. If not, playback continues with a decorative fallback.
  (YouTube playback uses the decorative fallback — the IFrame engine has no analyser.)
- **Media Session**: metadata + play/pause/next/previous handlers are registered so lock-screen
  and notification controls work on mobile.
- **History**: on `play`, the player POSTs to `/api/me/history` once per track id.

## API routes

| Route                          | Auth | Purpose                            |
| ------------------------------ | ---- | ---------------------------------- |
| `GET /api/v1/tracks`           | no   | Public read-only catalog API (rate-limited) |
| `GET /api/v1/search`           | no   | Public read-only search API (rate-limited) |
| `GET /api/health`              | no   | Uptime check + current catalog provider |
| `GET /api/youtube/*`           | no   | YouTube resolve / genre-fill / quota status (rate-limited) |
| `GET /api/tracks`              | no   | Search/browse catalog (rate-limited) |
| `GET /api/radios`              | no   | Genre radios                       |
| `GET|POST /api/me/favorites`   | yes  | List / add favorites               |
| `DELETE /api/me/favorites`     | yes  | Remove favorite (`trackId`)        |
| `POST /api/me/history`         | yes  | Record a listen                    |
| `GET|POST /api/me/playlists`   | yes  | List / create playlists            |
| `GET|PATCH|DELETE /api/me/playlists/[id]` | yes | Playlist CRUD            |
| `POST|DELETE /api/me/playlists/[id]/tracks` | yes | Add / remove tracks      |
| `POST /api/me/delete`          | yes  | Delete all library data            |

All `/api/me/*` routes resolve the session with `auth()` and reject with `401` when missing.
Public routes are rate-limited with a fixed-window in-memory limiter.

## Conventions

- Server components fetch data directly (`auth()`, `prisma`, `catalog.ts`) — no fetching layer.
- Client components talk to the API with `fetch` and `router.refresh()` after mutations.
- Mutations live behind routes; pages stay `"use server"` by default.
- Styling uses Tailwind 4 CSS-first config (`@theme` tokens in `globals.css`), OKLCH colors.
- Icons come from `lucide-react`; brand icons (GitHub, Google) are inline SVGs in `brand/icons.tsx`.

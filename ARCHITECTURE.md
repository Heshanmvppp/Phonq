# Phonq — Architecture

This document describes how Phonq is built. It is intentionally short — the goal is to give a
new contributor a mental model in five minutes.

## High level

```
Browser
   │
   ├─ Public site (App Router) ─── /, /login, /product/*, /resources/*, /company/*, /legal/*
   ├─ Authenticated app ────────── /app/*  (requires Google OAuth session)
   └─ REST API ─────────────────── /api/*
            │
            ├─ Jamendo API (https://api.jamendo.com/v3.0) ── audio streams + track metadata
            └─ Neon PostgreSQL (via Prisma + @prisma/adapter-neon) ── user data
```

Music never touches our servers. The browser fetches audio streams directly from Jamendo's CDN,
which is what makes serving the whole catalog effectively free.

## Folders

| Path                | Responsibility                                            |
| ------------------- | --------------------------------------------------------- |
| `src/app/(marketing)`| Public pages. Split into `product`, `resources`, `company`, `legal` groups. |
| `src/app/app`       | The authenticated player app (`/app/…`). Protected by `layout.tsx` via `auth()`. |
| `src/app/api`       | Route handlers. Public: `tracks`, `radios`, `health`. Authenticated: `me/*`. |
| `src/components/player` | Global audio engine. `PlayerProvider` owns the `<audio>` element and queue state. |
| `src/components/track`  | Track cards/rows + favorite/playlist actions. |
| `src/components/ui`     | Minimal design-system primitives (no component library). |
| `src/lib`           | `jamendo.ts` (API client), `auth.ts`, `prisma.ts`, `rate-limit.ts`, `api.ts`, `utils.ts`. |
| `src/content`       | Typed content for the marketing site (features, FAQ, legal, blog, roadmap…). |

## Data model

`prisma/schema.prisma` uses `@@map` (snake_case tables) and a `prisma-client` generator that
outputs to `src/generated/prisma`. Tables:

- `users` — from Google OAuth (name, email, image)
- `accounts` / `sessions` / `verification_tokens` — Auth.js standard
- `playlists` + `playlist_tracks` — user collections, ordered by `position`
- `favorites` — liked tracks
- `listens` — history (one row per user+track, updated with progress)

The catalog itself is **not** in the database. Track data comes from Jamendo on demand and is
cached in-memory for 10 minutes.

## The player (`player-context.tsx`)

- One `<audio>` element, owned by `PlayerProvider` (wrapped in the root layout).
- Queue state: `queue: Track[]`, `queueIndex`, `shuffle`, `repeat` (`off|all|one`).
- `playTrack(track, queue?)` — plays a track with an optional queue context, so "next" works in any list.
- **CORS probe**: before wiring the Web Audio analyser, we probe the stream origin once with a
  ranged request. If the CDN allows CORS, we connect `createMediaElementSource` → `AnalyserNode`
  and render a live waveform to a canvas. If not, playback continues with a decorative fallback.
- **History**: on `play`, the player POSTs to `/api/me/history` once per track id.

## API routes

| Route                          | Auth | Purpose                            |
| ------------------------------ | ---- | ---------------------------------- |
| `GET /api/health`              | no   | Uptime check                       |
| `GET /api/tracks`              | no   | Search/browse Jamendo (rate-limited) |
| `GET /api/radios`              | no   | Genre radios                       |
| `GET|POST /api/me/favorites`   | yes  | List / add favorites               |
| `DELETE /api/me/favorites`     | yes  | Remove favorite (`trackId`)        |
| `POST /api/me/history`         | yes  | Record a listen                    |
| `GET|POST /api/me/playlists`   | yes  | List / create playlists            |
| `GET|PATCH|DELETE /api/me/playlists/[id]` | yes | Playlist CRUD            |
| `POST|DELETE /api/me/playlists/[id]/tracks` | yes | Add / remove tracks      |
| `POST /api/me/delete`          | yes  | Delete all library data            |

All `/api/me/*` routes resolve the session with `auth()` and reject with `401` when missing.
Public Jamendo-facing routes are rate-limited with a fixed-window in-memory limiter.

## Conventions

- Server components fetch data directly (`auth()`, `prisma`, `jamendo.ts`) — no fetching layer.
- Client components talk to the API with `fetch` and `router.refresh()` after mutations.
- Mutations live behind routes; pages stay `"use server"` by default.
- Styling uses Tailwind 4 CSS-first config (`@theme` tokens in `globals.css`), OKLCH colors.
- Icons come from `lucide-react`; brand icons (GitHub, Google) are inline SVGs in `brand/icons.tsx`.

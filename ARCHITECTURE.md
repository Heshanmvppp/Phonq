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
            │     ├─ YouTube Data API v3 ── genre-gap fill via IFrame Player
            │     │     ├─ src/lib/youtube.ts ── resolve/search/cache orchestration
            │     │     ├─ src/lib/youtube-pool.ts ── **10-project quota pool router**
            │     │     │     • every key serves live `search.list` (whole pool ≈ 1,000/day)
            │     │     │     • cheap 1-unit ops (videos/playlistItems/channels) share the pool
            │     │     │     • per-project/per-op unit counters kept in Redis
            │     │     │     • 403/429 → key charged to limit, pool rotates (markProjectExhausted)
            │     │     ├─ src/lib/yt-redis.ts ── **Redis accelerator** (Upstash REST)
            │     │     │     • `search:{q}` (24h) + `song:{videoId}` read-through (12h)
            │     │     │     • negative cache (2h), quota + `ratelimit:{bucket}:{key}` counters
            │     │     │     • in-process bandwidth meter → `redis_usage_log` (daily)
            │     │     │     • optional: degrades to Postgres when absent, to in-memory in dev
            │     │     └─ src/lib/youtube-db.ts ── Prisma client
            │     │           • main app DB (shared) OR dedicated Neon `YOUTUBE_DATABASE_URL`
            │     │           • `songs` (lean catalog), `api_call_log` + `redis_usage_log` ledgers
            │     │           • nightly prune job (`scripts/prune-youtube.ts`) trims stale rows
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
| `src/lib`           | `catalog.ts` (resilient catalog layer), `jamendo.ts` (upstream client), `youtube.ts` + `youtube-pool.ts` + `yt-redis.ts` + `youtube-db.ts` (YouTube catalog), `auth.ts`, `prisma.ts`, `rate-limit.ts`, `api.ts`, `utils.ts`. |
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
- `songs` — lean YouTube catalog (one row per video, ~1 KB): metadata + `genre_tag` +
  `quality_score` + `last_played_at`; lives in a dedicated Neon DB when
  `YOUTUBE_DATABASE_URL` is set, else in the main app DB
- `api_call_log` — daily per-project YouTube API call log (burn-rate visibility; surfaces
  a suspended/quota-exhausted project before the search budget is silently spent)
- `redis_usage_log` — daily Redis bandwidth ledger (approx bytes read/written + hit/miss),
  accumulated from the in-process meter in `yt-redis` on each API call; tracks the ~10 GB
  monthly egress budget before the provider throttles

### Redis key inventory (`yt-redis`)

Capacity is configured on the provider (`maxmemory 200mb`, `maxmemory-policy allkeys-lru`),
not in code. TTLs are env-overridable (`YOUTUBE_REDIS_*_TTL`):

| Key pattern                         | Value                       | TTL     |
| ----------------------------------- | --------------------------- | ------- |
| `search:{normalized_query}`         | `video_id`                  | 24h     |
| `song:{video_id}`                   | small JSON (metadata)       | 12h     |
| `neg:{normalized_query}`            | `"1"` (negative cache)      | 2h      |
| `quota:{project}:{op}:{date}`       | counter                     | 24h     |
| `ratelimit:{bucket}:{key}`          | counter (API rate limiter)  | window+1s |

`search:` holds the whole catalog's hot-lookup mappings; `song:` is a true read-through in
front of Postgres, so most song-detail lookups (playback restore, resolve) are served by
Redis with Postgres hit only on cold cache or writes. The `ratelimit:` counter replaces the
old per-instance map once Redis is wired (falling back to it while Redis is down).

The catalog is **not** a primary store. It lives on Jamendo (with YouTube filling genre
gaps), and Phonq degrades in a ladder: live Jamendo → `cached_tracks` (Postgres, written
throttled on success) → bundled static snapshot in `src/content/featured-tracks.ts`.
`getCatalogStatus()` reflects the active provider and never lets upstream error strings
reach the UI (errors are logged server-side only).

## The player (`player-context.tsx`)

- One `<audio>` element for all tracks, owned by `PlayerProvider` (wrapped in the root layout).
  Jamendo streams play via the `/api/audio` same-origin proxy; YouTube-sourced tracks play via the
  `/api/youtube/stream` proxy (`src/lib/youtube-stream.ts` extracts a deciphered audio URL with
  youtube.js — clients rotate ANDROID_VR → MWEB → WEB, with a yt-dlp `-g` fallback — then streams
  the bytes back same-origin, forwarding Range requests so seeking works).
- A `<YouTubeEngine>` (200×200 IFrame Player, `src/components/player/youtube-engine.tsx`) is kept as a
  fallback only: if streaming fails, `PlayerProvider` flips into fallback mode and the video plays
  through the IFrame API instead. Its state/time is reported back into the same shared player state,
  so the UI doesn't care which engine is playing.
- Queue state: `queue: Track[]`, `queueIndex`, `shuffle`, `repeat` (`off|all|one`).
- `playTrack(track, queue?)` — plays a track with an optional queue context, so "next" works in any list.
- **CORS probe**: before wiring the Web Audio analyser, we probe the stream origin once with a
  ranged request. If the CDN allows CORS, we connect `createMediaElementSource` → `AnalyserNode`
  and render a live waveform to a canvas. If not, playback continues with a decorative fallback.
  Both proxies are same-origin, so YouTube streams feed the analyser just like Jamendo; only the
  IFrame fallback uses the decorative waveform. A failed stream remounts the `<audio>` element
  (keyed on fallback mode) so the dead media-source chain can't leak into later tracks.
- **Media Session**: metadata + play/pause/next/previous handlers are registered so lock-screen
  and notification controls work on mobile.
- **History**: on `play`, the player POSTs to `/api/me/history` once per track id.

## API routes

| Route                          | Auth | Purpose                            |
| ------------------------------ | ---- | ---------------------------------- |
| `GET /api/v1/tracks`           | no   | Public read-only catalog API (rate-limited) |
| `GET /api/v1/search`           | no   | Public read-only search API (rate-limited) |
| `GET /api/health`              | no   | Uptime check + current catalog provider |
| `GET /api/youtube/*`           | no   | YouTube resolve / genre-fill / quota + Redis bandwidth status (rate-limited) |
| `GET /api/youtube/stream`      | no   | Same-origin audio proxy for YouTube tracks: youtube.js/yt-dlp extraction + Range-forwarding stream (rate-limited) |
| `GET /api/download/:videoId`   | no   | Download a YouTube track as m4a via yt-dlp (rate-limited, catalog-gated) |
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

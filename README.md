# 🎵 Phonq — The free home of phonk

<div align="center">

[![MIT License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square)](https://typescriptlang.org)
[![Neon](https://img.shields.io/badge/DB-Neon%20Postgres-00e599?style=flat-square)](https://neon.tech)

Phonq is a free, open-source music streaming platform built for the **phonk** community.
Stream hundreds of thousands of **Creative Commons** tracks — legally, in full, forever free.

</div>

---

## ✨ What is Phonq?

Phonq streams the entire **Jamendo** catalog (500K+ CC-licensed tracks) with:

- 🎧 **A real music player** — full-length streaming, a live waveform visualizer (Web Audio API), a persistent queue, shuffle, repeat and volume control
- 🔥 **Live discovery** — trending phonk charts and fresh drops straight from the API, plus genre radios
- 🔍 **Full-catalog search** — tracks, artists, albums, tags and BPM
- ❤️ **Your library** — favorites, playlists and listening history that sync across devices via **Google OAuth 2.0**
- 🆓 **Zero ads, zero paywalls** — and legally free downloads where the artist allows

And it's **100% open source** under the MIT license. Fork it, audit it, self-host it, or build on it.

## 🚀 Tech Stack

| Layer     | Technology                                                        |
| --------- | ----------------------------------------------------------------- |
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack)          |
| Language  | TypeScript 5.9                                                    |
| Styling   | Tailwind CSS 4 (OKLCH phonk-purple theme)                         |
| Auth      | Auth.js v5 (NextAuth) + Google OAuth 2.0                          |
| Database  | [Neon](https://neon.tech) PostgreSQL via Prisma 7 (driver adapter)|
| Music     | [Jamendo API](https://developer.jamendo.com) — CC-licensed tracks |
| Deploy    | Vercel (serverless, ready)                                        |

## 📁 Project Structure

```
phonq/
├── prisma/
│   ├── schema.prisma         # Users, playlists, favorites, listens
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (marketing)/      # Public site: /, /login, product, resources, company, legal
│   │   ├── app/              # Authenticated app: /app/home, search, library, playlists…
│   │   └── api/              # Route handlers (/api/tracks, /api/me/*)
│   ├── components/
│   │   ├── ui/               # Button, Card, Dialog, DropdownMenu, Slider…
│   │   ├── player/           # PlayerContext, PlayerBar, QueuePanel, Waveform
│   │   ├── track/            # TrackCard, TrackRow, LikeButton, AddToPlaylist
│   │   └── layout/           # Nav, Footer, AppSidebar, AppHeader
│   ├── content/              # Marketing content (features, FAQ, legal, blog…)
│   ├── lib/                  # jamendo client, auth, prisma, rate-limit, api helpers
│   └── generated/prisma/     # Prisma client (generated — don't edit)
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full technical design.

## 🧰 Prerequisites

- Node.js 20+ (built and tested on 24)
- A free [Neon](https://neon.tech) PostgreSQL database
- A free [Jamendo client_id](https://devportal.jamendo.com) (register an app)
- A [Google OAuth](https://console.cloud.google.com/apis/credentials) client ID + secret

## ⚙️ Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   fill in DATABASE_URL, JAMENDO_CLIENT_ID, AUTH_SECRET,
#   AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, NEXT_PUBLIC_APP_URL

# 3. Create the database schema
npx prisma migrate dev

# 4. Run the dev server
npm run dev          # → http://localhost:3000
```

> **Jamendo client_id**: Phonq cannot ship with a working public key — Jamendo suspends
> shared test keys. Create your own (free, 2 minutes) at
> [devportal.jamendo.com](https://devportal.jamendo.com). Without it, the catalog endpoints
> return a friendly error and the app still renders.

## 📦 Scripts

| Script                | Description                            |
| --------------------- | -------------------------------------- |
| `npm run dev`         | Start the dev server (Turbopack)       |
| `npm run build`       | Generate Prisma client + production build |
| `npm run start`       | Serve the production build             |
| `npm run lint`        | ESLint                                 |
| `npm run typecheck`   | `tsc --noEmit`                         |
| `npm run db:generate` | `prisma generate`                      |
| `npm run db:deploy`   | `prisma migrate deploy`                |
| `npm run db:studio`   | Open Prisma Studio                     |

## ☁️ Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add the same env vars as `.env` in **Project → Settings → Environment Variables**.
3. Deploy. Run `npx prisma migrate deploy` once (via a Vercel build step or locally) to create the tables.

## 🤝 Contributing

Contributions are welcome — docs, translations, bug fixes, features. See
[CONTRIBUTING.md](CONTRIBUTING.md). In short:

```bash
git clone https://github.com/Heshanmvppp/Phonq.git
cd Phonq && npm install
# make your changes…
npm run lint && npm run typecheck
```

## 📄 License

MIT — see [LICENSE](LICENSE). Music is licensed by its artists under Creative Commons via
[Jamendo](https://www.jamendo.com); Phonq does not own the catalog.

---

<div align="center">
  <i>Built with ❤️ for the phonk community · <a href="https://github.com/Heshanmvppp">@Heshanmvppp</a></i>
</div>

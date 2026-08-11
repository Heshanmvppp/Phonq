# Multi-stage build for self-hosting Phonq.
# The final image keeps node_modules so `prisma migrate deploy` can run on boot.

FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000
# ffmpeg + yt-dlp back the /api/download endpoint for YouTube-sourced tracks
# (transcode bestaudio to m4a and stream it back). The standalone yt-dlp binary
# bundles its own Python, so only ffmpeg comes from apt.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg curl \
  && curl -fsSL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
  && chmod a+rx /usr/local/bin/yt-dlp \
  && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/.env.example ./.env.example
EXPOSE 3000
# Apply migrations (idempotent) then serve. DATABASE_URL comes from the container env.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]

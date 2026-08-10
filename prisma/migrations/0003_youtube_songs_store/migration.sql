-- Dedicated YouTube catalog store (Layer 3) + quota-monitoring ledger.
-- These tables back `youtube.ts`'s catalog layer. When `YOUTUBE_DATABASE_URL`
-- is set, migrations are applied to that Neon DB to isolate the catalog from
-- user data (`users`, `playlists`, `favorites`, `listens`).

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Lean song catalog. ~1 KB/row → 500 MB ≈ 400-500k songs. No thumbnail URLs
-- (reconstructed from the video id); no raw API-response dumps.
CREATE TABLE "songs" (
    "videoId"      VARCHAR(11) PRIMARY KEY,
    "title"        TEXT NOT NULL,
    "artist"       TEXT NOT NULL,
    "channelId"    VARCHAR(24),
    "channelTitle" TEXT,
    "durationSec"  SMALLINT NOT NULL DEFAULT 0,
    "genreTag"     VARCHAR(32),
    "qualityScore" SMALLINT NOT NULL DEFAULT 0,
    "embedStatus"  BOOLEAN NOT NULL DEFAULT true,
    "lastPlayedAt" TIMESTAMPTZ,
    "cachedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
    "source"       TEXT NOT NULL DEFAULT 'search'
);

CREATE INDEX "idx_song_genre"        ON "songs"("genreTag");
CREATE INDEX "idx_song_last_played"  ON "songs"("lastPlayedAt");
CREATE INDEX "idx_song_quality"      ON "songs"("qualityScore");
CREATE INDEX "idx_song_artist_trgm"  ON "songs" USING gin ("artist" gin_trgm_ops);
CREATE INDEX "idx_song_title_trgm"   ON "songs" USING gin ("title" gin_trgm_ops);
CREATE INDEX "idx_song_channel_topic" ON "songs"("channelTitle")
    WHERE "channelTitle" LIKE '%- Topic';

-- Per-call log for burn-rate visibility (project + endpoint + unit cost).
CREATE TABLE "api_call_log" (
    "id"         BIGSERIAL PRIMARY KEY,
    "projectId"  SMALLINT,
    "endpoint"   VARCHAR(32) NOT NULL,
    "unitCost"   SMALLINT NOT NULL DEFAULT 1,
    "calledAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "idx_api_call_log_project_calls" ON "api_call_log"("projectId", "calledAt");
CREATE INDEX "idx_api_call_log_called_at"     ON "api_call_log"("calledAt");

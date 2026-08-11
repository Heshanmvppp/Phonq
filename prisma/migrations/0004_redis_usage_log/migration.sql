-- Redis bandwidth ledger (Layer 2 accounting). One row per calendar date,
-- accumulated from the in-process meter in `yt-redis` whenever a YouTube API
-- call is recorded (see `recordBandwidth` in youtube-db.ts). Lives alongside
-- `api_call_log` so the monthly Upstash egress budget (~10 GB) is visible
-- before the provider starts throttling.

CREATE TABLE "redis_usage_log" (
    "id"         BIGSERIAL PRIMARY KEY,
    "date"       VARCHAR(10) NOT NULL,
    "ops"        INTEGER NOT NULL DEFAULT 0,
    "read_bytes" BIGINT NOT NULL DEFAULT 0,
    "write_bytes" BIGINT NOT NULL DEFAULT 0,
    "hits"       INTEGER NOT NULL DEFAULT 0,
    "misses"     INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "redis_usage_log_date_key" ON "redis_usage_log"("date");

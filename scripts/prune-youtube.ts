/**
 * Monthly prune of the YouTube catalog (`songs`) to keep the 500 MB dedicated DB
 * sustainable. Mirrors the architecture's pruning job:
 *
 *   DELETE FROM songs
 *   WHERE quality_score < 30
 *     AND (last_played_at IS NULL OR last_played_at < now() - interval '60 days')
 *
 * A song with `quality_score >= 30` is never pruned (high-confidence seeds:
 * Topic channels, official/VEVO uploads). Low-confidence fills that nobody has
 * played in 60 days are dropped to reclaim space.
 *
 *   npm run prune:youtube            # dry run
 *   npm run prune:youtube -- --apply # actually delete
 *
 * When `YOUTUBE_DATABASE_URL` is unset, pruning runs against the main app DB
 * (the shared fallback), so it's always available.
 */
import "dotenv/config";

import { pruneStaleSongs } from "../src/lib/youtube-db";

const APPLY = process.argv.includes("--apply");
const MIN_QUALITY = Number(process.env.YOUTUBE_PRUNE_MIN_QUALITY ?? 30);
const MAX_AGE_DAYS = Number(process.env.YOUTUBE_PRUNE_MAX_AGE_DAYS ?? 60);

async function main(): Promise<void> {
  if (!APPLY) {
    console.log(`[dry-run] would prune songs with qualityScore < ${MIN_QUALITY} and last_played_at older than ${MAX_AGE_DAYS} days.`);
  }
  const result = await pruneStaleSongs(MIN_QUALITY, MAX_AGE_DAYS, !APPLY);

  if (!APPLY) {
    const sample = (result ?? []) as Array<{ videoId: string; title: string; qualityScore: number }>;
    console.log(`[dry-run] ${sample.length} song(s) would be pruned. Examples:`);
    for (const s of sample.slice(0, 10)) {
      console.log(`  - ${s.qualityScore}  ${s.videoId}  ${s.title}`);
    }
    console.log(`Re-run with --apply to delete them.`);
    return;
  }

  if (typeof result === "number") {
    console.log(`Pruned ${result} stale song(s) (quality < ${MIN_QUALITY}, unplayed > ${MAX_AGE_DAYS} days).`);
  } else {
    console.log("Prune complete (no count returned).");
  }
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

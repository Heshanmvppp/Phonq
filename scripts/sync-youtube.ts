/**
 * Bulk-seeds the YouTube catalog for a genre gap using `playlistItems.list`
 * (1 unit per 50 items) instead of `search.list` (100 units each).
 *
 * Requires a working `YOUTUBE_API_KEYS` (the 10-project quota pool) and a
 * reachable `DATABASE_URL` / `YOUTUBE_DATABASE_URL`:
 *
 *   YOUTUBE_API_KEYS=… npm run sync:youtube -- --playlist PL_ID --subgenre brazilian
 *
 * Playlist paging + metadata refresh use the playback slice of the quota pool
 * (1-unit ops), so bulk backfills consume almost none of the live-search budget.
 * Re-running upserts the rows (metadata is refreshed from videos.list).
 */
import "dotenv/config";

import { hasProjects } from "../src/lib/youtube-pool";
import { seedFromPlaylist } from "../src/lib/youtube";

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const value = process.argv.find((a) => a.startsWith(prefix));
  return value ? value.slice(prefix.length) : undefined;
}

async function main(): Promise<void> {
  const playlistId = arg("playlist");
  const subgenre = arg("subgenre");
  const max = Math.min(Math.max(Number(arg("max") ?? 200), 1), 500);

  if (!hasProjects()) {
    console.error(
      "sync:youtube needs YouTube API keys. Set YOUTUBE_API_KEYS (comma-separated\n" +
        "list of up to 10 GCP service-account keys). All keys serve live searches;\n" +
        "setting YOUTUBE_SEARCH_PROJECTS=N reserves the first N for search only.",
    );
    process.exit(1);
  }
  if (!playlistId || !subgenre) {
    console.error("Usage: npm run sync:youtube -- --playlist=<playlistId> --subgenre=<slug> [--max=200]");
    process.exit(1);
  }

  console.log(`Seeding subgenre "${subgenre}" from playlist ${playlistId} (up to ${max} items)...`);
  const videos = await seedFromPlaylist(playlistId, subgenre, max);
  console.log(`Seeded ${videos.length} songs -> songs (source=playlist, subgenre=${subgenre}).`);
  if (videos.length === 0) {
    console.error("No videos seeded — is the playlist public and the key valid?");
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

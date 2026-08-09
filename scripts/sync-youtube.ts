/**
 * Bulk-seeds the YouTube catalog for a genre gap using `playlistItems.list`
 * (1 unit per 50 items) instead of `search.list` (100 units each).
 *
 * Requires a working `YOUTUBE_API_KEY` and a reachable `DATABASE_URL`:
 *
 *   YOUTUBE_API_KEY=… npm run sync:youtube -- --playlist PL_ID --subgenre brazilian
 *
 * Curated uploads-playlists / genre playlists are cheap to seed this way — you
 * can backfill hundreds of tracks for the cost of a handful of search calls.
 * Re-running upserts the rows (metadata is refreshed from videos.list).
 */
import "dotenv/config";
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

  if (!process.env.YOUTUBE_API_KEY) {
    console.error("sync:youtube needs a working YOUTUBE_API_KEY.");
    process.exit(1);
  }
  if (!playlistId || !subgenre) {
    console.error(
      "Usage: npm run sync:youtube -- --playlist=<playlistId> --subgenre=<slug> [--max=200]",
    );
    process.exit(1);
  }

  console.log(`Seeding subgenre "${subgenre}" from playlist ${playlistId} (up to ${max} items)…`);
  const videos = await seedFromPlaylist(playlistId, subgenre, max);
  console.log(`Seeded ${videos.length} videos → youtube_videos (source=playlist, subgenre=${subgenre}).`);
  if (videos.length === 0) {
    console.error("No videos seeded — is the playlist public and the key valid?");
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

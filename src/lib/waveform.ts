/**
 * Deterministic, decorative waveform profiles used when a stream can't be
 * inspected by the Web Audio analyser (e.g. a YouTube track whose native
 * `/api/youtube/stream` playback fell back to the cross-origin IFrame engine).
 *
 * These values are a function of the track id only — there is no `Date.now()`
 * or other time dependency — so a given track renders a stable, *per-track*
 * shape instead of the same generic hump (or the old animated placeholder).
 * It can't be a *live* visualizer (no audio data is available cross-origin),
 * but it lets the bar visually resemble the analyzed waveform of a Jamendo
 * track rather than a moving sine wave.
 */

const SEED_DEFAULT = 0xc0ffee;

/** djb2 variant — stable, fast, well-distributed for short string ids. */
export function hashTrackId(id: string | null | undefined): number {
  let hash = SEED_DEFAULT;
  const s = id ?? "";
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 33) ^ s.charCodeAt(i);
  }
  return hash >>> 0;
}

/** Tiny xorshift PRNG seeded from a numeric hash. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  if (state === 0) state = SEED_DEFAULT;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0xffffffff;
  };
}

/** MediaError code name for diagnostic logging. */
export function mediaErrorName(code: number | null | undefined): string {
  switch (code) {
    case 1:
      return "MEDIA_ERR_ABORTED";
    case 2:
      return "MEDIA_ERR_NETWORK";
    case 3:
      return "MEDIA_ERR_DECODE";
    case 4:
      return "MEDIA_ERR_SRC_NOT_SUPPORTED";
    default:
      return "MEDIA_ERR_UNKNOWN";
  }
}

/**
 * Deterministic per-track amplitude profile (0–255) of `count` bars.
 * The shape varies with the track id but is identical on every call, so the
 * visualizer stays stable while still looking like a real analyzed waveform.
 */
export function decorativeWaveform(id: string | null | undefined, count: number = 64): number[] {
  const seed = hashTrackId(id);
  const rand = seededRandom(seed);

  // Per-track modulation: a waveform frequency and phase drift derived solely
  // from the seed, so different tracks get recognizably different shapes.
  const freq = 1 + (seed % 3); // 1..3
  const drift = ((seed >>> 2) % 90) / 180; // ~0..0.5

  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 0 : i / (count - 1);
    const envelope = Math.sin(t * Math.PI); // broad hump, ~0 at the edges
    const mod = Math.sin(t * Math.PI * freq + drift * Math.PI);
    const noise = (rand() - 0.5) * 0.3;
    const level = Math.max(0, Math.min(1, envelope * 0.5 + mod * 0.25 + noise + 0.2));
    values.push(Math.round(level * 255));
  }
  return values;
}

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  readingTime: string;
  tag: string;
  body: string[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "phonq-1-0-is-live",
    title: "Phonq 1.0 is live — the free home of phonk",
    date: "2026-08-06",
    author: "The Phonq Team",
    excerpt:
      "After a full rewrite, Phonq is finally live: a free, open-source streaming platform with a live 500K+ track catalog, legal downloads, and zero ads.",
    readingTime: "4 min read",
    tag: "Announcement",
    body: [
      "Today we're launching Phonq 1.0, a complete rebuild of the phonk streaming platform we first prototyped in 2025. The goal hasn't changed: a free, legal, beautiful home for phonk music and the community around it. What's new is everything underneath.",
      "The old version was a static site streaming local MP3 files. Phonq 1.0 is a full-stack Next.js application. We stream the entire Jamendo catalog — more than half a million Creative Commons tracks — live, in full length, for free. The player is built from scratch with a real-time waveform visualizer, a persistent queue with shuffle and repeat, and buffering that respects your connection.",
      "Accounts now work properly. Sign in with Google OAuth and your favorites, playlists and listening history sync across every device. No ads, no trackers, no paywall — just music.",
      "Phonq is open source under the MIT license. Every line of the platform is on GitHub for you to read, audit, fork or self-host. If you love phonk and build software, we'd love your pull requests.",
      "Thank you to every artist who licenses their music openly on Jamendo — you make a platform like this possible. And thank you, listener. Now go turn it up.",
    ],
  },
  {
    slug: "building-a-web-audio-waveform-player",
    title: "Building the Phonq player: Web Audio, CORS and graceful degradation",
    date: "2026-07-28",
    author: "The Phonq Team",
    excerpt:
      "A deep dive into how Phonq's waveform visualizer works, why CORS matters for real-time audio analysis, and how we keep playback bulletproof.",
    readingTime: "6 min read",
    tag: "Engineering",
    body: [
      "Every music app needs a player. Making one that feels great — and doesn't break — is the hard part. In this post we walk through the audio engine that powers Phonq.",
      "The core is a single HTML5 audio element owned by a global React context. That context holds the queue, shuffle and repeat state, and survives navigation across the app. When you press play on a track card, we build the queue from the section you're in, so 'next' and 'previous' always make sense.",
      "The waveform is the fun part. We route the audio element through an AnalyserNode in the Web Audio API and read frequency data every animation frame, drawing bars onto a canvas. There's a catch though: the Web Audio API only lets you analyse media that was loaded with CORS approval.",
      "Before connecting the graph, we probe the stream with a ranged CORS request. If the stream allows it, we wire up the analyser. If not — which happens with some CDNs — we swap to a deterministic, decorative visualizer. The key decision was to make playback completely independent of the visualizer. No analyser, no problem: the music always plays.",
      "The same defensive thinking applies to the queue. Shuffle uses a Fisher-Yates-safe 'don't repeat yourself' index picker, repeat modes are handled at the 'ended' event, and everything degrades gracefully on mobile and slow connections.",
      "You can read the whole implementation in the open-source repository. Building it taught us a lot about Web Audio, and we're happy to share.",
    ],
  },
  {
    slug: "why-creative-commons-music",
    title: "Why we stream Creative Commons music (and why you should too)",
    date: "2026-07-15",
    author: "The Phonq Team",
    excerpt:
      "Streaming full songs legally for free isn't magic — it's Creative Commons licensing. Here's how it works and why it's the future of free music platforms.",
    readingTime: "5 min read",
    tag: "Music",
    body: [
      "Free music platforms usually mean one of two things: ad-supported streaming with label licensing, or piracy. Phonq deliberately chose a third path: Creative Commons.",
      "Creative Commons is a set of public licenses that let creators keep their copyright while granting everyone permission to share and remix their work — often including commercial use. On Jamendo, the platform we stream from, more than 500,000 tracks are published under these licenses, and artists explicitly allow free streaming and downloads.",
      "Why does this matter for you as a listener? Because 'free' here is actually free. No hidden paywall for the good stuff. No ads sold against your listening data. And when a track says it's free to download, it's legally free to download, forever.",
      "It matters for artists too. Open licensing is a discovery engine: a listener on Phonq finds your track, hears it on repeat, and follows you back to Jamendo where you can monetize through their licensing programs. Everyone wins.",
      "If you're building a music app, we strongly recommend starting with a licensed catalog like Jamendo rather than scraping streams. It's more reliable, it's ethical, and — as Phonq proves — it's more than enough music to build something people love.",
    ],
  },
];

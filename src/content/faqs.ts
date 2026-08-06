export interface Faq {
  question: string;
  answer: string;
  category: "Product" | "Music & licensing" | "Accounts" | "Technical" | "Contribution";
}

export const faqs: Faq[] = [
  {
    category: "Product",
    question: "Is Phonq really free?",
    answer:
      "Yes. Phonq is completely free — no subscriptions, no premium tier, no ads. The music catalog (Jamendo) is Creative Commons licensed, so streaming it legally costs nothing, and the app itself is open source under the MIT license.",
  },
  {
    category: "Music & licensing",
    question: "Where does the music come from?",
    answer:
      "All tracks come from the Jamendo API, the world's largest free music library with more than 500,000 tracks. Every track is Creative Commons licensed and the rights holders have explicitly allowed free streaming and, in most cases, free downloads.",
  },
  {
    category: "Music & licensing",
    question: "Can I download tracks?",
    answer:
      "When the artist enables downloads (most do), you'll find a download button on the track. Downloads are legal and permanent — the Creative Commons license applies. Tracks where the artist disabled downloads show a badge instead.",
  },
  {
    category: "Music & licensing",
    question: "How do I credit artists?",
    answer:
      "Creative Commons licenses usually require attribution. We always display artist and album names, and each track page links back to the original artist's page on Jamendo. If you reuse a track in a project, credit the artist as displayed.",
  },
  {
    category: "Accounts",
    question: "Why do I need to sign in?",
    answer:
      "Sign-in (via Google OAuth 2.0) powers your personal features: favorites, playlists and listening history synced across devices. You can browse and listen without an account — favorites and playlists just won't be saved.",
  },
  {
    category: "Accounts",
    question: "What data do you store about me?",
    answer:
      "Only what's needed: your name, email and profile picture from Google, plus your favorites, playlists and listening history. We never sell data, we don't show ads, and you can export or delete everything in Settings.",
  },
  {
    category: "Technical",
    question: "Why is an audio track slow to start on mobile?",
    answer:
      "Phonq streams full songs rather than previews, and high-quality audio is bigger. On a slower connection, playback buffers a little before starting. Use the seek bar to skip ahead while buffering.",
  },
  {
    category: "Technical",
    question: "Does the waveform visualizer work everywhere?",
    answer:
      "It uses the Web Audio API. Browsers block the analyser when a stream's CORS headers aren't available, so we automatically fall back to a decorative visualizer — playback itself is never affected.",
  },
  {
    category: "Contribution",
    question: "How can I contribute?",
    answer:
      "Phonq is open source. File issues, submit pull requests, translate the UI, or help with documentation on GitHub. Check the CONTRIBUTING guide and the roadmap to see where help is most needed.",
  },
  {
    category: "Contribution",
    question: "Can I self-host Phonq?",
    answer:
      "Absolutely. It's a standard Next.js app — clone the repo, point it at a Neon PostgreSQL database, add your own Jamendo client ID and Google OAuth credentials, and deploy it anywhere (Vercel included).",
  },
];

export const faqCategories = ["Product", "Music & licensing", "Accounts", "Technical", "Contribution"] as const;

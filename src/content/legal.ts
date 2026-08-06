export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalDoc {
  slug: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

export const legalDocs: LegalDoc[] = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    updated: "August 6, 2026",
    intro:
      "Phonq is built on a simple belief: free music shouldn't cost your privacy. This policy explains exactly what data we collect, why, and what you can do about it.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "When you sign in with Google OAuth, we store your name, email address and profile picture. We use them only to identify your account and personalize your experience.",
          "When you use Phonq, we store your favorites, playlists and listening history. This data powers the core features of the platform and is tied to your account.",
          "We collect minimal technical logs (IP address, browser, pages visited) for security and to diagnose errors. We do not sell this data to anyone.",
        ],
      },
      {
        heading: "What we never do",
        body: [
          "We do not show ads. We do not sell your data. We do not track you across the web. We do not use third-party analytics cookies to build a profile of you.",
          "The only cookies we set are the authentication cookie (so you stay signed in) and the theme preference stored locally in your browser.",
        ],
      },
      {
        heading: "Music streaming data",
        body: [
          "Streaming is handled by Jamendo, the music catalog provider. When you play a track, your browser fetches the audio from Jamendo's CDN. Jamendo's own privacy policy applies to those requests.",
          "We store a record of which tracks you played so your history works, but this data is only associated with your account and is never shared publicly.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You can export or permanently delete all of your data from the Settings page at any time. Deleting your account removes your favorites, playlists, history and profile data from our database.",
          "You can also withdraw Google access to Phonq at any time from your Google account security settings.",
        ],
      },
      {
        heading: "Data retention",
        body: [
          "We keep your data for as long as your account exists. If an account is inactive for 24 months, we may contact you first, then delete the account data.",
          "Technical logs are automatically deleted after 30 days.",
        ],
      },
      {
        heading: "Contact",
        body: [
          "Questions about this policy? Email hello@phonq.app. We'll reply within 7 days.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of Service",
    updated: "August 6, 2026",
    intro:
      "Welcome to Phonq. By using the platform you agree to these terms. They're short, fair, and written in plain language.",
    sections: [
      {
        heading: "Use of the service",
        body: [
          "Phonq provides a free streaming platform for Creative Commons music. You may use it for personal, non-commercial listening and, where a track's license permits, for your own projects with attribution.",
          "You must not attempt to reverse-engineer, scrape or bulk-download the catalog, abuse the API, or interfere with the service for other users.",
        ],
      },
      {
        heading: "Your account",
        body: [
          "You are responsible for keeping your Google account credentials secure. Phonq will never ask you for your password.",
          "We may suspend or delete accounts that violate these terms, abuse the service, or are found to be operating multiple automated accounts.",
        ],
      },
      {
        heading: "Music licensing",
        body: [
          "All music on Phonq is Creative Commons licensed by its artists. Phonq does not own this music. Respect the license shown on each track, including any attribution requirements.",
          "Downloading a track is only permitted where the artist has enabled downloads. Republishing, reselling or claiming ownership of a track is not permitted unless the license explicitly allows it.",
        ],
      },
      {
        heading: "No warranty",
        body: [
          "Phonq is provided 'as is' without warranties of any kind. The service may be interrupted for maintenance, and we don't guarantee uninterrupted availability.",
          "Phonq is a volunteer and community project. We do our best, but we can't promise the service is error-free.",
        ],
      },
      {
        heading: "Limitation of liability",
        body: [
          "To the maximum extent permitted by law, Phonq and its contributors are not liable for any indirect or consequential damages arising from your use of the service.",
        ],
      },
      {
        heading: "Changes",
        body: [
          "We may update these terms as the platform grows. Material changes will be announced on the changelog. Continued use after changes means you accept the new terms.",
        ],
      },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie Policy",
    updated: "August 6, 2026",
    intro:
      "Phonq keeps cookies to the absolute minimum. This page lists every cookie we set and what it does.",
    sections: [
      {
        heading: "Strictly necessary cookies",
        body: [
          "The authentication cookie (set by Auth.js) keeps you signed in. Without it, sign-in wouldn't work.",
          "It is an HTTP-only, secure, SameSite cookie. It cannot be read by JavaScript and it is not used for tracking.",
        ],
      },
      {
        heading: "Preference storage",
        body: [
          "Your theme choice (dark/light/system) and volume are stored in your browser's localStorage, not in cookies. localStorage never leaves your device.",
        ],
      },
      {
        heading: "Third-party cookies",
        body: [
          "Phonq sets no third-party advertising or analytics cookies. Streaming requests to Jamendo's CDN are governed by Jamendo's own policies.",
        ],
      },
      {
        heading: "Managing cookies",
        body: [
          "You can clear cookies and localStorage from your browser at any time. Signing out removes the auth cookie from your browser.",
        ],
      },
    ],
  },
  {
    slug: "license",
    title: "Licenses",
    updated: "August 6, 2026",
    intro:
      "Phonq is free and open source. This page collects the licenses for the platform's own code and for the music we stream.",
    sections: [
      {
        heading: "Software license",
        body: [
          "The Phonq platform (the code in the GitHub repository) is licensed under the MIT License.",
          "You may use, copy, modify, merge, publish and distribute the software, in source and binary form, free of charge, provided the copyright and permission notice is included in substantial portions of the software.",
          "The software is provided 'as is', without warranty of any kind, express or implied.",
        ],
      },
      {
        heading: "Music license",
        body: [
          "All music streamed on Phonq is licensed under Creative Commons by the artists who publish it on Jamendo. The specific license for each track is shown on the track and may be one of several CC variants (e.g. CC BY, CC BY-SA, CC BY-NC).",
          "Phonq does not own this music and cannot grant additional rights beyond the license the artist has chosen.",
        ],
      },
      {
        heading: "Trademarks",
        body: [
          "Phonq and the Phonq logo are trademarks used to identify the platform. Other product names and logos referenced here belong to their respective owners.",
        ],
      },
      {
        heading: "Third-party software",
        body: [
          "Phonq is built on open-source libraries including Next.js, React, Tailwind CSS, Prisma and Auth.js. Each library retains its own license; see their respective repositories for details.",
        ],
      },
    ],
  },
  {
    slug: "dmca",
    title: "DMCA / Copyright",
    updated: "August 6, 2026",
    intro:
      "Phonq streams only Creative Commons music from licensed sources. This page explains how copyright matters are handled.",
    sections: [
      {
        heading: "Our approach",
        body: [
          "Phonq does not host music files. All audio is streamed from Jamendo, whose artists have explicitly published their work under Creative Commons licenses.",
          "Because we operate on a licensed catalog, we don't expect takedown requests. If you believe content is nonetheless infringing, you can still contact us and we'll take it seriously.",
        ],
      },
      {
        heading: "Filing a notice",
        body: [
          "Send a notice to hello@phonq.app including: (1) a description of the copyrighted work, (2) the URL(s) on Phonq where it appears, (3) your contact information, and (4) a statement of good-faith belief that the use is not authorized.",
          "Include your physical or electronic signature. We'll acknowledge receipt within 7 days and investigate.",
        ],
      },
      {
        heading: "Counter-notices",
        body: [
          "If you believe content was removed in error, you may file a counter-notice with the same contact channel, including a statement under penalty of perjury that the material was removed by mistake.",
        ],
      },
    ],
  },
  {
    slug: "security",
    title: "Security",
    updated: "August 6, 2026",
    intro:
      "Phonq treats security as part of the product. Here's what we do to keep the platform safe, and how to report issues.",
    sections: [
      {
        heading: "What we do",
        body: [
          "All traffic is served over HTTPS with HSTS. Authentication uses OAuth 2.0 (Google) with short-lived, signed JWT sessions — we never see or store passwords.",
          "Database access uses connection pooling via Neon and least-privilege credentials. Secrets are environment variables, never committed to the repository.",
          "The app is protected by a rate limiter on API routes, secure default headers, and dependency updates reviewed regularly.",
        ],
      },
      {
        heading: "Responsible disclosure",
        body: [
          "Found a vulnerability? We appreciate responsible disclosure. Email security@phonq.app with a clear description and proof of concept — don't exploit it beyond what's needed to demonstrate it.",
          "We'll respond within 7 days, keep you updated on the fix, and give you credit if you'd like it.",
        ],
      },
    ],
  },
];

export function getLegalDoc(slug: string): LegalDoc | undefined {
  return legalDocs.find((doc) => doc.slug === slug);
}

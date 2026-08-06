export interface NavItem {
  href: string;
  label: string;
  description?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const site = {
  name: "Phonq",
  tagline: "The free home of phonk",
  description:
    "Phonq is a free, open-source music streaming platform built for the phonk community. Stream hundreds of thousands of Creative Commons tracks legally, in full, forever free.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://phonq.vercel.app",
  github: "https://github.com/Heshanmvppp/Phonq",
  email: "hello@phonq.app",
  jamendo: "https://www.jamendo.com",
} as const;

export const marketingNav: NavGroup[] = [
  {
    label: "Product",
    items: [
      { href: "/product/features", label: "Features", description: "Everything Phonq has to offer" },
      { href: "/product/pricing", label: "Pricing", description: "Free now, free always" },
      { href: "/product/changelog", label: "Changelog", description: "What's new in Phonq" },
      { href: "/product/roadmap", label: "Roadmap", description: "What we're building next" },
    ],
  },
  {
    label: "Resources",
    items: [
      { href: "/resources/blog", label: "Blog", description: "Stories, releases and guides" },
      { href: "/resources/docs", label: "Developer docs", description: "API, architecture and self-hosting" },
      { href: "/resources/faq", label: "FAQ", description: "Quick answers to common questions" },
      { href: "/resources/help", label: "Help center", description: "Troubleshooting and support" },
      { href: "/resources/status", label: "Status", description: "Service health and uptime" },
    ],
  },
  {
    label: "Company",
    items: [
      { href: "/company/about", label: "About", description: "Our mission and story" },
      { href: "/company/team", label: "Team", description: "The people behind Phonq" },
      { href: "/company/careers", label: "Careers", description: "Join us" },
      { href: "/company/press", label: "Press", description: "Newsroom and press kit" },
      { href: "/company/contact", label: "Contact", description: "Get in touch" },
    ],
  },
  {
    label: "Legal",
    items: [
      { href: "/legal/privacy", label: "Privacy Policy", description: "How we handle your data" },
      { href: "/legal/terms", label: "Terms of Service", description: "The rules of the road" },
      { href: "/legal/cookies", label: "Cookie Policy", description: "How we use cookies" },
      { href: "/legal/license", label: "Licenses", description: "Software and music licensing" },
      { href: "/legal/dmca", label: "DMCA", description: "Copyright takedowns" },
      { href: "/legal/security", label: "Security", description: "How we keep Phonq safe" },
    ],
  },
];

export const stats = [
  { value: "100%", label: "Free, forever" },
  { value: "500K+", label: "CC-licensed tracks" },
  { value: "0", label: "Ads. Really." },
  { value: "MIT", label: "Open source" },
];

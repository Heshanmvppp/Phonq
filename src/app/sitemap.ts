import type { MetadataRoute } from "next";

import { site } from "@/content/site";

const routes = [
  { path: "", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/login", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/product/features", changeFrequency: "monthly" as const, priority: 0.9 },
  { path: "/product/pricing", changeFrequency: "monthly" as const, priority: 0.9 },
  { path: "/product/changelog", changeFrequency: "weekly" as const, priority: 0.6 },
  { path: "/product/roadmap", changeFrequency: "weekly" as const, priority: 0.6 },
  { path: "/resources/blog", changeFrequency: "weekly" as const, priority: 0.7 },
  { path: "/resources/docs", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/resources/faq", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/resources/help", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/resources/status", changeFrequency: "daily" as const, priority: 0.5 },
  { path: "/company/about", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/company/team", changeFrequency: "monthly" as const, priority: 0.4 },
  { path: "/company/careers", changeFrequency: "monthly" as const, priority: 0.4 },
  { path: "/company/press", changeFrequency: "monthly" as const, priority: 0.3 },
  { path: "/company/contact", changeFrequency: "yearly" as const, priority: 0.4 },
  { path: "/legal/privacy", changeFrequency: "yearly" as const, priority: 0.2 },
  { path: "/legal/terms", changeFrequency: "yearly" as const, priority: 0.2 },
  { path: "/legal/cookies", changeFrequency: "yearly" as const, priority: 0.2 },
  { path: "/legal/license", changeFrequency: "yearly" as const, priority: 0.2 },
  { path: "/legal/dmca", changeFrequency: "yearly" as const, priority: 0.2 },
  { path: "/legal/security", changeFrequency: "yearly" as const, priority: 0.2 },
];
export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${site.url}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}

import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://typingmaster.local";

  const routes = [
    { path: "", changeFrequency: "daily", priority: 1.0 },
    { path: "/practice", changeFrequency: "daily", priority: 0.9 },
    { path: "/learn", changeFrequency: "weekly", priority: 0.8 },
    { path: "/challenge", changeFrequency: "daily", priority: 0.8 },
    { path: "/competition", changeFrequency: "daily", priority: 0.8 },
    { path: "/leaderboard", changeFrequency: "always", priority: 0.9 },
    { path: "/dashboard", changeFrequency: "daily", priority: 0.7 },
    { path: "/history", changeFrequency: "daily", priority: 0.7 },
    { path: "/about", changeFrequency: "monthly", priority: 0.6 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
    { path: "/settings", changeFrequency: "monthly", priority: 0.5 },
  ] as const;

  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

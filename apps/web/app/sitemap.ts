import type { MetadataRoute } from "next";

function buildUrl(siteUrl: string, path: string) {
  return `${siteUrl}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const now = new Date();

  const locales = ["en", "ar"];
  const pages = ["", "/about", "/contact", "/solutions", "/industries", "/case-studies", "/demos"];

  const entries = locales.flatMap((locale) =>
    pages.map((page) => ({
      url: buildUrl(siteUrl, `/${locale}${page}`),
      lastModified: now,
    }))
  );

  return entries;
}

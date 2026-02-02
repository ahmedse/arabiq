import type { MetadataRoute } from "next";

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

interface StrapiItem {
  id: number;
  slug?: string;
  attributes?: { slug?: string };
}

async function fetchSlugs(apiPath: string): Promise<string[]> {
  try {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }
    const res = await fetch(`${STRAPI_URL}${apiPath}?fields[0]=slug`, {
      headers,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || [])
      .map((item: StrapiItem) => item.slug || item.attributes?.slug)
      .filter(Boolean) as string[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.SITE_URL ?? "https://arabiq.tech";
  const now = new Date();
  const locales = ["en", "ar"];
  
  // Static pages with priorities
  const staticPages = [
    { path: "", priority: 1.0, changeFrequency: 'weekly' as const },
    { path: "/about", priority: 0.8, changeFrequency: 'monthly' as const },
    { path: "/contact", priority: 0.8, changeFrequency: 'monthly' as const },
    { path: "/solutions", priority: 0.9, changeFrequency: 'weekly' as const },
    { path: "/industries", priority: 0.9, changeFrequency: 'weekly' as const },
    { path: "/case-studies", priority: 0.8, changeFrequency: 'weekly' as const },
    { path: "/demos", priority: 0.7, changeFrequency: 'weekly' as const },
  ];
  
  // Fetch dynamic slugs from Strapi
  const [solutions, industries, caseStudies] = await Promise.all([
    fetchSlugs('/api/solutions'),
    fetchSlugs('/api/industries'),
    fetchSlugs('/api/case-studies'),
  ]);
  
  const entries: MetadataRoute.Sitemap = [];
  
  // Static pages for each locale
  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${siteUrl}/${locale}${page.path}`,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: {
            en: `${siteUrl}/en${page.path}`,
            ar: `${siteUrl}/ar${page.path}`,
          },
        },
      });
    }
    
    // Dynamic solution pages
    for (const slug of solutions) {
      entries.push({
        url: `${siteUrl}/${locale}/solutions/${slug}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
    
    // Dynamic industry pages
    for (const slug of industries) {
      entries.push({
        url: `${siteUrl}/${locale}/industries/${slug}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
    
    // Dynamic case study pages
    for (const slug of caseStudies) {
      entries.push({
        url: `${siteUrl}/${locale}/case-studies/${slug}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  }
  
  return entries;
}

/**
 * Utility functions for generating SEO metadata
 */

const SITE_URL = process.env.SITE_URL ?? 'https://arabiq.tech';

/**
 * Generate OG image URL using the dynamic API
 */
export function getOgImageUrl(title: string, description?: string, locale: string = 'en'): string {
  const params = new URLSearchParams({
    title,
    locale,
  });
  
  if (description) {
    params.set('description', description);
  }
  
  return `${SITE_URL}/api/og?${params.toString()}`;
}

/**
 * Common metadata configuration for pages
 */
export function getCommonMetadata(locale: string) {
  const isAR = locale === 'ar';
  return {
    siteUrl: SITE_URL,
    isAR,
    alternates: (path: string) => ({
      canonical: `${SITE_URL}/${locale}${path}`,
      languages: {
        'en': `${SITE_URL}/en${path}`,
        'ar': `${SITE_URL}/ar${path}`,
      },
    }),
    ogLocale: isAR ? 'ar_SA' : 'en_US',
  };
}

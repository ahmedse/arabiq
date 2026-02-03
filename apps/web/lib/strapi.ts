import "server-only";

type FetchStrapiOptions = {
  locale?: string;
  revalidate?: number;
  tags?: string[];
  cache?: RequestCache;
};

type StrapiListResponse<T> = {
  data: Array<{ id: number; documentId?: string; attributes?: T } & Partial<T>>;
};

type StrapiSingleResponse<T> = {
  data: ({ id: number; documentId?: string; attributes?: T } & Partial<T>) | null;
};

function pickAttributes<T extends object>(item: { attributes?: T } & Partial<T>): T {
  return (item.attributes ?? (item as unknown as T)) as T;
}

const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

// Default cache durations
export const CACHE_DURATIONS = {
  short: 60,          // 1 minute - for frequently changing content
  medium: 300,        // 5 minutes - default for most content
  long: 3600,         // 1 hour - for static content like pages
  veryLong: 86400,    // 24 hours - for rarely changing content
} as const;

export async function fetchStrapi(path: string, options: FetchStrapiOptions = {}) {
  if (!STRAPI_URL) return null;

  // Helpful warning when token is missing — some protected content will fail without it
  if (!STRAPI_API_TOKEN) {
    // Don't print the token value for safety
    console.warn('[Strapi] STRAPI_API_TOKEN is not set, protected content may not be returned');
  }

  async function doRequest(locale?: string) {
    const url = new URL(path, STRAPI_URL);
    if (locale) url.searchParams.set('locale', locale);

    // Build fetch options with caching
    const fetchOptions: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {
      headers: STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : undefined,
    };

    // Add caching configuration
    if (options.cache) {
      fetchOptions.cache = options.cache;
    } else if (options.revalidate !== undefined || options.tags) {
      fetchOptions.next = {};
      if (options.revalidate !== undefined) {
        fetchOptions.next.revalidate = options.revalidate;
      }
      if (options.tags) {
        fetchOptions.next.tags = options.tags;
      }
    }

    try {
      const response = await fetch(url.toString(), fetchOptions);

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error(`[Strapi] fetch ${url.toString()} failed: ${response.status} ${text}`);
        return null;
      }

      return response.json();
    } catch (err) {
      console.error(`[Strapi] fetch ${url.toString()} error:`, err);
      return null;
    }
  }

  // If a locale was requested, try that first; if no content, fall back to no-locale request
  if (options.locale) {
    const localized = await doRequest(options.locale);
    if (localized) return localized;
    // fallback to unlocalized content (helps when translations are missing)
    console.warn(`[Strapi] No content for locale="${options.locale}" at ${path}, retrying without locale`);
    return await doRequest();
  }

  return await doRequest();
}

async function getCollection(locale: string, apiPath: string, revalidate = 300) {
  const data = (await fetchStrapi(apiPath, { locale, revalidate })) as StrapiListResponse<{
    slug?: string;
    title?: string;
    summary?: string;
    icon?: string;
    description?: string;
    client?: string;
    industry?: string;
    demoType?: string;
  }> | null;

  if (!data?.data?.length) return [];

  return data.data.map((item) => {
    const attrs = pickAttributes(item);

    // Extract allowedRoles if present (supports string[] or relation shapes)
    const rawAllowed = (attrs as any).allowedRoles ?? (attrs as any).allowed_roles ?? (attrs as any).allowedRole ?? null;
    let allowedRoles: string[] = [];
    if (Array.isArray(rawAllowed)) {
      // support relation array with { name } objects or plain strings
      allowedRoles = rawAllowed.map((r: any) => (typeof r === 'string' ? r : r?.name ?? String(r))).filter(Boolean);
    } else if (typeof rawAllowed === 'string') {
      allowedRoles = rawAllowed.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    return {
      id: item.id,
      slug: attrs.slug ?? "",
      title: attrs.title ?? "Untitled",
      summary: attrs.summary ?? attrs.description ?? "",
      icon: attrs.icon,
      client: attrs.client,
      industry: attrs.industry,
      demoType: attrs.demoType,
      allowedRoles,
    };
  }).filter((item) => Boolean(item.slug));
}

async function getCollectionItemBySlug(locale: string, apiPath: string, slug: string, revalidate = 300) {
  const query = new URLSearchParams({ "filters[slug][$eq]": slug });
  const data = (await fetchStrapi(`${apiPath}?${query.toString()}`, { locale, revalidate })) as StrapiListResponse<{
    slug?: string;
    title?: string;
    summary?: string;
    body?: unknown;
    description?: string;
    icon?: string;
    client?: string;
    industry?: string;
    demoType?: string;
  }> | null;

  const item = data?.data?.[0];
  if (!item) return null;
  const attrs = pickAttributes(item);

  // Extract allowedRoles if present (supports string[] or relation shapes)
  const rawAllowed = (attrs as any).allowedRoles ?? (attrs as any).allowed_roles ?? (attrs as any).allowedRole ?? null;
  let allowedRoles: string[] = [];
  if (Array.isArray(rawAllowed)) {
    // support relation array with { name } objects or plain strings
    allowedRoles = rawAllowed.map((r: any) => (typeof r === 'string' ? r : r?.name ?? String(r))).filter(Boolean);
  } else if (typeof rawAllowed === 'string') {
    allowedRoles = rawAllowed.split(',').map((s: string) => s.trim()).filter(Boolean);
  }

  return {
    id: item.id,
    slug: attrs.slug ?? slug,
    title: attrs.title ?? "Untitled",
    summary: attrs.summary ?? attrs.description ?? "",
    body: attrs.body ?? attrs.description ?? null,
    icon: attrs.icon,
    client: attrs.client,
    industry: attrs.industry,
    demoType: attrs.demoType,
    allowedRoles,
  } as const;
}

// ============================================================================
// SITE SETTINGS
// ============================================================================

type SiteSettingsAttributes = {
  title?: string;
  description?: string;
  footerCompanyTitle?: string;
  footerProductsTitle?: string;
  footerResourcesTitle?: string;
  footerConnectTitle?: string;
  copyrightText?: string;
  loginButtonText?: string;
};

export type SiteSettings = {
  title: string | null;
  description: string | null;
  footerCompanyTitle: string | null;
  footerProductsTitle: string | null;
  footerResourcesTitle: string | null;
  footerConnectTitle: string | null;
  copyrightText: string | null;
  loginButtonText: string | null;
};

export async function getSiteSettings(locale: string): Promise<SiteSettings | null> {
  // Fetch localized settings
  const data = (await fetchStrapi("/api/site-setting", { locale, revalidate: 60 })) as StrapiSingleResponse<SiteSettingsAttributes> | null;
  const item = data?.data;
  if (!item) return null;
  const attrs = pickAttributes(item);

  // If some fields are missing in the localized record, fetch fallback (default locale) and merge
  const fallbackData = (await fetchStrapi("/api/site-setting")) as StrapiSingleResponse<SiteSettingsAttributes> | null;
  const fallbackAttrs = fallbackData?.data ? pickAttributes(fallbackData.data) : ({} as SiteSettingsAttributes);

  return {
    title: attrs.title ?? fallbackAttrs.title ?? null,
    description: attrs.description ?? fallbackAttrs.description ?? null,
    footerCompanyTitle: attrs.footerCompanyTitle ?? fallbackAttrs.footerCompanyTitle ?? null,
    footerProductsTitle: attrs.footerProductsTitle ?? fallbackAttrs.footerProductsTitle ?? null,
    footerResourcesTitle: attrs.footerResourcesTitle ?? fallbackAttrs.footerResourcesTitle ?? null,
    footerConnectTitle: attrs.footerConnectTitle ?? fallbackAttrs.footerConnectTitle ?? null,
    copyrightText: attrs.copyrightText ?? fallbackAttrs.copyrightText ?? null,
    loginButtonText: attrs.loginButtonText ?? fallbackAttrs.loginButtonText ?? null,
  };
}

// ============================================================================
// NAVIGATION ITEMS
// ============================================================================

type NavItemAttributes = {
  label?: string;
  href?: string;
  location?: string;
  order?: number;
  isExternal?: boolean;
};

export type NavItem = {
  id: number;
  label: string;
  href: string;
  location: string;
  order: number;
  isExternal: boolean;
};

export async function getNavItems(locale: string, location?: string): Promise<NavItem[]> {
  const params = location ? `?filters[location][$eq]=${location}&sort=order:asc` : "?sort=order:asc";
  // Try localized first; if localized is empty array, fall back to default locale
  const data = (await fetchStrapi(`/api/nav-items${params}`, { locale, revalidate: 60 })) as StrapiListResponse<NavItemAttributes> | null;
  let items = data?.data ?? [];

  if (locale && items.length === 0) {
    const fallback = (await fetchStrapi(`/api/nav-items${params}`)) as StrapiListResponse<NavItemAttributes> | null;
    items = fallback?.data ?? [];
  }

  if (!items.length) return [];

  return items.map((item) => {
    const attrs = pickAttributes(item);
    return {
      id: item.id,
      label: attrs.label ?? "",
      href: attrs.href ?? "/",
      location: attrs.location ?? "header",
      order: attrs.order ?? 0,
      isExternal: attrs.isExternal ?? false,
    };
  });
}

// ============================================================================
// HOMEPAGE
// ============================================================================

type HomepageAttributes = {
  heroTitle?: string;
  heroSubtitle?: string;
  heroPrimaryCta?: string;
  heroSecondaryCta?: string;
  heroBadge?: string;
  trustAward?: string;
  trustGlobal?: string;
  trustFast?: string;
  // Section visibility toggles
  showStatsSection?: boolean;
  showTrustedBySection?: boolean;
  trustedByTitle?: string;
  showHowItWorksSection?: boolean;
  howItWorksTitle?: string;
  howItWorksSubtitle?: string;
  showFeaturesSection?: boolean;
  featuresTitle?: string;
  featuresSubtitle?: string;
  showSolutionsSection?: boolean;
  solutionsTitle?: string;
  solutionsSubtitle?: string;
  showIndustriesSection?: boolean;
  industriesTitle?: string;
  industriesSubtitle?: string;
  showCaseStudiesSection?: boolean;
  caseStudiesTitle?: string;
  caseStudiesSubtitle?: string;
  showDemosSection?: boolean;
  demosTitle?: string;
  demosSubtitle?: string;
  showCtaSection?: boolean;
  ctaTitle?: string;
  ctaSubtitle?: string;
  ctaPrimaryButton?: string;
  ctaSecondaryButton?: string;
};

export async function getHomepage(locale: string) {
  // Fetch localized homepage
  const data = (await fetchStrapi("/api/homepage", { locale, revalidate: 60 })) as StrapiSingleResponse<HomepageAttributes> | null;
  const item = data?.data;
  if (!item) return null;
  const attrs = pickAttributes(item);

  // If localized fields are missing, merge with fallback (default locale)
  const fallbackData = (await fetchStrapi("/api/homepage")) as StrapiSingleResponse<HomepageAttributes> | null;
  const fallbackAttrs = fallbackData?.data ? pickAttributes(fallbackData.data) : ({} as HomepageAttributes);

  return {
    heroTitle: attrs.heroTitle ?? fallbackAttrs.heroTitle ?? null,
    heroSubtitle: attrs.heroSubtitle ?? fallbackAttrs.heroSubtitle ?? null,
    heroPrimaryCta: attrs.heroPrimaryCta ?? fallbackAttrs.heroPrimaryCta ?? null,
    heroSecondaryCta: attrs.heroSecondaryCta ?? fallbackAttrs.heroSecondaryCta ?? null,
    heroBadge: attrs.heroBadge ?? fallbackAttrs.heroBadge ?? null,
    trustAward: attrs.trustAward ?? fallbackAttrs.trustAward ?? null,
    trustGlobal: attrs.trustGlobal ?? fallbackAttrs.trustGlobal ?? null,
    trustFast: attrs.trustFast ?? fallbackAttrs.trustFast ?? null,
    showStatsSection: attrs.showStatsSection ?? fallbackAttrs.showStatsSection ?? false,
    showTrustedBySection: attrs.showTrustedBySection ?? fallbackAttrs.showTrustedBySection ?? false,
    trustedByTitle: attrs.trustedByTitle ?? fallbackAttrs.trustedByTitle ?? null,
    showHowItWorksSection: attrs.showHowItWorksSection ?? fallbackAttrs.showHowItWorksSection ?? false,
    howItWorksTitle: attrs.howItWorksTitle ?? fallbackAttrs.howItWorksTitle ?? null,
    howItWorksSubtitle: attrs.howItWorksSubtitle ?? fallbackAttrs.howItWorksSubtitle ?? null,
    showFeaturesSection: attrs.showFeaturesSection ?? fallbackAttrs.showFeaturesSection ?? false,
    featuresTitle: attrs.featuresTitle ?? fallbackAttrs.featuresTitle ?? null,
    featuresSubtitle: attrs.featuresSubtitle ?? fallbackAttrs.featuresSubtitle ?? null,
    showSolutionsSection: attrs.showSolutionsSection ?? fallbackAttrs.showSolutionsSection ?? false,
    solutionsTitle: attrs.solutionsTitle ?? fallbackAttrs.solutionsTitle ?? null,
    solutionsSubtitle: attrs.solutionsSubtitle ?? fallbackAttrs.solutionsSubtitle ?? null,
    showIndustriesSection: attrs.showIndustriesSection ?? fallbackAttrs.showIndustriesSection ?? false,
    industriesTitle: attrs.industriesTitle ?? fallbackAttrs.industriesTitle ?? null,
    industriesSubtitle: attrs.industriesSubtitle ?? fallbackAttrs.industriesSubtitle ?? null,
    showCaseStudiesSection: attrs.showCaseStudiesSection ?? fallbackAttrs.showCaseStudiesSection ?? false,
    caseStudiesTitle: attrs.caseStudiesTitle ?? fallbackAttrs.caseStudiesTitle ?? null,
    caseStudiesSubtitle: attrs.caseStudiesSubtitle ?? fallbackAttrs.caseStudiesSubtitle ?? null,
    showDemosSection: attrs.showDemosSection ?? fallbackAttrs.showDemosSection ?? false,
    demosTitle: attrs.demosTitle ?? fallbackAttrs.demosTitle ?? null,
    demosSubtitle: attrs.demosSubtitle ?? fallbackAttrs.demosSubtitle ?? null,
    showCtaSection: attrs.showCtaSection ?? fallbackAttrs.showCtaSection ?? false,
    ctaTitle: attrs.ctaTitle ?? fallbackAttrs.ctaTitle ?? null,
    ctaSubtitle: attrs.ctaSubtitle ?? fallbackAttrs.ctaSubtitle ?? null,
    ctaPrimaryButton: attrs.ctaPrimaryButton ?? fallbackAttrs.ctaPrimaryButton ?? null,
    ctaSecondaryButton: attrs.ctaSecondaryButton ?? fallbackAttrs.ctaSecondaryButton ?? null,
  };
}

// ============================================================================
// ABOUT PAGE
// ============================================================================

type AboutPageAttributes = {
  heroTitle?: string;
  heroSubtitle?: string;
  missionTitle?: string;
  missionText?: string;
  visionTitle?: string;
  visionText?: string;
  valuesTitle?: string;
  value1Title?: string;
  value1Text?: string;
  value2Title?: string;
  value2Text?: string;
  value3Title?: string;
  value3Text?: string;
  teamTitle?: string;
  teamSubtitle?: string;
  ctaTitle?: string;
  ctaButton?: string;
};

export async function getAboutPage(locale: string) {
  const data = (await fetchStrapi("/api/about-page", { locale, revalidate: 60 })) as StrapiSingleResponse<AboutPageAttributes> | null;
  const item = data?.data;
  if (!item) return null;
  return pickAttributes(item);
}

// ============================================================================
// CONTACT PAGE
// ============================================================================

type ContactPageAttributes = {
  heroTitle?: string;
  heroSubtitle?: string;
  formTitle?: string;
  nameLabel?: string;
  emailLabel?: string;
  phoneLabel?: string;
  messageLabel?: string;
  submitButton?: string;
  infoTitle?: string;
  address?: string;
  email?: string;
  phone?: string;
  hoursTitle?: string;
  hoursText?: string;
};

export async function getContactPage(locale: string) {
  const data = (await fetchStrapi("/api/contact-page", { locale, revalidate: 60 })) as StrapiSingleResponse<ContactPageAttributes> | null;
  const item = data?.data;
  if (!item) return null;
  return pickAttributes(item);
}

// ============================================================================
// STATS
// ============================================================================

type StatAttributes = {
  value?: string;
  label?: string;
  order?: number;
};

export async function getStats(locale: string) {
  const data = (await fetchStrapi("/api/stats?sort=order:asc", { locale, revalidate: 300 })) as StrapiListResponse<StatAttributes> | null;
  if (!data?.data?.length) return [];
  return data.data.map((item) => ({
    id: item.id,
    value: pickAttributes(item).value ?? "0",
    label: pickAttributes(item).label ?? "",
    order: pickAttributes(item).order ?? 0,
  }));
}

// ============================================================================
// TRUSTED COMPANIES
// ============================================================================

type TrustedCompanyAttributes = {
  name?: string;
  order?: number;
};

export async function getTrustedCompanies(locale: string) {
  const data = (await fetchStrapi("/api/trusted-companies?sort=order:asc", { locale, revalidate: 300 })) as StrapiListResponse<TrustedCompanyAttributes> | null;
  if (!data?.data?.length) return [];
  return data.data.map((item) => ({
    id: item.id,
    name: pickAttributes(item).name ?? "",
    order: pickAttributes(item).order ?? 0,
  }));
}

// ============================================================================
// PROCESS STEPS
// ============================================================================

type ProcessStepAttributes = {
  step?: number;
  title?: string;
  description?: string;
  icon?: string;
};

export async function getProcessSteps(locale: string) {
  const data = (await fetchStrapi("/api/process-steps?sort=step:asc", { locale, revalidate: 300 })) as StrapiListResponse<ProcessStepAttributes> | null;
  if (!data?.data?.length) return [];
  return data.data.map((item) => ({
    id: item.id,
    step: pickAttributes(item).step ?? 0,
    title: pickAttributes(item).title ?? "",
    description: pickAttributes(item).description ?? "",
    icon: pickAttributes(item).icon ?? "circle",
  }));
}

// ============================================================================
// FEATURES
// ============================================================================

type FeatureAttributes = {
  title?: string;
  description?: string;
  icon?: string;
  order?: number;
};

export async function getFeatures(locale: string) {
  const data = (await fetchStrapi("/api/features?sort=order:asc", { locale, revalidate: 300 })) as StrapiListResponse<FeatureAttributes> | null;
  if (!data?.data?.length) return [];
  return data.data.map((item) => ({
    id: item.id,
    title: pickAttributes(item).title ?? "",
    description: pickAttributes(item).description ?? "",
    icon: pickAttributes(item).icon ?? "star",
    order: pickAttributes(item).order ?? 0,
  }));
}

// ============================================================================
// SOLUTIONS
// ============================================================================

export async function getSolutions(locale: string) {
  return getCollection(locale, "/api/solutions?sort=createdAt:asc", 300);
}

export async function getSolutionBySlug(locale: string, slug: string) {
  return getCollectionItemBySlug(locale, "/api/solutions", slug, 300);
}

// ============================================================================
// INDUSTRIES
// ============================================================================

export async function getIndustries(locale: string) {
  return getCollection(locale, "/api/industries?sort=createdAt:asc", 300);
}

export async function getIndustryBySlug(locale: string, slug: string) {
  return getCollectionItemBySlug(locale, "/api/industries", slug, 300);
}

// ============================================================================
// CASE STUDIES
// ============================================================================

export async function getCaseStudies(locale: string) {
  return getCollection(locale, "/api/case-studies?sort=createdAt:desc", 300);
}

export async function getCaseStudyBySlug(locale: string, slug: string) {
  return getCollectionItemBySlug(locale, "/api/case-studies", slug, 300);
}

// ============================================================================
// DEMOS
// ============================================================================

export async function getDemos(locale: string) {
  return getCollection(locale, "/api/demos?sort=createdAt:asc", 30);
}

// Demo-specific attributes for Matterport integration
type DemoAttributes = {
  slug?: string;
  title?: string;
  summary?: string;
  body?: unknown;
  description?: string;
  demoType?: string;
  matterportModelId?: string;
  image?: { url?: string };
  featuredImage?: { url?: string };
  businessName?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessWhatsapp?: string;
  enableVoiceOver?: boolean;
  enableLiveChat?: boolean;
  enableAiChat?: boolean;
  allowedRoles?: unknown;
  ownerUser?: { id?: number; data?: { id?: number } };
};

export async function getDemoBySlug(locale: string, slug: string) {
  const query = new URLSearchParams({ 
    "filters[slug][$eq]": slug,
    "populate[0]": "featuredImage",
    "populate[1]": "ownerUser"
  });
  const data = (await fetchStrapi(`/api/demos?${query.toString()}`, { locale, revalidate: 30 })) as StrapiListResponse<DemoAttributes> | null;

  const item = data?.data?.[0];
  if (!item) return null;
  const attrs = pickAttributes(item);

  // Extract allowedRoles if present
  const rawAllowed = attrs.allowedRoles;
  let allowedRoles: string[] = [];
  if (Array.isArray(rawAllowed)) {
    allowedRoles = rawAllowed.map((r: unknown) => (typeof r === 'string' ? r : (r as { name?: string })?.name ?? String(r))).filter(Boolean);
  } else if (typeof rawAllowed === 'string') {
    allowedRoles = rawAllowed.split(',').map((s: string) => s.trim()).filter(Boolean);
  }

  // Extract owner user ID if present
  const ownerUser = attrs.ownerUser;
  const ownerId = ownerUser?.id ?? ownerUser?.data?.id ?? null;

  return {
    id: item.id,
    slug: attrs.slug ?? slug,
    title: attrs.title ?? "Untitled",
    summary: attrs.summary ?? attrs.description ?? "",
    body: attrs.body ?? attrs.description ?? null,
    demoType: attrs.demoType,
    matterportModelId: attrs.matterportModelId,
    image: attrs.image ?? attrs.featuredImage,
    businessName: attrs.businessName,
    businessPhone: attrs.businessPhone,
    businessEmail: attrs.businessEmail,
    businessWhatsapp: attrs.businessWhatsapp,
    enableVoiceOver: attrs.enableVoiceOver ?? false,
    enableLiveChat: attrs.enableLiveChat ?? false,
    enableAiChat: attrs.enableAiChat ?? true,
    allowedRoles,
    ownerId,
  };
}

// ============================================================================
// TEAM MEMBERS
// ============================================================================

type TeamMemberAttributes = {
  name?: string;
  position?: string;
  bio?: string;
  photo?: { url?: string };
  order?: number;
  linkedinUrl?: string;
  twitterUrl?: string;
};

export type TeamMember = {
  id: number;
  name: string;
  position: string;
  bio: string;
  photoUrl: string | null;
  order: number;
  linkedinUrl: string | null;
  twitterUrl: string | null;
};

export async function getTeamMembers(locale: string): Promise<TeamMember[]> {
  const data = (await fetchStrapi("/api/team-members?sort=order:asc&populate=photo", { locale, revalidate: 300 })) as StrapiListResponse<TeamMemberAttributes> | null;
  if (!data?.data?.length) return [];
  return data.data.map((item) => {
    const attrs = pickAttributes(item);
    return {
      id: item.id,
      name: attrs.name ?? "",
      position: attrs.position ?? "",
      bio: attrs.bio ?? "",
      photoUrl: attrs.photo?.url ?? null,
      order: attrs.order ?? 0,
      linkedinUrl: attrs.linkedinUrl ?? null,
      twitterUrl: attrs.twitterUrl ?? null,
    };
  });
}

// ============================================================================
// VALUES
// ============================================================================

type ValueAttributes = {
  title?: string;
  description?: string;
  icon?: string;
  order?: number;
};

export type Value = {
  id: number;
  title: string;
  description: string;
  icon: string;
  order: number;
};

export async function getValues(locale: string): Promise<Value[]> {
  const data = (await fetchStrapi("/api/values?sort=order:asc", { locale, revalidate: 300 })) as StrapiListResponse<ValueAttributes> | null;
  if (!data?.data?.length) return [];
  return data.data.map((item) => {
    const attrs = pickAttributes(item);
    return {
      id: item.id,
      title: attrs.title ?? "",
      description: attrs.description ?? "",
      icon: attrs.icon ?? "heart",
      order: attrs.order ?? 0,
    };
  });
}

// ============================================================================
// CACHE REVALIDATION
// ============================================================================

/**
 * Revalidate all CMS content caches.
 * Call this from webhook handlers when content changes in Strapi.
 * 
 * Note: In Next.js 16, revalidateTag requires a cache profile.
 * We use 'default' which immediately expires the cache.
 */
export async function revalidateCmsContent(tags?: string[]) {
  try {
    const { revalidateTag } = await import('next/cache');
    
    const tagsToRevalidate = tags || ['cms-content', 'pages', 'collections'];
    for (const tag of tagsToRevalidate) {
      // Second argument is the cache profile - { expire: 0 } means immediate revalidation
      revalidateTag(tag, { expire: 0 });
    }
    
    console.log(`[Strapi] Revalidated cache tags: ${tagsToRevalidate.join(', ')}`);
    return true;
  } catch (error) {
    console.error('[Strapi] Failed to revalidate cache:', error);
    return false;
  }
}

/**
 * Revalidate a specific page path.
 */
export async function revalidatePath(path: string) {
  try {
    const { revalidatePath: nextRevalidatePath } = await import('next/cache');
    nextRevalidatePath(path);
    console.log(`[Strapi] Revalidated path: ${path}`);
    return true;
  } catch (error) {
    console.error('[Strapi] Failed to revalidate path:', error);
    return false;
  }
}

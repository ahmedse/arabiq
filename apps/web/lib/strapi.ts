import "server-only";

type FetchStrapiOptions = {
  locale?: string;
  revalidate?: number;
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

export async function fetchStrapi(path: string, options: FetchStrapiOptions = {}) {
  if (!STRAPI_URL) return null;

  const url = new URL(path, STRAPI_URL);
  if (options.locale) url.searchParams.set("locale", options.locale);

  try {
    const response = await fetch(url.toString(), {
      headers: STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : undefined,
      next: options.revalidate ? { revalidate: options.revalidate } : undefined,
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
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
    return {
      id: item.id,
      slug: attrs.slug ?? "",
      title: attrs.title ?? "Untitled",
      summary: attrs.summary ?? attrs.description ?? "",
      icon: attrs.icon,
      client: attrs.client,
      industry: attrs.industry,
      demoType: attrs.demoType,
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
  const data = (await fetchStrapi("/api/site-setting", { locale, revalidate: 60 })) as StrapiSingleResponse<SiteSettingsAttributes> | null;
  const item = data?.data;
  if (!item) return null;
  const attrs = pickAttributes(item);
  return {
    title: attrs.title ?? null,
    description: attrs.description ?? null,
    footerCompanyTitle: attrs.footerCompanyTitle ?? null,
    footerProductsTitle: attrs.footerProductsTitle ?? null,
    footerResourcesTitle: attrs.footerResourcesTitle ?? null,
    footerConnectTitle: attrs.footerConnectTitle ?? null,
    copyrightText: attrs.copyrightText ?? null,
    loginButtonText: attrs.loginButtonText ?? null,
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
  const data = (await fetchStrapi(`/api/nav-items${params}`, { locale, revalidate: 60 })) as StrapiListResponse<NavItemAttributes> | null;

  if (!data?.data?.length) return [];

  return data.data.map((item) => {
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
  const data = (await fetchStrapi("/api/homepage", { locale, revalidate: 60 })) as StrapiSingleResponse<HomepageAttributes> | null;
  const item = data?.data;
  if (!item) return null;
  return pickAttributes(item);
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

export async function getDemoBySlug(locale: string, slug: string) {
  return getCollectionItemBySlug(locale, "/api/demos", slug, 30);
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

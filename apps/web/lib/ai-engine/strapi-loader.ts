/**
 * @fileoverview Strapi CMS Data Loader
 * 
 * Loads real demo and item data from Strapi CMS, maps to AI engine types,
 * and implements in-memory caching with 5-minute TTL.
 */

import type { DemoConfig, TourItem, AgentConfig, KnowledgeEntry } from './types';
import { getDefaultConfig } from './context-builder';

// ========================================
// Types
// ========================================

interface CacheEntry {
  data: { demo: DemoConfig; items: TourItem[] };
  timestamp: number;
}

interface CacheStats {
  entries: number;
  hits: number;
  misses: number;
}

interface StrapiResponse<T> {
  data: T[] | T;
  meta?: any;
}

interface StrapiDemo {
  id: number;
  documentId?: string;
  slug: string;
  title: string;
  demoType: string;
  businessName?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessWhatsapp?: string;
  enableAiChat?: boolean;
  agentConfig?: any;
}

interface StrapiItem {
  id: number;
  documentId?: string;
  // Product/showroom fields
  name?: string;
  // Property fields
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  category?: string;
  // Availability fields
  inStock?: boolean;
  isAvailable?: boolean;
  // Images
  images?: Array<{ url: string }>;
  image?: { url: string };
  // Specifications (products)
  specifications?: Record<string, string>;
  // Other metadata
  [key: string]: any;
}

// ========================================
// Configuration
// ========================================

const STRAPI_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// ========================================
// Cache
// ========================================

const cache = new Map<string, CacheEntry>();
const stats: CacheStats = {
  entries: 0,
  hits: 0,
  misses: 0,
};

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  return {
    ...stats,
    entries: cache.size,
  };
}

/**
 * Invalidate cache (one entry or all)
 */
export function invalidateCache(demoSlug?: string): void {
  if (demoSlug) {
    cache.delete(demoSlug);
    console.log(`[Strapi Loader] Cache invalidated for: ${demoSlug}`);
  } else {
    cache.clear();
    console.log('[Strapi Loader] Cache cleared (all entries)');
  }
}

/**
 * Clean expired cache entries
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}

// ========================================
// Strapi API Functions
// ========================================

/**
 * Fetch data from Strapi API
 */
async function fetchStrapi<T>(
  endpoint: string,
  locale?: string
): Promise<StrapiResponse<T> | null> {
  try {
    const url = new URL(endpoint, STRAPI_URL);
    if (locale) {
      url.searchParams.set('locale', locale);
    }

    const headers: HeadersInit = {};
    if (STRAPI_API_TOKEN) {
      headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    const response = await fetch(url.toString(), {
      headers,
      next: { revalidate: 0 }, // No Next.js caching, we handle it ourselves
    });

    if (!response.ok) {
      console.error(
        `[Strapi Loader] HTTP ${response.status} for ${endpoint}`
      );
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[Strapi Loader] Fetch error:', error);
    return null;
  }
}

/**
 * Fetch demo metadata from Strapi
 */
async function fetchDemoMetadata(
  demoSlug: string,
  locale: string
): Promise<StrapiDemo | null> {
  const endpoint = `/api/demos?filters[slug][$eq]=${demoSlug}&locale=${locale}&populate=*`;
  const response = await fetchStrapi<StrapiDemo>(endpoint);

  if (!response || !Array.isArray(response.data) || response.data.length === 0) {
    return null;
  }

  // Extract from Strapi response format
  const item = response.data[0];
  return {
    id: item.id,
    documentId: item.documentId,
    ...(item as any).attributes || item,
  } as StrapiDemo;
}

/**
 * Fetch items for a demo from Strapi
 */
async function fetchDemoItems(
  demoSlug: string,
  demoType: string,
  locale: string
): Promise<StrapiItem[]> {
  // Determine the correct content type based on demo type
  let contentType: string;
  switch (demoType) {
    case 'ecommerce':
    case 'showroom':
      contentType = 'demo-products';
      break;
    case 'cafe':
      contentType = 'demo-menu-items';
      break;
    case 'hotel':
      contentType = 'demo-rooms';
      break;
    case 'realestate':
      contentType = 'demo-properties';
      break;
    default:
      contentType = 'demo-products'; // fallback
  }

  // Filter by demo SLUG (not id) — in Strapi v5 i18n, demo ids differ per locale
  const endpoint = `/api/${contentType}?filters[demo][slug][$eq]=${demoSlug}&locale=${locale}&populate=*`;
  const response = await fetchStrapi<StrapiItem>(endpoint);

  if (!response || !Array.isArray(response.data)) {
    return [];
  }

  // Extract from Strapi response format
  return response.data.map((item: any) => ({
    id: item.id,
    documentId: item.documentId,
    ...(item.attributes || item),
  }));
}

// ========================================
// Mapping Functions
// ========================================

/**
 * Map CMS item to TourItem
 * Handles field name differences between Strapi and AI engine
 */
function mapCmsItemToTourItem(
  enItem: StrapiItem,
  arItem?: StrapiItem
): TourItem {
  // Handle name vs title field
  const title = enItem.name || enItem.title || 'Untitled';
  const titleAr = arItem ? (arItem.name || arItem.title) : undefined;

  // Handle availability field variations
  const available =
    enItem.inStock !== undefined ? enItem.inStock : enItem.isAvailable;

  // Extract image URL — Strapi returns relative paths (/uploads/...), prefix with base URL
  let imageUrl: string | undefined;
  if (enItem.images && enItem.images.length > 0 && enItem.images[0].url) {
    const url = enItem.images[0].url;
    imageUrl = url.startsWith('http') ? url : `${STRAPI_URL}${url}`;
  } else if (enItem.image?.url) {
    const url = enItem.image.url;
    imageUrl = url.startsWith('http') ? url : `${STRAPI_URL}${url}`;
  }

  // Build metadata from extra fields
  const metadata: Record<string, any> = {};
  const excludeKeys = [
    'id',
    'documentId',
    'name',
    'title',
    'description',
    'price',
    'currency',
    'category',
    'inStock',
    'isAvailable',
    'images',
    'image',
    'specifications',
    'createdAt',
    'updatedAt',
    'publishedAt',
    'locale',
    'localizations',
    'demo',
  ];

  for (const [key, value] of Object.entries(enItem)) {
    if (!excludeKeys.includes(key) && value !== undefined && value !== null) {
      metadata[key] = value;
    }
  }

  return {
    // Use documentId (stable across locales in Strapi v5) as the item identifier
    id: enItem.documentId || String(enItem.id),
    title,
    titleAr,
    description: enItem.description,
    descriptionAr: arItem?.description,
    category: enItem.category,
    price: enItem.price,
    currency: enItem.currency || 'EGP',
    available,
    specifications: enItem.specifications,
    imageUrl,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}

/**
 * Map CMS demo to DemoConfig
 */
function mapCmsDemoToConfig(
  enDemo: StrapiDemo,
  arDemo?: StrapiDemo
): DemoConfig {
  return {
    slug: enDemo.slug,
    type: enDemo.demoType,
    businessName: enDemo.businessName || enDemo.title,
    businessNameAr: arDemo?.businessName || arDemo?.title,
    description: enDemo.title,
    descriptionAr: arDemo?.title,
    strapiId: enDemo.id,
    businessPhone: enDemo.businessPhone,
    businessEmail: enDemo.businessEmail,
    businessWhatsapp: enDemo.businessWhatsapp,
    enableAiChat: enDemo.enableAiChat !== false, // default to true
    agentConfig: enDemo.agentConfig as AgentConfig | undefined,
  };
}

/**
 * Merge items from EN and AR locales by documentId
 * 
 * In Strapi v5, each locale has a DIFFERENT `id` but shares the same `documentId`.
 * So we MUST match on `documentId`, not `id`.
 */
function mergeLocalizedItems(
  enItems: StrapiItem[],
  arItems: StrapiItem[]
): TourItem[] {
  // Build AR lookup by documentId (stable across locales in Strapi v5)
  const arItemsMap = new Map<string, StrapiItem>();
  arItems.forEach((item) => {
    const key = item.documentId || String(item.id);
    arItemsMap.set(key, item);
  });

  return enItems.map((enItem) => {
    const key = enItem.documentId || String(enItem.id);
    const arItem = arItemsMap.get(key);
    return mapCmsItemToTourItem(enItem, arItem);
  });
}

// ========================================
// Main Export
// ========================================

/**
 * Load demo and items from Strapi CMS
 * Uses in-memory cache with 5-minute TTL
 */
export async function loadDemoFromCMS(
  demoSlug: string
): Promise<{ demo: DemoConfig; items: TourItem[] }> {
  // Check cache first
  const cached = cache.get(demoSlug);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    stats.hits++;
    console.log(`[Strapi Loader] Cache hit for: ${demoSlug}`);
    return cached.data;
  }

  stats.misses++;
  console.log(`[Strapi Loader] Cache miss for: ${demoSlug}, fetching from CMS...`);

  try {
    // Fetch demo metadata in both locales
    const [enDemo, arDemo] = await Promise.all([
      fetchDemoMetadata(demoSlug, 'en'),
      fetchDemoMetadata(demoSlug, 'ar'),
    ]);

    if (!enDemo) {
      console.error(
        `[Strapi Loader] Demo not found in CMS: ${demoSlug}`
      );
      // Return minimal fallback config
      const fallbackDemo: DemoConfig = {
        slug: demoSlug,
        type: 'ecommerce',
        businessName: demoSlug,
        enableAiChat: true,
      };
      return { demo: fallbackDemo, items: [] };
    }

    // Map demo config
    const demoConfig = mapCmsDemoToConfig(enDemo, arDemo || undefined);

    // Fetch items in both locales (use slug, not id — ids differ per locale in Strapi v5)
    const [enItems, arItems] = await Promise.all([
      fetchDemoItems(enDemo.slug, enDemo.demoType, 'en'),
      fetchDemoItems(enDemo.slug, enDemo.demoType, 'ar'),
    ]);

    console.log(
      `[Strapi Loader] Loaded ${enItems.length} items (EN), ${arItems.length} items (AR)`
    );

    // Merge localized items
    const items = mergeLocalizedItems(enItems, arItems);

    // Apply default agent config if not present
    if (!demoConfig.agentConfig) {
      demoConfig.agentConfig = getDefaultConfig({ type: demoConfig.type } as any);
    }

    // Store in cache
    const result = { demo: demoConfig, items };
    cache.set(demoSlug, {
      data: result,
      timestamp: Date.now(),
    });

    // Clean expired entries periodically
    if (Math.random() < 0.1) {
      // 10% chance on each load
      cleanExpiredCache();
    }

    console.log(`[Strapi Loader] Successfully loaded demo: ${demoSlug}`);
    return result;
  } catch (error) {
    console.error('[Strapi Loader] Error loading from CMS:', error);

    // Return minimal fallback
    const fallbackDemo: DemoConfig = {
      slug: demoSlug,
      type: 'ecommerce',
      businessName: demoSlug,
      enableAiChat: true,
    };
    return { demo: fallbackDemo, items: [] };
  }
}

// ========================================
// AI Agent Config & Knowledge Base
// ========================================

/**
 * Load AI agent config for a demo from CMS
 * Returns null if not found (caller uses hardcoded defaults)
 */
export async function loadAgentConfig(
  demoSlug: string,
  locale: string
): Promise<AgentConfig | null> {
  try {
    const endpoint = `/api/ai-agent-configs?filters[demo][slug][$eq]=${demoSlug}&locale=${locale}&populate=demo`;
    const response = await fetchStrapi<any>(endpoint, locale);

    if (!response || !Array.isArray(response.data) || response.data.length === 0) {
      console.log(`[Strapi Loader] No AI config found for demo: ${demoSlug}`);
      return null;
    }

    const item = response.data[0];
    const attrs = item.attributes || item;

    // Map CMS data to AgentConfig interface
    const config: AgentConfig = {
      agentName: attrs.agentName || 'Assistant',
      agentNameAr: locale === 'ar' ? attrs.agentName : undefined,
      persona: attrs.persona || 'You are a helpful AI assistant.',
      personaAr: locale === 'ar' ? attrs.persona : undefined,
      greeting: attrs.greeting || 'Hello! How can I help you?',
      greetingAr: locale === 'ar' ? attrs.greeting : undefined,
      modelTier: attrs.modelTier || 'standard',
      dailyMsgLimit: attrs.dailyMsgLimit || 200,
      enableLeadCapture: attrs.enableLeadCapture !== false,
      enableNavigation: attrs.enableNavigation !== false,
      suggestedPrompts: Array.isArray(attrs.suggestedPrompts) ? attrs.suggestedPrompts : [],
      suggestedPromptsAr: locale === 'ar' && Array.isArray(attrs.suggestedPrompts) ? attrs.suggestedPrompts : undefined,
      temperature: attrs.temperature || 0.7,
      maxResponseLen: attrs.maxResponseLen || 500,
    };

    console.log(`[Strapi Loader] Loaded AI config for demo: ${demoSlug}`);
    return config;
  } catch (error) {
    console.error('[Strapi Loader] Error loading AI config:', error);
    return null;
  }
}

/**
 * Load knowledge base entries for a demo from CMS
 * Returns empty array if none found
 */
export async function loadKnowledgeEntries(
  demoSlug: string,
  locale: string
): Promise<KnowledgeEntry[]> {
  try {
    const endpoint = `/api/ai-knowledge-entries?filters[demo][slug][$eq]=${demoSlug}&filters[isActive][$eq]=true&locale=${locale}&populate=demo&sort=priority:desc&pagination[limit]=30`;
    const response = await fetchStrapi<any>(endpoint, locale);

    if (!response || !Array.isArray(response.data) || response.data.length === 0) {
      console.log(`[Strapi Loader] No knowledge entries found for demo: ${demoSlug}`);
      return [];
    }

    // Map CMS data to KnowledgeEntry interface
    const entries: KnowledgeEntry[] = response.data.map((item: any): KnowledgeEntry => {
      const attrs = item.attributes || item;
      return {
        id: item.id?.toString() || item.documentId || 'unknown',
        category: (attrs.category || 'faq') as KnowledgeEntry['category'],
        question: attrs.question || '',
        answer: attrs.answer || '',
        keywords: Array.isArray(attrs.keywords) ? attrs.keywords : [],
        priority: attrs.priority || 5,
      };
    });

    console.log(`[Strapi Loader] Loaded ${entries.length} knowledge entries for demo: ${demoSlug}`);
    return entries;
  } catch (error) {
    console.error('[Strapi Loader] Error loading knowledge entries:', error);
    return [];
  }
}

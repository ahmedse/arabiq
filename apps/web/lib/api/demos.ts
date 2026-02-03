/**
 * Demo API Functions
 * Fetch demo items from Strapi CMS
 */

import 'server-only';
import type { TourItem } from '@/lib/matterport/types';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '';

interface StrapiResponse<T> {
  data: T[];
}

interface StrapiProduct {
  id: number;
  documentId: string;
  name: string;
  title?: string; // Properties use 'title' instead of 'name'
  description?: string;
  price: number;
  currency: string;
  category?: string;
  sku?: string;
  inStock: boolean;
  images?: Array<{ url: string }>;
  image?: { url: string };
  hotspotPosition?: { 
    x: number; 
    y: number; 
    z: number;
    stemVector?: { x: number; y: number; z: number };
    nearestSweepId?: string;
    floorIndex?: number;
    roomId?: string;
    cameraRotation?: { x: number; y: number };
  };
  // Menu item fields
  hotspotPositionX?: number;
  hotspotPositionY?: number;
  hotspotPositionZ?: number;
  isVegetarian?: boolean;
  spicyLevel?: number;
  prepTime?: number;
  // Hotel room fields
  roomType?: string;
  pricePerNight?: number;
  capacity?: number;
  bedType?: string;
  size?: string;
  amenities?: string[];
  // Property fields
  propertyType?: string;
  transactionType?: string;
  sizeUnit?: string;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  address?: string;
  features?: string[];
}

async function fetchFromCms<T>(endpoint: string): Promise<T | null> {
  try {
    const url = `${STRAPI_URL}${endpoint}`;
    const res = await fetch(url, {
      headers: STRAPI_API_TOKEN ? { Authorization: `Bearer ${STRAPI_API_TOKEN}` } : {},
      next: { revalidate: 60 },
    });
    
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('[API] Fetch error:', error);
    return null;
  }
}

/**
 * Fetch items for a demo based on type
 */
export async function fetchDemoItems(
  demoId: number, 
  demoType: string, 
  locale: string
): Promise<TourItem[]> {
  try {
    let endpoint: string;
    
    switch (demoType) {
      case 'ecommerce':
      case 'showroom':
        endpoint = `/api/demo-products?filters[demo][id][$eq]=${demoId}&locale=${locale}&populate=images`;
        break;
      case 'cafe':
        endpoint = `/api/demo-menu-items?filters[demo][id][$eq]=${demoId}&locale=${locale}&populate=image`;
        break;
      case 'hotel':
        endpoint = `/api/demo-rooms?filters[demo][id][$eq]=${demoId}&locale=${locale}&populate=images`;
        break;
      case 'realestate':
      case 'training':
        endpoint = `/api/demo-properties?filters[demo][id][$eq]=${demoId}&locale=${locale}&populate=images`;
        break;
      default:
        return [];
    }
    
    const response = await fetchFromCms<StrapiResponse<StrapiProduct>>(endpoint);
    
    if (!response?.data) {
      return [];
    }
    
    return response.data.map((item: StrapiProduct) => {
      // Extract enhanced hotspot data from stored JSON
      const storedPosition = item.hotspotPosition;
      const hasEnhancedData = storedPosition && storedPosition.stemVector;
      
      // Build hotspotData if enhanced data exists
      const hotspotData = hasEnhancedData ? {
        anchorPosition: {
          x: storedPosition.x || 0,
          y: storedPosition.y || 0,
          z: storedPosition.z || 0,
        },
        stemVector: storedPosition.stemVector || { x: 0, y: 0.3, z: 0 },
        nearestSweepId: storedPosition.nearestSweepId || undefined,
        floorIndex: storedPosition.floorIndex ?? undefined,
        roomId: storedPosition.roomId || undefined,
        cameraRotation: storedPosition.cameraRotation || undefined,
      } : undefined;
      
      // Legacy position for backwards compatibility
      const hotspotPosition = storedPosition ? {
        x: storedPosition.x || 0,
        y: storedPosition.y || 0,
        z: storedPosition.z || 0,
      } : {
        x: item.hotspotPositionX || 0,
        y: item.hotspotPositionY || 0,
        z: item.hotspotPositionZ || 0,
      };
      
      return {
        id: item.id,
        documentId: item.documentId,
        name: item.name || item.title || '', // Properties use 'title' instead of 'name'
        description: item.description,
        price: item.price,
        currency: item.currency,
        imageUrl: item.images?.[0]?.url 
          ? `${STRAPI_URL}${item.images[0].url}` 
          : item.image?.url 
            ? `${STRAPI_URL}${item.image.url}`
            : undefined,
        hotspotPosition,
        hotspotData,
        category: item.category || item.propertyType,
        // Menu item specific fields
        isVegetarian: item.isVegetarian,
        spicyLevel: item.spicyLevel,
        prepTime: item.prepTime,
        // Hotel room specific fields
        roomType: item.roomType,
        pricePerNight: item.pricePerNight,
        capacity: item.capacity,
        bedType: item.bedType,
        size: item.size,
        amenities: item.amenities,
        // Property specific fields
        propertyType: item.propertyType,
        transactionType: item.transactionType,
        sizeUnit: item.sizeUnit,
        bedrooms: item.bedrooms,
        bathrooms: item.bathrooms,
        yearBuilt: item.yearBuilt,
        address: item.address,
        features: item.features,
      };
    });
  } catch (error) {
    console.error('[API] Failed to fetch demo items:', error);
    return [];
  }
}

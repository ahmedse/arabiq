/**
 * Property API Functions
 * Fetch properties from Strapi
 */

import type { TourItem } from '@/lib/matterport/types';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL || 'http://localhost:1337';

export interface Property {
  id: number;
  title: string;
  description?: string;
  propertyType?: string;
  transactionType?: string;
  price?: number;
  currency: string;
  size?: number;
  sizeUnit?: string;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  address?: string;
  features?: string[];
  isAvailable: boolean;
  imageUrl?: string;
  hotspotPosition: { x: number; y: number; z: number };
}

/**
 * Fetch properties for a demo
 */
export async function fetchProperties(
  demoId: number, 
  locale: string = 'en',
  token?: string
): Promise<TourItem[]> {
  const response = await fetch(
    `${STRAPI_URL}/api/demo-properties?filters[demo][id][$eq]=${demoId}&locale=${locale}&populate=images`,
    {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      next: { revalidate: 60 },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch properties');
  }
  
  const result = await response.json();
  
  return (result.data || []).map((item: Record<string, unknown>) => ({
    id: item.id as number,
    name: (item.title as string) || '',
    description: item.description as string,
    price: item.price as number,
    currency: (item.currency as string) || 'EGP',
    imageUrl: Array.isArray(item.images) && item.images[0] 
      ? `${STRAPI_URL}${(item.images[0] as { url: string }).url}` 
      : undefined,
    hotspotPosition: {
      x: (item.hotspotPositionX as number) || 0,
      y: (item.hotspotPositionY as number) || 0,
      z: (item.hotspotPositionZ as number) || 0,
    },
    category: item.propertyType as string,
    propertyType: item.propertyType as string,
    transactionType: item.transactionType as string,
    size: item.size as number,
    sizeUnit: (item.sizeUnit as string) || 'sqm',
    bedrooms: item.bedrooms as number,
    bathrooms: item.bathrooms as number,
    yearBuilt: item.yearBuilt as number,
    address: item.address as string,
    features: item.features as string[],
    isAvailable: item.isAvailable as boolean,
  }));
}

/**
 * Update property hotspot position
 */
export async function updatePropertyPosition(
  propertyId: number,
  position: { x: number; y: number; z: number }
): Promise<void> {
  const response = await fetch(`/api/demo-properties/${propertyId}/position`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(position),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to update property position');
  }
}

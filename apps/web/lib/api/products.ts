/**
 * Product API Functions
 * CRUD operations for demo products
 */

import type { Vector3, HotspotPositionData } from '@/lib/matterport/types';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL || 'http://localhost:1337';

/**
 * Update product hotspot position
 * Supports both legacy Vector3 and enhanced HotspotPositionData
 */
export async function updateProductPosition(
  documentId: string,
  position: Vector3,
  enhancedData?: HotspotPositionData
): Promise<void> {
  const payload = enhancedData ? {
    x: position.x,
    y: position.y,
    z: position.z,
    // Enhanced data for better tag placement
    stemVector: enhancedData.stemVector,
    nearestSweepId: enhancedData.nearestSweepId,
    roomId: enhancedData.roomId,
    floorIndex: enhancedData.floorIndex,
    // Camera rotation for accurate fly-to direction
    cameraRotation: enhancedData.cameraRotation,
  } : position;

  const response = await fetch(`/api/demo-products/${documentId}/position`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 404) {
      throw new Error('Product not found in database. Please refresh the page and try again.');
    }
    throw new Error(error.error?.message || 'Failed to update product position');
  }
}

/**
 * Fetch products for a demo (server-side)
 */
export async function fetchDemoProducts(demoId: number, locale: string = 'en', token?: string): Promise<unknown[]> {
  const response = await fetch(
    `${STRAPI_URL}/api/demo-products?filters[demo][id][$eq]=${demoId}&locale=${locale}&populate=images`,
    {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  
  const result = await response.json();
  return result.data || [];
}

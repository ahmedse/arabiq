/**
 * Product API Functions
 * CRUD operations for demo products
 */

import type { Vector3 } from '@/lib/matterport/types';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL || 'http://localhost:1337';

/**
 * Update product hotspot position
 */
export async function updateProductPosition(
  productId: number,
  position: Vector3
): Promise<void> {
  const response = await fetch(`/api/demo-products/${productId}/position`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(position),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
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

/**
 * Menu Items API Functions
 * Fetch and update menu items from Strapi
 */

import type { Vector3 } from '@/lib/matterport/types';

const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  currency: string;
  category?: string;
  isAvailable: boolean;
  isVegetarian?: boolean;
  spicyLevel?: number;
  prepTime?: number;
  imageUrl?: string;
  hotspotPosition: Vector3;
}

/**
 * Fetch menu items for a demo
 */
export async function fetchMenuItems(demoId: number, locale: string = 'en'): Promise<MenuItem[]> {
  const response = await fetch(
    `${strapiUrl}/api/demo-menu-items?filters[demo][id][$eq]=${demoId}&locale=${locale}&populate=images`,
    {
      next: { revalidate: 60 },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch menu items');
  }
  
  const result = await response.json();
  
  return (result.data || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    currency: item.currency || 'EGP',
    category: item.category,
    isAvailable: item.isAvailable,
    isVegetarian: item.isVegetarian,
    spicyLevel: item.spicyLevel,
    prepTime: item.prepTime,
    imageUrl: item.images?.[0]?.url ? `${strapiUrl}${item.images[0].url}` : undefined,
    hotspotPosition: {
      x: item.hotspotPositionX || 0,
      y: item.hotspotPositionY || 0,
      z: item.hotspotPositionZ || 0,
    },
  }));
}

/**
 * Update menu item hotspot position
 */
export async function updateMenuItemPosition(
  itemId: number,
  position: Vector3
): Promise<void> {
  const response = await fetch(`/api/demo-menu-items/${itemId}/position`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      x: position.x,
      y: position.y,
      z: position.z,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to update menu item position');
  }
}

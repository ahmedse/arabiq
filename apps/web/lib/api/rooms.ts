/**
 * Rooms API functions
 * For hotel room data
 */

import type { TourItem } from '@/lib/matterport/types';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL || 'http://localhost:1337';

export async function fetchRooms(
  demoId: number, 
  locale: string = 'en',
  token?: string
): Promise<TourItem[]> {
  try {
    const response = await fetch(
      `${STRAPI_URL}/api/demo-rooms?filters[demo][id][$eq]=${demoId}&locale=${locale}&populate=images`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch rooms');
    }
    
    const result = await response.json();
    const rooms = result.data || [];
    
    return rooms.map((room: Record<string, unknown>) => ({
      id: room.id as number,
      name: (room.name as string) || '',
      description: (room.description as string) || '',
      category: (room.roomType as string) || 'standard',
      imageUrl: Array.isArray(room.images) && room.images[0] 
        ? `${STRAPI_URL}${(room.images[0] as { url: string }).url}`
        : undefined,
      hotspotPosition: room.hotspotPosition || null,
      // Room-specific fields
      roomType: (room.roomType as string) || 'standard',
      pricePerNight: (room.pricePerNight as number) || 0,
      capacity: (room.capacity as number) || 2,
      bedType: (room.bedType as string) || 'double',
      size: (room.size as string) || '',
      amenities: (room.amenities as string[]) || [],
      currency: (room.currency as string) || 'EGP',
    }));
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
    return [];
  }
}

export async function updateRoomPosition(
  roomId: number, 
  position: { x: number; y: number; z: number }
): Promise<boolean> {
  try {
    const response = await fetch(`/api/demo-rooms/${roomId}/position`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(position),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update room position');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to update room position:', error);
    return false;
  }
}

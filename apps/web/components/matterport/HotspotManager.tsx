'use client';

/**
 * Hotspot Manager
 * Injects product hotspots into the Matterport tour
 */

import { useEffect, useCallback, useRef } from 'react';
import { useMatterport, useMattertags } from './index';
import type { TourItem, MattertagDescriptor } from '@/lib/matterport/types';

interface HotspotManagerProps {
  items: TourItem[];
  onItemClick: (item: TourItem) => void;
}

// Colors for different categories
const CATEGORY_COLORS: Record<string, { r: number; g: number; b: number }> = {
  // E-commerce categories
  'TVs': { r: 0.2, g: 0.5, b: 0.9 },           // Blue
  'Laptops': { r: 0.5, g: 0.3, b: 0.8 },       // Purple
  'Phones': { r: 0.9, g: 0.4, b: 0.1 },        // Orange
  'Gaming': { r: 0.1, g: 0.7, b: 0.3 },        // Green
  'Audio': { r: 0.8, g: 0.2, b: 0.5 },         // Pink
  'Wearables': { r: 0.1, g: 0.6, b: 0.7 },     // Teal
  
  // Café categories
  'Hot Drinks': { r: 0.6, g: 0.3, b: 0.1 },      // Brown
  'Cold Drinks': { r: 0.2, g: 0.6, b: 0.8 },     // Light Blue
  'Breakfast': { r: 0.9, g: 0.7, b: 0.2 },       // Golden
  'Main Course': { r: 0.8, g: 0.3, b: 0.2 },     // Red
  'Desserts': { r: 0.8, g: 0.4, b: 0.6 },        // Pink
  
  // Arabic categories
  'مشروبات ساخنة': { r: 0.6, g: 0.3, b: 0.1 },   // Brown
  'مشروبات باردة': { r: 0.2, g: 0.6, b: 0.8 },   // Light Blue
  'فطور': { r: 0.9, g: 0.7, b: 0.2 },            // Golden
  'طبق رئيسي': { r: 0.8, g: 0.3, b: 0.2 },       // Red
  'حلويات': { r: 0.8, g: 0.4, b: 0.6 },          // Pink
  
  // Hotel room types
  'standard': { r: 0.5, g: 0.5, b: 0.5 },        // Gray
  'superior': { r: 0.2, g: 0.5, b: 0.9 },        // Blue
  'deluxe': { r: 0.6, g: 0.3, b: 0.8 },          // Purple
  'suite': { r: 0.9, g: 0.7, b: 0.2 },           // Gold
  'penthouse': { r: 1.0, g: 0.8, b: 0.0 },       // Bright Gold
  
  // Arabic room types
  'قياسي': { r: 0.5, g: 0.5, b: 0.5 },           // Gray
  'سوبيريور': { r: 0.2, g: 0.5, b: 0.9 },        // Blue
  'ديلوكس': { r: 0.6, g: 0.3, b: 0.8 },          // Purple
  'جناح': { r: 0.9, g: 0.7, b: 0.2 },            // Gold
  'بنتهاوس': { r: 1.0, g: 0.8, b: 0.0 },         // Bright Gold
  
  // Real estate area types
  'office': { r: 0.2, g: 0.5, b: 0.8 },          // Blue
  'reception': { r: 0.6, g: 0.3, b: 0.7 },       // Purple
  'executive': { r: 0.9, g: 0.6, b: 0.2 },       // Gold
  'workspace': { r: 0.3, g: 0.7, b: 0.4 },       // Green
  'meeting': { r: 0.4, g: 0.4, b: 0.8 },         // Indigo
  'utility': { r: 0.5, g: 0.5, b: 0.5 },         // Gray
  'amenity': { r: 0.2, g: 0.6, b: 0.6 },         // Teal
  
  // Showroom/Furniture categories
  'Sofas': { r: 0.6, g: 0.3, b: 0.5 },           // Plum
  'Tables': { r: 0.4, g: 0.3, b: 0.2 },          // Brown
  'Dining': { r: 0.8, g: 0.5, b: 0.2 },          // Orange
  'Bedroom': { r: 0.5, g: 0.4, b: 0.6 },         // Lavender
  'Lighting': { r: 0.9, g: 0.8, b: 0.3 },        // Yellow
  'Rugs': { r: 0.7, g: 0.2, b: 0.3 },            // Burgundy
  'Decor': { r: 0.6, g: 0.6, b: 0.3 },           // Olive
  'Office': { r: 0.3, g: 0.4, b: 0.6 },          // Steel Blue
  
  // Training facility types
  'conference': { r: 0.6, g: 0.2, b: 0.2 },      // Dark Red
  'lab': { r: 0.2, g: 0.5, b: 0.7 },             // Blue
  'boardroom': { r: 0.4, g: 0.3, b: 0.5 },       // Purple
  'classroom': { r: 0.3, g: 0.6, b: 0.3 },       // Green
  
  // Arabic training facility types
  'مؤتمرات': { r: 0.6, g: 0.2, b: 0.2 },          // Dark Red
  'معمل': { r: 0.2, g: 0.5, b: 0.7 },             // Blue
  'قاعة اجتماعات': { r: 0.4, g: 0.3, b: 0.5 },    // Purple
  'فصل دراسي': { r: 0.3, g: 0.6, b: 0.3 },        // Green
  
  // Arabic furniture categories
  'أرائك': { r: 0.6, g: 0.3, b: 0.5 },           // Plum
  'طاولات': { r: 0.4, g: 0.3, b: 0.2 },          // Brown
  'طعام': { r: 0.8, g: 0.5, b: 0.2 },            // Orange
  'غرف نوم': { r: 0.5, g: 0.4, b: 0.6 },         // Lavender
  'إضاءة': { r: 0.9, g: 0.8, b: 0.3 },           // Yellow
  'سجاد': { r: 0.7, g: 0.2, b: 0.3 },            // Burgundy
  'ديكور': { r: 0.6, g: 0.6, b: 0.3 },           // Olive
  'مكتب': { r: 0.3, g: 0.4, b: 0.6 },            // Steel Blue
  
  'default': { r: 0.3, g: 0.6, b: 0.9 },       // Default blue
};

export function HotspotManager({ items, onItemClick }: HotspotManagerProps) {
  const { sdk, isReady } = useMatterport();
  const { addTag } = useMattertags(sdk);
  const tagMapRef = useRef<Map<string, TourItem>>(new Map());
  const injectedRef = useRef(false);
  
  // Inject hotspots when SDK is ready
  useEffect(() => {
    if (!sdk || !isReady || injectedRef.current) return;
    if (items.length === 0) return;
    
    // Only inject items that have valid positions
    const validItems = items.filter(item => 
      item.hotspotPosition && 
      (item.hotspotPosition.x !== 0 || item.hotspotPosition.y !== 0 || item.hotspotPosition.z !== 0)
    );
    
    if (validItems.length === 0) {
      console.log('[HotspotManager] No items with valid positions to inject');
      return;
    }
    
    const injectHotspots = async () => {
      console.log(`[HotspotManager] Injecting ${validItems.length} hotspots...`);
      
      for (const item of validItems) {
        const color = CATEGORY_COLORS[item.category || 'default'] || CATEGORY_COLORS.default;
        
        const descriptor: MattertagDescriptor = {
          label: item.name,
          description: item.price 
            ? `${item.currency || 'EGP'} ${item.price.toLocaleString()}`
            : '',
          anchorPosition: item.hotspotPosition,
          stemVector: { x: 0, y: 0.3, z: 0 },
          color,
        };
        
        try {
          const tagId = await addTag(descriptor);
          if (tagId) {
            tagMapRef.current.set(tagId, item);
            console.log(`  ✅ Injected: ${item.name}`);
          }
        } catch (error) {
          console.error(`  ❌ Failed to inject: ${item.name}`, error);
        }
      }
      
      injectedRef.current = true;
      console.log('[HotspotManager] Hotspot injection complete');
    };
    
    injectHotspots();
  }, [sdk, isReady, items, addTag]);
  
  // Handle tag clicks
  useEffect(() => {
    if (!sdk) return;
    
    const handleTagClick = (event: unknown) => {
      const tagEvent = event as { sid: string };
      const item = tagMapRef.current.get(tagEvent.sid);
      if (item) {
        onItemClick(item);
      }
    };
    
    sdk.on('mattertag.click', handleTagClick as (event: unknown) => void);
    
    return () => {
      sdk.off('mattertag.click', handleTagClick as (event: unknown) => void);
    };
  }, [sdk, onItemClick]);
  
  // This component doesn't render anything visible
  return null;
}

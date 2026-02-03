/**
 * Matterport SDK Configuration
 */

import type { MatterportOptions } from './types';

// SDK Key from environment
export const MATTERPORT_SDK_KEY = process.env.NEXT_PUBLIC_MATTERPORT_SDK_KEY || '';

// Validate SDK key exists
if (!MATTERPORT_SDK_KEY && typeof window !== 'undefined') {
  console.warn('[Matterport] SDK key not found. Set NEXT_PUBLIC_MATTERPORT_SDK_KEY in .env.local');
}

// Default SDK options
export const DEFAULT_OPTIONS: MatterportOptions = {
  play: true,        // Autoplay
  qs: true,          // Quick start
  dh: true,          // Disable highlight reel
  mt: true,          // Show mattertags
  hr: false,         // No highlight reel
  help: false,       // Hide help button
  brand: false,      // Hide Matterport branding
  search: false,     // Hide search
  title: false,      // Hide title
  vr: false,         // Disable VR (for now)
  lang: 'en',        // Default language
};

// Build iframe URL with options
export function buildShowcaseUrl(modelId: string, options: MatterportOptions = {}): string {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const params = new URLSearchParams();
  
  // Add SDK key
  params.append('m', modelId);
  params.append('applicationKey', MATTERPORT_SDK_KEY);
  
  // Add boolean options
  Object.entries(mergedOptions).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      params.append(key, value ? '1' : '0');
    } else if (value !== undefined) {
      params.append(key, String(value));
    }
  });
  
  return `https://my.matterport.com/show?${params.toString()}`;
}

// Available demo tours
export const DEMO_TOURS = {
  'awni-electronics': {
    modelId: '6WxfcPSW7KM',
    name: 'Awni Electronics',
    type: 'ecommerce' as const,
  },
  'cavalli-cafe': {
    modelId: 'dA2YT3w5Jgs',
    name: 'Cavalli Cafe',
    type: 'cafe' as const,
  },
  'royal-jewel': {
    modelId: 'bBwDnZTv2qm',
    name: 'Royal Jewel & Lail',
    type: 'hotel' as const,
  },
  'office-sale': {
    modelId: 'Tv2upLvBLZ6',
    name: 'Office for Sale',
    type: 'realestate' as const,
  },
  'trust-interior': {
    modelId: 'wheLaeajqUu',
    name: 'Trust Co. Interior',
    type: 'showroom' as const,
  },
  'eaac-training': {
    modelId: 'fNbgwVqbf5R',
    name: 'EAAC Training',
    type: 'office' as const,
  },
} as const;

export type DemoSlug = keyof typeof DEMO_TOURS;

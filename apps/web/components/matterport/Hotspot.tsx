'use client';

/**
 * Custom Hotspot Component
 * Represents a clickable point in the 3D space
 */

import React from 'react';
import { ShoppingBag, Coffee, Bed, Home, Eye, Building } from 'lucide-react';
import type { TourItem } from '@/lib/matterport/types';

type HotspotType = 'product' | 'menu' | 'room' | 'property' | 'info' | 'office';

interface HotspotProps {
  type: HotspotType;
  item?: TourItem;
  label?: string;
  onClick?: () => void;
  className?: string;
}

const HOTSPOT_ICONS: Record<HotspotType, React.ComponentType<{ className?: string }>> = {
  product: ShoppingBag,
  menu: Coffee,
  room: Bed,
  property: Home,
  info: Eye,
  office: Building,
};

const HOTSPOT_COLORS: Record<HotspotType, string> = {
  product: 'bg-blue-500 hover:bg-blue-600',
  menu: 'bg-orange-500 hover:bg-orange-600',
  room: 'bg-purple-500 hover:bg-purple-600',
  property: 'bg-green-500 hover:bg-green-600',
  info: 'bg-gray-500 hover:bg-gray-600',
  office: 'bg-indigo-500 hover:bg-indigo-600',
};

export function Hotspot({ type, item, label, onClick, className = '' }: HotspotProps) {
  const Icon = HOTSPOT_ICONS[type];
  const colorClass = HOTSPOT_COLORS[type];
  
  return (
    <button
      onClick={onClick}
      className={`
        group relative
        w-10 h-10 rounded-full
        ${colorClass}
        text-white shadow-lg
        flex items-center justify-center
        transition-all duration-200
        hover:scale-110
        ${className}
      `}
      title={label || item?.name}
    >
      <Icon className="w-5 h-5" />
      
      {/* Pulse animation */}
      <span className="absolute inset-0 rounded-full bg-current opacity-30 animate-ping" />
      
      {/* Label tooltip */}
      {(label || item?.name) && (
        <span className="
          absolute bottom-full left-1/2 -translate-x-1/2 mb-2
          px-2 py-1 text-xs font-medium
          bg-gray-900 text-white rounded
          whitespace-nowrap
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
        ">
          {label || item?.name}
        </span>
      )}
    </button>
  );
}

'use client';

/**
 * Menu Item Popup
 * Shows menu item details when a hotspot is clicked
 */

import React from 'react';
import Image from 'next/image';
import { X, Clock, Leaf, Flame, Calendar } from 'lucide-react';
import type { TourItem } from '@/lib/matterport/types';

interface MenuItemPopupProps {
  item: TourItem & {
    isVegetarian?: boolean;
    spicyLevel?: number;
    prepTime?: number;
  };
  onClose: () => void;
  onReserve: () => void;
  locale: string;
}

export function MenuItemPopup({ item, onClose, onReserve, locale }: MenuItemPopupProps) {
  const isRtl = locale === 'ar';
  
  const formatPrice = (price: number, currency: string = 'EGP') => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };
  
  const t = {
    prepTime: isRtl ? 'وقت التحضير' : 'Prep time',
    minutes: isRtl ? 'دقائق' : 'min',
    vegetarian: isRtl ? 'نباتي' : 'Vegetarian',
    spicy: isRtl ? 'حار' : 'Spicy',
    reserveTable: isRtl ? 'احجز طاولة' : 'Reserve a Table',
  };
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden ${isRtl ? 'rtl' : 'ltr'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/90 rounded-full shadow hover:bg-white z-10"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Item Image */}
        {item.imageUrl && (
          <div className="relative h-56 bg-gradient-to-br from-amber-100 to-orange-100">
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        
        {/* Fallback gradient if no image */}
        {!item.imageUrl && (
          <div className="h-32 bg-gradient-to-br from-amber-400 to-orange-500" />
        )}
        
        {/* Content */}
        <div className="p-6">
          {/* Category */}
          {item.category && (
            <span className="inline-block px-3 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded-full mb-2">
              {item.category}
            </span>
          )}
          
          {/* Name */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {item.name}
          </h2>
          
          {/* Price */}
          {item.price !== undefined && (
            <p className="text-3xl font-bold text-amber-600 mb-4">
              {formatPrice(item.price, item.currency)}
            </p>
          )}
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {item.isVegetarian && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full">
                <Leaf className="w-3 h-3" />
                {t.vegetarian}
              </span>
            )}
            {item.spicyLevel && item.spicyLevel > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-full">
                <Flame className="w-3 h-3" />
                {t.spicy} {'🌶️'.repeat(item.spicyLevel)}
              </span>
            )}
            {item.prepTime && item.prepTime > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                <Clock className="w-3 h-3" />
                {item.prepTime} {t.minutes}
              </span>
            )}
          </div>
          
          {/* Description */}
          {item.description && (
            <p className="text-gray-600 mb-6 leading-relaxed">
              {item.description}
            </p>
          )}
          
          {/* Reserve Button */}
          <button
            onClick={onReserve}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-amber-600 text-white rounded-xl font-bold text-lg hover:bg-amber-700 transition-colors"
          >
            <Calendar className="w-6 h-6" />
            {t.reserveTable}
          </button>
        </div>
      </div>
    </div>
  );
}

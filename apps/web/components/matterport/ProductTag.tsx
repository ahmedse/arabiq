'use client';

/**
 * Product Tag Component
 * Shows product info when hovering over a tag in the tour
 */

import React from 'react';
import Image from 'next/image';
import type { TourItem } from '@/lib/matterport/types';

interface ProductTagProps {
  item: TourItem;
  onSelect?: () => void;
  onAddToCart?: () => void;
  className?: string;
}

export function ProductTag({ item, onSelect, onAddToCart, className = '' }: ProductTagProps) {
  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };
  
  return (
    <div 
      className={`bg-white rounded-lg shadow-xl overflow-hidden max-w-xs ${className}`}
      onClick={onSelect}
    >
      {/* Product Image */}
      {item.imageUrl && (
        <div className="relative h-32 bg-gray-100">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
          />
        </div>
      )}
      
      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
        
        {item.category && (
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            {item.category}
          </span>
        )}
        
        {item.description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {item.description}
          </p>
        )}
        
        {/* Price & Action */}
        <div className="flex items-center justify-between mt-4">
          {item.price !== undefined && (
            <span className="text-lg font-bold text-primary-600">
              {formatPrice(item.price, item.currency)}
            </span>
          )}
          
          {onAddToCart && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
              className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

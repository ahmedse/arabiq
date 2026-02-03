'use client';

/**
 * Info Panel Component
 * Side panel showing details about selected item
 */

import React from 'react';
import Image from 'next/image';
import { X, ShoppingCart, Phone, MessageCircle } from 'lucide-react';
import { useMatterport } from './MatterportProvider';
import type { TourItem } from '@/lib/matterport/types';

interface InfoPanelProps {
  onAddToCart?: (item: TourItem) => void;
  onInquire?: (item: TourItem) => void;
}

export function InfoPanel({ onAddToCart, onInquire }: InfoPanelProps) {
  const { selectedItem, selectItem, isPanelOpen, togglePanel, demo } = useMatterport();
  
  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };
  
  if (!isPanelOpen || !selectedItem) return null;
  
  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-bold text-lg">Details</h2>
        <button
          onClick={() => {
            selectItem(null);
            togglePanel();
          }}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Image */}
        {selectedItem.imageUrl && (
          <div className="relative h-48 bg-gray-100">
            <Image
              src={selectedItem.imageUrl}
              alt={selectedItem.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        
        {/* Info */}
        <div className="p-4">
          <h3 className="text-xl font-bold text-gray-900">{selectedItem.name}</h3>
          
          {selectedItem.category && (
            <span className="inline-block mt-1 text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded">
              {selectedItem.category}
            </span>
          )}
          
          {selectedItem.price !== undefined && (
            <p className="mt-4 text-2xl font-bold text-primary-600">
              {formatPrice(selectedItem.price, selectedItem.currency)}
            </p>
          )}
          
          {selectedItem.description && (
            <p className="mt-4 text-gray-600">{selectedItem.description}</p>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="p-4 border-t space-y-2">
        {onAddToCart && (
          <button
            onClick={() => onAddToCart(selectedItem)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ShoppingCart className="w-5 h-5" />
            Add to Cart
          </button>
        )}
        
        {onInquire && (
          <button
            onClick={() => onInquire(selectedItem)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Ask a Question
          </button>
        )}
        
        {demo?.businessWhatsapp && (
          <a
            href={`https://wa.me/${demo.businessWhatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Phone className="w-5 h-5" />
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

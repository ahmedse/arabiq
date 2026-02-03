'use client';

/**
 * Property/Area Popup
 * Shows property details when a hotspot is clicked
 */

import React from 'react';
import Image from 'next/image';
import { X, Maximize, Calendar, Bath, CheckCircle, MapPin, Send } from 'lucide-react';
import type { TourItem } from '@/lib/matterport/types';

interface PropertyPopupProps {
  property: TourItem & {
    propertyType?: string;
    transactionType?: string;
    size?: number;
    sizeUnit?: string;
    bedrooms?: number;
    bathrooms?: number;
    yearBuilt?: number;
    address?: string;
    features?: string[];
  };
  onClose: () => void;
  onInquire: () => void;
  locale: string;
  isMainProperty?: boolean;
}

// Property type colors
const PROPERTY_TYPE_COLORS: Record<string, string> = {
  office: 'bg-blue-100 text-blue-700',
  reception: 'bg-purple-100 text-purple-700',
  executive: 'bg-amber-100 text-amber-700',
  workspace: 'bg-green-100 text-green-700',
  meeting: 'bg-indigo-100 text-indigo-700',
  utility: 'bg-gray-100 text-gray-700',
  amenity: 'bg-teal-100 text-teal-700',
};

// Property type labels (English and Arabic)
const PROPERTY_TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  office: { en: 'Office', ar: 'مكتب' },
  reception: { en: 'Reception', ar: 'استقبال' },
  executive: { en: 'Executive', ar: 'تنفيذي' },
  workspace: { en: 'Workspace', ar: 'مساحة عمل' },
  meeting: { en: 'Meeting Room', ar: 'قاعة اجتماعات' },
  utility: { en: 'Utility', ar: 'خدمات' },
  amenity: { en: 'Amenity', ar: 'مرافق' },
};

export function PropertyPopup({ property, onClose, onInquire, locale, isMainProperty }: PropertyPopupProps) {
  const isRtl = locale === 'ar';
  
  const formatPrice = (price: number, currency: string = 'EGP') => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  };
  
  const t = {
    size: isRtl ? 'المساحة' : 'Size',
    sqm: isRtl ? 'م²' : 'sqm',
    yearBuilt: isRtl ? 'سنة البناء' : 'Year Built',
    bathrooms: isRtl ? 'حمامات' : 'Bathrooms',
    features: isRtl ? 'المميزات' : 'Features',
    inquireNow: isRtl ? 'استفسر الآن' : 'Inquire Now',
    forSale: isRtl ? 'للبيع' : 'For Sale',
    forRent: isRtl ? 'للإيجار' : 'For Rent',
  };
  
  const typeLabel = property.propertyType 
    ? (PROPERTY_TYPE_LABELS[property.propertyType]?.[isRtl ? 'ar' : 'en'] || 
       property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1))
    : '';
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden relative ${isRtl ? 'rtl' : 'ltr'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/90 rounded-full shadow hover:bg-white z-10"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Property Image */}
        {property.imageUrl ? (
          <div className="relative h-56 bg-gray-100">
            <Image
              src={property.imageUrl}
              alt={property.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-40 bg-gradient-to-br from-blue-400 to-indigo-600" />
        )}
        
        {/* Content */}
        <div className="p-6">
          {/* Type Badge & Transaction Type */}
          <div className="flex items-center gap-2 mb-2">
            {property.propertyType && (
              <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${PROPERTY_TYPE_COLORS[property.propertyType] || PROPERTY_TYPE_COLORS.office}`}>
                {typeLabel}
              </span>
            )}
            {isMainProperty && property.transactionType && property.transactionType !== 'info' && (
              <span className="inline-block px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700">
                {property.transactionType === 'sale' ? t.forSale : t.forRent}
              </span>
            )}
          </div>
          
          {/* Name */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {property.name}
          </h2>
          
          {/* Address */}
          {property.address && (
            <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
              <MapPin className="w-4 h-4" />
              <span>{property.address}</span>
            </div>
          )}
          
          {/* Price (for main property) */}
          {isMainProperty && property.price && (
            <div className="mb-4">
              <span className="text-3xl font-bold text-blue-600">
                {formatPrice(property.price, property.currency)}
              </span>
            </div>
          )}
          
          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
            {property.size && (
              <div className="flex items-center gap-1">
                <Maximize className="w-4 h-4" />
                <span>{property.size} {t.sqm}</span>
              </div>
            )}
            {property.bathrooms && property.bathrooms > 0 && (
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                <span>{property.bathrooms} {t.bathrooms}</span>
              </div>
            )}
            {property.yearBuilt && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{property.yearBuilt}</span>
              </div>
            )}
          </div>
          
          {/* Description */}
          {property.description && (
            <p className="text-gray-600 mb-4 leading-relaxed">
              {property.description}
            </p>
          )}
          
          {/* Features */}
          {property.features && property.features.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">{t.features}</h3>
              <div className="flex flex-wrap gap-2">
                {property.features.map((feature, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full"
                  >
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Inquire Button (only for main property) */}
          {isMainProperty && (
            <button
              onClick={onInquire}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors"
            >
              <Send className="w-6 h-6" />
              {t.inquireNow}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

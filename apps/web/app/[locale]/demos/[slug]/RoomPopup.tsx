'use client';

/**
 * Room Popup
 * Shows room details when a hotspot is clicked
 */

import React from 'react';
import Image from 'next/image';
import { X, Users, Bed, Maximize, Wifi, Tv, Coffee, Waves, ChefHat, Calendar } from 'lucide-react';
import type { TourItem } from '@/lib/matterport/types';

interface RoomPopupProps {
  room: TourItem & {
    roomType?: string;
    pricePerNight?: number;
    capacity?: number;
    bedType?: string;
    size?: string;
    amenities?: string[];
  };
  onClose: () => void;
  onBook: () => void;
  locale: string;
}

// Map amenities to icons
const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'Free WiFi': <Wifi className="w-4 h-4" />,
  'Smart TV': <Tv className="w-4 h-4" />,
  'Mini Bar': <Coffee className="w-4 h-4" />,
  'Room Service': <Coffee className="w-4 h-4" />,
  'Jacuzzi': <Waves className="w-4 h-4" />,
  'Personal Chef': <ChefHat className="w-4 h-4" />,
  'Private Pool': <Waves className="w-4 h-4" />,
};

// Room type colors
const ROOM_TYPE_COLORS: Record<string, string> = {
  standard: 'bg-gray-100 text-gray-700',
  superior: 'bg-blue-100 text-blue-700',
  deluxe: 'bg-purple-100 text-purple-700',
  suite: 'bg-amber-100 text-amber-700',
  penthouse: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white',
};

export function RoomPopup({ room, onClose, onBook, locale }: RoomPopupProps) {
  const isRtl = locale === 'ar';
  
  const formatPrice = (price: number, currency: string = 'EGP') => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  };
  
  const t = {
    perNight: isRtl ? '/ليلة' : '/night',
    guests: isRtl ? 'ضيوف' : 'guests',
    sqm: isRtl ? 'م²' : 'm²',
    amenities: isRtl ? 'المرافق' : 'Amenities',
    bookNow: isRtl ? 'احجز الآن' : 'Book Now',
  };
  
  const roomTypeLabel = room.roomType 
    ? room.roomType.charAt(0).toUpperCase() + room.roomType.slice(1) 
    : '';
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden ${isRtl ? 'rtl' : 'ltr'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/90 rounded-full shadow hover:bg-white z-10"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Room Image */}
        {room.imageUrl ? (
          <div className="relative h-56 bg-gray-100">
            <Image
              src={room.imageUrl}
              alt={room.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-40 bg-gradient-to-br from-purple-400 to-indigo-600" />
        )}
        
        {/* Content */}
        <div className="p-6">
          {/* Room Type Badge */}
          {room.roomType && (
            <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-2 ${ROOM_TYPE_COLORS[room.roomType] || ROOM_TYPE_COLORS.standard}`}>
              {roomTypeLabel}
            </span>
          )}
          
          {/* Name */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {room.name}
          </h2>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
            {room.capacity && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{room.capacity} {t.guests}</span>
              </div>
            )}
            {room.bedType && (
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                <span>{room.bedType}</span>
              </div>
            )}
            {room.size && (
              <div className="flex items-center gap-1">
                <Maximize className="w-4 h-4" />
                <span>{room.size} {t.sqm}</span>
              </div>
            )}
          </div>
          
          {/* Price */}
          {room.pricePerNight && (
            <div className="mb-4">
              <span className="text-3xl font-bold text-primary-600">
                {formatPrice(room.pricePerNight, room.currency)}
              </span>
              <span className="text-gray-500">{t.perNight}</span>
            </div>
          )}
          
          {/* Description */}
          {room.description && (
            <p className="text-gray-600 mb-4 leading-relaxed">
              {room.description}
            </p>
          )}
          
          {/* Amenities */}
          {room.amenities && room.amenities.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">{t.amenities}</h3>
              <div className="flex flex-wrap gap-2">
                {room.amenities.map((amenity, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full"
                  >
                    {AMENITY_ICONS[amenity] || <Coffee className="w-3 h-3" />}
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Book Button */}
          <button
            onClick={onBook}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary-600 text-white rounded-xl font-bold text-lg hover:bg-primary-700 transition-colors"
          >
            <Calendar className="w-6 h-6" />
            {t.bookNow}
          </button>
        </div>
      </div>
    </div>
  );
}

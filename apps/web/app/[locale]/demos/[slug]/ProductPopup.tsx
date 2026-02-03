'use client';

/**
 * Product Popup
 * Shows product details when a hotspot is clicked
 */

import React from 'react';
import Image from 'next/image';
import { X, ShoppingCart, Plus, Minus, Check } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import type { TourItem } from '@/lib/matterport/types';

interface ProductPopupProps {
  product: TourItem;
  onClose: () => void;
  locale: string;
}

export function ProductPopup({ product, onClose, locale }: ProductPopupProps) {
  const { addItem, items } = useCart();
  const [quantity, setQuantity] = React.useState(1);
  const [added, setAdded] = React.useState(false);
  
  const isRtl = locale === 'ar';
  const cartItem = items.find(item => item.id === product.id.toString());
  
  const formatPrice = (price: number, currency: string = 'EGP') => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency,
    }).format(price);
  };
  
  const handleAddToCart = () => {
    addItem({
      id: product.id.toString(),
      name: product.name,
      price: product.price || 0,
      quantity,
      image: product.imageUrl,
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1500);
  };
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative ${isRtl ? 'rtl' : 'ltr'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/90 rounded-full shadow hover:bg-white z-10"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Product Image */}
        {product.imageUrl && (
          <div className="relative h-64 bg-gray-100">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {/* Category */}
          {product.category && (
            <span className="inline-block px-2 py-1 text-xs font-medium text-primary-700 bg-primary-50 rounded-full mb-2">
              {product.category}
            </span>
          )}
          
          {/* Name */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {product.name}
          </h2>
          
          {/* Price */}
          {product.price !== undefined && (
            <p className="text-3xl font-bold text-primary-600 mb-4">
              {formatPrice(product.price, product.currency)}
            </p>
          )}
          
          {/* Description */}
          {product.description && (
            <p className="text-gray-600 mb-6">
              {product.description}
            </p>
          )}
          
          {/* Quantity Selector */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-gray-700">{isRtl ? 'الكمية:' : 'Quantity:'}</span>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-gray-100"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={added}
            className={`
              w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg
              transition-all duration-300
              ${added 
                ? 'bg-green-600 text-white' 
                : 'bg-primary-600 text-white hover:bg-primary-700'
              }
            `}
          >
            {added ? (
              <>
                <Check className="w-6 h-6" />
                {isRtl ? 'تمت الإضافة!' : 'Added!'}
              </>
            ) : (
              <>
                <ShoppingCart className="w-6 h-6" />
                {isRtl ? 'أضف إلى السلة' : 'Add to Cart'}
              </>
            )}
          </button>
          
          {/* Already in cart notice */}
          {cartItem && !added && (
            <p className="text-center text-sm text-gray-500 mt-2">
              {isRtl 
                ? `لديك ${cartItem.quantity} في السلة` 
                : `You have ${cartItem.quantity} in cart`
              }
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

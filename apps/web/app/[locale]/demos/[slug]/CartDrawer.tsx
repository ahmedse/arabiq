'use client';

/**
 * Cart Drawer
 * Slide-out shopping cart panel
 */

import React from 'react';
import Image from 'next/image';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
  locale: string;
}

export function CartDrawer({ isOpen, onClose, onCheckout, locale }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, total, itemCount, clearCart } = useCart();
  const isRtl = locale === 'ar';
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
    }).format(price);
  };
  
  const t = {
    title: isRtl ? 'سلة التسوق' : 'Shopping Cart',
    empty: isRtl ? 'السلة فارغة' : 'Your cart is empty',
    emptyDesc: isRtl ? 'أضف منتجات من الجولة الافتراضية' : 'Add products from the virtual tour',
    subtotal: isRtl ? 'المجموع الفرعي' : 'Subtotal',
    checkout: isRtl ? 'إتمام الشراء' : 'Proceed to Checkout',
    continueShopping: isRtl ? 'متابعة التسوق' : 'Continue Shopping',
    clearCart: isRtl ? 'إفراغ السلة' : 'Clear Cart',
    items: isRtl ? 'منتجات' : 'items',
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`
        absolute top-0 bottom-0 w-full max-w-md bg-white shadow-2xl
        flex flex-col
        ${isRtl ? 'left-0' : 'right-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" />
            {t.title}
            {itemCount > 0 && (
              <span className="text-sm font-normal text-gray-500">
                ({itemCount} {t.items})
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t.empty}
              </h3>
              <p className="text-gray-500 mb-6">{t.emptyDesc}</p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                {t.continueShopping}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                  {/* Image */}
                  {item.image && (
                    <div className="relative w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {item.name}
                    </h3>
                    <p className="text-primary-600 font-bold">
                      {formatPrice(item.price)}
                    </p>
                    
                    {/* Quantity */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full self-start"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {/* Clear cart */}
            <button
              onClick={clearCart}
              className="w-full text-sm text-red-600 hover:underline"
            >
              {t.clearCart}
            </button>
            
            {/* Subtotal */}
            <div className="flex items-center justify-between text-lg font-bold">
              <span>{t.subtotal}</span>
              <span className="text-primary-600">{formatPrice(total)}</span>
            </div>
            
            {/* Checkout button */}
            <button
              onClick={onCheckout}
              className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors"
            >
              {t.checkout}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

/**
 * Premium Product Detail Drawer
 * Beautiful e-commerce product display with images, specs, reviews
 * Modern UI inspired by top commerce sites
 */

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star, 
  Truck, 
  Shield, 
  RotateCcw,
  Check,
  Plus,
  Minus,
  Zap,
  Package,
  CreditCard
} from 'lucide-react';
import { ResizablePanel } from '@/components/ui/ResizablePanel';
import { useCart } from '@/contexts/CartContext';
import type { TourItem } from '@/lib/matterport/types';

interface ProductDrawerProps {
  product: TourItem | null;
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  onGoToProduct?: (product: TourItem) => void;
}

// Mock reviews for demo
const mockReviews = [
  { id: 1, name: 'Ahmed M.', rating: 5, comment: 'Excellent product! Highly recommended.', date: '2024-01-15' },
  { id: 2, name: 'Sara K.', rating: 4, comment: 'Great quality, fast delivery.', date: '2024-01-10' },
  { id: 3, name: 'Omar H.', rating: 5, comment: 'Best purchase I made this year!', date: '2024-01-05' },
];

// Product images from CMS
const getProductImages = (product: TourItem): string[] => {
  // ONLY use actual product image from CMS - no fallback mismatches
  if (product.imageUrl) {
    return [product.imageUrl];
  }
  // Return empty array if no image - will show placeholder icon instead
  return [];
};

export function ProductDrawer({ product, isOpen, onClose, locale, onGoToProduct }: ProductDrawerProps) {
  const { addItem, items: cartItems } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews'>('specs');
  const drawerRef = useRef<HTMLDivElement>(null);
  
  const isRtl = locale === 'ar';
  
  // Reset state when product changes
  useEffect(() => {
    setQuantity(1);
    setAdded(false);
    setCurrentImageIndex(0);
  }, [product?.id]);
  
  const formatPrice = (price: number, currency: string = 'EGP') => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };
  
  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id.toString(),
      name: product.name,
      price: product.price || 0,
      quantity,
      image: product.imageUrl,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };
  
  const images = product ? getProductImages(product) : [];
  const hasImage = images.length > 0;
  const inCart = product && cartItems.find(item => item.id === product.id.toString());
  
  if (!isOpen || !product) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <ResizablePanel
        side="right"
        defaultWidth={450}
        minWidth={380}
        maxWidth={700}
        className="relative z-10"
      >
        <div 
          ref={drawerRef}
          className={`h-full bg-white shadow-2xl overflow-y-auto ${isRtl ? 'rtl' : 'ltr'}`}
        >
          {/* Header */}
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between p-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`p-2 rounded-full transition-colors ${
                    isFavorite ? 'text-red-500 bg-red-50' : 'hover:bg-gray-100'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Image Gallery */}
          <div className="relative bg-gradient-to-b from-gray-50 to-white p-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-lg">
              {images.length > 0 ? (
                <Image
                  src={images[currentImageIndex]}
                  alt={product.name}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 700px) 100vw, 700px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <Package className="w-24 h-24 text-gray-300" />
                </div>
              )}
              
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            
            {/* Image Indicators */}
            {images.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex ? 'w-6 bg-primary-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Category & Rating */}
            <div className="flex items-center justify-between">
              {product.category && (
                <span className="px-3 py-1 text-xs font-semibold text-primary-700 bg-primary-50 rounded-full">
                  {product.category}
                </span>
              )}
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-medium">4.8</span>
                <span className="text-gray-400 text-sm">(128)</span>
              </div>
            </div>
            
            {/* Name */}
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>
            
            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(product.price || 0, product.currency)}
              </span>
              {/* Fake original price for discount effect */}
              <span className="text-sm text-gray-400 line-through">
                {formatPrice((product.price || 0) * 1.2, product.currency)}
              </span>
              <span className="px-2 py-0.5 text-xs font-bold text-green-700 bg-green-100 rounded">
                -20%
              </span>
            </div>
            
            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 py-3 border-y border-gray-100">
              <div className="flex flex-col items-center text-center gap-1">
                <Truck className="w-5 h-5 text-primary-600" />
                <span className="text-xs text-gray-600">
                  {isRtl ? 'شحن مجاني' : 'Free Shipping'}
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <Shield className="w-5 h-5 text-primary-600" />
                <span className="text-xs text-gray-600">
                  {isRtl ? 'ضمان سنة' : '1 Year Warranty'}
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <RotateCcw className="w-5 h-5 text-primary-600" />
                <span className="text-xs text-gray-600">
                  {isRtl ? 'إرجاع 14 يوم' : '14-Day Return'}
                </span>
              </div>
            </div>
            
            {/* Description */}
            {product.description && (
              <p className="text-gray-600 leading-relaxed">
                {product.description}
              </p>
            )}
            
            {/* Tabs: Specs & Reviews */}
            <div className="border-b border-gray-200">
              <div className="flex gap-8">
                <button
                  onClick={() => setActiveTab('specs')}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'specs'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {isRtl ? 'المواصفات' : 'Specifications'}
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'reviews'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {isRtl ? 'التقييمات' : 'Reviews'} (3)
                </button>
              </div>
            </div>
            
            {/* Tab Content */}
            {activeTab === 'specs' && (
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">{isRtl ? 'الماركة' : 'Brand'}</span>
                  <span className="font-medium">Premium</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">{isRtl ? 'الموديل' : 'Model'}</span>
                  <span className="font-medium">2024</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">{isRtl ? 'الضمان' : 'Warranty'}</span>
                  <span className="font-medium">{isRtl ? 'سنة واحدة' : '1 Year'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">{isRtl ? 'التوفر' : 'Availability'}</span>
                  <span className="font-medium text-green-600">{isRtl ? 'متوفر' : 'In Stock'}</span>
                </div>
              </div>
            )}
            
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {mockReviews.map((review) => (
                  <div key={review.id} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{review.name}</span>
                      <div className="flex">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* View in Tour Button */}
            {onGoToProduct && (
              <button
                onClick={() => onGoToProduct(product)}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-primary-600 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors"
              >
                <Zap className="w-5 h-5" />
                {isRtl ? 'عرض في الجولة ثلاثية الأبعاد' : 'View in 3D Tour'}
              </button>
            )}
          </div>
          
          {/* Sticky Add to Cart */}
          <div className="sticky bottom-0 p-4 bg-white border-t shadow-lg">
            <div className="flex items-center gap-3">
              {/* Quantity */}
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-100"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-3 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-gray-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={added}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-lg transition-all ${
                  added
                    ? 'bg-green-600 text-white'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-5 h-5" />
                    {isRtl ? 'تمت الإضافة!' : 'Added!'}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    {isRtl ? 'أضف للسلة' : 'Add to Cart'}
                  </>
                )}
              </button>
            </div>
            
            {/* Payment Options */}
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500">
              <CreditCard className="w-4 h-4" />
              {isRtl ? 'ادفع بالتقسيط أو الدفع عند الاستلام' : 'Pay in installments or cash on delivery'}
            </div>
          </div>
        </div>
      </ResizablePanel>
    </div>
  );
}

export default ProductDrawer;

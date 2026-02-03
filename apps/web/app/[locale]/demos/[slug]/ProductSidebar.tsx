'use client';

/**
 * Product Sidebar - Resizable product list for e-commerce demos
 * Shows all products with highlights when tags are clicked
 */

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { 
  Package,
  Search,
  Filter,
  Star,
  ShoppingCart,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { ResizablePanel } from '@/components/ui/ResizablePanel';
import type { TourItem } from '@/lib/matterport/types';

interface ProductSidebarProps {
  products: TourItem[];
  selectedProductId: number | null;
  onSelectProduct: (product: TourItem) => void;
  onViewInTour: (product: TourItem) => void;
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

interface CategoryGroup {
  name: string;
  products: TourItem[];
}

export function ProductSidebar({
  products,
  selectedProductId,
  onSelectProduct,
  onViewInTour,
  isOpen,
  onClose,
  locale,
}: ProductSidebarProps) {
  const selectedRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const isRtl = locale === 'ar';

  // Scroll to selected product when it changes
  useEffect(() => {
    if (selectedProductId && selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedProductId]);

  // Group products by category
  const groupedProducts = React.useMemo(() => {
    const groups: CategoryGroup[] = [];
    const categoryMap = new Map<string, TourItem[]>();
    
    const filteredProducts = products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    filteredProducts.forEach((product) => {
      const category = product.category || 'Other';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(product);
    });
    
    categoryMap.forEach((prods, name) => {
      groups.push({ name, products: prods });
    });
    
    return groups;
  }, [products, searchQuery]);

  // Auto-expand category of selected product
  useEffect(() => {
    if (selectedProductId) {
      const product = products.find((p) => p.id === selectedProductId);
      if (product?.category) {
        setExpandedCategories((prev) => new Set([...prev, product.category!]));
      }
    }
  }, [selectedProductId, products]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const formatPrice = (price: number, currency: string = 'EGP') => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 z-40 flex">
      <ResizablePanel
        side="left"
        defaultWidth={380}
        minWidth={320}
        maxWidth={480}
        className="h-full"
      >
        <div className={`h-full bg-white shadow-2xl flex flex-col ${isRtl ? 'rtl' : 'ltr'}`}>
          {/* Header */}
          <div className="flex-shrink-0 p-4 border-b bg-gradient-to-r from-primary-600 to-primary-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                {isRtl ? 'المنتجات' : 'Products'}
                <span className="px-2 py-0.5 text-xs bg-white/20 rounded-full">
                  {products.length}
                </span>
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/20 rounded-full text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? 'بحث عن منتج...' : 'Search products...'}
                className="w-full pl-10 pr-4 py-2 rounded-lg border-0 bg-white/95 text-sm placeholder-gray-400 focus:ring-2 focus:ring-white"
              />
            </div>
          </div>

          {/* Product List */}
          <div className="flex-1 overflow-y-auto">
            {groupedProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>{isRtl ? 'لا توجد منتجات' : 'No products found'}</p>
              </div>
            ) : (
              groupedProducts.map((group) => (
                <div key={group.name} className="border-b border-gray-100 last:border-0">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(group.name)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                  >
                    <span className="font-semibold text-gray-700">{group.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{group.products.length}</span>
                      {expandedCategories.has(group.name) ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                  
                  {/* Products */}
                  {expandedCategories.has(group.name) && (
                    <div className="pb-2">
                      {group.products.map((product) => {
                        const isSelected = product.id === selectedProductId;
                        const hasPosition = product.hotspotPosition && 
                          (product.hotspotPosition.x !== 0 || product.hotspotPosition.y !== 0 || product.hotspotPosition.z !== 0);
                        
                        return (
                          <div
                            key={product.id}
                            ref={isSelected ? selectedRef : undefined}
                            onClick={() => onSelectProduct(product)}
                            className={`
                              mx-2 mb-2 p-3 rounded-xl cursor-pointer transition-all duration-300
                              ${isSelected 
                                ? 'bg-primary-50 ring-2 ring-primary-500 shadow-lg scale-[1.02]' 
                                : 'hover:bg-gray-50 hover:shadow-md'
                              }
                            `}
                          >
                            <div className="flex gap-3">
                              {/* Thumbnail */}
                              <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                {product.imageUrl ? (
                                  <Image
                                    src={product.imageUrl}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-6 h-6 text-gray-300" />
                                  </div>
                                )}
                                {hasPosition && (
                                  <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                                )}
                              </div>
                              
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 text-sm truncate">
                                  {product.name}
                                </h3>
                                <div className="flex items-center gap-1 my-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className="w-3 h-3 text-amber-400 fill-current" />
                                  ))}
                                  <span className="text-xs text-gray-400 ml-1">(4.8)</span>
                                </div>
                                <p className="font-bold text-primary-600">
                                  {formatPrice(product.price || 0, product.currency)}
                                </p>
                              </div>
                            </div>
                            
                            {/* Actions (shown when selected) */}
                            {isSelected && (
                              <div className="flex gap-2 mt-3 pt-3 border-t border-primary-100">
                                {hasPosition && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onViewInTour(product);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium text-primary-600 bg-white border border-primary-200 rounded-lg hover:bg-primary-50"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    {isRtl ? 'عرض' : 'View in Tour'}
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectProduct(product);
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                                >
                                  <ShoppingCart className="w-3.5 h-3.5" />
                                  {isRtl ? 'تفاصيل' : 'Details'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          {/* Footer */}
          <div className="flex-shrink-0 p-4 border-t bg-gray-50">
            <p className="text-xs text-center text-gray-500">
              {isRtl 
                ? 'انقر على المنتجات في الجولة للتفاصيل'
                : 'Click products in the tour for details'
              }
            </p>
          </div>
        </div>
      </ResizablePanel>
    </div>
  );
}

export default ProductSidebar;

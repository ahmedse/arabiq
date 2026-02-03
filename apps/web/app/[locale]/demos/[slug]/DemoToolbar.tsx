'use client';

/**
 * Demo Toolbar
 * Top toolbar with demo controls and info
 */

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, MessageCircle, Volume2, VolumeX, Users, Settings, Calendar, Bed, Send, Package } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import type { DemoConfig } from '@/lib/matterport/types';

interface DemoToolbarProps {
  demo: DemoConfig;
  onCartClick?: () => void;
  onProductsClick?: () => void;
  onReserveClick?: () => void;
  onBookClick?: () => void;
  onInquireClick?: () => void;
  onAIChatClick?: () => void;
  productCount?: number;
}

export function DemoToolbar({ 
  demo, 
  onCartClick, 
  onProductsClick,
  onReserveClick, 
  onBookClick, 
  onInquireClick, 
  onAIChatClick,
  productCount = 0,
}: DemoToolbarProps) {
  const { itemCount } = useCart();
  const [isMuted, setIsMuted] = React.useState(false);
  
  return (
    <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent z-40">
      {/* Left: Back & Title */}
      <div className="flex items-center gap-4">
        <Link
          href="/demos"
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <div className="text-white">
          <h1 className="font-bold text-lg">{demo.title}</h1>
          {demo.businessName && (
            <p className="text-sm text-white/70">{demo.businessName}</p>
          )}
        </div>
      </div>
      
      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Owner Dashboard link (for live chat enabled demos) */}
        {demo.enableLiveChat && (
          <Link
            href={`/demos/${demo.slug}/owner`}
            className="p-2 rounded-full bg-green-500/80 hover:bg-green-600 text-white backdrop-blur-sm"
            title="Owner Dashboard"
          >
            <Users className="w-5 h-5" />
          </Link>
        )}
        
        {/* Admin link */}
        <Link
          href={`/demos/${demo.slug}/admin`}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
          title="Admin Settings"
        >
          <Settings className="w-5 h-5" />
        </Link>
        
        {/* Voice Over Toggle */}
        {demo.enableVoiceOver && (
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        )}
        
        {/* Live Chat */}
        {demo.enableLiveChat && (
          <button
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm relative"
            title="Live Chat"
          >
            <Users className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full" />
          </button>
        )}
        
        {/* AI Chat */}
        {demo.enableAiChat && onAIChatClick && (
          <button
            onClick={onAIChatClick}
            className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white backdrop-blur-sm transition-all"
            title="AI Assistant"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        )}
        
        {/* Products Catalog (for e-commerce demos) */}
        {(demo.demoType === 'ecommerce' || demo.demoType === 'showroom') && onProductsClick && (
          <button
            onClick={onProductsClick}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm relative"
            title="Products Catalog"
          >
            <Package className="w-5 h-5" />
            {productCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                {productCount}
              </span>
            )}
          </button>
        )}
        
        {/* Cart (for e-commerce demos) */}
        {(demo.demoType === 'ecommerce' || demo.demoType === 'showroom') && (
          <button
            onClick={onCartClick}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm relative"
            title="Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
        )}
        
        {/* Reserve (for café demos) */}
        {demo.demoType === 'cafe' && onReserveClick && (
          <button
            onClick={onReserveClick}
            className="px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-700 text-white backdrop-blur-sm flex items-center gap-2"
            title="Reserve a Table"
          >
            <Calendar className="w-5 h-5" />
            <span className="hidden sm:inline">Reserve</span>
          </button>
        )}
        
        {/* Book Room (for hotel demos) */}
        {demo.demoType === 'hotel' && onBookClick && (
          <button
            onClick={onBookClick}
            className="px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white backdrop-blur-sm flex items-center gap-2"
            title="Book a Room"
          >
            <Bed className="w-5 h-5" />
            <span className="hidden sm:inline">Book</span>
          </button>
        )}
        
        {/* Inquire (for real estate demos) */}
        {demo.demoType === 'realestate' && onInquireClick && (
          <button
            onClick={onInquireClick}
            className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white backdrop-blur-sm flex items-center gap-2"
            title="Inquire"
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline">Inquire</span>
          </button>
        )}
      </div>
    </div>
  );
}

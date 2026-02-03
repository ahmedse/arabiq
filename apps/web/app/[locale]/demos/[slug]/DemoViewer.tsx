'use client';

/**
 * Demo Viewer Client Component
 * Full e-commerce experience with resizable panels, tracking, and tag interaction
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  MatterportProvider, 
  MatterportViewer, 
  MiniMap,
  useMatterport,
} from '@/components/matterport';
import { HotspotManager } from '@/components/matterport/HotspotManager';
import type { DemoConfig, TourItem } from '@/lib/matterport/types';
import { DemoToolbar } from './DemoToolbar';

// E-commerce components (enhanced)
import { ProductSidebar } from './ProductSidebar';
import { ProductDrawer } from './ProductDrawer';
import { CartDrawer } from './CartDrawer';
import { CheckoutModal } from './CheckoutModal';

// Café components
import { MenuItemPopup } from './MenuItemPopup';
import { ReservationDrawer } from './ReservationDrawer';

// Hotel components
import { RoomPopup } from './RoomPopup';
import { BookingDrawer } from './BookingDrawer';

// Real estate components
import { PropertyPopup } from './PropertyPopup';
import { InquiryDrawer } from './InquiryDrawer';

// AI Chat component
import { AIChatDrawer } from './AIChatDrawer';

// Presence & Live Chat components
import { PresenceTracker, generateSessionId } from './PresenceTracker';
import { LiveChatWidget } from './LiveChatWidget';

// Voice-over components
import { VoiceOverPlayer } from '@/components/voiceover';
import type { AudioClip } from '@/lib/voiceover';

// Tracking
import { 
  trackPageView, 
  trackProductClick, 
  trackTagClick, 
  trackNavigation,
  trackTimeSpent 
} from '@/lib/analytics/tracking';

interface DemoViewerProps {
  demo: DemoConfig;
  items: TourItem[];
  voiceOvers?: AudioClip[];
  locale: string;
}

export function DemoViewer({ demo, items, voiceOvers = [], locale }: DemoViewerProps) {
  return (
    <MatterportProvider initialDemo={demo}>
      <DemoViewerContent demo={demo} items={items} voiceOvers={voiceOvers} locale={locale} />
    </MatterportProvider>
  );
}

function DemoViewerContent({ demo, items, voiceOvers, locale }: DemoViewerProps) {
  const { setItems, setDemo, isReady, sdk } = useMatterport();
  
  // Session tracking
  const [sessionId] = useState(() => generateSessionId());
  const sessionStartRef = useRef(Date.now());
  
  // Demo type checks
  const isEcommerce = demo.demoType === 'ecommerce' || demo.demoType === 'showroom';
  const isCafe = demo.demoType === 'cafe';
  const isHotel = demo.demoType === 'hotel';
  const isRealEstate = demo.demoType === 'realestate' || demo.demoType === 'training';
  
  // Shared state
  const [selectedItem, setSelectedItem] = useState<TourItem | null>(null);
  const [highlightedProductId, setHighlightedProductId] = useState<number | null>(null);
  
  // E-commerce state
  const [isProductSidebarOpen, setIsProductSidebarOpen] = useState(isEcommerce);
  const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  // Café state
  const [isReservationOpen, setIsReservationOpen] = useState(false);
  
  // Hotel state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<TourItem | null>(null);
  
  // Real estate state
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  
  // AI Chat state
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  
  // Track page view on mount
  useEffect(() => {
    trackPageView(demo.id, sessionId);
    
    // Track time spent on unmount
    return () => {
      const duration = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      trackTimeSpent(demo.id, sessionId, duration);
    };
  }, [demo.id, sessionId]);
  
  // Set demo data
  useEffect(() => {
    setDemo(demo);
    setItems(items);
  }, [demo, items, setDemo, setItems]);
  
  // Handle hotspot/tag click from tour
  const handleItemClick = useCallback((item: TourItem) => {
    setSelectedItem(item);
    setHighlightedProductId(item.id);
    
    // Track the click
    if (item.hotspotPosition) {
      trackTagClick(demo.id, sessionId, item.id, item.hotspotPosition);
    }
    trackProductClick(demo.id, sessionId, item.id, item.name, 'tag');
    
    // For e-commerce, open sidebar and drawer
    if (demo.demoType === 'ecommerce' || demo.demoType === 'showroom') {
      setIsProductSidebarOpen(true);
      setIsProductDrawerOpen(true);
    }
  }, [demo.id, demo.demoType, sessionId]);
  
  // Handle product click from sidebar
  const handleSidebarProductClick = useCallback((item: TourItem) => {
    setSelectedItem(item);
    setHighlightedProductId(item.id);
    setIsProductDrawerOpen(true);
    
    trackProductClick(demo.id, sessionId, item.id, item.name, 'sidebar');
  }, [demo.id, sessionId]);
  
  // Navigate to product in tour
  const handleViewInTour = useCallback(async (item: TourItem) => {
    if (!sdk) return;
    
    const sweepId = item.hotspotData?.nearestSweepId;
    
    try {
      if (sweepId) {
        await sdk.Camera.moveToSweep(sweepId, { transition: 'fly' });
        setHighlightedProductId(item.id);
        
        const position = item.hotspotData?.anchorPosition || item.hotspotPosition;
        trackNavigation(demo.id, sessionId, sweepId, position || { x: 0, y: 0, z: 0 });
      }
    } catch (err) {
      console.error('[DemoViewer] Navigation failed:', err);
    }
  }, [sdk, demo.id, sessionId]);
  
  // Close product drawer
  const handleCloseDrawer = useCallback(() => {
    setIsProductDrawerOpen(false);
    setSelectedItem(null);
  }, []);
  
  // Handle checkout (e-commerce)
  const handleCheckout = useCallback(() => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }, []);
  
  // Handle reserve (café)
  const handleReserve = useCallback(() => {
    setSelectedItem(null);
    setIsReservationOpen(true);
  }, []);
  
  // Handle book room (hotel)
  const handleBookRoom = useCallback(() => {
    if (selectedItem) {
      setSelectedRoom(selectedItem);
      setSelectedItem(null);
      setIsBookingOpen(true);
    }
  }, [selectedItem]);
  
  // Handle inquire (real estate)
  const handleInquire = useCallback(() => {
    setSelectedItem(null);
    setIsInquiryOpen(true);
  }, []);
  
  // Toggle sidebar
  const toggleProductSidebar = useCallback(() => {
    setIsProductSidebarOpen((prev) => !prev);
  }, []);
  
  // Get main property for real estate
  const mainProperty = items.find(item => 
    (item as TourItem & { transactionType?: string }).transactionType === 'sale' || 
    (item as TourItem & { transactionType?: string }).transactionType === 'rent'
  );
  
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Main 3D Viewer */}
      <MatterportViewer className="w-full h-full" useIframeMode={false} />
      
      {/* Overlay UI */}
      {isReady && (
        <>
          <HotspotManager 
            items={items} 
            onItemClick={handleItemClick}
            highlightedItemId={highlightedProductId}
          />
          
          <DemoToolbar 
            demo={demo}
            onCartClick={isEcommerce ? () => setIsCartOpen(true) : undefined}
            onProductsClick={isEcommerce ? toggleProductSidebar : undefined}
            onReserveClick={isCafe ? () => setIsReservationOpen(true) : undefined}
            onBookClick={isHotel ? () => setIsBookingOpen(true) : undefined}
            onInquireClick={isRealEstate ? () => setIsInquiryOpen(true) : undefined}
            onAIChatClick={demo.enableAiChat ? () => setIsAIChatOpen(true) : undefined}
            productCount={items.length}
          />
          
          <MiniMap className="absolute bottom-4 left-4" />
        </>
      )}
      
      {/* E-commerce Components */}
      {isEcommerce && (
        <>
          <ProductSidebar
            products={items}
            selectedProductId={highlightedProductId}
            onSelectProduct={handleSidebarProductClick}
            onViewInTour={handleViewInTour}
            isOpen={isProductSidebarOpen}
            onClose={() => setIsProductSidebarOpen(false)}
            locale={locale}
          />
          
          <ProductDrawer
            product={selectedItem}
            isOpen={isProductDrawerOpen}
            onClose={handleCloseDrawer}
            onGoToProduct={handleViewInTour}
            locale={locale}
          />
          
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            onCheckout={handleCheckout}
            locale={locale}
          />
          
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            demoId={demo.id}
            locale={locale}
          />
        </>
      )}
      
      {/* Café Components */}
      {isCafe && (
        <>
          {selectedItem && (
            <MenuItemPopup
              item={selectedItem as TourItem & { isVegetarian?: boolean; spicyLevel?: number; prepTime?: number }}
              onClose={() => setSelectedItem(null)}
              onReserve={handleReserve}
              locale={locale}
            />
          )}
          <ReservationDrawer
            isOpen={isReservationOpen}
            onClose={() => setIsReservationOpen(false)}
            demoId={demo.id}
            businessName={demo.businessName || demo.title}
            locale={locale}
          />
        </>
      )}
      
      {/* Hotel Components */}
      {isHotel && (
        <>
          {selectedItem && (
            <RoomPopup
              room={selectedItem as TourItem & { roomType?: string; pricePerNight?: number; capacity?: number; bedType?: string; size?: string; amenities?: string[] }}
              onClose={() => setSelectedItem(null)}
              onBook={handleBookRoom}
              locale={locale}
            />
          )}
          <BookingDrawer
            isOpen={isBookingOpen}
            onClose={() => setIsBookingOpen(false)}
            demoId={demo.id}
            room={selectedRoom as (TourItem & { pricePerNight?: number; capacity?: number }) | null}
            businessName={demo.businessName || demo.title}
            locale={locale}
          />
        </>
      )}
      
      {/* Real Estate Components */}
      {isRealEstate && (
        <>
          {selectedItem && (
            <PropertyPopup
              property={selectedItem as TourItem & { propertyType?: string; transactionType?: string; size?: number; features?: string[] }}
              onClose={() => setSelectedItem(null)}
              onInquire={handleInquire}
              locale={locale}
              isMainProperty={(selectedItem as TourItem & { transactionType?: string }).transactionType === 'sale' || (selectedItem as TourItem & { transactionType?: string }).transactionType === 'rent'}
            />
          )}
          <InquiryDrawer
            isOpen={isInquiryOpen}
            onClose={() => setIsInquiryOpen(false)}
            demoId={demo.id}
            propertyTitle={mainProperty?.name || demo.title}
            propertyPrice={mainProperty?.price}
            locale={locale}
          />
        </>
      )}
      
      {/* AI Chat Drawer */}
      {demo.enableAiChat && (
        <AIChatDrawer
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
          demo={demo}
          locale={locale}
        />
      )}
      
      {/* Presence Tracking */}
      {demo.enableLiveChat && (
        <PresenceTracker
          demoSlug={demo.slug}
          sessionId={sessionId}
          visitorName={`Visitor ${sessionId.slice(-4)}`}
          locale={locale}
          enabled={true}
        />
      )}
      
      {/* Live Chat Widget */}
      {demo.enableLiveChat && (
        <LiveChatWidget
          demoSlug={demo.slug}
          sessionId={sessionId}
          visitorName={`Visitor ${sessionId.slice(-4)}`}
          locale={locale}
        />
      )}
      
      {/* Voice-Over Player */}
      {demo.enableVoiceOver && voiceOvers && voiceOvers.length > 0 && (
        <VoiceOverPlayer
          clips={voiceOvers}
          locale={locale}
          autoPlayIntro={true}
        />
      )}
    </div>
  );
}

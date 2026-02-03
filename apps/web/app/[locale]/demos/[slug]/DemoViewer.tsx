'use client';

/**
 * Demo Viewer Client Component
 * Wraps Matterport viewer with demo-specific features
 */

import React, { useEffect, useState, useCallback } from 'react';
import { 
  MatterportProvider, 
  MatterportViewer, 
  MiniMap,
  useMatterport,
} from '@/components/matterport';
import { HotspotManager } from '@/components/matterport/HotspotManager';
import type { DemoConfig, TourItem } from '@/lib/matterport/types';
import { DemoToolbar } from './DemoToolbar';
// E-commerce components
import { ProductPopup } from './ProductPopup';
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
  const { setItems, setDemo, isReady } = useMatterport();
  
  // Shared state
  const [selectedItem, setSelectedItem] = useState<TourItem | null>(null);
  
  // E-commerce state
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
  
  // Presence tracking - generate session ID on mount
  const [sessionId] = useState(() => generateSessionId());
  
  // Set demo data
  useEffect(() => {
    setDemo(demo);
    setItems(items);
  }, [demo, items, setDemo, setItems]);
  
  // Handle hotspot click
  const handleItemClick = useCallback((item: TourItem) => {
    setSelectedItem(item);
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
  
  const isEcommerce = demo.demoType === 'ecommerce' || demo.demoType === 'showroom';
  const isCafe = demo.demoType === 'cafe';
  const isHotel = demo.demoType === 'hotel';
  const isRealEstate = demo.demoType === 'realestate' || demo.demoType === 'training';
  
  // Get main property for real estate
  const mainProperty = items.find(item => 
    (item as TourItem & { transactionType?: string }).transactionType === 'sale' || 
    (item as TourItem & { transactionType?: string }).transactionType === 'rent'
  );
  
  return (
    <div className="relative w-full h-screen">
      {/* Main 3D Viewer - SDK mode for hotspots */}
      <MatterportViewer className="w-full h-full" useIframeMode={false} />
      
      {/* Overlay UI */}
      {isReady && (
        <>
          <HotspotManager items={items} onItemClick={handleItemClick} />
          
          <DemoToolbar 
            demo={demo}
            onCartClick={isEcommerce ? () => setIsCartOpen(true) : undefined}
            onReserveClick={isCafe ? () => setIsReservationOpen(true) : undefined}
            onBookClick={isHotel ? () => setIsBookingOpen(true) : undefined}
            onInquireClick={isRealEstate ? () => setIsInquiryOpen(true) : undefined}
            onAIChatClick={demo.enableAiChat ? () => setIsAIChatOpen(true) : undefined}
          />
          
          <MiniMap className="absolute bottom-4 left-4" />
        </>
      )}
      
      {/* E-commerce Popups */}
      {isEcommerce && (
        <>
          {selectedItem && (
            <ProductPopup
              product={selectedItem}
              onClose={() => setSelectedItem(null)}
              locale={locale}
            />
          )}
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
      
      {/* Café Popups */}
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
      
      {/* Hotel Popups */}
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
      
      {/* Real Estate Popups */}
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
      
      {/* AI Chat Drawer (available for all demo types when enabled) */}
      {demo.enableAiChat && (
        <AIChatDrawer
          isOpen={isAIChatOpen}
          onClose={() => setIsAIChatOpen(false)}
          demo={demo}
          locale={locale}
        />
      )}
      
      {/* Presence Tracking (tracks visitor position in 3D space) */}
      {demo.enableLiveChat && (
        <PresenceTracker
          demoSlug={demo.slug}
          sessionId={sessionId}
          visitorName={`Visitor ${sessionId.slice(-4)}`}
          locale={locale}
          enabled={true}
        />
      )}
      
      {/* Live Chat Widget (for visitors to chat with owner) */}
      {demo.enableLiveChat && (
        <LiveChatWidget
          demoSlug={demo.slug}
          sessionId={sessionId}
          visitorName={`Visitor ${sessionId.slice(-4)}`}
          locale={locale}
        />
      )}
      
      {/* Voice-Over Player (audio tour guide) */}
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

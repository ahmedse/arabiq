# Arabiq VTour Platform - Demo Development Plan

> **Created**: 2026-02-02  
> **Updated**: 2026-02-02  
> **Status**: PHASE 2 (After CMS/Web Completion)  
> **Owner**: Master Agent (GitHub Copilot)

---

## 🏢 Business Context

**Arabiq is a Matterport solutions company** that transforms 3D virtual tours into interactive business applications.

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARABIQ BUSINESS MODEL                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   WE TURN THIS:                INTO THIS:                       │
│   ─────────────                ──────────                       │
│                                                                 │
│   Static 3D Tour      ──────►  Interactive Application          │
│   (Look around)                (Shop, Book, Explore, Engage)    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   CLIENT INDUSTRIES:                                            │
│                                                                 │
│   🛒 Retail & E-commerce     - Virtual stores with cart         │
│   ☕ Cafés & Restaurants     - Menu browsing + table booking    │
│   🏨 Hotels & Hospitality    - Room tours + direct booking      │
│   🏠 Real Estate             - Property tours + inquiry forms   │
│   🏢 Offices & Coworking     - Space tours + scheduling         │
│   🎪 Events & Exhibitions    - Virtual booths + lead capture    │
│   🎓 Education               - Campus tours + applications      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   DEPLOYMENT OPTIONS (by client tier):                          │
│   • Hosted on Arabiq infrastructure                             │
│   • Embedded widget on client website                           │
│   • White-label solution                                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   FUTURE: Client self-service dashboard for:                    │
│   • Update products/menu/rooms                                  │
│   • View analytics                                              │
│   • Manage bookings/orders                                      │
│   • Configure hotspots                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Demo Purpose

The demos on **arabiq.tech** serve as:

1. **Sales Tools** - Show potential clients what's possible
2. **Working Examples** - Fully functional, not mockups
3. **Proof of Capability** - Real integrations with our backend
4. **Portfolio Pieces** - Different industries, different use cases

**Important**: Demos use **realistic generated data** (products, menus, rooms, etc.) that looks and feels like real client data.

---

## ⚠️ Prerequisites

**Complete CMS + Web first!** This plan executes AFTER:
- ✅ All foundation work (loading states, error handling, forms)
- ✅ All pages complete with CMS integration
- ✅ SEO & performance optimization
- ✅ Security hardening

---

## 🧠 Platform Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    ARABIQ VTOUR ENGINE                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    CORE ENGINE                              │ │
│  │                                                             │ │
│  │  • Matterport SDK Integration                               │ │
│  │  • Hotspot System (positions from Strapi)                   │ │
│  │  • Overlay Rendering Engine                                 │ │
│  │  • Action Tracking & Analytics                              │ │
│  │  • AI Assistant (Poe.com API)                               │ │
│  │  • Smooth Transitions & Animations                          │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    DEMO MODES                               │ │
│  │                                                             │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │ │
│  │  │ RETAIL   │ │  CAFÉ    │ │  HOTEL   │ │  REAL    │      │ │
│  │  │          │ │          │ │          │ │  ESTATE  │      │ │
│  │  │•Products │ │•Menu     │ │•Rooms    │ │•Listings │      │ │
│  │  │•Cart     │ │•Tables   │ │•Amenities│ │•Features │      │ │
│  │  │•Checkout │ │•Booking  │ │•Booking  │ │•Inquiry  │      │ │
│  │  │•Wishlist │ │•Reviews  │ │•Rates    │ │•Agent    │      │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │ │
│  │                                                             │ │
│  │  ┌──────────┐ ┌──────────┐                                 │ │
│  │  │  EVENT   │ │  OFFICE  │  + More as needed               │ │
│  │  │          │ │          │                                  │ │
│  │  │•Booths   │ │•Spaces   │                                  │ │
│  │  │•Schedules│ │•Calendar │                                  │ │
│  │  │•Leads    │ │•Booking  │                                  │ │
│  │  │•Videos   │ │•Capacity │                                  │ │
│  │  └──────────┘ └──────────┘                                 │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     BIDIRECTIONAL DATA FLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   STRAPI CMS                                                    │
│   ├── Tours (Matterport model IDs, settings)                    │
│   ├── Hotspots (positions, types, linked content)               │
│   ├── Products / Menu Items / Rooms / Listings                  │
│   ├── Bookings / Orders / Inquiries                             │
│   └── Analytics Events                                          │
│            │                                                    │
│            │  ◄───── Content OUT ─────►                        │
│            │  ◄───── Actions IN ──────►                        │
│            ▼                                                    │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                    NEXT.JS API                           │  │
│   │                                                          │  │
│   │  /api/vtour/[tourId]/config     GET tour + hotspots     │  │
│   │  /api/vtour/[tourId]/products   GET products for tour   │  │
│   │  /api/vtour/cart                POST add to cart        │  │
│   │  /api/vtour/booking             POST make booking       │  │
│   │  /api/vtour/inquiry             POST property inquiry   │  │
│   │  /api/vtour/analytics           POST track event        │  │
│   │  /api/chat                      POST AI conversation    │  │
│   │                                                          │  │
│   └─────────────────────────────────────────────────────────┘  │
│            │                                                    │
│            ▼                                                    │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                 MATTERPORT TOUR + OVERLAYS               │  │
│   │                                                          │  │
│   │  [3D Navigation]  ◄────►  [React Overlays]              │  │
│   │                                                          │  │
│   │  • User moves in space      • Product cards appear       │  │
│   │  • User clicks hotspot      • Booking forms slide in    │  │
│   │  • User lingers on item     • AI offers to help         │  │
│   │  • User adds to cart        • Confirmation shows        │  │
│   │                                                          │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎬 User Experience Philosophy

> *"The user is the customer, not a tech demo viewer."*

### Principles

| Principle | Implementation |
|-----------|----------------|
| **Smooth** | No jarring transitions, buttery animations |
| **Intuitive** | Hotspots glow subtly, actions are obvious |
| **Fast** | Instant feedback, optimistic updates |
| **Helpful** | AI assists without being pushy |
| **Focused** | One thing at a time, no overwhelm |
| **Delightful** | Micro-interactions, satisfying clicks |

### The "Shopper" Experience (E-commerce Example)

```
┌─────────────────────────────────────────────────────────────┐
│  USER JOURNEY: VIRTUAL SHOPPING                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. ENTER STORE                                             │
│     ┌─────────────────────────────────────────────────┐    │
│     │ "Welcome to our store! I'm here to help." 🤖    │    │
│     │            [Start Shopping] [Take a Tour]        │    │
│     └─────────────────────────────────────────────────┘    │
│                          │                                  │
│                          ▼                                  │
│  2. EXPLORE FREELY                                          │
│     • User navigates naturally through 3D space             │
│     • Hotspots on products pulse gently                     │
│     • Category labels visible but not intrusive             │
│                          │                                  │
│                          ▼                                  │
│  3. DISCOVER PRODUCT                                        │
│     • User clicks or approaches product                     │
│     • Smooth zoom + camera focus                            │
│     • Product card slides in from side                      │
│     ┌─────────────────────────────────────────────────┐    │
│     │  [IMAGE]  Premium Headphones                     │    │
│     │           ★★★★☆ (42 reviews)                     │    │
│     │           $299.00                                │    │
│     │                                                  │    │
│     │  Wireless • Noise Canceling • 30hr Battery      │    │
│     │                                                  │    │
│     │  [Add to Cart]  [View Details]  [♡ Save]        │    │
│     └─────────────────────────────────────────────────┘    │
│                          │                                  │
│                          ▼                                  │
│  4. ADD TO CART                                             │
│     • Satisfying animation: product "flies" to cart         │
│     • Cart icon updates with count                          │
│     • "Added! Keep shopping or checkout?" subtle toast      │
│                          │                                  │
│                          ▼                                  │
│  5. CHECKOUT (when ready)                                   │
│     • Cart sidebar opens                                    │
│     • Full checkout flow in overlay                         │
│     • Return to tour after purchase                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛒 Demo #1: Virtual Retail Store

### Mock Data Required (Strapi)

```
Products Collection:
├── 30-50 realistic products
├── Categories (Electronics, Fashion, Home, etc.)
├── Images (use Unsplash or generated)
├── Prices, ratings, descriptions
├── Inventory status
└── Related products

Demo Settings:
├── Store name & branding
├── Welcome message
├── Featured products
└── Promotions/banners
```

### Features

- [ ] Product hotspots throughout store
- [ ] Category navigation (jump to section)
- [ ] Product cards with full details
- [ ] Add to cart with animation
- [ ] Cart sidebar with total
- [ ] Wishlist functionality
- [ ] Search products
- [ ] AI shopping assistant
- [ ] Checkout flow (demo mode)

---

## ☕ Demo #2: Café/Restaurant

### Mock Data Required (Strapi)

```
Menu Collection:
├── 20-30 menu items
├── Categories (Drinks, Food, Desserts)
├── Images, prices, descriptions
├── Dietary tags (Vegan, GF, etc.)
└── Popular/featured flags

Tables Collection:
├── Table positions in tour
├── Capacity (2, 4, 6 seats)
├── Availability slots
└── Special features (window, private)

Reservations (demo):
├── Sample bookings
└── Time slots
```

### Features

- [ ] Menu hotspots at tables/counter
- [ ] Full menu browser overlay
- [ ] Table selection with status
- [ ] Date/time picker for booking
- [ ] Reservation confirmation
- [ ] AI host assistant
- [ ] Special requests form

---

## 🏨 Demo #3: Hotel Experience

### Mock Data Required (Strapi)

```
Rooms Collection:
├── 5-10 room types
├── Images, descriptions, amenities
├── Pricing (per night, seasonal)
├── Availability calendar
└── Max occupancy

Amenities Collection:
├── Pool, Spa, Gym, Restaurant
├── Operating hours
└── Booking requirements

Hotel Info:
├── Name, location, contact
├── Policies
└── Star rating, awards
```

### Features

- [ ] Room type hotspots
- [ ] Room details with gallery
- [ ] Amenity exploration
- [ ] Check availability by dates
- [ ] Rate calculator
- [ ] Booking flow
- [ ] AI concierge

---

## 🏠 Demo #4: Real Estate Property

### Mock Data Required (Strapi)

```
Property Details:
├── Address, price, type
├── Bedrooms, bathrooms, sqft
├── Features & highlights
├── Neighborhood info
└── Agent info

Rooms Collection:
├── Room labels (Master Bedroom, Kitchen)
├── Dimensions
└── Special features
```

### Features

- [ ] Room labels as you navigate
- [ ] Property info sidebar
- [ ] Measurement mode
- [ ] Floor plan toggle
- [ ] Photo gallery hotspots
- [ ] Inquiry/contact form
- [ ] Schedule viewing
- [ ] Mortgage calculator
- [ ] AI property advisor

---

## 🎪 Demo #5: Virtual Exhibition

### Mock Data Required (Strapi)

```
Exhibitors Collection:
├── 10-15 companies
├── Booth locations
├── Company info, logo
├── Products/services
├── Videos, brochures (PDFs)
└── Contact info

Event Info:
├── Event name, dates
├── Schedule/sessions
└── Sponsors
```

### Features

- [ ] Booth directory with navigation
- [ ] Company info panels
- [ ] Video playback in-tour
- [ ] Brochure downloads
- [ ] Lead capture forms
- [ ] Schedule/sessions sidebar
- [ ] AI event guide

---

## 🏢 Demo #6: Office/Coworking Space

### Mock Data Required (Strapi)

```
Spaces Collection:
├── Private offices
├── Meeting rooms
├── Hot desks
├── Common areas
└── Pricing, capacity, amenities

Availability:
├── Calendar integration mock
└── Time slots
```

### Features

- [ ] Space hotspots with details
- [ ] Availability calendar
- [ ] Booking request form
- [ ] Virtual tour of each space type
- [ ] Pricing calculator
- [ ] AI space advisor

---

## 🤖 AI Assistant (All Demos)

**Powered by Poe.com API**

### Context-Aware Behavior

```
Location: Electronics Section
User asks: "What's good here?"
AI knows: User is looking at electronics
AI responds: "Our top sellers are the Sony headphones 
             and the Samsung tablet. Want me to show 
             you the headphones? They're on sale!"
```

### Capabilities

- Answer questions about products/menu/rooms
- Navigate user to locations ("Take me to...")
- Provide recommendations
- Help with checkout/booking
- Remember conversation context
- Personality per demo type:
  - E-commerce: Shopping assistant
  - Restaurant: Friendly host
  - Hotel: Concierge
  - Real Estate: Property expert
  - Exhibition: Event guide

### Implementation

```typescript
// API Route: /api/chat/route.ts

export async function POST(req: Request) {
  const { message, tourId, currentLocation, history } = await req.json();
  
  // Get context from Strapi
  const tourContext = await getTourContext(tourId, currentLocation);
  
  // Build system prompt based on demo type
  const systemPrompt = buildSystemPrompt(tourContext);
  
  // Call Poe.com API
  const response = await callPoeAPI({
    systemPrompt,
    history,
    message,
  });
  
  // Track interaction
  await trackAnalytics({
    type: 'chat',
    tourId,
    location: currentLocation,
    query: message,
  });
  
  return Response.json(response);
}
```

---

## 📈 Analytics Tracking

### Events to Capture

| Event | Data | Purpose |
|-------|------|---------|
| `tour_start` | tourId, timestamp | Engagement |
| `navigation` | from, to, duration | Heat maps |
| `hotspot_view` | hotspotId, itemId | Interest |
| `hotspot_click` | hotspotId, action | Conversion |
| `product_view` | productId, duration | Interest scoring |
| `add_to_cart` | productId, quantity | Conversion |
| `booking_start` | type, details | Funnel |
| `booking_complete` | bookingId | Conversion |
| `chat_message` | query, response | AI usage |
| `tour_exit` | duration, lastLocation | Engagement |

---

## 📁 Technical Structure

```
apps/web/
├── components/vtour/
│   ├── core/
│   │   ├── MatterportProvider.tsx     # SDK context
│   │   ├── MatterportViewer.tsx       # Main viewer
│   │   ├── HotspotManager.tsx         # Hotspot rendering
│   │   ├── OverlayContainer.tsx       # Overlay positioning
│   │   └── TourNavigation.tsx         # Navigation controls
│   │
│   ├── overlays/
│   │   ├── ProductCard.tsx            # E-commerce
│   │   ├── MenuBrowser.tsx            # Restaurant
│   │   ├── RoomDetails.tsx            # Hotel
│   │   ├── PropertyInfo.tsx           # Real estate
│   │   ├── BoothPanel.tsx             # Exhibition
│   │   ├── SpaceCard.tsx              # Office
│   │   ├── BookingForm.tsx            # Universal booking
│   │   ├── CartSidebar.tsx            # Shopping cart
│   │   └── InquiryForm.tsx            # Lead capture
│   │
│   ├── chat/
│   │   ├── ChatBubble.tsx             # Floating trigger
│   │   ├── ChatWindow.tsx             # Chat interface
│   │   ├── ChatMessage.tsx            # Message component
│   │   └── TypingIndicator.tsx        # Loading state
│   │
│   └── hooks/
│       ├── useMatterport.ts           # SDK hook
│       ├── useHotspots.ts             # Hotspot management
│       ├── useOverlay.ts              # Overlay state
│       ├── useCart.ts                 # Cart state (Zustand)
│       ├── useBooking.ts              # Booking flow
│       └── useAnalytics.ts            # Event tracking
│
├── app/api/vtour/
│   ├── [tourId]/
│   │   ├── config/route.ts            # Tour configuration
│   │   ├── products/route.ts          # Product catalog
│   │   ├── menu/route.ts              # Menu items
│   │   ├── rooms/route.ts             # Hotel rooms
│   │   └── spaces/route.ts            # Office spaces
│   │
│   ├── cart/route.ts                  # Cart operations
│   ├── booking/route.ts               # Booking submission
│   ├── inquiry/route.ts               # Lead capture
│   └── analytics/route.ts             # Event logging
│
└── app/[locale]/demos/[slug]/
    ├── page.tsx                       # Demo page (server)
    ├── tour-client.tsx                # Tour client component
    └── loading.tsx                    # Loading state

apps/cms/src/api/
├── vtour/                             # Tour configurations
├── vtour-hotspot/                     # Hotspot positions
├── vtour-product/                     # Demo products
├── vtour-menu-item/                   # Demo menu items
├── vtour-room/                        # Demo hotel rooms
├── vtour-property/                    # Demo properties
├── vtour-exhibitor/                   # Demo exhibitors
├── vtour-space/                       # Demo office spaces
├── vtour-booking/                     # Bookings
├── vtour-cart-item/                   # Cart items
├── vtour-inquiry/                     # Inquiries
└── vtour-analytics/                   # Analytics events
```

---

## 🗓 Implementation Timeline

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Core Engine | Matterport integration, hotspot system, overlay framework |
| 2 | E-commerce Demo | Full shopping experience with cart |
| 3 | Restaurant + Hotel | Booking flows, menu/room browsers |
| 4 | Real Estate + Exhibition | Inquiry forms, lead capture |
| 5 | Polish + AI | Poe.com integration, animations, testing |

---

## ✅ Success Criteria

- [ ] All 6 demos fully functional
- [ ] Realistic mock data that feels real
- [ ] Smooth, delightful user experience
- [ ] AI assistant helpful and context-aware
- [ ] Mobile responsive
- [ ] Bilingual (EN/AR)
- [ ] All actions sync to server
- [ ] Analytics tracking working
- [ ] Load time < 3 seconds
- [ ] No jank or stuttering

---

*Plan maintained by GitHub Copilot - Master Agent*

### CMS Schema Extension

```json
// apps/cms/src/api/demo/content-types/demo/schema.json
{
  "attributes": {
    // Existing fields...
    
    "isVTour": {
      "type": "boolean",
      "default": false
    },
    "matterportModelId": {
      "type": "string"
    },
    "matterportSid": {
      "type": "string"
    },
    "showcaseSettings": {
      "type": "json",
      "default": {
        "help": 0,
        "qs": 1,
        "brand": 0,
        "play": 1
      }
    },
    "hotspots": {
      "type": "json",
      "default": []
    },
    "tourSteps": {
      "type": "json",
      "default": []
    },
    "vtourType": {
      "type": "enumeration",
      "enum": [
        "ai-chatbot",
        "ecommerce",
        "booking",
        "exhibition",
        "real-estate",
        "hotel"
      ]
    }
  }
}
```

### Environment Configuration

```env
# .env.local (Web)
MATTERPORT_SDK_KEY=your-sdk-key-here
MATTERPORT_API_TOKEN=your-api-token-here

# .env (CMS) - if needed for validation
MATTERPORT_SDK_KEY=your-sdk-key-here
```

### Component Structure

```
apps/web/components/vtour/
├── MatterportViewer.tsx      # Core SDK wrapper
├── MatterportLoader.tsx      # Loading state
├── VTourContainer.tsx        # Layout container
├── VTourSidebar.tsx          # Navigation & controls
├── VTourMinimap.tsx          # Floorplan minimap
├── overlays/
│   ├── AIChat.tsx            # AI chatbot overlay
│   ├── ProductCard.tsx       # E-commerce product
│   ├── BookingWidget.tsx     # Booking form
│   ├── InfoPanel.tsx         # Information panel
│   └── ContactForm.tsx       # Lead capture
├── hotspots/
│   ├── BaseHotspot.tsx       # Base hotspot component
│   ├── ProductHotspot.tsx    # Product marker
│   ├── TableHotspot.tsx      # Table marker
│   ├── BoothHotspot.tsx      # Exhibition booth
│   └── RoomHotspot.tsx       # Hotel room
└── hooks/
    ├── useMatterport.ts      # SDK initialization
    ├── useHotspots.ts        # Hotspot management
    ├── useTourNavigation.ts  # Guided tour
    └── useVTourAnalytics.ts  # Event tracking
```

### API Routes

```
apps/web/app/api/vtour/
├── chat/route.ts             # AI chat endpoint
├── booking/route.ts          # Booking submission
├── products/route.ts         # Product data
├── leads/route.ts            # Lead capture
└── analytics/route.ts        # Event logging
```

---

## Matterport SDK Integration Guide

### Installation

```bash
cd apps/web
pnpm add @matterport/sdk
```

### Basic Integration

```typescript
// components/vtour/MatterportViewer.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { setupSdk, type MpSdk } from '@matterport/sdk';

interface MatterportViewerProps {
  modelId: string;
  sid?: string;
  onSdkReady?: (sdk: MpSdk) => void;
}

export function MatterportViewer({ modelId, sid, onSdkReady }: MatterportViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sdk, setSdk] = useState<MpSdk | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initSdk = async () => {
      if (!containerRef.current) return;

      try {
        const mpSdk = await setupSdk(
          process.env.NEXT_PUBLIC_MATTERPORT_SDK_KEY!,
          {
            container: containerRef.current,
            space: modelId,
            ...(sid && { applicationKey: sid }),
          }
        );

        if (mounted) {
          setSdk(mpSdk);
          setLoading(false);
          onSdkReady?.(mpSdk);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load tour');
          setLoading(false);
        }
      }
    };

    initSdk();

    return () => {
      mounted = false;
      // SDK cleanup if needed
    };
  }, [modelId, sid, onSdkReady]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900 text-white">
        <div className="text-center">
          <p className="text-red-400 mb-2">Error loading tour</p>
          <p className="text-sm text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
          <div className="text-center text-white">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4" />
            <p>Loading Virtual Tour...</p>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
```

### Hotspot System

```typescript
// components/vtour/hooks/useHotspots.ts
import { useCallback, useEffect, useState } from 'react';
import type { MpSdk } from '@matterport/sdk';

interface Hotspot {
  id: string;
  position: { x: number; y: number; z: number };
  type: 'product' | 'info' | 'table' | 'booth';
  data: Record<string, any>;
}

export function useHotspots(sdk: MpSdk | null, hotspots: Hotspot[]) {
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);

  useEffect(() => {
    if (!sdk) return;

    const mattertags: string[] = [];

    // Add hotspots as Mattertags
    hotspots.forEach(async (hotspot) => {
      try {
        const [tagId] = await sdk.Mattertag.add([{
          anchorPosition: hotspot.position,
          stemVector: { x: 0, y: 0.3, z: 0 },
          label: hotspot.data.label || '',
          description: '',
          media: { type: 'none' },
        }]);
        mattertags.push(tagId);
      } catch (err) {
        console.error('Failed to add hotspot:', err);
      }
    });

    // Listen for clicks
    const unsubscribe = sdk.Mattertag.on('click', (tagSid) => {
      const hotspot = hotspots.find((h) => h.id === tagSid);
      if (hotspot) {
        setActiveHotspot(hotspot);
      }
    });

    return () => {
      unsubscribe();
      // Remove mattertags on cleanup
    };
  }, [sdk, hotspots]);

  const closeHotspot = useCallback(() => {
    setActiveHotspot(null);
  }, []);

  return { activeHotspot, closeHotspot };
}
```

---

## Implementation Timeline

### Week 1: Foundation

| Day | Task | Owner |
|-----|------|-------|
| 1-2 | CMS schema update + seed data | Worker |
| 3-4 | MatterportViewer base component | Worker |
| 5 | Demo detail page integration | Worker |

### Week 2: AI Chatbot Demo

| Day | Task | Owner |
|-----|------|-------|
| 1-2 | AI chat overlay component | Worker |
| 3-4 | OpenAI/Claude integration | Worker |
| 5 | Location-aware context | Worker |

### Week 3: E-Commerce + Booking

| Day | Task | Owner |
|-----|------|-------|
| 1-2 | Product hotspot system | Worker |
| 3-4 | Shopping cart integration | Worker |
| 5 | Booking widget component | Worker |

### Week 4: Remaining Demos + Polish

| Day | Task | Owner |
|-----|------|-------|
| 1-2 | Tech fair booth system | Worker |
| 3-4 | Real estate features | Worker |
| 5 | Testing & optimization | Worker |

---

## Matterport Tours Placeholder

> **Note**: Ahmed will provide specific Matterport model IDs for each demo

| Demo | Model ID | Status |
|------|----------|--------|
| E-Commerce Store | TBD | ⏳ Pending |
| Café/Restaurant | TBD | ⏳ Pending |
| Hotel | TBD | ⏳ Pending |
| Real Estate | TBD | ⏳ Pending |
| Tech Fair/Exhibition | TBD | ⏳ Pending |
| Office/Coworking | TBD | ⏳ Pending |

---

## Dependencies

### NPM Packages

```json
{
  "@matterport/sdk": "latest",
  "zustand": "^4.x",
  "framer-motion": "^11.x",
  "react-hot-toast": "^2.x"
}
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_MATTERPORT_SDK_KEY` | Public SDK key | Yes |
| `MATTERPORT_API_TOKEN` | Server-side API token | Optional |
| `POE_API_KEY` | Poe.com AI chat | Yes |

---

## ✅ Success Criteria

- [ ] All 6 VTour demos accessible via `/demos/[slug]`
- [ ] Smooth 3D navigation on desktop and mobile
- [ ] Interactive hotspots functional
- [ ] AI chat responds contextually (Poe.com)
- [ ] Booking/cart systems work end-to-end
- [ ] All actions sync to Strapi
- [ ] Analytics tracking working
- [ ] Bilingual UI (EN/AR)
- [ ] Load time < 3 seconds
- [ ] No jank, smooth experience

---

*Plan maintained by GitHub Copilot - Master Agent*

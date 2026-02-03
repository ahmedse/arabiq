# Arabiq Platform Development Roadmap

> **Created**: 2026-02-02  
> **Last Updated**: 2026-02-02  
> **Master Agent**: GitHub Copilot  
> **Status**: ACTIVE  

---

## 🏢 Business Context

**Arabiq is a Matterport solutions company** that transforms 3D virtual tours into interactive business applications for retail, hospitality, real estate, events, and more.

The **arabiq.tech** website serves as:
1. **Marketing site** - Explain services, showcase capabilities
2. **Demo gallery** - Working examples for each industry
3. **Lead generation** - Convert visitors to clients

---

## 📋 Phase Overview

| Phase | Focus | Duration | Status |
|-------|-------|----------|--------|
| **Phase 1** | Foundation Completion | 1 week | ✅ COMPLETE |
| **Phase 2** | CMS/Web Polish | 1 week | 🔴 IN PROGRESS |
| **Phase 3** | Security & Performance | 3-4 days | ⏳ Pending |
| **Phase 4** | Demo Experiences | 2-3 weeks | ⏳ Pending |

---

## Phase 1: Foundation Completion ✅ COMPLETE

**Goal**: Robust, professional web application with no gaps.

### Task Breakdown

| ID | Task | Priority | Hours | Status |
|----|------|----------|-------|--------|
| TASK-001 | Loading states, error handling, UI components, contact form | HIGH | 6-8 | ✅ DONE |
| TASK-002 | Page sections, account management, email integration | HIGH | 6 | ✅ DONE |

### Deliverables
- ✅ Every page has loading skeleton
- ✅ Errors are caught and displayed gracefully
- ✅ Contact form submits and stores data
- ✅ UI component library is complete
- ✅ All pages render CMS content properly
- ✅ Account profile editing works
- ✅ Password change functionality
- ✅ Admin user management improved
- ✅ Email notifications via Resend

---

## Phase 2: CMS/Web Polish (Week 2) ✅ COMPLETE

**Goal**: Complete content integration, translations, and user flows.

### Task Breakdown

| ID | Task | Priority | Hours | Status |
|----|------|----------|-------|--------|
| TASK-003 | SEO meta tags, Open Graph, structured data, Arabic translations | HIGH | 5-6 | ✅ DONE |
| TASK-004 | Security hardening (rate limiting, CSP, validation) | HIGH | 4-5 | ✅ DONE |
| TASK-005 | Performance optimization (images, lazy loading, caching) | MEDIUM | 4 | ✅ DONE |
| TASK-006 | Final testing and production prep | MEDIUM | 3 | ✅ DONE |

### Deliverables
- ✅ Site works perfectly in Arabic
- ✅ All pages have proper meta tags
- ✅ Structured data for SEO
- ✅ Graceful fallbacks when CMS offline
- ✅ Security hardened (rate limiting, CSP, validation)
- ✅ Performance optimized (images, lazy loading, caching)
- ✅ Production ready

---

## Phase 3: VTour Demo Infrastructure 🔴 IN PROGRESS

**Goal**: Build the foundation for immersive VTour demos with real-time features.

### Available Tours

| # | Tour Name | Model ID | Demo Type |
|---|-----------|----------|-----------|
| 1 | Awni Electronics | `6WxfcPSW7KM` | E-commerce |
| 2 | Cavalli Cafe | `dA2YT3w5Jgs` | Restaurant |
| 3 | Royal Jewel & Lail | `bBwDnZTv2qm` | Hotel |
| 4 | Office for Sale | `Tv2upLvBLZ6` | Real Estate |
| 5 | Trust Co. Interior | `wheLaeajqUu` | Showroom |
| 6 | EAAC Training | `fNbgwVqbf5R` | Corporate |

### Task Breakdown

| ID | Task | Priority | Hours | Status |
|----|------|----------|-------|--------|
| TASK-007 | CMS Content Types & Tables | HIGH | 4-6 | ✅ DONE |
| TASK-008 | Matterport SDK Integration | HIGH | 6-8 | ✅ DONE |
| TASK-009 | Demo 1: E-commerce (Awni) | HIGH | 8-10 | ✅ DONE |
| TASK-010 | Demo 2: Restaurant (Cavalli) | HIGH | 6-8 | ✅ DONE |
| TASK-011 | Demo 3: Hotel (Royal Jewel) | MEDIUM | 6-8 | ✅ DONE |
| TASK-012 | Demo 4: Real Estate (Office) | MEDIUM | 4-6 | ✅ DONE |
| TASK-013 | Demo 5: Showroom (Trust Co.) | MEDIUM | 4-6 | ✅ DONE |
| TASK-014 | Demo 6: Training Center (EAAC) | MEDIUM | 4-6 | ✅ DONE |
| TASK-015 | AI Chatbot (Poe.com API) | HIGH | 6-8 | ✅ DONE |
| TASK-016 | Real-time Presence & Live Chat | HIGH | 8-10 | ✅ DONE |
| TASK-017 | Voice-over/Narrative System | MEDIUM | 4-6 | ✅ DONE |
| TASK-018 | Business Owner Dashboard | HIGH | 6-8 | ✅ DONE |

### 🎉 Phase 4 Complete!

### Key Features

1. **Interactive VTour Demos**
   - Matterport SDK with custom hotspots
   - Product/menu/room catalogs
   - Cart/booking/inquiry systems

2. **Real-time Presence**
   - See who's in your space NOW
   - Visitor positions in 3D
   - Initiate live chat with visitors

3. **Voice-over Narrative**
   - Audio tour guide
   - Auto-play at locations
   - Multi-language support

4. **AI Assistant**
   - Poe.com API integration
   - Answer product questions
   - Guide visitors

5. **Business Owner Dashboard**
   - View all active visitors
   - Chat with visitors
   - Manage orders/bookings

### CMS Content Types (TASK-007)

**Catalog Types:**
- Demo (enhanced)
- Demo Product
- Demo Menu Item
- Demo Room
- Demo Property
- Demo Voice Over

**Action Types (stored & returned to owner):**
- Demo Order
- Demo Reservation
- Demo Booking
- Demo Inquiry
- Demo Visitor Session

### Deliverables
- ⏳ 6 working VTour demos
- ⏳ Real-time visitor tracking
- ⏳ AI chatbot integration
- ⏳ Voice-over support
- ⏳ Business owner dashboard

---

## Phase 4: Polish & Launch (Week 6)
- ✅ E-commerce with server-synced cart
- ✅ AI chatbot with Poe.com
- ✅ All demos bilingual (EN/AR)

---

## Demo Experiences Vision

### E-Commerce VTour

```
┌─────────────────────────────────────────────────────────────┐
│  ARABIQ VIRTUAL STORE                           [Cart: 2]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     ┌─────────────────────────────────────────────────┐    │
│     │                                                 │    │
│     │         [3D MATTERPORT STORE VIEW]             │    │
│     │                                                 │    │
│     │    ⭐ Product Hotspot (glowing)                │    │
│     │                                                 │    │
│     │                    ┌──────────────────┐        │    │
│     │                    │ PRODUCT CARD    │        │    │
│     │                    │ ┌────┐          │        │    │
│     │                    │ │IMG │ Name     │        │    │
│     │                    │ └────┘ $99.00   │        │    │
│     │                    │ ★★★★☆           │        │    │
│     │                    │ [Add to Cart]   │        │    │
│     │                    └──────────────────┘        │    │
│     │                                                 │    │
│     └─────────────────────────────────────────────────┘    │
│                                                             │
│  [◀ Back]  [🗺️ Map]  [🛒 Cart]  [❓ Help]                 │
└─────────────────────────────────────────────────────────────┘
```

### AI Chatbot

```
┌──────────────────────────────────────────────────────────────┐
│  PAGE CONTENT                              🤖 Chat with AI  │
│                                            ┌──────────────┐ │
│                                            │ How can I    │ │
│  [Main content area]                       │ help you     │ │
│                                            │ today?       │ │
│                                            │              │ │
│                                            │ User: What   │ │
│                                            │ products do  │ │
│                                            │ you have?    │ │
│                                            │              │ │
│                                            │ Bot: We have │ │
│                                            │ amazing...   │ │
│                                            │              │ │
│                                            │ [Type here]  │ │
│                                            └──────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## Environment Variables Required

### Phase 1-3 (CMS + Web)

```env
# Web (.env.local)
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your-token
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
SITE_URL=https://arabiq.tech

# CMS (.env)
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_NAME=arabiq
DATABASE_USERNAME=arabiq
DATABASE_PASSWORD=your-password
ADMIN_JWT_SECRET=your-secret
JWT_SECRET=your-secret
APP_KEYS=key1,key2,key3,key4
```

### Phase 4 (Demos)

```env
# Web (.env.local) - Additional
NEXT_PUBLIC_MATTERPORT_SDK_KEY=your-sdk-key
MATTERPORT_API_TOKEN=your-api-token
POE_API_KEY=your-poe-api-key
```

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Lighthouse Performance | > 90 | TBD |
| Lighthouse Accessibility | > 95 | TBD |
| Lighthouse SEO | 100 | TBD |
| Page Load Time | < 2s | TBD |
| Error Rate | < 0.1% | TBD |
| Demo Engagement | > 3min avg | TBD |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Matterport SDK issues | HIGH | Have iframe fallback ready |
| Poe.com API rate limits | MEDIUM | Implement caching, queue |
| Arabic RTL bugs | MEDIUM | Test thoroughly with native speakers |
| Performance on mobile | HIGH | Test on real devices early |

---

## Communication

- **Task assignments**: `TASK.md`
- **Results**: `TASK-RESULTS.md`
- **This roadmap**: `docs/DEVELOPMENT-ROADMAP.md`
- **Demo plan**: `docs/VTOUR-DEMO-PLAN.md`
- **Audit report**: `docs/PLATFORM-AUDIT-2026-02-02.md`

---

*Roadmap maintained by GitHub Copilot - Master Agent*

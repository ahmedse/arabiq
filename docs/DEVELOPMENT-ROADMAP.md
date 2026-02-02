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

## Phase 2: CMS/Web Polish (Week 2) 🔴 IN PROGRESS

**Goal**: Complete content integration, translations, and user flows.

### Task Breakdown

| ID | Task | Priority | Hours | Status |
|----|------|----------|-------|--------|
| TASK-003 | SEO meta tags, Open Graph, structured data, Arabic translations | HIGH | 5-6 | ✅ DONE |
| TASK-004 | Security hardening (rate limiting, CSP, validation) | HIGH | 4-5 | 🔴 ACTIVE |
| TASK-005 | Performance optimization (images, lazy loading, caching) | MEDIUM | 4 | ⏳ |
| TASK-006 | Final testing and production prep | MEDIUM | 3 | ⏳ |

### Deliverables
- ✅ Site works perfectly in Arabic
- ✅ All pages have proper meta tags
- ✅ Structured data for SEO
- ✅ Graceful fallbacks when CMS offline
- ⏳ Security hardened
- ⏳ Performance optimized

---

## Phase 3: Security & Performance (Days 15-18)

**Goal**: Harden the application for production.

### Task Breakdown

| ID | Task | Priority | Hours | Status |
|----|------|----------|-------|--------|
| TASK-007 | Rate limiting on all API routes | HIGH | 3 | ⏳ |
| TASK-008 | CSRF protection for forms | HIGH | 2 | ⏳ |
| TASK-009 | CSP headers configuration | MEDIUM | 2 | ⏳ |
| TASK-010 | Image optimization with next/image | MEDIUM | 3 | ⏳ |
| TASK-011 | Lazy loading for below-fold sections | MEDIUM | 2 | ⏳ |
| TASK-012 | Database backup automation | MEDIUM | 2 | ⏳ |

### Deliverables
- ⏳ No security vulnerabilities
- ⏳ Lighthouse score > 90
- ⏳ Images optimized
- ⏳ Backups automated

---

## Phase 4: Demo Experiences (Weeks 3-5)

**Goal**: Create immersive, server-connected demo experiences.

### Task Breakdown

| ID | Task | Priority | Hours | Status |
|----|------|----------|-------|--------|
| TASK-020 | Matterport SDK integration base | HIGH | 8 | ⏳ |
| TASK-021 | Product catalog API in Strapi | HIGH | 4 | ⏳ |
| TASK-022 | E-Commerce VTour demo | HIGH | 16 | ⏳ |
| TASK-023 | AI Chatbot with Poe.com API | HIGH | 12 | ⏳ |
| TASK-024 | Café booking demo | MEDIUM | 10 | ⏳ |
| TASK-025 | Tech fair demo | MEDIUM | 10 | ⏳ |
| TASK-026 | Remaining demos | LOW | 16 | ⏳ |

### Deliverables
- ✅ 5-6 working VTour demos
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

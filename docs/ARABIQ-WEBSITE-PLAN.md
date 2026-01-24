# Arabiq Website — Comprehensive Transformation Plan

> **Goal:** Transform arabiq.tech from a generic placeholder into a compelling, bilingual (EN/AR) marketing website that showcases Arabiq's AI-powered digital-twin platform vision.

---

## 1. Current State Assessment

### 1.1 Critical Issues

| Category | Issue | Impact |
|----------|-------|--------|
| **UI/UX** | Generic, bland design | Doesn't reflect innovation or premium positioning |
| **Content** | Only English in CMS | Fails bilingual requirement |
| **Content** | Generic placeholder text | Doesn't match actual business offerings |
| **Auth** | Missing AUTH_SECRET | Login page broken |
| **Branding** | Misaligned with business plan | Solutions/Industries don't match Vmall, AI Suite vision |
| **i18n** | Hardcoded strings | Not maintainable, no proper translation system |
| **Design** | No hero sections, icons, or visuals | Poor first impression |

### 1.2 What We Have Working
- ✅ Next.js 14 App Router with locale routing
- ✅ Strapi CMS with i18n plugin
- ✅ Prisma + PostgreSQL for auth
- ✅ Auth.js with Google provider (needs config)
- ✅ Basic page structure
- ✅ RTL/LTR switching

---

## 2. Target State Vision

### 2.1 Brand Positioning
**"The Arab World's AI-Powered Digital-Twin Platform"**

- **Tagline EN:** "Your business, alive online"
- **Tagline AR:** "أعمالك، حية على الإنترنت"

### 2.2 Core Value Proposition
Enable businesses to "exist twice": once in the physical world and again inside a rich, intelligent, 3D-driven digital space.

### 2.3 Target Audience
- SME retailers & shop owners
- Real estate developers & agencies
- Tourism & hospitality businesses
- Event organizers & exhibition managers
- Educational institutions

---

## 3. Content Architecture

### 3.1 Solutions (Aligned with Business Plan)

| Slug | EN Title | AR Title | Description Focus |
|------|----------|----------|-------------------|
| `vmall-platform` | Vmall Platform | منصة Vmall | 3D virtual malls, shops, exhibitions using Matterport + AI |
| `arabiq-ai-suite` | Arabiq AI Suite | مجموعة Arabiq للذكاء الاصطناعي | Arabic voice, chat, vision, recommendation APIs |
| `arabiq-commerce` | Arabiq Commerce | Arabiq للتجارة الإلكترونية | E-commerce backend, carts, payments |
| `integration-layer` | System Integration | التكامل مع الأنظمة | Bridges with WooCommerce, Shopify, Odoo, ERPNext |
| `digital-twin-production` | Digital Twin Production | إنتاج التوأم الرقمي | Matterport scanning, post-production, hosting |
| `vfair-edition` | VFair Edition | نسخة VFair | Virtual fairs & exhibitions |

### 3.2 Industries

| Slug | EN Title | AR Title |
|------|----------|----------|
| `retail-ecommerce` | Retail & E-commerce | التجزئة والتجارة الإلكترونية |
| `real-estate` | Real Estate | العقارات |
| `tourism-hospitality` | Tourism & Hospitality | السياحة والضيافة |
| `events-exhibitions` | Events & Exhibitions | الفعاليات والمعارض |
| `education` | Education | التعليم |
| `healthcare` | Healthcare | الرعاية الصحية |

### 3.3 Case Studies

| Slug | EN Title | AR Title | Industry |
|------|----------|----------|----------|
| `vmall-retail-pilot` | Virtual Mall Retail Pilot | تجربة المول الافتراضي للتجزئة | Retail |
| `real-estate-showcase` | 3D Property Showcase | عرض العقارات ثلاثي الأبعاد | Real Estate |
| `museum-digital-twin` | Museum Digital Experience | التجربة الرقمية للمتحف | Tourism |

### 3.4 Demos

| Slug | EN Title | AR Title | Type |
|------|----------|----------|------|
| `ai-chat-assistant` | AI Chat Assistant | مساعد الذكاء الاصطناعي | Internal Demo |
| `vmall-showroom` | Virtual Showroom | صالة العرض الافتراضية | Matterport Embed |
| `voice-narration` | Arabic Voice AI | الذكاء الاصطناعي الصوتي | Audio Demo |

---

## 4. Design System

### 4.1 Color Palette

```css
/* Primary - Deep Tech Blue */
--primary-50: #eff6ff;
--primary-500: #3b82f6;
--primary-600: #2563eb;
--primary-700: #1d4ed8;
--primary-900: #1e3a5f;

/* Accent - Innovation Cyan */
--accent-400: #22d3ee;
--accent-500: #06b6d4;

/* Arabic Gold (for AR locale accents) */
--gold-400: #fbbf24;
--gold-500: #f59e0b;

/* Neutrals */
--slate-50: #f8fafc;
--slate-900: #0f172a;
```

### 4.2 Typography
- **English:** Inter (modern, clean)
- **Arabic:** IBM Plex Sans Arabic (professional, readable)

### 4.3 Component Library Needs
- Hero sections (gradient backgrounds, CTAs)
- Feature cards with icons
- Testimonial/Quote blocks
- Stats/Numbers sections
- Interactive demo embeds
- Before/After comparisons
- Logo clouds (clients/partners)
- Animated counters

---

## 5. Page-by-Page Design Spec

### 5.1 Home Page

**Hero Section:**
```
[Gradient Background with subtle 3D mesh pattern]

ARABIQ.TECH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your Business, Alive Online
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build immersive 3D digital twins of your spaces —
powered by Arabic AI, loved by your customers.

[Explore Solutions]  [Request Demo]
```

**What We Do Section:**
- 3 main pillars: Vmall | AI Suite | Commerce

**Why Arabiq Section:**
- Arabic-First AI
- 70% Lower Cost
- Egyptian Innovation
- Full Bilingual Support

**Industries Grid:**
- Visual cards with icons

**Stats Bar:**
- 10+ Clients
- 3+ AI Models
- 2 Countries
- 100% Arabic Support

**CTA Section:**
- "Ready to digitize your business?"

### 5.2 Solutions Page
- Hero with gradient
- Grid of solution cards with:
  - Icon
  - Title
  - Summary
  - "Learn more →"

### 5.3 Solution Detail Page
- Hero with solution icon
- Problem/Solution format
- Features list with icons
- Use cases
- "Get Started" CTA

### 5.4 Industries Page
- Similar structure to Solutions
- Industry-specific imagery/icons

### 5.5 Case Studies Page
- Card grid with:
  - Client logo placeholder
  - Title
  - Industry tag
  - Key metric highlight

### 5.6 Case Study Detail
- Challenge → Solution → Results format
- Metrics/stats highlights
- Testimonial quote
- Gallery (if available)

### 5.7 Demos Page
- Requires authentication
- Demo cards with:
  - Thumbnail
  - Title
  - Type badge
  - "Try Demo" button

### 5.8 Contact Page
- Contact form (name, email, company, message)
- Contact info sidebar
- Office locations (Cairo, Alexandria)

### 5.9 About Page
- Company story
- Vision & Mission
- Team section (founders)
- Values

---

## 6. Technical Implementation

### 6.1 i18n System

**Option A: next-intl (Recommended)**
```
/messages
  /en.json
  /ar.json
```

**Option B: CMS-driven translations**
- All text from Strapi with locale param
- More flexible but slower

**Decision:** Hybrid approach
- Static UI strings → next-intl
- Content (solutions, industries, etc.) → Strapi with i18n

### 6.2 Component Structure

```
/components
  /ui           # Base components (Button, Card, Badge, etc.)
  /layout       # Header, Footer, Navigation
  /sections     # Hero, Features, Stats, CTA
  /marketing    # SolutionCard, IndustryCard, CaseStudyCard
  /icons        # Custom SVG icons
```

### 6.3 Auth Fix

Required environment variables:
```env
AUTH_SECRET=<generate-with-openssl>
AUTH_GOOGLE_ID=<google-client-id>
AUTH_GOOGLE_SECRET=<google-client-secret>
```

Generate secret:
```bash
openssl rand -base64 32
```

### 6.4 CMS Content Updates

1. Update seed.mjs to include:
   - All 6 solutions (EN + AR)
   - All 6 industries (EN + AR)
   - Case studies (EN + AR)
   - Demos (EN + AR)
   - Site settings for both locales

2. Strapi content types review:
   - Ensure all fields support i18n
   - Add icon field (emoji or SVG reference)
   - Add featured image field

---

## 7. Implementation Phases

### Phase 1: Foundation (Days 1-2)
- [ ] Fix AUTH_SECRET error
- [ ] Set up next-intl for UI translations
- [ ] Create translation files (en.json, ar.json)
- [ ] Build base UI components (Button, Card, Badge, Icon)
- [ ] Update global CSS with design tokens

### Phase 2: Design System (Days 3-4)
- [ ] Create Hero component variants
- [ ] Create Section components (Features, Stats, CTA)
- [ ] Create marketing card components
- [ ] Add icon library (Lucide or Heroicons)
- [ ] Implement Arabic typography

### Phase 3: Content (Days 5-6)
- [ ] Update seed.mjs with bilingual content
- [ ] Re-seed Strapi with new content
- [ ] Ensure all Strapi content types have AR translations
- [ ] Add Site Settings for AR locale

### Phase 4: Pages (Days 7-10)
- [ ] Redesign Home page
- [ ] Redesign Solutions page + detail
- [ ] Redesign Industries page + detail
- [ ] Redesign Case Studies page + detail
- [ ] Redesign About page
- [ ] Redesign Contact page (add form)
- [ ] Redesign Demos page
- [ ] Redesign Login page

### Phase 5: Polish (Days 11-12)
- [ ] Responsive testing
- [ ] RTL testing for all pages
- [ ] Performance optimization
- [ ] SEO meta tags
- [ ] Error handling
- [ ] Loading states

---

## 8. Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Lighthouse Performance | ~70 | 90+ |
| Lighthouse Accessibility | ~80 | 95+ |
| Arabic content coverage | 0% | 100% |
| Page load time | ~3s | <1.5s |
| Mobile usability | Poor | Excellent |
| Auth working | ❌ | ✅ |

---

## 9. File Structure After Implementation

```
apps/web/
  /app
    /[locale]
      /page.tsx              # Home - redesigned
      /layout.tsx            # Updated with translations
      /solutions
        /page.tsx            # Grid of solutions
        /[slug]/page.tsx     # Solution detail
      /industries
        /page.tsx            # Grid of industries
        /[slug]/page.tsx     # Industry detail
      /case-studies
        /page.tsx            # Grid of case studies
        /[slug]/page.tsx     # Case study detail
      /demos
        /page.tsx            # Demo grid (protected)
        /[slug]/page.tsx     # Demo viewer (protected)
      /about/page.tsx        # Redesigned
      /contact/page.tsx      # With form
      /login/page.tsx        # Styled login
  /components
    /ui
      Button.tsx
      Card.tsx
      Badge.tsx
      Container.tsx
    /sections
      Hero.tsx
      Features.tsx
      Stats.tsx
      CTA.tsx
    /marketing
      SolutionCard.tsx
      IndustryCard.tsx
      CaseStudyCard.tsx
  /messages
    /en.json
    /ar.json
  /lib
    /i18n.ts                 # next-intl setup
```

---

## 10. Immediate Next Steps

1. **Discuss & Approve Plan** — Review this document
2. **Fix Critical Bugs** — AUTH_SECRET, image warnings
3. **Create Design Tokens** — Colors, fonts in Tailwind config
4. **Build Components** — Start with Hero and Cards
5. **Update CMS Content** — Bilingual seed script
6. **Redesign Pages** — One by one

---

## Appendix A: Arabic Content Samples

### Site Settings (AR)
```json
{
  "title": "Arabiq - منصة التوأم الرقمي",
  "description": "أعمالك، حية على الإنترنت. نبني مساحات رقمية ثلاثية الأبعاد مدعومة بالذكاء الاصطناعي العربي."
}
```

### Solution: Vmall (AR)
```json
{
  "title": "منصة Vmall",
  "slug": "vmall-platform",
  "summary": "أنشئ واستضف مولات افتراضية ومعارض ومتاجر باستخدام تقنية Matterport والذكاء الاصطناعي.",
  "description": "..."
}
```

### Industry: Real Estate (AR)
```json
{
  "title": "العقارات",
  "slug": "real-estate",
  "summary": "جولات افتراضية ثلاثية الأبعاد للعقارات تتيح للمشترين استكشاف المساحات من أي مكان."
}
```

---

## Appendix B: Environment Variables Needed

```env
# Auth (CRITICAL - Fix immediately)
AUTH_SECRET=<openssl rand -base64 32>
AUTH_GOOGLE_ID=<from-google-cloud-console>
AUTH_GOOGLE_SECRET=<from-google-cloud-console>

# Database
DATABASE_URL=postgresql://...

# Strapi
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=<from-strapi-admin>

# Site
SITE_URL=http://localhost:3000
```

---

**Document Status:** Ready for Review  
**Last Updated:** January 23, 2026  
**Author:** GitHub Copilot  

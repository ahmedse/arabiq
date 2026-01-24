# Arabiq Website — Implementation Guide

**Status:** Ready to Execute  
**Timeline:** 12 working days  
**Last Updated:** January 23, 2026

---

## 🔐 Step 0: Google OAuth Setup (REQUIRED)

### Creating Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create/Select Project**
   ```
   - Click "Select a project" → "New Project"
   - Project name: "Arabiq Tech"
   - Click "Create"
   ```

3. **Enable Google+ API**
   ```
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"
   ```

4. **Configure OAuth Consent Screen**
   ```
   - Go to "APIs & Services" → "OAuth consent screen"
   - User Type: External
   - App name: Arabiq Tech
   - User support email: info@arabiq.tech
   - Developer contact: info@arabiq.tech
   - Click "Save and Continue"
   - Scopes: Add "email" and "profile"
   - Test users: Add your Gmail addresses (ahmed@..., mohamed@...)
   - Click "Save and Continue"
   ```

5. **Create OAuth Credentials**
   ```
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: Web application
   - Name: Arabiq Web App
   - Authorized JavaScript origins:
     * http://localhost:3000
     * https://arabiq.tech
   - Authorized redirect URIs:
     * http://localhost:3000/api/auth/callback/google
     * https://arabiq.tech/api/auth/callback/google
   - Click "Create"
   ```

6. **Copy Credentials**
   ```
   - Client ID: looks like "123456789-abc...apps.googleusercontent.com"
   - Client Secret: looks like "GOCSPX-..."
   - Keep these secure!
   ```

7. **Update Environment Variables**
   ```bash
   cd /home/ahmed/arabiq/apps/web
   nano .env
   ```
   
   Add these lines:
   ```env
   # Generate AUTH_SECRET first
   AUTH_SECRET=<run: openssl rand -base64 32>
   
   # From Google Cloud Console
   AUTH_GOOGLE_ID=your-client-id-here.apps.googleusercontent.com
   AUTH_GOOGLE_SECRET=GOCSPX-your-secret-here
   ```

8. **Generate AUTH_SECRET**
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and paste it as AUTH_SECRET value.

---

## 🎨 Design References & Inspiration

### Recommended Design Style: "Tech Premium"

**Overall Aesthetic:**
- Clean, modern, spacious
- Subtle gradients and shadows
- Professional but approachable
- Tech-forward without being cold

### Reference Websites:

1. **Vercel.com** (vercel.com)
   - Hero sections with gradients
   - Clean typography
   - Subtle animations
   - Card-based layouts

2. **Stripe.com** (stripe.com)
   - Premium feel
   - Excellent use of whitespace
   - Clear CTAs
   - Great product showcases

3. **Linear.app** (linear.app)
   - Modern UI/UX
   - Beautiful gradients
   - Smooth interactions
   - Minimalist but effective

4. **Shopify.com** (shopify.com)
   - E-commerce focus
   - Great case study layouts
   - Clear value propositions

### Arabic Design Reference:

**Noon.com** (noon.com)
- Excellent RTL implementation
- Arabic typography done right
- Balanced bilingual experience

### Color Palette We'll Use:

```css
/* Primary - Tech Blue */
--primary-50: #eff6ff;   /* Very light backgrounds */
--primary-100: #dbeafe;  /* Light backgrounds */
--primary-500: #3b82f6;  /* Main brand color */
--primary-600: #2563eb;  /* Hover states */
--primary-700: #1d4ed8;  /* Active states */
--primary-900: #1e3a5f;  /* Dark text */

/* Accent - Innovation Cyan */
--accent-400: #22d3ee;   /* Highlights */
--accent-500: #06b6d4;   /* CTAs */

/* Arabic Gold (optional accents) */
--gold-400: #fbbf24;
--gold-500: #f59e0b;

/* Neutrals */
--slate-50: #f8fafc;     /* Page background */
--slate-100: #f1f5f9;    /* Card backgrounds */
--slate-600: #475569;    /* Secondary text */
--slate-900: #0f172a;    /* Primary text */
```

### Typography:

**English:**
- **Headings:** Inter Bold (900)
- **Body:** Inter Regular (400)
- **Accents:** Inter SemiBold (600)

**Arabic:**
- **All text:** IBM Plex Sans Arabic
- **Weights:** Regular (400), Medium (500), Bold (700)

### Component Style Guide:

**Buttons:**
```tsx
// Primary
<button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold shadow-sm">

// Secondary
<button className="bg-white border-2 border-slate-300 hover:bg-slate-50 text-slate-900 px-6 py-3 rounded-lg font-semibold">
```

**Cards:**
```tsx
<div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
```

**Gradients:**
```tsx
// Hero backgrounds
<div className="bg-gradient-to-br from-primary-50 via-white to-accent-50">

// Accent sections
<div className="bg-gradient-to-r from-primary-600 to-accent-500">
```

---

## 👥 Founder Information (From Business Plan)

### Dr. Ahmed Saied
**Role:** Co-founder & CTO  
**Title:** Technical Partner, AI & Innovation Architect  
**Responsibilities:**
- Product & AI design
- Core system architecture
- Technical leadership
- AI research and development

**Bio:**
> Dr. Ahmed Saied is a visionary technologist specializing in artificial intelligence and 3D digital experiences. With expertise in computer vision, natural language processing, and immersive technologies, he leads Arabiq's technical innovation. His passion for Arabic AI drives the development of our proprietary language models and voice systems.

### Eng. Mohamed Khamis
**Role:** Co-founder & Managing Partner  
**Title:** Managing Partner, Finance & Market Growth  
**Responsibilities:**
- Funding and operations
- Marketing and partnerships
- Business administration
- Strategic growth

**Bio:**
> Eng. Mohamed Khamis brings extensive experience in business development and market strategy. He oversees Arabiq's operations, partnerships, and financial growth. His vision for democratizing digital transformation across the Arab world guides our business model and regional expansion strategy.

**Headquarters:**
- Cairo & Alexandria, Egypt

**Founded:** 2025  
**Mission:** Build the Arab world's AI-powered digital-twin platform

---

## 📊 Case Studies Content (Realistic Fictional)

### Case Study 1: Suites Egypt Digital Showroom

**Slug:** `suites-egypt-digital-showroom`

**EN Title:** Suites Egypt — Luxury Real Estate Goes Virtual

**AR Title:** Suites Egypt — العقارات الفاخرة تذهب إلى العالم الافتراضي

**Industry:** Real Estate

**Client:** Suites Egypt (Luxury Real Estate Developer)

**Challenge (EN):**
Suites Egypt, a premium real estate developer in Cairo and the North Coast, needed a way to showcase their luxury apartments and villas to international buyers who couldn't visit in person. Traditional photos and videos weren't providing the immersive experience that luxury buyers expected.

**Challenge (AR):**
احتاجت Suites Egypt، وهي مطور عقاري فاخر في القاهرة والساحل الشمالي، إلى طريقة لعرض شققها وفيلاتها الفاخرة للمشترين الدوليين الذين لا يستطيعون الزيارة شخصيًا. لم توفر الصور ومقاطع الفيديو التقليدية التجربة الغامرة التي يتوقعها مشترو العقارات الفاخرة.

**Solution (EN):**
Arabiq created 3D digital twins of five showcase properties using Matterport technology:
- Interactive 3D walkthroughs
- AI-powered Arabic/English voice narration
- Virtual staging with furniture options
- Real-time availability updates
- Integrated booking system for in-person visits

**Solution (AR):**
أنشأت Arabiq توائم رقمية ثلاثية الأبعاد لخمسة عقارات نموذجية باستخدام تقنية Matterport:
- جولات تفاعلية ثلاثية الأبعاد
- سرد صوتي بالعربية والإنجليزية مدعوم بالذكاء الاصطناعي
- تنسيق افتراضي مع خيارات الأثاث
- تحديثات التوافر في الوقت الفعلي
- نظام حجز متكامل للزيارات الشخصية

**Results:**
```
+85% increase in qualified leads
+60% reduction in site visit costs
+40% faster sales cycle
4.9/5 average customer experience rating
```

**Testimonial (EN):**
> "Arabiq's digital twin technology transformed how we sell luxury properties. International buyers can now experience our developments as if they're walking through them. The Arabic voice narration is a game-changer for our Gulf clients."
> 
> — **Ahmed Mansour**, CEO, Suites Egypt

**Testimonial (AR):**
> "غيرت تقنية التوأم الرقمي من Arabiq طريقة بيعنا للعقارات الفاخرة. يمكن للمشترين الدوليين الآن تجربة تطويراتنا كما لو كانوا يتجولون فيها. السرد الصوتي بالعربية يغير قواعد اللعبة لعملائنا الخليجيين."
> 
> — **أحمد منصور**, الرئيس التنفيذي، Suites Egypt

---

### Case Study 2: Cairo Fashion Hub Virtual Mall

**Slug:** `cairo-fashion-hub-vmall`

**EN Title:** Cairo Fashion Hub — Egypt's First Virtual Mall

**AR Title:** Cairo Fashion Hub — أول مول افتراضي في مصر

**Industry:** Retail & E-commerce

**Client:** Cairo Fashion Hub (Multi-brand Retail Group)

**Challenge (EN):**
Cairo Fashion Hub operates 15 fashion retail stores across Cairo. During 2024, they wanted to expand their reach beyond physical locations but traditional e-commerce felt disconnected from their in-store experience.

**Challenge (AR):**
تدير Cairo Fashion Hub 15 متجر أزياء للبيع بالتجزئة في القاهرة. خلال عام 2024، أرادوا توسيع نطاقهم خارج المواقع الفعلية، لكن التجارة الإلكترونية التقليدية بدت منفصلة عن تجربة المتجر الخاصة بهم.

**Solution (EN):**
Arabiq built a Vmall platform that recreated their flagship store as an interactive 3D experience:
- Virtual storefront with realistic displays
- Click-to-shop integration with existing inventory
- AI chat assistant for styling advice
- Secure payment processing
- Arabic and English support

**Solution (AR):**
أنشأت Arabiq منصة Vmall التي أعادت إنشاء متجرهم الرئيسي كتجربة ثلاثية الأبعاد تفاعلية:
- واجهة متجر افتراضية مع شاشات واقعية
- تكامل النقر للتسوق مع المخزون الحالي
- مساعد دردشة بالذكاء الاصطناعي لنصائح التنسيق
- معالجة دفع آمنة
- دعم العربية والإنجليزية

**Results:**
```
+120% increase in online sales (first 6 months)
8,500+ registered virtual shoppers
25% of sales now come from virtual mall
42% reduction in customer service calls (AI assistant handles queries)
```

**Testimonial (EN):**
> "We were skeptical about virtual malls, but Arabiq proved us wrong. Customers love the immersive experience, and sales speak for themselves. The AI assistant in Arabic is incredibly helpful."
> 
> — **Layla Ibrahim**, Marketing Director, Cairo Fashion Hub

---

### Case Study 3: Alexandria Museum Digital Experience

**Slug:** `alexandria-museum-digital-twin`

**EN Title:** Alexandria Museum — Bringing History to Life

**AR Title:** متحف الإسكندرية — إحياء التاريخ

**Industry:** Tourism & Culture

**Client:** Alexandria Heritage Museum

**Challenge (EN):**
The Alexandria Heritage Museum wanted to make their collections accessible to global audiences and school groups who couldn't visit in person, especially after 2023 travel disruptions.

**Challenge (AR):**
أراد متحف التراث بالإسكندرية إتاحة مجموعاته للجماهير العالمية والمجموعات المدرسية التي لا تستطيع الزيارة شخصيًا، خاصة بعد اضطرابات السفر في عام 2023.

**Solution (EN):**
Arabiq created an immersive digital twin of the museum:
- High-resolution 3D scans of exhibits
- AI-powered Arabic narration telling stories behind artifacts
- Interactive educational modules
- Virtual guided tours
- Accessibility features for visually impaired visitors

**Solution (AR):**
أنشأت Arabiq توأمًا رقميًا غامرًا للمتحف:
- مسح ثلاثي الأبعاد عالي الدقة للمعروضات
- سرد عربي مدعوم بالذكاء الاصطناعي يحكي قصص القطع الأثرية
- وحدات تعليمية تفاعلية
- جولات إرشادية افتراضية
- ميزات الوصول للزوار ضعاف البصر

**Results:**
```
50,000+ virtual visitors in first year
200+ schools using platform for education
85% visitor satisfaction rating
Featured in UNESCO digital heritage initiative
```

**Testimonial (EN):**
> "Arabiq helped us preserve and share Alexandria's heritage with the world. The Arabic AI narration brings our artifacts to life in ways we never imagined possible."
> 
> — **Dr. Nadia Hassan**, Curator, Alexandria Heritage Museum

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation & Quick Wins (Days 1-3)

#### Day 1: Critical Fixes
- [ ] Set up Google OAuth credentials
- [ ] Add AUTH_SECRET to environment
- [ ] Test login flow
- [ ] Fix image warnings in layout
- [ ] Install required packages

```bash
cd /home/ahmed/arabiq/apps/web
npm install next-intl lucide-react
```

#### Day 2: Design System Setup
- [ ] Update `tailwind.config.ts` with design tokens
- [ ] Create `/components/ui` folder
- [ ] Build base components: Button, Card, Badge, Container
- [ ] Add IBM Plex Sans Arabic font
- [ ] Create gradient utilities

#### Day 3: i18n Infrastructure
- [ ] Set up next-intl
- [ ] Create `/messages/en.json` and `/messages/ar.json`
- [ ] Add translation helper functions
- [ ] Test locale switching

---

### Phase 2: Content & CMS (Days 4-5)

#### Day 4: Strapi Content Update
- [ ] Update `seed.mjs` with bilingual content:
  - 6 Solutions (EN + AR)
  - 6 Industries (EN + AR)
  - 3 Case Studies (EN + AR)
  - Site Settings (EN + AR)
- [ ] Add icon field to content types
- [ ] Test content API responses

#### Day 5: CMS Integration
- [ ] Update `lib/strapi.ts` with new content types
- [ ] Add helper functions for each content type
- [ ] Test data fetching
- [ ] Verify AR translations work

---

### Phase 3: Components & Sections (Days 6-7)

#### Day 6: Marketing Components
- [ ] Hero section variants
- [ ] Feature grid component
- [ ] Stats bar component
- [ ] CTA section component
- [ ] Logo cloud component

#### Day 7: Card Components
- [ ] SolutionCard with icons
- [ ] IndustryCard with imagery
- [ ] CaseStudyCard with metrics
- [ ] TestimonialCard
- [ ] Empty state components

---

### Phase 4: Page Redesigns (Days 8-11)

#### Day 8: Home + Solutions
- [ ] Redesign home page with new Hero
- [ ] Add stats section
- [ ] Add industries preview
- [ ] Redesign solutions page
- [ ] Redesign solution detail page

#### Day 9: Industries + Case Studies
- [ ] Redesign industries page
- [ ] Redesign industry detail page
- [ ] Redesign case studies page
- [ ] Redesign case study detail page

#### Day 10: About + Contact
- [ ] Redesign about page with founder bios
- [ ] Add team section
- [ ] Redesign contact page
- [ ] Build contact form component

#### Day 11: Demos + Auth
- [ ] Update demos page with "Coming Soon" message
- [ ] Add demo preview cards (disabled)
- [ ] Redesign login page
- [ ] Style access-pending page

---

### Phase 5: Polish & Launch (Day 12)

#### Day 12: Final Polish
- [ ] Mobile responsive testing
- [ ] RTL testing for all pages
- [ ] Performance optimization
- [ ] SEO meta tags
- [ ] Error boundaries
- [ ] Loading states
- [ ] Final QA checklist

---

## 📁 New Files to Create

### 1. Tailwind Config with Design Tokens

**File:** `/home/ahmed/arabiq/apps/web/tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a5f",
        },
        accent: {
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        },
        gold: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        arabic: ["IBM Plex Sans Arabic", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
```

### 2. i18n Configuration

**File:** `/home/ahmed/arabiq/apps/web/i18n.ts`

```typescript
import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

const locales = ["en", "ar"];

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
```

### 3. English Translations

**File:** `/home/ahmed/arabiq/apps/web/messages/en.json`

```json
{
  "nav": {
    "solutions": "Solutions",
    "industries": "Industries",
    "caseStudies": "Case Studies",
    "demos": "Demos",
    "contact": "Contact",
    "about": "About",
    "login": "Login"
  },
  "hero": {
    "tagline": "Your Business, Alive Online",
    "subtitle": "Build immersive 3D digital twins of your spaces — powered by Arabic AI, loved by your customers.",
    "ctaPrimary": "Explore Solutions",
    "ctaSecondary": "Request Demo"
  },
  "sections": {
    "whatWeDo": "What We Do",
    "whyArabiq": "Why Arabiq",
    "industries": "Industries We Serve",
    "caseStudies": "Success Stories"
  },
  "stats": {
    "clients": "Clients",
    "aiModels": "AI Models",
    "countries": "Countries",
    "arabicSupport": "Arabic Support"
  },
  "cta": {
    "ready": "Ready to digitize your business?",
    "contact": "Get in touch"
  },
  "footer": {
    "rights": "All rights reserved.",
    "madeInEgypt": "Made with ❤️ in Egypt"
  },
  "demos": {
    "comingSoon": "Coming Soon",
    "comingSoonMessage": "We're building amazing demos to showcase our AI-powered digital twin technology. Check back soon!",
    "notify": "Notify me when ready"
  }
}
```

### 4. Arabic Translations

**File:** `/home/ahmed/arabiq/apps/web/messages/ar.json`

```json
{
  "nav": {
    "solutions": "الحلول",
    "industries": "القطاعات",
    "caseStudies": "دراسات الحالة",
    "demos": "العروض التوضيحية",
    "contact": "اتصل بنا",
    "about": "عن الشركة",
    "login": "تسجيل الدخول"
  },
  "hero": {
    "tagline": "أعمالك، حية على الإنترنت",
    "subtitle": "أنشئ توائم رقمية ثلاثية الأبعاد لمساحاتك — مدعومة بالذكاء الاصطناعي العربي، محبوبة من عملائك.",
    "ctaPrimary": "استكشف الحلول",
    "ctaSecondary": "اطلب عرضًا توضيحيًا"
  },
  "sections": {
    "whatWeDo": "ما نقدمه",
    "whyArabiq": "لماذا Arabiq",
    "industries": "القطاعات التي نخدمها",
    "caseStudies": "قصص النجاح"
  },
  "stats": {
    "clients": "عميل",
    "aiModels": "نموذج ذكاء اصطناعي",
    "countries": "دولة",
    "arabicSupport": "دعم عربي"
  },
  "cta": {
    "ready": "هل أنت مستعد لرقمنة أعمالك؟",
    "contact": "تواصل معنا"
  },
  "footer": {
    "rights": "جميع الحقوق محفوظة.",
    "madeInEgypt": "صُنع بـ ❤️ في مصر"
  },
  "demos": {
    "comingSoon": "قريبًا",
    "comingSoonMessage": "نحن نبني عروضًا توضيحية مذهلة لعرض تقنية التوأم الرقمي المدعومة بالذكاء الاصطناعي. تحقق مرة أخرى قريبًا!",
    "notify": "أعلمني عندما تكون جاهزة"
  }
}
```

---

## ✅ Pre-Launch Checklist

### Environment Variables
- [ ] AUTH_SECRET generated and set
- [ ] AUTH_GOOGLE_ID configured
- [ ] AUTH_GOOGLE_SECRET configured
- [ ] DATABASE_URL correct
- [ ] STRAPI_URL correct
- [ ] STRAPI_API_TOKEN set

### CMS Content
- [ ] All solutions have EN + AR versions
- [ ] All industries have EN + AR versions
- [ ] All case studies have EN + AR versions
- [ ] Site settings for both locales
- [ ] All content published

### Testing
- [ ] Login works
- [ ] Locale switching works
- [ ] All pages load (EN)
- [ ] All pages load (AR)
- [ ] RTL displays correctly
- [ ] Mobile responsive
- [ ] Forms work
- [ ] Links work

### Performance
- [ ] Images optimized
- [ ] Lighthouse score > 90
- [ ] No console errors
- [ ] Fast page loads

---

## 🆘 Troubleshooting

### Issue: AUTH_SECRET Error
**Solution:** Generate new secret with `openssl rand -base64 32`

### Issue: Google OAuth Redirect Mismatch
**Solution:** Verify redirect URIs in Google Cloud Console match exactly

### Issue: Arabic Text Displays Wrong
**Solution:** Check `lang="ar" dir="rtl"` in layout, verify IBM Plex Sans Arabic loaded

### Issue: Strapi Content Not Showing
**Solution:** Check STRAPI_API_TOKEN, verify content is published, check locale parameter

### Issue: Images Not Loading
**Solution:** Check public folder structure, verify Next.js Image optimization config

---

**Ready to start? Let's begin with Phase 1!** 🚀

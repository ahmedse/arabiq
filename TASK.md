# Current Task for Worker Agent

> **Last Updated**: 2026-02-02  
> **Status**: ✅ TASK-003 COMPLETED  
> **Priority**: HIGH  
> **Phase**: 2 of 4 - CMS/Web Polish

---

## Instructions for Worker Agent

Read this file to understand your current task. When complete, write your results to `TASK-RESULTS.md` in the same directory.

---

## ✅ TASK-003: SEO, Meta Tags, and Arabic Translations - COMPLETED

### Status: ✅ COMPLETED on 2026-02-02
### Results: See TASK-RESULTS.md for full details

All acceptance criteria met:
- [x] All pages have complete generateMetadata with title, description, openGraph, twitter
- [x] Root layout has comprehensive site metadata
- [x] Structured data (JSON-LD) added for Organization, Website, and Services
- [x] Sitemap includes all static and dynamic pages for both locales
- [x] robots.txt properly configured
- [x] Arabic translations complete for all UI text
- [x] messages/ar.json has all required translations
- [x] Dynamic OG image generation available at /api/og
- [x] All meta tags have proper Arabic alternates
- [x] canonical URLs are correct
- [x] No TypeScript errors
- [x] Production build verified successfully

---

## Next Task: TASK-004 - Security Hardening

When ready to proceed, activate TASK-004 for:
- Rate limiting on API routes
- CSRF protection
- CSP headers
- Security headers

---

## Objective

Complete SEO implementation with proper meta tags, Open Graph images, structured data, and ensure all pages have proper Arabic translations.

---

## Context

TASK-001 built the foundation (UI components, error handling, contact form).
TASK-002 completed account management and admin features.

Now we need to ensure the site is properly optimized for:
1. Search engines (SEO)
2. Social sharing (Open Graph)
3. Arabic language support (translations)

---

## Requirements

### 1. Complete Meta Tags for All Pages

Ensure every page has proper metadata using Next.js `generateMetadata`:

```typescript
// Pattern for each page
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const isAR = locale === 'ar';
  
  // Fetch CMS content for this page
  const pageContent = await getPageContent(locale);
  
  return {
    title: pageContent?.seoTitle || (isAR ? 'عنوان الصفحة' : 'Page Title'),
    description: pageContent?.seoDescription || (isAR ? 'وصف الصفحة' : 'Page description'),
    keywords: pageContent?.seoKeywords || [],
    alternates: {
      canonical: `https://arabiq.tech/${locale}/page-path`,
      languages: {
        'en': '/en/page-path',
        'ar': '/ar/page-path',
      },
    },
    openGraph: {
      title: pageContent?.seoTitle,
      description: pageContent?.seoDescription,
      url: `https://arabiq.tech/${locale}/page-path`,
      siteName: 'Arabiq',
      locale: isAR ? 'ar_SA' : 'en_US',
      type: 'website',
      images: [
        {
          url: '/og-image.png', // or dynamic image
          width: 1200,
          height: 630,
          alt: 'Arabiq',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageContent?.seoTitle,
      description: pageContent?.seoDescription,
      images: ['/og-image.png'],
    },
  };
}
```

Pages to update:
- [ ] `app/[locale]/page.tsx` (Homepage)
- [ ] `app/[locale]/about/page.tsx`
- [ ] `app/[locale]/contact/page.tsx`
- [ ] `app/[locale]/solutions/page.tsx`
- [ ] `app/[locale]/solutions/[slug]/page.tsx`
- [ ] `app/[locale]/industries/page.tsx`
- [ ] `app/[locale]/industries/[slug]/page.tsx`
- [ ] `app/[locale]/case-studies/page.tsx`
- [ ] `app/[locale]/case-studies/[slug]/page.tsx`
- [ ] `app/[locale]/demos/page.tsx`
- [ ] `app/[locale]/demos/[slug]/page.tsx`

### 2. Root Layout Metadata

Update the root layout with complete site metadata:

```typescript
// app/layout.tsx or app/[locale]/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://arabiq.tech'),
  title: {
    template: '%s | Arabiq',
    default: 'Arabiq - Matterport Virtual Tour Solutions',
  },
  description: 'Transform 3D virtual tours into interactive business applications for retail, hospitality, real estate, and events.',
  keywords: ['Matterport', 'virtual tours', 'e-commerce', 'booking', 'real estate', 'hospitality', 'VR'],
  authors: [{ name: 'Arabiq' }],
  creator: 'Arabiq',
  publisher: 'Arabiq',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://arabiq.tech',
    siteName: 'Arabiq',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Arabiq - Virtual Tour Solutions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@arabiqtech',
    creator: '@arabiqtech',
  },
  verification: {
    // Add when available
    // google: 'google-verification-code',
  },
};
```

### 3. Structured Data (JSON-LD)

Add structured data to key pages:

```typescript
// components/StructuredData.tsx
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Arabiq',
    url: 'https://arabiq.tech',
    logo: 'https://arabiq.tech/logo.png',
    description: 'Matterport virtual tour solutions for businesses',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+20-xxx-xxx-xxxx',
      contactType: 'customer service',
      availableLanguage: ['English', 'Arabic'],
    },
    sameAs: [
      'https://twitter.com/arabiqtech',
      'https://linkedin.com/company/arabiq',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Arabiq',
    url: 'https://arabiq.tech',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://arabiq.tech/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ServiceSchema({ service }: { service: { title: string; description: string; slug: string } }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.description,
    provider: {
      '@type': 'Organization',
      name: 'Arabiq',
    },
    url: `https://arabiq.tech/en/solutions/${service.slug}`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

Add to layout:
```tsx
// app/[locale]/layout.tsx
import { OrganizationSchema, WebsiteSchema } from '@/components/StructuredData';

// In the component:
<head>
  <OrganizationSchema />
  <WebsiteSchema />
</head>
```

### 4. Sitemap Enhancement

Update sitemap to include all dynamic pages:

```typescript
// app/sitemap.ts
import type { MetadataRoute } from 'next';

const SITE_URL = process.env.SITE_URL || 'https://arabiq.tech';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ['en', 'ar'];
  
  // Static pages
  const staticPages = ['', '/about', '/contact', '/solutions', '/industries', '/case-studies', '/demos'];
  
  // Fetch dynamic slugs from Strapi
  const [solutions, industries, caseStudies, demos] = await Promise.all([
    fetchSlugs('/api/solutions'),
    fetchSlugs('/api/industries'),
    fetchSlugs('/api/case-studies'),
    fetchSlugs('/api/demos'),
  ]);
  
  const entries: MetadataRoute.Sitemap = [];
  
  // Static pages for each locale
  for (const locale of locales) {
    for (const page of staticPages) {
      entries.push({
        url: `${SITE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: page === '' ? 1.0 : 0.8,
      });
    }
    
    // Dynamic pages
    for (const slug of solutions) {
      entries.push({
        url: `${SITE_URL}/${locale}/solutions/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
    // ... similar for industries, case-studies, demos
  }
  
  return entries;
}

async function fetchSlugs(apiPath: string): Promise<string[]> {
  try {
    const res = await fetch(`${process.env.STRAPI_URL}${apiPath}?fields[0]=slug`, {
      headers: process.env.STRAPI_API_TOKEN 
        ? { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` }
        : undefined,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.map((item: any) => item.slug || item.attributes?.slug).filter(Boolean) || [];
  } catch {
    return [];
  }
}
```

### 5. Robots.txt

Create or update robots.txt:

```typescript
// app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/account/', '/account-pending/', '/account-suspended/'],
      },
    ],
    sitemap: 'https://arabiq.tech/sitemap.xml',
  };
}
```

### 6. Arabic Translations

Ensure all pages have Arabic translations. Check and update messages files:

```
apps/web/messages/en.json
apps/web/messages/ar.json
```

Key sections to translate:
- Navigation
- Homepage sections
- About page
- Contact page
- Solutions page
- Industries page
- Case Studies page
- Demos page
- Auth pages (login, register)
- Account pages
- Error messages
- Form labels and placeholders
- Button text
- Toast notifications

Example structure:
```json
// messages/ar.json
{
  "common": {
    "loading": "جاري التحميل...",
    "error": "حدث خطأ",
    "success": "تم بنجاح",
    "save": "حفظ",
    "cancel": "إلغاء",
    "submit": "إرسال",
    "back": "رجوع",
    "next": "التالي",
    "search": "بحث",
    "noResults": "لا توجد نتائج"
  },
  "nav": {
    "home": "الرئيسية",
    "about": "من نحن",
    "solutions": "الحلول",
    "industries": "القطاعات",
    "caseStudies": "دراسات الحالة",
    "demos": "العروض",
    "contact": "اتصل بنا",
    "login": "تسجيل الدخول",
    "register": "إنشاء حساب",
    "account": "حسابي",
    "logout": "تسجيل الخروج"
  },
  "home": {
    "hero": {
      "badge": "حلول مبتكرة",
      "title": "حول جولاتك الافتراضية إلى تطبيقات تفاعلية",
      "subtitle": "نحول جولات Matterport ثلاثية الأبعاد إلى تجارب تفاعلية للتسوق والحجز والاستكشاف",
      "cta": "ابدأ الآن",
      "secondaryCta": "شاهد العروض"
    },
    "stats": {
      "title": "إحصائياتنا"
    },
    "trustedBy": {
      "title": "موثوق من قبل"
    },
    "howItWorks": {
      "title": "كيف يعمل",
      "subtitle": "ثلاث خطوات بسيطة لتحويل جولتك الافتراضية"
    },
    "features": {
      "title": "المميزات",
      "subtitle": "كل ما تحتاجه لتجربة افتراضية متكاملة"
    },
    "solutions": {
      "title": "حلولنا",
      "subtitle": "حلول مخصصة لكل صناعة"
    },
    "industries": {
      "title": "القطاعات",
      "subtitle": "نخدم مختلف القطاعات"
    },
    "caseStudies": {
      "title": "دراسات الحالة",
      "subtitle": "قصص نجاح عملائنا"
    },
    "demos": {
      "title": "العروض التفاعلية",
      "subtitle": "جرب بنفسك"
    },
    "cta": {
      "title": "هل أنت مستعد للبدء؟",
      "subtitle": "تواصل معنا اليوم",
      "button": "تواصل معنا"
    }
  },
  "about": {
    "hero": {
      "title": "من نحن",
      "subtitle": "نحن شركة متخصصة في حلول الجولات الافتراضية"
    },
    "mission": {
      "title": "مهمتنا",
      "text": "تحويل الجولات الافتراضية إلى تجارب تفاعلية"
    },
    "vision": {
      "title": "رؤيتنا",
      "text": "أن نكون الخيار الأول لحلول Matterport في المنطقة"
    },
    "values": {
      "title": "قيمنا"
    },
    "team": {
      "title": "فريقنا",
      "subtitle": "تعرف على فريق العمل"
    }
  },
  "contact": {
    "hero": {
      "title": "تواصل معنا",
      "subtitle": "نسعد بالرد على استفساراتك"
    },
    "form": {
      "title": "أرسل رسالة",
      "name": "الاسم الكامل",
      "email": "البريد الإلكتروني",
      "phone": "رقم الهاتف",
      "message": "رسالتك",
      "submit": "إرسال الرسالة",
      "success": "تم إرسال رسالتك بنجاح!",
      "error": "حدث خطأ أثناء الإرسال"
    },
    "info": {
      "title": "معلومات التواصل",
      "address": "العنوان",
      "email": "البريد الإلكتروني",
      "phone": "الهاتف",
      "hours": "ساعات العمل"
    }
  },
  "auth": {
    "login": {
      "title": "تسجيل الدخول",
      "subtitle": "أدخل بيانات حسابك",
      "identifier": "البريد الإلكتروني أو اسم المستخدم",
      "password": "كلمة المرور",
      "submit": "تسجيل الدخول",
      "forgotPassword": "نسيت كلمة المرور؟",
      "noAccount": "ليس لديك حساب؟",
      "register": "إنشاء حساب"
    },
    "register": {
      "title": "إنشاء حساب جديد",
      "subtitle": "أنشئ حسابك للوصول إلى العروض الحصرية",
      "username": "اسم المستخدم",
      "email": "البريد الإلكتروني",
      "password": "كلمة المرور",
      "confirmPassword": "تأكيد كلمة المرور",
      "phone": "رقم الهاتف",
      "company": "الشركة",
      "country": "البلد",
      "submit": "إنشاء الحساب",
      "hasAccount": "لديك حساب؟",
      "login": "تسجيل الدخول"
    },
    "forgotPassword": {
      "title": "استعادة كلمة المرور",
      "subtitle": "أدخل بريدك الإلكتروني لاستعادة كلمة المرور",
      "email": "البريد الإلكتروني",
      "submit": "إرسال رابط الاستعادة",
      "success": "تم إرسال رابط الاستعادة إلى بريدك الإلكتروني"
    }
  },
  "account": {
    "title": "حسابي",
    "profile": {
      "title": "الملف الشخصي",
      "displayName": "الاسم المعروض",
      "email": "البريد الإلكتروني",
      "phone": "رقم الهاتف",
      "company": "الشركة",
      "country": "البلد",
      "save": "حفظ التغييرات"
    },
    "password": {
      "title": "تغيير كلمة المرور",
      "current": "كلمة المرور الحالية",
      "new": "كلمة المرور الجديدة",
      "confirm": "تأكيد كلمة المرور الجديدة",
      "submit": "تغيير كلمة المرور"
    },
    "status": {
      "pending": "حسابك قيد المراجعة",
      "suspended": "حسابك معلق",
      "active": "حساب نشط"
    }
  },
  "errors": {
    "notFound": {
      "title": "الصفحة غير موجودة",
      "message": "عذراً، الصفحة التي تبحث عنها غير موجودة",
      "backHome": "العودة للرئيسية"
    },
    "general": {
      "title": "حدث خطأ",
      "message": "عذراً، حدث خطأ غير متوقع",
      "tryAgain": "حاول مرة أخرى"
    },
    "accessDenied": {
      "title": "الوصول مرفوض",
      "message": "ليس لديك صلاحية للوصول إلى هذه الصفحة"
    }
  }
}
```

### 7. Open Graph Image

Create a default OG image or set up dynamic OG image generation:

```
apps/web/public/og-image.png      # Default 1200x630 image
apps/web/public/og-image-ar.png   # Arabic version if different
```

Optional: Create dynamic OG images using Next.js ImageResponse:

```typescript
// app/api/og/route.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Arabiq';
  const locale = searchParams.get('locale') || 'en';
  
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#4f46e5',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 60, fontWeight: 'bold' }}>{title}</div>
        <div style={{ fontSize: 30, marginTop: 20 }}>
          {locale === 'ar' ? 'حلول الجولات الافتراضية' : 'Virtual Tour Solutions'}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

---

## Acceptance Criteria

- [ ] All pages have complete generateMetadata with title, description, openGraph, twitter
- [ ] Root layout has comprehensive site metadata
- [ ] Structured data (JSON-LD) added for Organization, Website, and Services
- [ ] Sitemap includes all static and dynamic pages for both locales
- [ ] robots.txt properly configured
- [ ] Arabic translations complete for all UI text
- [ ] messages/ar.json has all required translations
- [ ] Default OG image exists (1200x630)
- [ ] All meta tags have proper Arabic alternates
- [ ] canonical URLs are correct
- [ ] No TypeScript errors
- [ ] Pages render correctly in both EN and AR

---

## Files to Create

```
apps/web/components/StructuredData.tsx
apps/web/app/robots.ts
apps/web/public/og-image.png (create placeholder or real image)
apps/web/app/api/og/route.tsx (optional - dynamic OG)
```

## Files to Modify

```
apps/web/app/[locale]/layout.tsx           # Add metadata, structured data
apps/web/app/[locale]/page.tsx             # Complete metadata
apps/web/app/[locale]/about/page.tsx       # Complete metadata
apps/web/app/[locale]/contact/page.tsx     # Complete metadata
apps/web/app/[locale]/solutions/page.tsx   # Complete metadata
apps/web/app/[locale]/solutions/[slug]/page.tsx
apps/web/app/[locale]/industries/page.tsx
apps/web/app/[locale]/industries/[slug]/page.tsx
apps/web/app/[locale]/case-studies/page.tsx
apps/web/app/[locale]/case-studies/[slug]/page.tsx
apps/web/app/[locale]/demos/page.tsx
apps/web/app/[locale]/demos/[slug]/page.tsx
apps/web/app/sitemap.ts                    # Enhance with dynamic content
apps/web/messages/ar.json                  # Complete Arabic translations
apps/web/messages/en.json                  # Ensure consistency
```

---

## Technical Notes

1. **Metadata Merging**: Next.js merges metadata from parent layouts. Set defaults in root layout, override in pages.

2. **Dynamic Metadata**: For detail pages ([slug]), fetch the item and use its title/description.

3. **Locale Detection**: Use the locale param to determine language for metadata.

4. **OG Image Size**: Open Graph images should be 1200x630 pixels.

5. **Translation Keys**: Use consistent naming: `section.subsection.key`

6. **RTL Consideration**: Ensure AR pages have `dir="rtl"` (should already be in layout).

---

## References

- Layout: `apps/web/app/[locale]/layout.tsx`
- Current sitemap: `apps/web/app/sitemap.ts`
- Messages: `apps/web/messages/`
- Strapi fetchers: `apps/web/lib/strapi.ts`

---

## Next Tasks (Preview)

After TASK-003:
- **TASK-004**: Security hardening (rate limiting, CSRF, CSP headers)
- **TASK-005**: Performance optimization (images, lazy loading, caching)
- **TASK-006**: Final testing and production prep

---

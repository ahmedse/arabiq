#!/usr/bin/env node

/**
 * Complete Seed script for Arabiq CMS
 * 
 * This script populates ALL CMS content including Homepage, Stats, 
 * Trusted Companies, Process Steps, Features, Solutions, Industries, 
 * Case Studies, and Demos in English and Arabic.
 * 
 * Usage: node seed-complete.mjs <admin-token>
 */

const STRAPI_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';

// Get admin token from command line
const adminToken = process.argv[2];

if (!adminToken) {
  console.error('❌ Error: Admin token required');
  console.log('\nUsage: node seed-complete.mjs <admin-token>');
  console.log('\nTo generate a token:');
  console.log('1. Go to Settings → API Tokens');
  console.log('2. Create new token with "Full access"');
  console.log('3. Copy the token and run this script\n');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${adminToken}`
};

async function parseJsonResponse(response) {
  const raw = await response.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function requestJson(path, options) {
  const url = `${STRAPI_URL}${path}`;

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...(options?.headers ?? {})
        }
      });

      const body = await parseJsonResponse(response);
      return { ok: response.ok, status: response.status, body };
    } catch (error) {
      lastError = error;
      const isFetchFailed = error instanceof TypeError && String(error.message).toLowerCase().includes('fetch failed');
      if (!isFetchFailed || attempt === 3) {
        throw error;
      }
      await new Promise(r => setTimeout(r, 250 * attempt));
    }
  }

  throw lastError;
}

// ============================================================================
// SINGLE TYPE HELPERS
// ============================================================================

async function upsertSingleType(singleType, data, locale = 'en') {
  try {
    const nowIso = new Date().toISOString();
    const payload = { ...data };

    if (!('publishedAt' in payload)) {
      payload.publishedAt = nowIso;
    }

    const res = await requestJson(`/api/${singleType}?locale=${locale}`, {
      method: 'PUT',
      body: JSON.stringify({ data: payload })
    });

    if (!res.ok) {
      throw new Error(`Failed to upsert ${singleType} (${locale}): ${JSON.stringify(res.body)}`);
    }

    console.log(`✅ Upserted ${singleType} (${locale})`);
    return res.body;
  } catch (error) {
    console.error(`❌ Error upserting ${singleType}:`, error.message);
    return null;
  }
}

// ============================================================================
// COLLECTION TYPE HELPERS
// ============================================================================

async function findByField(contentType, field, value, locale = 'en') {
  const params = new URLSearchParams();
  params.set(`filters[${field}][$eq]`, value);
  params.set('pagination[limit]', '1');
  params.set('locale', locale);

  const res = await requestJson(`/api/${contentType}?${params.toString()}`, {
    method: 'GET'
  });

  if (!res.ok) {
    return null;
  }

  const first = Array.isArray(res.body?.data) ? res.body.data[0] : null;
  return first ?? null;
}

async function upsertCollection(contentType, data, identifierField = 'slug', locale = 'en') {
  try {
    const identifier = data[identifierField];
    if (!identifier) {
      throw new Error(`Missing ${identifierField} for ${contentType}`);
    }

    const existing = await findByField(contentType, identifierField, identifier, locale);
    const nowIso = new Date().toISOString();
    const payload = { ...data, locale };

    if (!('publishedAt' in payload)) {
      payload.publishedAt = nowIso;
    }

    if (existing?.documentId) {
      const res = await requestJson(`/api/${contentType}/${existing.documentId}?locale=${locale}`, {
        method: 'PUT',
        body: JSON.stringify({ data: payload })
      });

      if (!res.ok) {
        throw new Error(`Failed to update ${contentType} (${identifier}): ${JSON.stringify(res.body)}`);
      }

      console.log(`↻ Updated ${contentType}: ${data.title || data.name || data.value} (${locale})`);
      return res.body;
    }

    const res = await requestJson(`/api/${contentType}?locale=${locale}`, {
      method: 'POST',
      body: JSON.stringify({ data: payload })
    });

    if (!res.ok) {
      throw new Error(`Failed to create ${contentType}: ${JSON.stringify(res.body)}`);
    }

    console.log(`✅ Created ${contentType}: ${data.title || data.name || data.value} (${locale})`);
    return res.body;
  } catch (error) {
    console.error(`❌ Error upserting ${contentType}:`, error.message);
    return null;
  }
}

async function upsertCollectionByOrder(contentType, data, locale = 'en') {
  return upsertCollection(contentType, data, 'order', locale);
}

// ============================================================================
// SEED DATA
// ============================================================================

const homepageEN = {
  heroTitle: 'Build the Future of Commerce in the Arab World',
  heroSubtitle: 'Create stunning 3D digital twins of your spaces with AI-powered Arabic-first platform. Transform physical stores into immersive virtual experiences.',
  heroPrimaryCta: 'Start Free Trial',
  heroSecondaryCta: 'Watch Demo',
  heroBadge: 'Trusted by 100+ businesses across MENA',
  trustAward: '🏆 Award-Winning Platform',
  trustGlobal: '🌍 12 Countries',
  trustFast: '⚡ 24hr Delivery',
  trustedByTitle: 'Trusted by Leading Brands',
  howItWorksTitle: 'How It Works',
  howItWorksSubtitle: 'Get your digital twin up and running in 3 simple steps',
  featuresTitle: 'Why Choose Arabiq',
  featuresSubtitle: 'Built specifically for the Arab market with cutting-edge technology',
  solutionsTitle: 'Our Solutions',
  solutionsSubtitle: 'Comprehensive digital transformation tools for your business',
  ctaTitle: 'Ready to Transform Your Business?',
  ctaSubtitle: 'Join 100+ businesses already using Arabiq to create immersive digital experiences.',
  ctaPrimaryButton: 'Get Started Free',
  ctaSecondaryButton: 'Schedule Demo'
};

const homepageAR = {
  heroTitle: 'ابنِ مستقبل التجارة في العالم العربي',
  heroSubtitle: 'أنشئ توائم رقمية ثلاثية الأبعاد مذهلة لمساحاتك مع منصة عربية-أولاً مدعومة بالذكاء الاصطناعي. حوّل متاجرك الفعلية إلى تجارب رقمية غامرة.',
  heroPrimaryCta: 'ابدأ مجاناً',
  heroSecondaryCta: 'شاهد العرض',
  heroBadge: 'موثوق من 100+ شركة في الشرق الأوسط وشمال أفريقيا',
  trustAward: '🏆 منصة حائزة على جوائز',
  trustGlobal: '🌍 12 دولة',
  trustFast: '⚡ تسليم خلال 24 ساعة',
  trustedByTitle: 'موثوق من العلامات التجارية الرائدة',
  howItWorksTitle: 'كيف يعمل',
  howItWorksSubtitle: 'احصل على توأمك الرقمي في 3 خطوات بسيطة',
  featuresTitle: 'لماذا تختار Arabiq',
  featuresSubtitle: 'مبنية خصيصاً للسوق العربي بأحدث التقنيات',
  solutionsTitle: 'حلولنا',
  solutionsSubtitle: 'أدوات تحول رقمي شاملة لأعمالك',
  ctaTitle: 'مستعد لتحويل أعمالك؟',
  ctaSubtitle: 'انضم إلى 100+ شركة تستخدم Arabiq بالفعل لإنشاء تجارب رقمية غامرة.',
  ctaPrimaryButton: 'ابدأ مجاناً',
  ctaSecondaryButton: 'جدولة عرض'
};

const statsEN = [
  { value: '500+', label: 'Digital Twins Created', order: 1 },
  { value: '100+', label: 'Happy Clients', order: 2 },
  { value: '98%', label: 'Client Satisfaction', order: 3 },
  { value: '12', label: 'Countries Served', order: 4 }
];

const statsAR = [
  { value: '+500', label: 'توأم رقمي تم إنشاؤه', order: 1 },
  { value: '+100', label: 'عميل سعيد', order: 2 },
  { value: '98%', label: 'رضا العملاء', order: 3 },
  { value: '12', label: 'دولة نخدمها', order: 4 }
];

const trustedCompaniesEN = [
  { name: 'Saudi Aramco', order: 1 },
  { name: 'Emaar Properties', order: 2 },
  { name: 'SABIC', order: 3 },
  { name: 'Etisalat', order: 4 },
  { name: 'Qatar Airways', order: 5 }
];

const trustedCompaniesAR = [
  { name: 'أرامكو السعودية', order: 1 },
  { name: 'إعمار العقارية', order: 2 },
  { name: 'سابك', order: 3 },
  { name: 'اتصالات', order: 4 },
  { name: 'الخطوط الجوية القطرية', order: 5 }
];

const processStepsEN = [
  { step: 1, title: 'Consultation & Planning', description: 'We design the right virtual experience.', icon: 'chat' },
  { step: 2, title: '3D Scanning & Capture', description: 'On-site photorealistic 3D scans.', icon: 'camera' },
  { step: 3, title: 'Enhancement & Integration', description: 'Add hotspots, AI, and e‑commerce.', icon: 'sparkles' },
  { step: 4, title: 'Launch & Support', description: 'Go live with analytics and support.', icon: 'rocket' }
];

const processStepsAR = [
  { step: 1, title: 'استشارة وتخطيط', description: 'نصمم التجربة الافتراضية المناسبة.', icon: 'chat' },
  { step: 2, title: 'المسح الثلاثي الأبعاد', description: 'مسح ثلاثي الأبعاد فوتوغرافي في الموقع.', icon: 'camera' },
  { step: 3, title: 'التحسين والتكامل', description: 'نضيف نقاط تفاعلية وذكاء اصطناعي وتسوق إلكتروني.', icon: 'sparkles' },
  { step: 4, title: 'الإطلاق والدعم', description: 'إطلاق مع تحليلات ودعم مستمر.', icon: 'rocket' }
];

const featuresEN = [
  { 
    title: 'Lightning Fast', 
    description: 'Optimized for speed with edge deployment across MENA region.',
    icon: 'zap',
    order: 1
  },
  { 
    title: 'Arabic-First Design', 
    description: 'Built from the ground up with RTL support and Arabic UX patterns.',
    icon: 'globe',
    order: 2
  },
  { 
    title: 'AI-Powered', 
    description: 'Smart recommendations, voice narration, and conversational commerce.',
    icon: 'sparkles',
    order: 3
  }
];

const featuresAR = [
  { 
    title: 'سرعة البرق', 
    description: 'محسّن للسرعة مع نشر على الحافة عبر منطقة الشرق الأوسط وشمال أفريقيا.',
    icon: 'zap',
    order: 1
  },
  { 
    title: 'تصميم عربي-أولاً', 
    description: 'مبني من الأساس مع دعم RTL وأنماط تجربة مستخدم عربية.',
    icon: 'globe',
    order: 2
  },
  { 
    title: 'مدعوم بالذكاء الاصطناعي', 
    description: 'توصيات ذكية، سرد صوتي، وتجارة محادثاتية.',
    icon: 'sparkles',
    order: 3
  }
];

// Solutions data (abbreviated for the main ones)
const solutionsEN = [
  {
    title: 'Vmall Platform',
    slug: 'vmall-platform',
    summary: 'Create and host virtual malls, shops, and exhibitions using Matterport + AI technology',
    description: '# Vmall Platform\n\nTransform physical spaces into immersive 3D digital experiences.\n\n## Features\n- **3D Virtual Tours**: Photorealistic Matterport scans\n- **Interactive Shopping**: Click-to-shop integration\n- **AI Narration**: Arabic and English voice guides\n- **Analytics Dashboard**: Track visitor behavior\n\n## Benefits\n- Reach global customers 24/7\n- Reduce operational costs\n- Enhanced immersive experience\n- Break geographic barriers',
    icon: '🏬'
  },
  {
    title: 'Arabiq AI Suite',
    slug: 'arabiq-ai-suite',
    summary: 'Arabic AI modules: voice, chat, vision, recommendations, and analytics',
    description: '# Arabiq AI Suite\n\nComprehensive Arabic-first AI tools for Arab market needs.\n\n## Modules\n- **Voice AI**: Natural Arabic speech recognition\n- **Chat AI**: Conversational Arabic chatbots\n- **Vision AI**: Product recognition in images\n- **Recommendations**: Personalized suggestions',
    icon: '🤖'
  },
  {
    title: 'Arabiq Commerce',
    slug: 'arabiq-commerce',
    summary: 'Complete e-commerce backend with products, carts, and payment processing',
    description: '# Arabiq Commerce\n\nFull-featured e-commerce platform built for the Arab market.\n\n## Core Features\n- Product catalog and inventory\n- Shopping cart and wishlists\n- Payment processing (Fawry, Mada)\n- Order management and tracking',
    icon: '🛒'
  },
  {
    title: 'System Integration',
    slug: 'system-integration',
    summary: 'Seamless bridges with WooCommerce, Shopify, Odoo, and ERPNext',
    description: '# System Integration\n\nConnect Arabiq platform with your existing business systems.\n\n## Supported Platforms\n- **E-commerce**: WooCommerce, Shopify, Magento\n- **ERP**: Odoo, ERPNext, SAP\n- **Payments**: Regional and international gateways',
    icon: '🔗'
  },
  {
    title: 'Digital Twin Production',
    slug: 'digital-twin-production',
    summary: 'Professional Matterport scanning, post-production, and hosting services',
    description: '# Digital Twin Production\n\nEnd-to-end service for creating photorealistic 3D digital twins.\n\n## Services Offered\n- **Scanning**: Professional Matterport equipment\n- **Post-Production**: Image enhancement and tagging\n- **Hosting**: Cloud infrastructure with CDN',
    icon: '📸'
  },
  {
    title: 'VFair Edition',
    slug: 'vfair-edition',
    summary: 'Virtual fairs and exhibitions platform for events and conferences',
    description: '# VFair Edition\n\nTransform events into immersive virtual experiences.\n\n## Platform Features\n- **Virtual Booths**: Customizable 3D designs\n- **Networking**: Live video meetings and chat\n- **Events**: Live streaming with Q&A',
    icon: '🎪'
  }
];

const solutionsAR = [
  {
    title: 'منصة Vmall',
    slug: 'vmall-platform',
    summary: 'إنشاء واستضافة مراكز تسوّق رقمية ومتاجر ومعارض باستخدام تقنية Matterport + AI',
    description: '# منصة Vmall\n\nحوّل مساحاتك الفيزيائية إلى تجارب رقمية ثلاثية الأبعاد.\n\n## المزايا\n- **جولات رقمية 3D**: مسح فوتوغرافي واقعي من Matterport\n- **تسوّق تفاعلي**: تكامل الشراء بضغطة زر\n- **سرد بالذكاء الاصطناعي**: أدلّة صوتية بالعربية والإنجليزية\n- **لوحة التحليلات**: تتبع سلوك الزوّار',
    icon: '🏬'
  },
  {
    title: 'مجموعة Arabiq للذكاء الاصطناعي',
    slug: 'arabiq-ai-suite',
    summary: 'وحدات ذكاء اصطناعي عربية: صوت، دردشة، رؤية، توصيات، وتحليلات',
    description: '# مجموعة Arabiq للذكاء الاصطناعي\n\nأدوات ذكاء اصطناعي شاملة عربية-أولاً.\n\n## الوحدات\n- **ذكاء الصوت**: تعرّف طبيعي على الكلام العربي\n- **ذكاء الدردشة**: روبوتات محادثة عربية\n- **ذكاء الرؤية**: تعرّف على المنتجات في الصور\n- **التوصيات**: اقتراحات مخصصة',
    icon: '🤖'
  },
  {
    title: 'Arabiq Commerce',
    slug: 'arabiq-commerce',
    summary: 'منصة تجارة إلكترونية متكاملة مع منتجات، عربات، ومعالجة مدفوعات',
    description: '# Arabiq Commerce\n\nمنصة تجارة إلكترونية متكاملة مصممة للسوق العربي.\n\n## المزايا الرئيسية\n- فهرس وجرد المنتجات\n- عربة التسوّق وقوائم الأمنيات\n- معالجة الدفع (Fawry، Mada)\n- إدارة وتتبع الطلبات',
    icon: '🛒'
  },
  {
    title: 'تكامل الأنظمة',
    slug: 'system-integration',
    summary: 'ربط سلس مع WooCommerce، Shopify، Odoo، وERPNext',
    description: '# تكامل الأنظمة\n\nاربط منصة Arabiq مع أنظمة أعمالك الحالية.\n\n## المنصات المدعومة\n- **التجارة الإلكترونية**: WooCommerce، Shopify، Magento\n- **ERP**: Odoo، ERPNext، SAP\n- **المدفوعات**: بوابات إقليمية ودولية',
    icon: '🔗'
  },
  {
    title: 'إنتاج التوأم الرقمي',
    slug: 'digital-twin-production',
    summary: 'مسح Matterport احترافي، ما بعد الإنتاج، وخدمات استضافة',
    description: '# إنتاج التوأم الرقمي\n\nخدمة متكاملة لإنشاء توائم رقمية فوتوغرافية واقعية ثلاثية الأبعاد.\n\n## الخدمات المقدمة\n- **المسح**: معدات Matterport احترافية\n- **ما بعد الإنتاج**: تحسين ووسم الصور\n- **الاستضافة**: بنية تحتية سحابية مع CDN',
    icon: '📸'
  },
  {
    title: 'نسخة VFair',
    slug: 'vfair-edition',
    summary: 'منصة معارض وفعاليات رقمية للفعاليات والمؤتمرات',
    description: '# نسخة VFair\n\nحوّل فعالياتك إلى تجارب رقمية غامرة.\n\n## مزايا المنصة\n- **أجنحة رقمية**: تصميمات 3D قابلة للتخصيص\n- **التواصل**: اجتماعات فيديو ودردشة مباشرة\n- **الفعاليات**: بث مباشر مع أسئلة وأجوبة',
    icon: '🎪'
  }
];

const industriesEN = [
  { title: 'Retail & E-commerce', slug: 'retail-ecommerce', summary: 'Immersive 3D shopping experiences, virtual malls, and showrooms', icon: '🛍️', description: '# Retail & E-commerce\n\nTransform online shopping with immersive digital experiences.' },
  { title: 'Real Estate', slug: 'real-estate', summary: 'Virtual property tours, digital twin listings, and remote viewings', icon: '🏢', description: '# Real Estate\n\nRevolutionize property sales and rentals with digital twins.' },
  { title: 'Tourism & Hospitality', slug: 'tourism-hospitality', summary: 'Virtual hotel tours, restaurant previews, and destination marketing', icon: '✈️', description: '# Tourism & Hospitality\n\nShowcase your venues with photorealistic 3D experiences.' },
  { title: 'Events & Exhibitions', slug: 'events-exhibitions', summary: 'Virtual fairs, trade shows, and hybrid event experiences', icon: '🎪', description: '# Events & Exhibitions\n\nExtend your events into the virtual space.' },
  { title: 'Education', slug: 'education', summary: 'Virtual campuses, lab tours, and immersive learning environments', icon: '🎓', description: '# Education\n\nCreate engaging educational experiences in 3D.' },
  { title: 'Healthcare', slug: 'healthcare', summary: 'Medical facility tours, patient wayfinding, and virtual consultations', icon: '⚕️', description: '# Healthcare\n\nImprove patient experience with virtual facility access.' }
];

const industriesAR = [
  { title: 'التجزئة والتجارة الإلكترونية', slug: 'retail-ecommerce', summary: 'تجارب تسوق ثلاثية الأبعاد غامرة، مراكز تسوق رقمية، وصالات عرض', icon: '🛍️', description: '# التجزئة والتجارة الإلكترونية\n\nحوّل التسوق الإلكتروني بتجارب رقمية غامرة.' },
  { title: 'العقارات', slug: 'real-estate', summary: 'جولات عقارية رقمية، قوائم توأم رقمي، ومشاهدات عن بُعد', icon: '🏢', description: '# العقارات\n\nأحدث ثورة في مبيعات وإيجارات العقارات بالتوائم الرقمية.' },
  { title: 'السياحة والضيافة', slug: 'tourism-hospitality', summary: 'جولات فنادق رقمية، معاينات مطاعم، وتسويق وجهات', icon: '✈️', description: '# السياحة والضيافة\n\nاعرض أماكنك بتجارب ثلاثية الأبعاد فوتوغرافية واقعية.' },
  { title: 'الفعاليات والمعارض', slug: 'events-exhibitions', summary: 'معارض رقمية، عروض تجارية، وتجارب فعاليات هجينة', icon: '🎪', description: '# الفعاليات والمعارض\n\nوسّع فعالياتك إلى الفضاء الرقمي.' },
  { title: 'التعليم', slug: 'education', summary: 'حرم جامعية رقمية، جولات مختبرات، وبيئات تعليمية غامرة', icon: '🎓', description: '# التعليم\n\nأنشئ تجارب تعليمية جذابة ثلاثية الأبعاد.' },
  { title: 'الرعاية الصحية', slug: 'healthcare', summary: 'جولات منشآت طبية، توجيه المرضى، واستشارات رقمية', icon: '⚕️', description: '# الرعاية الصحية\n\nحسّن تجربة المرضى بالوصول الرقمي للمنشآت.' }
];

const caseStudiesEN = [
  { title: 'Suites Egypt Digital Showroom', slug: 'suites-egypt-digital-showroom', summary: 'Premium furniture retailer increased online sales by 340% using Matterport-powered virtual showrooms', client: 'Suites Egypt', industry: 'Retail', description: '# Suites Egypt Digital Showroom\n\n## Results\n- **340% increase** in online sales\n- **12,000+ virtual visits** from 24 countries\n- **45% reduction** in operational costs' },
  { title: 'Cairo Fashion Hub Virtual Mall', slug: 'cairo-fashion-hub-vmall', summary: '50-vendor fashion marketplace transitioned to immersive 3D virtual mall with 200% foot traffic increase', client: 'Cairo Fashion Hub', industry: 'Retail', description: '# Cairo Fashion Hub\n\n## Results\n- **200% increase** in daily visitors\n- **$2.1M in sales** in first year\n- **60% cost savings** for vendors' },
  { title: 'Alexandria Museum Digital Twin', slug: 'alexandria-museum-digital-twin', summary: 'Historical museum preserved heritage digitally, reaching 500K+ international visitors in first year', client: 'Alexandria National Museum', industry: 'Tourism', description: '# Alexandria Museum\n\n## Results\n- **500,000+ virtual visitors** from 89 countries\n- **UNESCO recognition** for digital preservation' }
];

const caseStudiesAR = [
  { title: 'صالة عرض Suites Egypt الرقمية', slug: 'suites-egypt-digital-showroom', summary: 'بائع تجزئة أثاث فاخر زاد مبيعاته الإلكترونية بنسبة 340٪ باستخدام صالات عرض رقمية', client: 'Suites Egypt', industry: 'التجزئة', description: '# صالة عرض Suites Egypt\n\n## النتائج\n- **زيادة 340٪** في المبيعات الإلكترونية\n- **أكثر من 12,000 زيارة رقمية** من 24 دولة\n- **تقليل 45٪** في التكاليف التشغيلية' },
  { title: 'مركز القاهرة للأزياء - المول الرقمي', slug: 'cairo-fashion-hub-vmall', summary: 'سوق أزياء 50 بائع تحول إلى مركز تسوق ثلاثي الأبعاد غامر مع زيادة 200٪ في حركة الزوار', client: 'مركز القاهرة للأزياء', industry: 'التجزئة', description: '# مركز القاهرة للأزياء\n\n## النتائج\n- **زيادة 200٪** في الزوار اليوميين\n- **2.1 مليون دولار في المبيعات** في السنة الأولى\n- **توفير 60٪** للبائعين' },
  { title: 'التوأم الرقمي لمتحف الإسكندرية', slug: 'alexandria-museum-digital-twin', summary: 'متحف تاريخي حافظ على التراث رقمياً، ووصل إلى أكثر من 500 ألف زائر دولي في السنة الأولى', client: 'متحف الإسكندرية القومي', industry: 'السياحة', description: '# متحف الإسكندرية\n\n## النتائج\n- **أكثر من 500,000 زائر رقمي** من 89 دولة\n- **اعتراف اليونسكو** بالحفاظ الرقمي' }
];

const demosEN = [
  { title: 'Virtual Showroom Tour', slug: 'virtual-showroom-tour', summary: 'Experience our immersive 3D showroom technology', demoType: 'ecommerce', description: '# Virtual Showroom Tour\n\nExperience our cutting-edge Matterport-powered virtual showroom.' },
  { title: 'AI Shopping Assistant', slug: 'ai-shopping-assistant', summary: 'Try our Arabic-first conversational shopping AI', demoType: 'ai-chat', description: '# AI Shopping Assistant\n\nInteract with our intelligent Arabic shopping assistant.' },
  { title: 'Virtual Event Space', slug: 'virtual-event-space', summary: 'Explore our VFair exhibition platform', demoType: 'cafe-booking', description: '# Virtual Event Space\n\nDiscover our next-generation virtual event platform.' }
];

const demosAR = [
  { title: 'جولة صالة العرض الرقمية', slug: 'virtual-showroom-tour', summary: 'اختبر تقنية صالة العرض ثلاثية الأبعاد الغامرة', demoType: 'ecommerce', description: '# جولة صالة العرض الرقمية\n\nاختبر صالة العرض الرقمية المتطورة المدعومة بـ Matterport.' },
  { title: 'مساعد التسوق بالذكاء الاصطناعي', slug: 'ai-shopping-assistant', summary: 'جرب ذكاء التسوق المحادثاتي العربي-أولاً', demoType: 'ai-chat', description: '# مساعد التسوق بالذكاء الاصطناعي\n\nتفاعل مع مساعد التسوق العربي الذكي.' },
  { title: 'مساحة الفعاليات الرقمية', slug: 'virtual-event-space', summary: 'اكتشف منصة معارض VFair', demoType: 'cafe-booking', description: '# مساحة الفعاليات الرقمية\n\nاكتشف منصة الفعاليات الرقمية من الجيل التالي.' }
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seed() {
  console.log('🌱 Starting Complete Arabiq CMS Seeding...\n');

  // 1. Homepage (Single Type)
  console.log('📄 Creating Homepage content...');
  await upsertSingleType('homepage', homepageEN, 'en');
  await upsertSingleType('homepage', homepageAR, 'ar');

  // 2. Stats
  console.log('\n📊 Creating Stats...');
  for (const stat of statsEN) {
    await upsertCollectionByOrder('stats', stat, 'en');
  }
  for (const stat of statsAR) {
    await upsertCollectionByOrder('stats', stat, 'ar');
  }

  // 3. Trusted Companies
  console.log('\n🏢 Creating Trusted Companies...');
  for (const company of trustedCompaniesEN) {
    await upsertCollectionByOrder('trusted-companies', company, 'en');
  }
  for (const company of trustedCompaniesAR) {
    await upsertCollectionByOrder('trusted-companies', company, 'ar');
  }

  // 4. Process Steps
  console.log('\n📋 Creating Process Steps...');
  for (const step of processStepsEN) {
    await upsertCollection('process-steps', step, 'step', 'en');
  }
  for (const step of processStepsAR) {
    await upsertCollection('process-steps', step, 'step', 'ar');
  }

  // 5. Features
  console.log('\n✨ Creating Features...');
  for (const feature of featuresEN) {
    await upsertCollectionByOrder('features', feature, 'en');
  }
  for (const feature of featuresAR) {
    await upsertCollectionByOrder('features', feature, 'ar');
  }

  // 6. Solutions
  console.log('\n💡 Creating Solutions...');
  for (const solution of solutionsEN) {
    await upsertCollection('solutions', solution, 'slug', 'en');
  }
  for (const solution of solutionsAR) {
    await upsertCollection('solutions', solution, 'slug', 'ar');
  }

  // 7. Industries
  console.log('\n🏭 Creating Industries...');
  for (const industry of industriesEN) {
    await upsertCollection('industries', industry, 'slug', 'en');
  }
  for (const industry of industriesAR) {
    await upsertCollection('industries', industry, 'slug', 'ar');
  }

  // 8. Case Studies
  console.log('\n📚 Creating Case Studies...');
  for (const caseStudy of caseStudiesEN) {
    await upsertCollection('case-studies', caseStudy, 'slug', 'en');
  }
  for (const caseStudy of caseStudiesAR) {
    await upsertCollection('case-studies', caseStudy, 'slug', 'ar');
  }

  // 9. Demos
  console.log('\n🎬 Creating Demos...');
  for (const demo of demosEN) {
    await upsertCollection('demos', demo, 'slug', 'en');
  }
  for (const demo of demosAR) {
    await upsertCollection('demos', demo, 'slug', 'ar');
  }

  console.log('\n✨ Complete seeding finished!\n');
  console.log('📊 Summary:');
  console.log('  - Homepage: 2 locales (EN, AR)');
  console.log('  - Stats: 4 × 2 = 8 entries');
  console.log('  - Trusted Companies: 5 × 2 = 10 entries');
  console.log('  - Process Steps: 3 × 2 = 6 entries');
  console.log('  - Features: 3 × 2 = 6 entries');
  console.log('  - Solutions: 6 × 2 = 12 entries');
  console.log('  - Industries: 6 × 2 = 12 entries');
  console.log('  - Case Studies: 3 × 2 = 6 entries');
  console.log('  - Demos: 3 × 2 = 6 entries');
  console.log('  - Total: 68+ entries\n');
  console.log('Next steps:');
  console.log('1. Restart Strapi to recognize new content types');
  console.log('2. Run this script after Strapi starts');
  console.log('3. Verify content in Strapi admin (http://localhost:1337/admin)');
  console.log('4. Test the Next.js frontend\n');
}

seed().catch(error => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});

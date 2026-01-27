#!/usr/bin/env node

/**
 * Complete CMS Seed Script for Arabiq
 * Seeds ALL content: Navigation, Pages, Homepage sections, etc.
 * Usage: node seed-all.mjs <admin-token>
 */

const STRAPI_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';
let adminToken = process.argv[2] || process.env.SEED_TOKEN;
if (!adminToken) {
  try {
    const fs = await import('fs');
    const realFs = fs && fs.default ? fs.default : fs;
    if (process.env.SEED_TOKEN_FILE) {
      try { const v = realFs.readFileSync(process.env.SEED_TOKEN_FILE, 'utf8').trim(); if (v) adminToken = v; } catch (e) {}
    }
    if (!adminToken && process.env.HOME) {
      try { const p = `${process.env.HOME}/strapi-token.txt`; if (realFs.existsSync(p)) adminToken = realFs.readFileSync(p, 'utf8').trim(); } catch (e) {}
    }
    if (!adminToken) {
      try { const envPath = `${process.cwd()}/apps/cms/.env.local`; if (realFs.existsSync(envPath)) { const content = realFs.readFileSync(envPath, 'utf8'); const m = content.match(/^SEED_TOKEN=(.+)$/m); if (m) adminToken = m[1].trim(); } } catch (e) {}
    }
  } catch (e) {}
}

if (!adminToken) {
  console.error('❌ Error: Admin token required\nUsage: node seed-all.mjs <admin-token>');
  console.error('\nTip: set SEED_TOKEN in apps/cms/.env.local or export SEED_TOKEN in your shell, or use SEED_TOKEN_FILE=~/strapi-token.txt');
  process.exit(1);
}

const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` };

async function request(path, options) {
  const url = `${STRAPI_URL}${path}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { ...options, headers: { ...headers, ...(options?.headers ?? {}) } });
      const text = await res.text();
      return { ok: res.ok, status: res.status, body: text ? JSON.parse(text) : null };
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise(r => setTimeout(r, 250 * attempt));
    }
  }
}

// Confirm before seeding if DB appears non-empty (unless forced)
async function confirmIfNonEmpty() {
  const forced = process.argv.includes('--force') || process.env.FORCE_SEED === '1';
  if (forced) return;
  try {
    const res = await request('/api/homepage?pagination[limit]=1');
    const hasContent = res.ok && Array.isArray(res.body?.data) && res.body.data.length > 0;
    if (hasContent) {
      const { createInterface } = await import('readline');
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      const answer = await new Promise(resolve => rl.question('Database appears to contain content. Proceed with seeding? (yes/no): ', a => { rl.close(); resolve(a); }));
      if (String(answer).trim().toLowerCase() !== 'yes') {
        console.log('Aborting seeding. No changes made.');
        process.exit(0);
      }
    }
  } catch (e) {
    console.warn('Warning: could not determine DB content - proceeding. Error:', e.message);
  }
}

async function upsertSingle(type, data, locale = 'en') {
  const payload = { ...data, publishedAt: new Date().toISOString() };
  const res = await request(`/api/${type}?locale=${locale}`, { method: 'PUT', body: JSON.stringify({ data: payload }) });
  console.log(res.ok ? `✅ ${type} (${locale})` : `❌ ${type} (${locale}): ${JSON.stringify(res.body)}`);
  return res;
}

async function findByField(type, field, value, locale = 'en') {
  const params = new URLSearchParams({ [`filters[${field}][$eq]`]: value, 'pagination[limit]': '1', locale });
  const res = await request(`/api/${type}?${params}`, { method: 'GET' });
  return res.ok && res.body?.data?.[0] ? res.body.data[0] : null;
}

async function findByHrefLocation(type, href, location, locale = 'en') {
  const params = new URLSearchParams({ 'filters[href][$eq]': href, 'filters[location][$eq]': location, 'pagination[limit]': '1', locale });
  const res = await request(`/api/${type}?${params}`, { method: 'GET' });
  return res.ok && res.body?.data?.[0] ? res.body.data[0] : null;
}

async function upsertCollection(type, data, idField = 'order', locale = 'en') {
  // Prefer stable unique identifiers in this order: idField (order), href+location
  let existing = await findByField(type, idField, data[idField], locale);
  if (!existing && data.href && data.location) {
    existing = await findByHrefLocation(type, data.href, data.location, locale);
  }

  const payload = { ...data, locale, publishedAt: new Date().toISOString() };
  
  if (existing?.documentId) {
    const res = await request(`/api/${type}/${existing.documentId}?locale=${locale}`, { method: 'PUT', body: JSON.stringify({ data: payload }) });
    console.log(res.ok ? `↻ ${type}: ${data.label || data.title || data.name || data.value} (${locale})` : `❌ ${type}`);
    return res;
  }
  
  const res = await request(`/api/${type}?locale=${locale}`, { method: 'POST', body: JSON.stringify({ data: payload }) });
  console.log(res.ok ? `✅ ${type}: ${data.label || data.title || data.name || data.value} (${locale})` : `❌ ${type}`);
  return res;
}

// ============================================================================
// SEED DATA
// ============================================================================

const navItemsEN = [
  // Header navigation
  { label: 'Solutions', href: '/solutions', location: 'header', order: 1, isExternal: false },
  { label: 'Industries', href: '/industries', location: 'header', order: 2, isExternal: false },
  { label: 'Case Studies', href: '/case-studies', location: 'header', order: 3, isExternal: false },
  { label: 'Demos', href: '/demos', location: 'header', order: 4, isExternal: false },
  { label: 'About', href: '/about', location: 'header', order: 5, isExternal: false },
  { label: 'Contact', href: '/contact', location: 'header', order: 6, isExternal: false },
  // Footer - Company
  { label: 'About Us', href: '/about', location: 'footer-company', order: 10, isExternal: false },
  { label: 'Contact', href: '/contact', location: 'footer-company', order: 11, isExternal: false },
  { label: 'Careers', href: '/careers', location: 'footer-company', order: 12, isExternal: false },
  // Footer - Products
  { label: 'Solutions', href: '/solutions', location: 'footer-products', order: 20, isExternal: false },
  { label: 'Live Demos', href: '/demos', location: 'footer-products', order: 21, isExternal: false },
  { label: 'Pricing', href: '/pricing', location: 'footer-products', order: 22, isExternal: false },
  // Footer - Resources
  { label: 'Case Studies', href: '/case-studies', location: 'footer-resources', order: 30, isExternal: false },
  { label: 'Industries', href: '/industries', location: 'footer-resources', order: 31, isExternal: false },
  { label: 'Blog', href: '/blog', location: 'footer-resources', order: 32, isExternal: false },
  // Footer - Social
  { label: 'Twitter', href: 'https://twitter.com/arabiq', location: 'footer-social', order: 40, isExternal: true },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/arabiq', location: 'footer-social', order: 41, isExternal: true },
  { label: 'GitHub', href: 'https://github.com/arabiq', location: 'footer-social', order: 42, isExternal: true },
];

const navItemsAR = [
  { label: 'الحلول', href: '/solutions', location: 'header', order: 1, isExternal: false },
  { label: 'القطاعات', href: '/industries', location: 'header', order: 2, isExternal: false },
  { label: 'قصص النجاح', href: '/case-studies', location: 'header', order: 3, isExternal: false },
  { label: 'العروض', href: '/demos', location: 'header', order: 4, isExternal: false },
  { label: 'من نحن', href: '/about', location: 'header', order: 5, isExternal: false },
  { label: 'تواصل معنا', href: '/contact', location: 'header', order: 6, isExternal: false },
  { label: 'من نحن', href: '/about', location: 'footer-company', order: 10, isExternal: false },
  { label: 'تواصل معنا', href: '/contact', location: 'footer-company', order: 11, isExternal: false },
  { label: 'وظائف', href: '/careers', location: 'footer-company', order: 12, isExternal: false },
  { label: 'الحلول', href: '/solutions', location: 'footer-products', order: 20, isExternal: false },
  { label: 'العروض الحية', href: '/demos', location: 'footer-products', order: 21, isExternal: false },
  { label: 'الأسعار', href: '/pricing', location: 'footer-products', order: 22, isExternal: false },
  { label: 'قصص النجاح', href: '/case-studies', location: 'footer-resources', order: 30, isExternal: false },
  { label: 'القطاعات', href: '/industries', location: 'footer-resources', order: 31, isExternal: false },
  { label: 'المدونة', href: '/blog', location: 'footer-resources', order: 32, isExternal: false },
  { label: 'تويتر', href: 'https://twitter.com/arabiq', location: 'footer-social', order: 40, isExternal: true },
  { label: 'لينكد إن', href: 'https://linkedin.com/company/arabiq', location: 'footer-social', order: 41, isExternal: true },
  { label: 'جيت هاب', href: 'https://github.com/arabiq', location: 'footer-social', order: 42, isExternal: true },
];

const homepageEN = {
  heroTitle: 'Build the Future of Commerce in the Arab World',
  heroSubtitle: 'Create stunning 3D digital twins of your spaces with our AI-powered Arabic-first platform. Transform physical stores into immersive virtual experiences.',
  heroPrimaryCta: 'Start Free Trial',
  heroSecondaryCta: 'Watch Demo',
  heroBadge: 'Trusted by 100+ businesses',
  trustAward: '🏆 Award-Winning',
  trustGlobal: '🌍 12 Countries',
  trustFast: '⚡ 24hr Delivery',
  showStatsSection: true,
  showTrustedBySection: true,
  trustedByTitle: 'TRUSTED BY LEADING COMPANIES',
  showHowItWorksSection: true,
  howItWorksTitle: 'How It Works',
  howItWorksSubtitle: 'Three simple steps to create your digital twin',
  showFeaturesSection: true,
  featuresTitle: 'Why Choose Arabiq',
  featuresSubtitle: 'Built specifically for the Arab market',
  showSolutionsSection: true,
  solutionsTitle: 'Our Solutions',
  solutionsSubtitle: 'Comprehensive digital transformation tools',
  showIndustriesSection: true,
  industriesTitle: 'Industries We Serve',
  industriesSubtitle: 'Tailored solutions for every sector',
  showCaseStudiesSection: true,
  caseStudiesTitle: 'Success Stories',
  caseStudiesSubtitle: 'See how we helped our clients',
  showDemosSection: true,
  demosTitle: 'Try Live Demos',
  demosSubtitle: 'Experience our platform firsthand',
  showCtaSection: true,
  ctaTitle: 'Ready to Transform Your Business?',
  ctaSubtitle: 'Join hundreds of companies already using Arabiq',
  ctaPrimaryButton: 'Get Started Free',
  ctaSecondaryButton: 'Schedule Demo'
};

const homepageAR = {
  heroTitle: 'ابنِ مستقبل التجارة في العالم العربي',
  heroSubtitle: 'أنشئ توائم رقمية ثلاثية الأبعاد مذهلة لمساحاتك مع منصتنا العربية-أولاً المدعومة بالذكاء الاصطناعي. حوّل متاجرك الفعلية إلى تجارب رقمية غامرة.',
  heroPrimaryCta: 'ابدأ مجاناً',
  heroSecondaryCta: 'شاهد العرض',
  heroBadge: 'موثوق من 100+ شركة',
  trustAward: '🏆 حائز على جوائز',
  trustGlobal: '🌍 12 دولة',
  trustFast: '⚡ تسليم 24 ساعة',
  showStatsSection: true,
  showTrustedBySection: true,
  trustedByTitle: 'موثوق من الشركات الرائدة',
  showHowItWorksSection: true,
  howItWorksTitle: 'كيف يعمل',
  howItWorksSubtitle: 'ثلاث خطوات بسيطة لإنشاء توأمك الرقمي',
  showFeaturesSection: true,
  featuresTitle: 'لماذا تختار Arabiq',
  featuresSubtitle: 'مبنية خصيصاً للسوق العربي',
  showSolutionsSection: true,
  solutionsTitle: 'حلولنا',
  solutionsSubtitle: 'أدوات تحول رقمي شاملة',
  showIndustriesSection: true,
  industriesTitle: 'القطاعات التي نخدمها',
  industriesSubtitle: 'حلول مخصصة لكل قطاع',
  showCaseStudiesSection: true,
  caseStudiesTitle: 'قصص النجاح',
  caseStudiesSubtitle: 'شاهد كيف ساعدنا عملائنا',
  showDemosSection: true,
  demosTitle: 'جرب العروض الحية',
  demosSubtitle: 'اختبر منصتنا بنفسك',
  showCtaSection: true,
  ctaTitle: 'مستعد لتحويل أعمالك؟',
  ctaSubtitle: 'انضم إلى مئات الشركات التي تستخدم Arabiq',
  ctaPrimaryButton: 'ابدأ مجاناً',
  ctaSecondaryButton: 'جدولة عرض'
};

const aboutPageEN = {
  heroTitle: 'About Arabiq',
  heroSubtitle: 'We\'re building the future of digital commerce for the Arab world',
  missionTitle: 'Our Mission',
  missionText: 'To empower Arab businesses with cutting-edge digital twin technology, enabling them to create immersive virtual experiences that transcend physical boundaries.',
  visionTitle: 'Our Vision',
  visionText: 'A world where every Arab business can exist twice - once physical, once digital - reaching customers anywhere, anytime.',
  valuesTitle: 'Our Values',
  value1Title: 'Innovation',
  value1Text: 'We push boundaries and embrace new technologies to deliver exceptional solutions.',
  value2Title: 'Arabic-First',
  value2Text: 'We build for the Arab market first, with RTL support and cultural understanding.',
  value3Title: 'Excellence',
  value3Text: 'We strive for the highest quality in everything we do.',
  teamTitle: 'Our Team',
  teamSubtitle: 'A diverse team of engineers, designers, and strategists passionate about digital innovation.',
  ctaTitle: 'Join Our Journey',
  ctaButton: 'Get in Touch'
};

const aboutPageAR = {
  heroTitle: 'عن Arabiq',
  heroSubtitle: 'نبني مستقبل التجارة الرقمية للعالم العربي',
  missionTitle: 'مهمتنا',
  missionText: 'تمكين الشركات العربية بتقنية التوأم الرقمي المتطورة، لإنشاء تجارب رقمية غامرة تتجاوز الحدود المادية.',
  visionTitle: 'رؤيتنا',
  visionText: 'عالم حيث كل شركة عربية يمكنها الوجود مرتين - مرة فعلياً ومرة رقمياً - للوصول للعملاء في أي مكان وأي وقت.',
  valuesTitle: 'قيمنا',
  value1Title: 'الابتكار',
  value1Text: 'ندفع الحدود ونتبنى تقنيات جديدة لتقديم حلول استثنائية.',
  value2Title: 'عربي-أولاً',
  value2Text: 'نبني للسوق العربي أولاً، مع دعم RTL وفهم ثقافي.',
  value3Title: 'التميز',
  value3Text: 'نسعى لأعلى جودة في كل ما نفعله.',
  teamTitle: 'فريقنا',
  teamSubtitle: 'فريق متنوع من المهندسين والمصممين والاستراتيجيين الشغوفين بالابتكار الرقمي.',
  ctaTitle: 'انضم لرحلتنا',
  ctaButton: 'تواصل معنا'
};

const contactPageEN = {
  heroTitle: 'Get in Touch',
  heroSubtitle: 'We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.',
  formTitle: 'Send a Message',
  nameLabel: 'Full Name',
  emailLabel: 'Email Address',
  phoneLabel: 'Phone Number',
  messageLabel: 'Your Message',
  submitButton: 'Send Message',
  infoTitle: 'Contact Information',
  address: 'Cairo, Egypt\nDubai, UAE',
  email: 'hello@arabiq.tech',
  phone: '+20 123 456 7890',
  hoursTitle: 'Business Hours',
  hoursText: 'Sunday - Thursday: 9AM - 6PM\nFriday - Saturday: Closed'
};

const contactPageAR = {
  heroTitle: 'تواصل معنا',
  heroSubtitle: 'نحب أن نسمع منك. أرسل لنا رسالة وسنرد في أقرب وقت ممكن.',
  formTitle: 'أرسل رسالة',
  nameLabel: 'الاسم الكامل',
  emailLabel: 'البريد الإلكتروني',
  phoneLabel: 'رقم الهاتف',
  messageLabel: 'رسالتك',
  submitButton: 'إرسال الرسالة',
  infoTitle: 'معلومات التواصل',
  address: 'القاهرة، مصر\nدبي، الإمارات',
  email: 'hello@arabiq.tech',
  phone: '+20 123 456 7890',
  hoursTitle: 'ساعات العمل',
  hoursText: 'الأحد - الخميس: 9ص - 6م\nالجمعة - السبت: مغلق'
};

const statsEN = [
  { value: '500+', label: 'Digital Twins Created', order: 1 },
  { value: '100+', label: 'Happy Clients', order: 2 },
  { value: '98%', label: 'Client Satisfaction', order: 3 },
  { value: '12', label: 'Countries Served', order: 4 }
];

const statsAR = [
  { value: '+500', label: 'توأم رقمي', order: 1 },
  { value: '+100', label: 'عميل سعيد', order: 2 },
  { value: '98%', label: 'رضا العملاء', order: 3 },
  { value: '12', label: 'دولة', order: 4 }
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
  { name: 'الخطوط القطرية', order: 5 }
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
  { title: 'Lightning Fast', description: 'Optimized for speed with edge deployment across MENA.', icon: 'zap', order: 1 },
  { title: 'Arabic-First', description: 'Built with RTL support and Arabic UX patterns.', icon: 'globe', order: 2 },
  { title: 'AI-Powered', description: 'Smart recommendations and voice narration.', icon: 'sparkles', order: 3 }
];

const featuresAR = [
  { title: 'سرعة البرق', description: 'محسّن للسرعة مع نشر على الحافة.', icon: 'zap', order: 1 },
  { title: 'عربي-أولاً', description: 'مبني مع دعم RTL وأنماط UX عربية.', icon: 'globe', order: 2 },
  { title: 'مدعوم بالذكاء الاصطناعي', description: 'توصيات ذكية وسرد صوتي.', icon: 'sparkles', order: 3 }
];

const solutionsEN = [
  { title: 'Vmall Platform', slug: 'vmall-platform', summary: 'Create virtual malls and showrooms with Matterport + AI', description: '# Vmall Platform\n\nTransform physical spaces into immersive 3D experiences.', icon: '🏬' },
  { title: 'Arabiq AI Suite', slug: 'arabiq-ai-suite', summary: 'Arabic AI: voice, chat, vision, and recommendations', description: '# Arabiq AI Suite\n\nComprehensive Arabic-first AI tools.', icon: '🤖' },
  { title: 'Arabiq Commerce', slug: 'arabiq-commerce', summary: 'Complete e-commerce with local payments', description: '# Arabiq Commerce\n\nFull e-commerce platform for Arab market.', icon: '🛒' },
  { title: 'System Integration', slug: 'system-integration', summary: 'Connect with WooCommerce, Shopify, Odoo', description: '# System Integration\n\nSeamless connections to your existing systems.', icon: '🔗' },
  { title: 'Digital Twin Production', slug: 'digital-twin-production', summary: 'Professional Matterport scanning services', description: '# Digital Twin Production\n\nEnd-to-end 3D scanning and hosting.', icon: '📸' },
  { title: 'VFair Edition', slug: 'vfair-edition', summary: 'Virtual fairs and exhibitions platform', description: '# VFair Edition\n\nImmersive virtual event experiences.', icon: '🎪' }
];

const solutionsAR = [
  { title: 'منصة Vmall', slug: 'vmall-platform', summary: 'إنشاء مراكز تسوق ومعارض رقمية', description: '# منصة Vmall\n\nحوّل المساحات الفعلية إلى تجارب رقمية.', icon: '🏬' },
  { title: 'مجموعة Arabiq AI', slug: 'arabiq-ai-suite', summary: 'ذكاء اصطناعي عربي: صوت، دردشة، رؤية', description: '# مجموعة Arabiq AI\n\nأدوات ذكاء اصطناعي عربية-أولاً.', icon: '🤖' },
  { title: 'Arabiq Commerce', slug: 'arabiq-commerce', summary: 'تجارة إلكترونية مع دفع محلي', description: '# Arabiq Commerce\n\nمنصة تجارة للسوق العربي.', icon: '🛒' },
  { title: 'تكامل الأنظمة', slug: 'system-integration', summary: 'ربط مع WooCommerce، Shopify، Odoo', description: '# تكامل الأنظمة\n\nاتصالات سلسة مع أنظمتك.', icon: '🔗' },
  { title: 'إنتاج التوأم الرقمي', slug: 'digital-twin-production', summary: 'خدمات مسح Matterport احترافية', description: '# إنتاج التوأم الرقمي\n\nمسح واستضافة 3D.', icon: '📸' },
  { title: 'نسخة VFair', slug: 'vfair-edition', summary: 'منصة معارض وفعاليات رقمية', description: '# نسخة VFair\n\nتجارب فعاليات رقمية غامرة.', icon: '🎪' }
];

const industriesEN = [
  { title: 'Retail & E-commerce', slug: 'retail-ecommerce', summary: 'Virtual malls and 3D showrooms', description: '# Retail\n\nImmersive shopping experiences.', icon: '🛍️' },
  { title: 'Real Estate', slug: 'real-estate', summary: 'Virtual property tours', description: '# Real Estate\n\nDigital property showcases.', icon: '🏢' },
  { title: 'Tourism & Hospitality', slug: 'tourism-hospitality', summary: 'Hotel and destination tours', description: '# Tourism\n\nVirtual travel experiences.', icon: '✈️' },
  { title: 'Events & Exhibitions', slug: 'events-exhibitions', summary: 'Virtual fairs and conferences', description: '# Events\n\nHybrid event solutions.', icon: '🎪' },
  { title: 'Education', slug: 'education', summary: 'Virtual campuses and labs', description: '# Education\n\n3D learning environments.', icon: '🎓' },
  { title: 'Healthcare', slug: 'healthcare', summary: 'Facility tours and consultations', description: '# Healthcare\n\nVirtual medical facilities.', icon: '⚕️' }
];

const industriesAR = [
  { title: 'التجزئة والتجارة الإلكترونية', slug: 'retail-ecommerce', summary: 'مراكز تسوق وصالات عرض رقمية', description: '# التجزئة\n\nتجارب تسوق غامرة.', icon: '🛍️' },
  { title: 'العقارات', slug: 'real-estate', summary: 'جولات عقارية رقمية', description: '# العقارات\n\nعروض عقارات رقمية.', icon: '🏢' },
  { title: 'السياحة والضيافة', slug: 'tourism-hospitality', summary: 'جولات فنادق ووجهات', description: '# السياحة\n\nتجارب سفر رقمية.', icon: '✈️' },
  { title: 'الفعاليات والمعارض', slug: 'events-exhibitions', summary: 'معارض ومؤتمرات رقمية', description: '# الفعاليات\n\nحلول فعاليات هجينة.', icon: '🎪' },
  { title: 'التعليم', slug: 'education', summary: 'حرم جامعية ومختبرات رقمية', description: '# التعليم\n\nبيئات تعلم ثلاثية الأبعاد.', icon: '🎓' },
  { title: 'الرعاية الصحية', slug: 'healthcare', summary: 'جولات منشآت واستشارات', description: '# الرعاية الصحية\n\nمنشآت طبية رقمية.', icon: '⚕️' }
];

const caseStudiesEN = [
  { title: 'Suites Egypt Showroom', slug: 'suites-egypt', summary: '340% increase in online sales with virtual showroom', description: '# Suites Egypt\n\n## Results\n- 340% sales increase\n- 12,000+ virtual visits', client: 'Suites Egypt', industry: 'Retail' },
  { title: 'Cairo Fashion Hub', slug: 'cairo-fashion-hub', summary: '50-vendor mall with 200% traffic increase', description: '# Cairo Fashion Hub\n\n## Results\n- 200% traffic increase\n- $2.1M first year sales', client: 'Cairo Fashion Hub', industry: 'Retail' },
  { title: 'Alexandria Museum', slug: 'alexandria-museum', summary: '500K+ visitors from 89 countries', description: '# Alexandria Museum\n\n## Results\n- 500,000+ virtual visitors\n- UNESCO recognition', client: 'Alexandria Museum', industry: 'Tourism' }
];

const caseStudiesAR = [
  { title: 'صالة عرض Suites Egypt', slug: 'suites-egypt', summary: 'زيادة 340% في المبيعات الإلكترونية', description: '# Suites Egypt\n\n## النتائج\n- زيادة 340% في المبيعات\n- 12,000+ زيارة رقمية', client: 'Suites Egypt', industry: 'التجزئة' },
  { title: 'مركز القاهرة للأزياء', slug: 'cairo-fashion-hub', summary: 'مول 50 بائع مع زيادة 200% في الزوار', description: '# مركز القاهرة للأزياء\n\n## النتائج\n- زيادة 200% في الزوار\n- 2.1 مليون دولار أول سنة', client: 'Cairo Fashion Hub', industry: 'التجزئة' },
  { title: 'متحف الإسكندرية', slug: 'alexandria-museum', summary: '500 ألف+ زائر من 89 دولة', description: '# متحف الإسكندرية\n\n## النتائج\n- 500,000+ زائر رقمي\n- اعتراف اليونسكو', client: 'متحف الإسكندرية', industry: 'السياحة' }
];

const demosEN = [
  { title: 'Virtual Showroom', slug: 'virtual-showroom', summary: 'Experience 3D showroom technology', demoType: 'ecommerce', description: '# Virtual Showroom\n\nExplore our Matterport-powered showroom.' },
  { title: 'AI Shopping Assistant', slug: 'ai-assistant', summary: 'Try our Arabic conversational AI', demoType: 'ai-chat', description: '# AI Assistant\n\nChat with our intelligent assistant.' },
  { title: 'Virtual Event Space', slug: 'virtual-event', summary: 'Explore VFair platform', demoType: 'events', description: '# Virtual Event\n\nSee our event platform in action.' }
];

const demosAR = [
  { title: 'صالة عرض رقمية', slug: 'virtual-showroom', summary: 'اختبر تقنية الصالات ثلاثية الأبعاد', demoType: 'ecommerce', description: '# صالة العرض الرقمية\n\nاستكشف صالتنا المدعومة بـ Matterport.' },
  { title: 'مساعد التسوق AI', slug: 'ai-assistant', summary: 'جرب الذكاء الاصطناعي المحادثاتي العربي', demoType: 'ai-chat', description: '# مساعد AI\n\nتحدث مع مساعدنا الذكي.' },
  { title: 'مساحة فعاليات رقمية', slug: 'virtual-event', summary: 'استكشف منصة VFair', demoType: 'events', description: '# فعالية رقمية\n\nشاهد منصة الفعاليات.' }
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seed() {
  console.log('🌱 Seeding Complete Arabiq CMS...\n');

  await confirmIfNonEmpty();

  // Navigation Items
  // NOTE: Nav items are now managed centrally by `seed-nav-canonical.mjs` to avoid duplicates.
  console.log('📍 Navigation Items: skipped (managed by seed-nav-canonical)');

  // Homepage
  console.log('\n🏠 Homepage...');
  await upsertSingle('homepage', homepageEN, 'en');
  await upsertSingle('homepage', homepageAR, 'ar');

  // About Page
  console.log('\n📄 About Page...');
  await upsertSingle('about-page', aboutPageEN, 'en');
  await upsertSingle('about-page', aboutPageAR, 'ar');

  // Contact Page
  console.log('\n📞 Contact Page...');
  await upsertSingle('contact-page', contactPageEN, 'en');
  await upsertSingle('contact-page', contactPageAR, 'ar');

  // Stats
  console.log('\n📊 Stats...');
  for (const s of statsEN) await upsertCollection('stats', s, 'order', 'en');
  for (const s of statsAR) await upsertCollection('stats', s, 'order', 'ar');

  // Trusted Companies
  console.log('\n🏢 Trusted Companies...');
  for (const c of trustedCompaniesEN) await upsertCollection('trusted-companies', c, 'order', 'en');
  for (const c of trustedCompaniesAR) await upsertCollection('trusted-companies', c, 'order', 'ar');

  // Process Steps
  console.log('\n📋 Process Steps...');
  for (const s of processStepsEN) await upsertCollection('process-steps', s, 'step', 'en');
  for (const s of processStepsAR) await upsertCollection('process-steps', s, 'step', 'ar');

  // Features
  console.log('\n✨ Features...');
  for (const f of featuresEN) await upsertCollection('features', f, 'order', 'en');
  for (const f of featuresAR) await upsertCollection('features', f, 'order', 'ar');

  // Solutions
  console.log('\n💡 Solutions...');
  for (const s of solutionsEN) await upsertCollection('solutions', s, 'slug', 'en');
  for (const s of solutionsAR) await upsertCollection('solutions', s, 'slug', 'ar');

  // Industries
  console.log('\n🏭 Industries...');
  for (const i of industriesEN) await upsertCollection('industries', i, 'slug', 'en');
  for (const i of industriesAR) await upsertCollection('industries', i, 'slug', 'ar');

  // Case Studies
  console.log('\n📚 Case Studies...');
  for (const c of caseStudiesEN) await upsertCollection('case-studies', c, 'slug', 'en');
  for (const c of caseStudiesAR) await upsertCollection('case-studies', c, 'slug', 'ar');

  // Demos
  console.log('\n🎬 Demos...');
  for (const d of demosEN) await upsertCollection('demos', d, 'slug', 'en');
  for (const d of demosAR) await upsertCollection('demos', d, 'slug', 'ar');

  console.log('\n✅ Complete! All content seeded in EN and AR.');
  console.log('\n📊 Summary:');
  console.log('  - Navigation: 18 items × 2 = 36');
  console.log('  - Pages: Homepage, About, Contact × 2 = 6');
  console.log('  - Stats: 4 × 2 = 8');
  console.log('  - Trusted Companies: 5 × 2 = 10');
  console.log('  - Process Steps: 3 × 2 = 6');
  console.log('  - Features: 3 × 2 = 6');
  console.log('  - Solutions: 6 × 2 = 12');
  console.log('  - Industries: 6 × 2 = 12');
  console.log('  - Case Studies: 3 × 2 = 6');
  console.log('  - Demos: 3 × 2 = 6');
  console.log('\nNext: Restart Strapi, then run this script again.');
}

seed().catch(e => { console.error('❌ Failed:', e); process.exit(1); });

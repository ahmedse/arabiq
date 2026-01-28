#!/usr/bin/env node

const STRAPI_URL = 'http://127.0.0.1:1337';
const TOKEN = process.argv[2] || process.env.SEED_TOKEN;

if (!TOKEN) {
  console.error('❌ Token required: node seed-nav-items.mjs <token>');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`
};

const navItems = [
  // Header Navigation (EN)
  { label: 'Home', href: '/', location: 'header', order: 1, locale: 'en' },
  { label: 'Solutions', href: '/solutions', location: 'header', order: 2, locale: 'en' },
  { label: 'Industries', href: '/industries', location: 'header', order: 3, locale: 'en' },
  { label: 'Case Studies', href: '/case-studies', location: 'header', order: 4, locale: 'en' },
  { label: 'Demos', href: '/demos', location: 'header', order: 5, locale: 'en' },
  { label: 'About', href: '/about', location: 'header', order: 6, locale: 'en' },
  { label: 'Contact', href: '/contact', location: 'header', order: 7, locale: 'en' },

  // Header Navigation (AR)
  { label: 'الرئيسية', href: '/', location: 'header', order: 1, locale: 'ar' },
  { label: 'الحلول', href: '/solutions', location: 'header', order: 2, locale: 'ar' },
  { label: 'الصناعات', href: '/industries', location: 'header', order: 3, locale: 'ar' },
  { label: 'دراسات الحالة', href: '/case-studies', location: 'header', order: 4, locale: 'ar' },
  { label: 'العروض التوضيحية', href: '/demos', location: 'header', order: 5, locale: 'ar' },
  { label: 'من نحن', href: '/about', location: 'header', order: 6, locale: 'ar' },
  { label: 'اتصل بنا', href: '/contact', location: 'header', order: 7, locale: 'ar' },

  // Footer - Solutions (EN)
  { label: 'Vmall Platform', href: '/solutions/vmall', location: 'footer-solutions', order: 1, locale: 'en' },
  { label: 'AI Suite', href: '/solutions/ai-suite', location: 'footer-solutions', order: 2, locale: 'en' },
  { label: 'Commerce', href: '/solutions/commerce', location: 'footer-solutions', order: 3, locale: 'en' },
  { label: 'System Integration', href: '/solutions/integration', location: 'footer-solutions', order: 4, locale: 'en' },

  // Footer - Solutions (AR)
  { label: 'منصة Vmall', href: '/solutions/vmall', location: 'footer-solutions', order: 1, locale: 'ar' },
  { label: 'مجموعة الذكاء الاصطناعي', href: '/solutions/ai-suite', location: 'footer-solutions', order: 2, locale: 'ar' },
  { label: 'التجارة الإلكترونية', href: '/solutions/commerce', location: 'footer-solutions', order: 3, locale: 'ar' },
  { label: 'تكامل الأنظمة', href: '/solutions/integration', location: 'footer-solutions', order: 4, locale: 'ar' },

  // Footer - Company (EN)
  { label: 'About Us', href: '/about', location: 'footer-company', order: 1, locale: 'en' },
  { label: 'Case Studies', href: '/case-studies', location: 'footer-company', order: 2, locale: 'en' },
  { label: 'Careers', href: '/careers', location: 'footer-company', order: 3, locale: 'en' },
  { label: 'Contact', href: '/contact', location: 'footer-company', order: 4, locale: 'en' },

  // Footer - Company (AR)
  { label: 'من نحن', href: '/about', location: 'footer-company', order: 1, locale: 'ar' },
  { label: 'دراسات الحالة', href: '/case-studies', location: 'footer-company', order: 2, locale: 'ar' },
  { label: 'الوظائف', href: '/careers', location: 'footer-company', order: 3, locale: 'ar' },
  { label: 'اتصل بنا', href: '/contact', location: 'footer-company', order: 4, locale: 'ar' },

  // Footer - Resources (EN)
  { label: 'Documentation', href: '/docs', location: 'footer-resources', order: 1, locale: 'en' },
  { label: 'API Reference', href: '/api-docs', location: 'footer-resources', order: 2, locale: 'en' },
  { label: 'Support', href: '/support', location: 'footer-resources', order: 3, locale: 'en' },
  { label: 'Blog', href: '/blog', location: 'footer-resources', order: 4, locale: 'en' },

  // Footer - Resources (AR)
  { label: 'التوثيق', href: '/docs', location: 'footer-resources', order: 1, locale: 'ar' },
  { label: 'مرجع API', href: '/api-docs', location: 'footer-resources', order: 2, locale: 'ar' },
  { label: 'الدعم', href: '/support', location: 'footer-resources', order: 3, locale: 'ar' },
  { label: 'المدونة', href: '/blog', location: 'footer-resources', order: 4, locale: 'ar' },

  // Footer - Social (EN)
  { label: 'LinkedIn', href: 'https://linkedin.com/company/arabiq', location: 'footer-social', order: 1, isExternal: true, locale: 'en' },
  { label: 'Twitter', href: 'https://twitter.com/arabiq', location: 'footer-social', order: 2, isExternal: true, locale: 'en' },
  { label: 'GitHub', href: 'https://github.com/arabiq', location: 'footer-social', order: 3, isExternal: true, locale: 'en' },

  // Footer - Social (AR)
  { label: 'لينكد إن', href: 'https://linkedin.com/company/arabiq', location: 'footer-social', order: 1, isExternal: true, locale: 'ar' },
  { label: 'تويتر', href: 'https://twitter.com/arabiq', location: 'footer-social', order: 2, isExternal: true, locale: 'ar' },
  { label: 'جيت هاب', href: 'https://github.com/arabiq', location: 'footer-social', order: 3, isExternal: true, locale: 'ar' },
];

async function createNavItem(item) {
  try {
    const res = await fetch(`${STRAPI_URL}/api/nav-items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ data: { ...item, isExternal: item.isExternal || false } })
    });

    if (!res.ok) {
      const error = await res.text();
      console.error(`❌ Failed to create ${item.label} (${item.locale}):`, error.substring(0, 200));
      return false;
    }

    console.log(`✅ Created nav-item: ${item.label} (${item.locale}) [${item.location}]`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating ${item.label}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🌱 Seeding Navigation Items...\n');
  
  let created = 0;
  let failed = 0;

  for (const item of navItems) {
    const success = await createNavItem(item);
    if (success) created++;
    else failed++;
    await new Promise(r => setTimeout(r, 50)); // Rate limit
  }

  console.log(`\n✨ Navigation seeding complete!`);
  console.log(`   Created: ${created}`);
  console.log(`   Failed: ${failed}`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

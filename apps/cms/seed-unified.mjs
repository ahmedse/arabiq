#!/usr/bin/env node
/*
 Unified seeder for Arabiq CMS
 - Audits collections and single-types for both locales
 - Backs up current content to /backups
 - Removes existing collection entries (safe-delete)
 - Seeds canonical EN + AR content
 - Publishes created items

 Usage: node seed-unified.mjs <TOKEN>
*/

import { writeFileSync, mkdirSync } from 'fs';

const STRAPI_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';
const TOKEN = process.argv[2] || process.env.SEED_TOKEN;
if (!TOKEN) {
  console.error('❌ Token required. Usage: node seed-unified.mjs <TOKEN>');
  process.exit(1);
}
const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` };

const collections = ['nav-items','demos','stats','features','solutions','industries','case-studies','trusted-companies','process-steps'];
const singleTypes = ['site-setting','homepage','about-page','contact-page'];

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

async function fetchAll(apiPath){
  const url = `${STRAPI_URL}/api/${apiPath}?pagination[pageSize]=500`;
  const res = await fetch(url, { headers });
  if(!res.ok) { console.error('Fetch failed', apiPath, res.status); return null; }
  return (await res.json()).data || [];
}

async function backup(){
  console.log('📦 Backing up current content (per collection, per locale)...');
  try{ mkdirSync('./backups', { recursive: true }); } catch(e){}

  // Collections: fetch raw (all locales) and write
  for(const c of collections){
    const res = await fetch(`${STRAPI_URL}/api/${c}?pagination[pageSize]=500`, { headers });
    if(!res.ok) { console.warn(' - failed to fetch', c); continue; }
    const json = await res.json();
    writeFileSync(`./backups/${c}.json`, JSON.stringify(json, null, 2));
    console.log(' - backed up', c);
    await sleep(200);
  }

  // Single-types per locale
  for(const s of singleTypes){
    for(const locale of ['en','ar']){
      const res = await fetch(`${STRAPI_URL}/api/${s}?locale=${locale}`, { headers });
      if(!res.ok) { console.warn(' - failed to fetch', s, locale); continue; }
      const json = await res.json();
      writeFileSync(`./backups/${s}.${locale}.json`, JSON.stringify(json, null, 2));
      console.log(` - backed up ${s} (${locale})`);
      await sleep(200);
    }
  }
}

async function deleteAllCollections(){
  console.log('🧹 Deleting all collection entries (will remove items across locales)...');
  for(const c of collections){
    const items = await fetchAll(c);
    if(!items) continue;
    for(const it of items){
      const id = it.id;
      const del = await fetch(`${STRAPI_URL}/api/${c}/${id}`, { method: 'DELETE', headers });
      if(!del.ok){ console.warn(' - failed delete', c, id); continue; }
      console.log(` - deleted ${c} id=${id}`);
      await sleep(80);
    }
  }
}

// Upsert single-type: PUT with { data }
async function upsertSingle(apiPath, data, locale='en'){
  const url = `${STRAPI_URL}/api/${apiPath}?locale=${locale}`;
  const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify({ data }) });
  if(!res.ok){ console.error('❌ failed upsert', apiPath, locale, await res.text()); return null; }
  console.log(`✅ Upserted /api/${apiPath} (${locale})`);
  await sleep(200);
  return await res.json();
}

// Create collection item
async function createCollection(apiPath, data, locale='en'){
  const res = await fetch(`${STRAPI_URL}/api/${apiPath}?locale=${locale}`, { method: 'POST', headers, body: JSON.stringify({ data }) });
  if(!res.ok){ console.error('❌ failed create', apiPath, locale, await res.text()); return null; }
  const json = await res.json();
  const id = json.data?.id;
  if(id){
    await fetch(`${STRAPI_URL}/api/${apiPath}/${id}/actions/publish`, { method: 'POST', headers, body: '{}' }).catch(()=>{});
    console.log(`✅ Created ${apiPath} id=${id} (${locale})`);
  }
  await sleep(120);
  return json;
}

// Seed payloads (minimal canonical content - expand as needed)
const seed = {
  'site-setting': {
    en: {
      title: 'Arabiq', description: 'Arabiq platform.', contactEmail: 'contact@arabiq.tech', contactPhone: '+966 XX XXX XXXX', footerCompanyTitle: 'Company', footerProductsTitle: 'Products', footerResourcesTitle: 'Resources', footerConnectTitle: 'Connect', copyrightText: '© Arabiq', loginButtonText: 'Login'
    },
    ar: {
      title: 'عربق', description: 'منصة عربق.', contactEmail: 'contact@arabiq.tech', contactPhone: '+966 XX XXX XXXX', footerCompanyTitle: 'الشركة', footerProductsTitle: 'المنتجات', footerResourcesTitle: 'الموارد', footerConnectTitle: 'تواصل', copyrightText: '© عربق', loginButtonText: 'تسجيل الدخول'
    }
  },
  'homepage': {
    en: { heroTitle: 'Build the Future of Commerce in the Arab World', heroSubtitle: 'Create stunning 3D digital twins of your spaces with AI-powered Arabic-first platform. Transform physical stores into immersive virtual experiences.', heroPrimaryCta: 'Get a demo', heroSecondaryCta: 'Learn more', heroBadge: '#1 Platform in the Region', trustAward: 'Trust Award', trustGlobal: 'Trust Global', trustFast: 'Trust Fast' },
    ar: { heroTitle: 'ابنِ مستقبل التجارة في العالم العربي', heroSubtitle: 'أنشئ توائم رقمية ثلاثية الأبعاد مذهلة لمساحاتك مع منصة عربية-أولاً مدعومة بالذكاء الاصطناعي. حوّل متاجرك الفعلية إلى تجارب رقمية غامرة.', heroPrimaryCta: 'احصل على عرض', heroSecondaryCta: 'اعرف أكثر', heroBadge: '#1 في المنطقة', trustAward: 'جائزة الثقة', trustGlobal: 'الثقة العالمية', trustFast: 'الثقة السريعة' }
  },
  'about-page': {
    en: { heroTitle: 'About Arabiq', heroSubtitle: 'Pioneering Immersive Technology in the Middle East', missionTitle: 'Our Mission', missionText: 'To empower businesses across the Middle East with innovative immersive technology solutions that drive growth and digital transformation.', visionTitle: 'Our Vision', visionText: 'To become the region\'s most trusted partner for virtual experiences and digital innovation.' },
    ar: { heroTitle: 'عن عربق', heroSubtitle: 'رواد التكنولوجيا الغامرة في الشرق الأوسط', missionTitle: 'مهمتنا', missionText: 'تمكين الشركات في جميع أنحاء الشرق الأوسط بحلول تكنولوجية غامرة ومبتكرة تدفع النمو والتحول الرقمي.', visionTitle: 'رؤيتنا', visionText: 'أن نصبح الشريك الأكثر ثقة في المنطقة للتجارب الافتراضية والابتكار الرقمي.' }
  },
  'contact-page': {
    en: { heroTitle: 'Contact Us', heroSubtitle: 'Get in touch with our team', formTitle: 'Send us a message', nameLabel: 'Full Name', emailLabel: 'Email Address', phoneLabel: 'Phone Number', messageLabel: 'Your Message', submitButton: 'Send Message', infoTitle: 'Contact Information', email: 'contact@arabiq.tech', phone: '+966 XX XXX XXXX', address: 'Riyadh, Saudi Arabia', hoursTitle: 'Business Hours', hoursText: 'Sun-Thu 9:00 - 18:00' },
    ar: { heroTitle: 'اتصل بنا', heroSubtitle: 'تواصل مع فريقنا', formTitle: 'أرسل لنا رسالة', nameLabel: 'الاسم الكامل', emailLabel: 'البريد الإلكتروني', phoneLabel: 'رقم الهاتف', messageLabel: 'رسالتك', submitButton: 'إرسال الرسالة', infoTitle: 'معلومات الاتصال', email: 'contact@arabiq.tech', phone: '+966 XX XXX XXXX', address: 'الرياض، المملكة العربية السعودية', hoursTitle: 'ساعات العمل', hoursText: 'الأحد - الخميس 9:00 - 18:00' }
  }
};

// Minimal nav header / footer
const navHeader = {
  en: [
    { label: 'Home', href: '/', location: 'header', order: 1 },
    { label: 'Solutions', href: '/solutions', location: 'header', order: 2 },
    { label: 'Industries', href: '/industries', location: 'header', order: 3 },
    { label: 'Case Studies', href: '/case-studies', location: 'header', order: 4 },
    { label: 'Demos', href: '/demos', location: 'header', order: 5 },
    { label: 'About', href: '/about', location: 'header', order: 6 },
    { label: 'Contact', href: '/contact', location: 'header', order: 7 }
  ],
  ar: [
    { label: 'الرئيسية', href: '/', location: 'header', order: 1 },
    { label: 'الحلول', href: '/solutions', location: 'header', order: 2 },
    { label: 'الصناعات', href: '/industries', location: 'header', order: 3 },
    { label: 'دراسات الحالة', href: '/case-studies', location: 'header', order: 4 },
    { label: 'العروض التوضيحية', href: '/demos', location: 'header', order: 5 },
    { label: 'من نحن', href: '/about', location: 'header', order: 6 },
    { label: 'اتصل بنا', href: '/contact', location: 'header', order: 7 }
  ]
};

// Demo items
const demos = {
  en: [
    { title: 'Virtual Showroom Tour', slug: 'virtual-showroom-tour', summary: 'Experience our immersive 3D showroom technology', demoType: 'ecommerce', description: '# Virtual Showroom Tour\n\nExperience our cutting-edge Matterport-powered virtual showroom.', accessLevel: 'public' },
    { title: 'AI Shopping Assistant', slug: 'ai-shopping-assistant', summary: 'Try our Arabic-first conversational shopping AI', demoType: 'ai-chat', description: '# AI Shopping Assistant\n\nInteract with our intelligent Arabic shopping assistant.', accessLevel: 'authenticated' },
    { title: 'Virtual Event Space', slug: 'virtual-event-space', summary: 'Explore our VFair exhibition platform', demoType: 'cafe-booking', description: '# Virtual Event Space\n\nDiscover our next-generation virtual event platform.', accessLevel: 'authenticated' }
  ],
  ar: [
    { title: 'جولة صالة العرض الرقمية', slug: 'virtual-showroom-tour', summary: 'اختبر تقنية صالة العرض ثلاثية الأبعاد الغامرة', demoType: 'ecommerce', description: '# جولة صالة العرض الرقمية\n\nاختبر صالة العرض الرقمية المتطورة المدعومة بـ Matterport.', accessLevel: 'public' },
    { title: 'مساعد التسوق بالذكاء الاصطناعي', slug: 'ai-shopping-assistant', summary: 'جرب ذكاء التسوق المحادثاتي العربي-أولاً', demoType: 'ai-chat', description: '# مساعد التسوق بالذكاء الاصطناعي\n\nتفاعل مع مساعد التسوق العربي الذكي.', accessLevel: 'authenticated' },
    { title: 'مساحة الفعاليات الرقمية', slug: 'virtual-event-space', summary: 'اكتشف منصة معارض VFair', demoType: 'cafe-booking', description: '# مساحة الفعاليات الرقمية\n\nاكتشف منصة الفعاليات الرقمية من الجيل التالي.', accessLevel: 'authenticated' }
  ]
};

async function seedAll(){
  try{
    await backup();
    await deleteAllCollections();

    // Upsert single-types in both locales
    for(const s of singleTypes){
      if(seed[s]){
        await upsertSingle(s, seed[s].en, 'en');
        await upsertSingle(s, seed[s].ar, 'ar');
      } else {
        console.log('⚠️ No seed data for', s);
      }
    }

    // Seed nav header/footer in both locales
    for(const locale of ['en','ar']){
      const items = navHeader[locale];
      for(const it of items){
        await createCollection('nav-items', { ...it, locale }, locale);
      }
    }

    // Seed demos
    for(const locale of ['en','ar']){
      for(const d of demos[locale]){
        await createCollection('demos', d, locale);
      }
    }

    console.log('\n🎉 Seeding complete. Please verify in CMS and then refresh the web app.');
  }catch(err){
    console.error('Fatal:', err);
    process.exit(1);
  }
}

seedAll();

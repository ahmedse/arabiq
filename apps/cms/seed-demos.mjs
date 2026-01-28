#!/usr/bin/env node
import { readFileSync } from 'fs';

const TOKEN = process.argv[2] || process.env.SEED_TOKEN;
if (!TOKEN) {
  console.error('❌ No API token provided. Usage: node seed-demos.mjs <token>');
  process.exit(1);
}

const API_URL = 'http://localhost:1337';

async function upsertDemo(data, locale) {
  // Check if demo exists
  const checkUrl = `${API_URL}/api/demos?filters[slug][$eq]=${data.slug}&locale=${locale}`;
  const checkRes = await fetch(checkUrl, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  const existing = await checkRes.json();

  const url = existing.data?.length > 0
    ? `${API_URL}/api/demos/${existing.data[0].documentId}`
    : `${API_URL}/api/demos`;
  
  const method = existing.data?.length > 0 ? 'PUT' : 'POST';

  const res = await fetch(url + `?locale=${locale}`, {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ data })
  });

  if (!res.ok) {
    const error = await res.json();
    console.error(`❌ Failed ${data.slug} (${locale}):`, JSON.stringify(error));
    return false;
  }

  // Publish the demo
  if (existing.data?.length > 0) {
    const publishRes = await fetch(`${API_URL}/api/demos/${existing.data[0].documentId}/actions/publish`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
  }

  console.log(`✅ Upserted demo: ${data.slug} (${locale})`);
  return true;
}

const demosEN = [
  {
    title: 'Virtual Showroom Tour',
    slug: 'virtual-showroom-tour',
    summary: 'Experience our immersive 3D showroom technology',
    demoType: 'ecommerce',
    description: '# Virtual Showroom Tour\n\nExperience our cutting-edge Matterport-powered virtual showroom.',
    accessLevel: 'public',
    allowedRoles: []
  },
  {
    title: 'AI Shopping Assistant',
    slug: 'ai-shopping-assistant',
    summary: 'Try our Arabic-first conversational shopping AI',
    demoType: 'ai-chat',
    description: '# AI Shopping Assistant\n\nInteract with our intelligent Arabic shopping assistant.',
    accessLevel: 'authenticated',
    allowedRoles: []
  },
  {
    title: 'Virtual Event Space',
    slug: 'virtual-event-space',
    summary: 'Explore our VFair exhibition platform',
    demoType: 'cafe-booking',
    description: '# Virtual Event Space\n\nDiscover our next-generation virtual event platform.',
    accessLevel: 'authenticated',
    allowedRoles: []
  }
];

const demosAR = [
  {
    title: 'جولة صالة العرض الرقمية',
    slug: 'virtual-showroom-tour',
    summary: 'اختبر تقنية صالة العرض ثلاثية الأبعاد الغامرة',
    demoType: 'ecommerce',
    description: '# جولة صالة العرض الرقمية\n\nاختبر صالة العرض الرقمية المتطورة المدعومة بـ Matterport.',
    accessLevel: 'public',
    allowedRoles: []
  },
  {
    title: 'مساعد التسوق بالذكاء الاصطناعي',
    slug: 'ai-shopping-assistant',
    summary: 'جرب ذكاء التسوق المحادثاتي العربي-أولاً',
    demoType: 'ai-chat',
    description: '# مساعد التسوق بالذكاء الاصطناعي\n\nتفاعل مع مساعد التسوق العربي الذكي.',
    accessLevel: 'authenticated',
    allowedRoles: []
  },
  {
    title: 'مساحة الفعاليات الرقمية',
    slug: 'virtual-event-space',
    summary: 'اكتشف منصة معارض VFair',
    demoType: 'cafe-booking',
    description: '# مساحة الفعاليات الرقمية\n\nاكتشف منصة الفعاليات الرقمية من الجيل التالي.',
    accessLevel: 'authenticated',
    allowedRoles: []
  }
];

async function main() {
  console.log('🎬 Seeding Demos...\n');

  for (const demo of demosEN) {
    await upsertDemo(demo, 'en');
  }

  for (const demo of demosAR) {
    await upsertDemo(demo, 'ar');
  }

  console.log('\n✨ Demos seeded successfully!');
}

main().catch(console.error);

#!/usr/bin/env node
/**
 * Seed Team Members and Values for Arabiq CMS
 */

const STRAPI_URL = 'http://127.0.0.1:1337';

// Get token from .env.local
let adminToken;
try {
  const fs = await import('fs');
  const realFs = fs?.default || fs;
  const content = realFs.readFileSync('.env.local', 'utf8');
  const match = content.match(/^SEED_TOKEN=(.+)$/m);
  if (match) adminToken = match[1].trim();
} catch (e) {}

if (!adminToken) {
  console.error('❌ SEED_TOKEN not found in .env.local');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${adminToken}`
};

async function request(path, opts = {}) {
  const url = `${STRAPI_URL}${path}`;
  const res = await fetch(url, { ...opts, headers: { ...headers, ...(opts.headers || {}) } });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  return { ok: res.ok, status: res.status, body };
}

async function upsertByName(type, enData, arData) {
  // Check if EN exists
  const params = new URLSearchParams();
  params.set('filters[name][$eq]', enData.name);
  params.set('locale', 'en');
  params.set('pagination[limit]', '1');
  const check = await request(`/api/${type}?${params}`);
  
  if (check.ok && check.body?.data?.length > 0) {
    console.log(`  ⏭️  Skipped ${type} (EN): ${enData.name} (exists)`);
    return;
  }

  // Create EN
  const enRes = await request(`/api/${type}?locale=en`, {
    method: 'POST',
    body: JSON.stringify({ data: enData })
  });
  if (enRes.ok) {
    console.log(`  ✅ Created ${type} (EN): ${enData.name}`);
  } else {
    console.log(`  ❌ Failed ${type} (EN): ${enData.name}`, enRes.body?.error?.message);
    return;
  }

  // Create AR
  const arRes = await request(`/api/${type}?locale=ar`, {
    method: 'POST',
    body: JSON.stringify({ data: arData })
  });
  if (arRes.ok) {
    console.log(`  ✅ Created ${type} (AR): ${arData.name || arData.title}`);
  }
}

async function upsertByTitle(type, enData, arData) {
  // Check if EN exists
  const params = new URLSearchParams();
  params.set('filters[title][$eq]', enData.title);
  params.set('locale', 'en');
  params.set('pagination[limit]', '1');
  const check = await request(`/api/${type}?${params}`);
  
  if (check.ok && check.body?.data?.length > 0) {
    console.log(`  ⏭️  Skipped ${type} (EN): ${enData.title} (exists)`);
    return;
  }

  // Create EN
  const enRes = await request(`/api/${type}?locale=en`, {
    method: 'POST',
    body: JSON.stringify({ data: enData })
  });
  if (enRes.ok) {
    console.log(`  ✅ Created ${type} (EN): ${enData.title}`);
  } else {
    console.log(`  ❌ Failed ${type} (EN): ${enData.title}`, enRes.body?.error?.message);
    return;
  }

  // Create AR
  const arRes = await request(`/api/${type}?locale=ar`, {
    method: 'POST',
    body: JSON.stringify({ data: arData })
  });
  if (arRes.ok) {
    console.log(`  ✅ Created ${type} (AR): ${arData.title}`);
  }
}

async function seed() {
  console.log('🌱 Seeding Team Members and Values...\n');

  // TEAM MEMBERS
  console.log('👥 Team Members...');
  
  await upsertByName('team-members', 
    { name: 'Ahmed Al-Rashid', position: 'Founder & CEO', bio: 'Visionary leader with 15+ years in digital innovation, driving MENA digital transformation.', order: 1, linkedinUrl: 'https://linkedin.com/in/ahmedalrashid' },
    { name: 'أحمد الراشد', position: 'المؤسس والرئيس التنفيذي', bio: 'قائد رؤيوي بخبرة أكثر من 15 عامًا في الابتكار الرقمي، يقود التحول الرقمي في منطقة الشرق الأوسط وشمال إفريقيا.', order: 1, linkedinUrl: 'https://linkedin.com/in/ahmedalrashid' }
  );
  
  await upsertByName('team-members',
    { name: 'Sara El-Masri', position: 'Chief Technology Officer', bio: 'Tech architect specializing in immersive technologies and AI solutions for Arabic markets.', order: 2, linkedinUrl: 'https://linkedin.com/in/saraelmasri' },
    { name: 'سارة المصري', position: 'الرئيس التنفيذي للتقنية', bio: 'مهندسة تقنية متخصصة في التقنيات الغامرة وحلول الذكاء الاصطناعي للأسواق العربية.', order: 2, linkedinUrl: 'https://linkedin.com/in/saraelmasri' }
  );
  
  await upsertByName('team-members',
    { name: 'Omar Khalil', position: 'Head of Product', bio: 'Product strategist with a passion for creating seamless digital experiences.', order: 3, linkedinUrl: 'https://linkedin.com/in/omarkhalil' },
    { name: 'عمر خليل', position: 'رئيس قسم المنتجات', bio: 'استراتيجي منتجات شغوف بإنشاء تجارب رقمية سلسة.', order: 3, linkedinUrl: 'https://linkedin.com/in/omarkhalil' }
  );
  
  await upsertByName('team-members',
    { name: 'Layla Hassan', position: 'Creative Director', bio: 'Award-winning designer bringing brands to life in 3D virtual spaces.', order: 4, linkedinUrl: 'https://linkedin.com/in/laylahassan' },
    { name: 'ليلى حسن', position: 'المديرة الإبداعية', bio: 'مصممة حائزة على جوائز تحيي العلامات التجارية في الفضاءات الافتراضية ثلاثية الأبعاد.', order: 4, linkedinUrl: 'https://linkedin.com/in/laylahassan' }
  );

  // VALUES
  console.log('\n💎 Company Values...');
  
  await upsertByTitle('values',
    { title: 'Innovation First', description: 'We push boundaries and embrace cutting-edge technologies to deliver solutions that transform businesses.', icon: 'lightbulb', order: 1 },
    { title: 'الابتكار أولاً', description: 'نتجاوز الحدود ونتبنى أحدث التقنيات لتقديم حلول تحول الأعمال.', icon: 'lightbulb', order: 1 }
  );
  
  await upsertByTitle('values',
    { title: 'Arabic Excellence', description: 'We are committed to delivering world-class digital experiences tailored for Arabic-speaking markets.', icon: 'globe', order: 2 },
    { title: 'التميز العربي', description: 'نلتزم بتقديم تجارب رقمية عالمية المستوى مصممة خصيصًا للأسواق الناطقة بالعربية.', icon: 'globe', order: 2 }
  );
  
  await upsertByTitle('values',
    { title: 'Customer Success', description: 'Your success is our success. We partner with clients to achieve measurable business outcomes.', icon: 'users', order: 3 },
    { title: 'نجاح العملاء', description: 'نجاحكم هو نجاحنا. نشارك العملاء لتحقيق نتائج أعمال قابلة للقياس.', icon: 'users', order: 3 }
  );
  
  await upsertByTitle('values',
    { title: 'Integrity', description: 'We build trust through transparency, honesty, and delivering on our promises.', icon: 'shield', order: 4 },
    { title: 'النزاهة', description: 'نبني الثقة من خلال الشفافية والصدق والوفاء بوعودنا.', icon: 'shield', order: 4 }
  );

  console.log('\n✨ Team Members and Values seeded!');
}

seed().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

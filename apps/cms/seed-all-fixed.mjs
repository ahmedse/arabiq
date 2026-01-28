#!/usr/bin/env node
// Seeder with corrected schemas
const STRAPI_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';
const TOKEN = process.argv[2] || process.env.SEED_TOKEN;
if (!TOKEN) { console.error('❌ Token required'); process.exit(1); }
const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` };

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function create(apiPath, data, locale = 'en') {
  const url = `${STRAPI_URL}/api/${apiPath}${locale ? `?locale=${locale}` : ''}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ data }) });
  if (!res.ok) { console.error(`❌ ${apiPath} (${locale}): ${res.status}`); return null; }
  const json = await res.json();
  console.log(`✅ Created ${apiPath} id=${json.data.id} (${locale})`);
  return json.data;
}

const statsEN = [
  { value: '100+', label: 'Happy Clients', order: 1 },
  { value: '500+', label: 'Digital Twins', order: 2 },
  { value: '98%', label: 'Satisfaction', order: 3 },
  { value: '12', label: 'Countries', order: 4 }
];

const statsAR = [
  { value: '100+', label: 'عملاء سعداء', order: 1 },
  { value: '500+', label: 'توأم رقمي', order: 2 },
  { value: '98%', label: 'رضا العملاء', order: 3 },
  { value: '12', label: 'دولة', order: 4 }
];

const solutionsEN = [
  { title: 'Vmall Platform', slug: 'vmall-platform-en', summary: 'Virtual mall platform', description: 'Create 3D virtual malls', body: 'Full 3D virtual mall creation with AI and commerce', icon: '🏬', allowedRoles: [] },
  { title: 'AI Suite', slug: 'ai-suite-en', summary: 'Arabic AI tools', description: 'AI for voice, chat, vision', body: 'Complete Arabic AI suite for commerce', icon: '🤖', allowedRoles: [] },
  { title: 'Commerce', slug: 'commerce-en', summary: 'E-commerce backend', description: 'Complete commerce system', body: 'Products, cart, checkout, payments', icon: '🛒', allowedRoles: [] }
];

const solutionsAR = [
  { title: 'منصة Vmall', slug: 'vmall-platform-ar', summary: 'منصة المراكز الافتراضية', description: 'إنشاء مراكز تسوق ثلاثية الأبعاد', body: 'إنشاء مراكز تسوق افتراضية ثلاثية الأبعاد كاملة مع الذكاء الاصطناعي والتجارة', icon: '🏬', allowedRoles: [] },
  { title: 'مجموعة AI', slug: 'ai-suite-ar', summary: 'أدوات الذكاء الاصطناعي العربي', description: 'الذكاء الاصطناعي للصوت والدردشة والرؤية', body: 'مجموعة الذكاء الاصطناعي العربية الكاملة للتجارة', icon: '🤖', allowedRoles: [] },
  { title: 'التجارة', slug: 'commerce-ar', summary: 'نظام التجارة الإلكترونية', description: 'نظام تجارة كامل', body: 'المنتجات والسلة والدفع والمدفوعات', icon: '🛒', allowedRoles: [] }
];

const industriesEN = [
  { title: 'Retail', slug: 'retail-en', icon: '🛍️', summary: '3D stores', description: 'Virtual retail', body: 'Immersive shopping experiences' },
  { title: 'Real Estate', slug: 'real-estate-en', icon: '🏢', summary: 'Property tours', description: 'Virtual properties', body: 'Remote property viewing' },
  { title: 'Tourism', slug: 'tourism-en', icon: '✈️', summary: 'Virtual travel', description: 'Destination previews', body: 'Virtual hotel and attraction tours' }
];

const industriesAR = [
  { title: 'التجزئة', slug: 'retail-ar', icon: '🛍️', summary: 'متاجر ثلاثية الأبعاد', description: 'التجزئة الافتراضية', body: 'تجارب تسوق غامرة' },
  { title: 'العقارات', slug: 'real-estate-ar', icon: '🏢', summary: 'جولات عقارية', description: 'عقارات افتراضية', body: 'مشاهدة العقارات عن بعد' },
  { title: 'السياحة', slug: 'tourism-ar', icon: '✈️', summary: 'السفر الافتراضي', description: 'معاينات الوجهات', body: 'جولات افتراضية للفنادق والمعالم السياحية' }
];

const caseStudiesEN = [
  { title: 'Museum Twin', slug: 'museum-twin-en', client: 'Alexandria Museum', industry: 'Tourism', summary: 'Digital heritage', description: 'Virtual museum', body: '500K visitors, 85% engagement', allowedRoles: [] },
  { title: 'Fashion Mall', slug: 'fashion-mall-en', client: 'Cairo Fashion', industry: 'Retail', summary: 'Virtual mall', description: '50+ vendors online', body: '200% traffic increase', allowedRoles: [] }
];

const caseStudiesAR = [
  { title: 'التوأم الرقمي للمتحف', slug: 'museum-twin-ar', client: 'متحف الإسكندرية', industry: 'السياحة', summary: 'التراث الرقمي', description: 'متحف افتراضي', body: '500 ألف زائر، مشاركة 85%', allowedRoles: [] },
  { title: 'مركز الأزياء', slug: 'fashion-mall-ar', client: 'أزياء القاهرة', industry: 'التجزئة', summary: 'مركز افتراضي', description: 'أكثر من 50 بائع', body: 'زيادة 200% في الزيارات', allowedRoles: [] }
];

const processEN = [
  { step: 1, title: 'Consultation', description: 'Understand goals and design experience', icon: '💬' },
  { step: 2, title: '3D Scanning', description: 'Professional photorealistic scanning', icon: '📸' },
  { step: 3, title: 'Enhancement', description: 'Add hotspots, AI, and commerce', icon: '⚡' },
  { step: 4, title: 'Launch', description: 'Go live with analytics and support', icon: '🚀' }
];

const processAR = [
  { step: 1, title: 'الاستشارة', description: 'فهم الأهداف وتصميم التجربة', icon: '💬' },
  { step: 2, title: 'المسح ثلاثي الأبعاد', description: 'مسح احترافي واقعي', icon: '📸' },
  { step: 3, title: 'التحسين', description: 'إضافة النقاط الساخنة والذكاء الاصطناعي والتجارة', icon: '⚡' },
  { step: 4, title: 'الإطلاق', description: 'الانطلاق مع التحليلات والدعم', icon: '🚀' }
];

const teamEN = [
  { name: 'Ahmed Al-Rashid', position: 'CEO', bio: '15+ years in tech', order: 1 },
  { name: 'Fatima Hassan', position: 'CTO', bio: 'AI expert, MIT grad', order: 2 },
  { name: 'Omar Khalil', position: 'Head of Design', bio: 'Award-winning UX designer', order: 3 }
];

const teamAR = [
  { name: 'أحمد الرشيد', position: 'الرئيس التنفيذي', bio: 'أكثر من 15 عامًا في التكنولوجيا', order: 1 },
  { name: 'فاطمة حسن', position: 'المدير التنفيذي للتكنولوجيا', bio: 'خبير الذكاء الاصطناعي', order: 2 },
  { name: 'عمر خليل', position: 'رئيس التصميم', bio: 'مصمم تجربة مستخدم حائز على جوائز', order: 3 }
];

const valuesEN = [
  { title: 'Arabic-First', description: 'Built for Arabic and RTL', icon: '🌍', order: 1 },
  { title: 'Innovation', description: 'Pioneering immersive commerce', icon: '💡', order: 2 },
  { title: 'Quality', description: 'Enterprise-grade, 99.9% uptime', icon: '⭐', order: 3 }
];

const valuesAR = [
  { title: 'العربية أولاً', description: 'مبني للعربية', icon: '🌍', order: 1 },
  { title: 'الابتكار', description: 'ريادة التجارة الغامرة', icon: '💡', order: 2 },
  { title: 'الجودة', description: 'مستوى المؤسسات، 99.9%', icon: '⭐', order: 3 }
];

const companies = [
  { name: 'Saudi Aramco', order: 1 },
  { name: 'Emaar', order: 2 },
  { name: 'SABIC', order: 3 },
  { name: 'Etisalat', order: 4 }
];

async function main() {
  console.log('🌱 Seeding...\n');
  console.log('=== STATS ===');
  for (const s of statsEN) await create('stats', s, 'en');
  await sleep(100);
  for (const s of statsAR) await create('stats', s, 'ar');
  
  console.log('\n=== SOLUTIONS ===');
  for (const s of solutionsEN) await create('solutions', s, 'en');
  await sleep(100);
  for (const s of solutionsAR) await create('solutions', s, 'ar');
  
  console.log('\n=== INDUSTRIES ===');
  for (const i of industriesEN) await create('industries', i, 'en');
  await sleep(100);
  for (const i of industriesAR) await create('industries', i, 'ar');
  
  console.log('\n=== CASE STUDIES ===');
  for (const c of caseStudiesEN) await create('case-studies', c, 'en');
  await sleep(100);
  for (const c of caseStudiesAR) await create('case-studies', c, 'ar');
  
  console.log('\n=== PROCESS STEPS ===');
  for (const p of processEN) await create('process-steps', p, 'en');
  await sleep(100);
  for (const p of processAR) await create('process-steps', p, 'ar');
  
  console.log('\n=== TEAM ===');
  for (const t of teamEN) await create('team-members', t, 'en');
  await sleep(100);
  for (const t of teamAR) await create('team-members', t, 'ar');
  
  console.log('\n=== VALUES ===');
  for (const v of valuesEN) await create('values', v, 'en');
  await sleep(100);
  for (const v of valuesAR) await create('values', v, 'ar');
  
  console.log('\n=== COMPANIES ===');
  for (const c of companies) await create('trusted-companies', c, null);
  
  console.log('\n🎉 Complete!');
}

main().catch(console.error);

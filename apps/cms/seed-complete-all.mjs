#!/usr/bin/env node
/*
 * Complete seeder for all Arabiq CMS collections
 * Seeds: stats, features, solutions, industries, case-studies, 
 *        trusted-companies, process-steps, team-members, values
 */

const STRAPI_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';
const TOKEN = process.argv[2] || process.env.SEED_TOKEN;
if (!TOKEN) {
  console.error('❌ Token required. Usage: node seed-complete-all.mjs <TOKEN>');
  process.exit(1);
}
const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` };

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function create(apiPath, data, locale = 'en') {
  const url = `${STRAPI_URL}/api/${apiPath}?locale=${locale}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ data }) });
  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ Failed to create ${apiPath} (${locale}): ${res.status} ${text.substring(0, 200)}`);
    return null;
  }
  const json = await res.json();
  console.log(`✅ Created ${apiPath} id=${json.data.id} (${locale})`);
  return json.data;
}

// Stats data (fields: label, order, value)
const statsEN = [
  { value: '100+', label: 'Happy Clients', order: 1 },
  { value: '500+', label: 'Digital Twins Created', order: 2 },
  { value: '98%', label: 'Client Satisfaction', order: 3 },
  { value: '12', label: 'Countries Served', order: 4 }
];

const statsAR = [
  { value: '100+', label: 'عملاء سعداء', order: 1 },
  { value: '500+', label: 'توأم رقمي تم إنشاؤها', order: 2 },
  { value: '98%', label: 'رضا العملاء', order: 3 },
  { value: '12', label: 'دولة يتم خدمتها', order: 4 }
];

// Features data
const featuresEN = [
  {
    title: '3D Virtual Tours',
    description: 'Immersive 360° tours with photorealistic quality and smooth navigation',
    icon: '🏛️',
    order: 1
  },
  {
    title: 'AI-Powered Analytics',
    description: 'Smart insights into visitor behavior, heat maps, and engagement metrics',
    icon: '📊',
    order: 2
  },
  {
    title: 'Arabic Voice AI',
    description: 'Natural Arabic voice narration and conversational commerce assistant',
    icon: '🎤',
    order: 3
  },
  {
    title: 'E-Commerce Integration',
    description: 'Seamless shopping experience with cart, checkout, and payment processing',
    icon: '🛒',
    order: 4
  },
  {
    title: 'Multi-Platform',
    description: 'Works on web, mobile, VR headsets, and embedded in apps',
    icon: '📱',
    order: 5
  },
  {
    title: 'Real-Time Collaboration',
    description: 'Multiple users can explore together with live chat and guidance',
    icon: '👥',
    order: 6
  }
];

const featuresAR = [
  {
    title: 'جولات افتراضية ثلاثية الأبعاد',
    description: 'جولات غامرة بزاوية 360° بجودة واقعية وتنقل سلس',
    icon: '🏛️',
    order: 1
  },
  {
    title: 'تحليلات مدعومة بالذكاء الاصطناعي',
    description: 'رؤى ذكية حول سلوك الزوار وخرائط الحرارة ومقاييس المشاركة',
    icon: '📊',
    order: 2
  },
  {
    title: 'صوت الذكاء الاصطناعي العربي',
    description: 'سرد صوتي عربي طبيعي ومساعد تجارة محادثة',
    icon: '🎤',
    order: 3
  },
  {
    title: 'تكامل التجارة الإلكترونية',
    description: 'تجربة تسوق سلسة مع السلة والدفع ومعالجة الدفع',
    icon: '🛒',
    order: 4
  },
  {
    title: 'متعدد المنصات',
    description: 'يعمل على الويب والهاتف المحمول وسماعات الواقع الافتراضي والتطبيقات المضمنة',
    icon: '📱',
    order: 5
  },
  {
    title: 'التعاون في الوقت الفعلي',
    description: 'يمكن لعدة مستخدمين الاستكشاف معًا مع الدردشة الحية والإرشاد',
    icon: '👥',
    order: 6
  }
];

// Solutions data (fields: title, slug, description, summary, body, icon, allowedRoles)
const solutionsEN = [
  {
    title: 'Vmall Platform',
    slug: 'vmall-platform',
    summary: 'Virtual mall and 3D store creation platform',
    description: 'Create and manage virtual malls with 3D stores, exhibitions, and showrooms. Perfect for retail and e-commerce businesses.',
    body: 'The Vmall Platform enables businesses to create immersive 3D virtual spaces. Features include multi-vendor support, product hotspots, analytics dashboard, and seamless integration with existing e-commerce systems.',
    icon: '🏬'
  },
  {
    title: 'Arabiq AI Suite',
    slug: 'arabiq-ai-suite',
    summary: 'Arabic-first AI for voice, chat, and vision',
    description: 'Arabic-first AI modules for voice, chat, vision, recommendations, and analytics. Built specifically for MENA market.',
    body: 'Our AI Suite includes Arabic Voice AI, Conversational Commerce assistant, Smart Recommendations engine, and advanced Behavior Analytics. All optimized for Arabic language and cultural context.',
    icon: '🤖'
  },
  {
    title: 'Arabiq Commerce',
    slug: 'arabiq-commerce',
    summary: 'Complete e-commerce backend solution',
    description: 'Complete e-commerce backend with products, inventory, carts, and payments. Enterprise-grade and scalable.',
    body: 'Full-featured commerce platform with product management, shopping cart, multiple payment gateways, order tracking, and inventory management. Integrates seamlessly with Vmall and other Arabiq products.',
    icon: '🛒'
  },
  {
    title: 'Enterprise Integration',
    slug: 'enterprise-integration',
    summary: 'Connect with existing enterprise systems',
    description: 'Connect with existing ERP, CRM, and inventory systems. Custom integrations and workflows available.',
    body: 'Our integration suite connects Arabiq platform with your existing enterprise systems through REST APIs, webhooks, and custom connectors. Includes SSO authentication, data synchronization, and custom workflow automation.',
    icon: '🔗'
  }
];

const solutionsAR = [
  {
    title: 'منصة Vmall',
    slug: 'vmall-platform',
    summary: 'منصة إنشاء المراكز التجارية والمتاجر ثلاثية الأبعاد',
    description: 'إنشاء وإدارة مراكز التسوق الافتراضية مع متاجر ثلاثية الأبعاد ومعارض وصالات عرض. مثالي للبيع بالتجزئة والتجارة الإلكترونية.',
    body: 'تمكن منصة Vmall الشركات من إنشاء مساحات افتراضية ثلاثية الأبعاد غامرة. تتضمن الميزات دعم متعدد البائعين ونقاط المنتج الساخنة ولوحة التحليلات والتكامل السلس مع أنظمة التجارة الإلكترونية الموجودة.',
    icon: '🏬'
  },
  {
    title: 'مجموعة Arabiq AI',
    slug: 'arabiq-ai-suite',
    summary: 'الذكاء الاصطناعي العربي للصوت والدردشة والرؤية',
    description: 'وحدات الذكاء الاصطناعي العربية للصوت والدردشة والرؤية والتوصيات والتحليلات. مبنية خصيصًا لسوق الشرق الأوسط وشمال إفريقيا.',
    body: 'تتضمن مجموعة الذكاء الاصطناعي لدينا صوت الذكاء الاصطناعي العربي ومساعد التجارة المحادثة ومحرك التوصيات الذكية وتحليلات السلوك المتقدمة. كل ذلك محسّن للغة العربية والسياق الثقافي.',
    icon: '🤖'
  },
  {
    title: 'Arabiq Commerce',
    slug: 'arabiq-commerce',
    summary: 'حل خلفي كامل للتجارة الإلكترونية',
    description: 'نظام التجارة الإلكترونية الكامل مع المنتجات والمخزون والعربات والمدفوعات. على مستوى المؤسسات وقابل للتطوير.',
    body: 'منصة تجارية كاملة الميزات مع إدارة المنتجات وسلة التسوق وبوابات دفع متعددة وتتبع الطلبات وإدارة المخزون. تتكامل بسلاسة مع Vmall ومنتجات Arabiq الأخرى.',
    icon: '🛒'
  },
  {
    title: 'تكامل المؤسسات',
    slug: 'enterprise-integration',
    summary: 'الاتصال بأنظمة المؤسسات الموجودة',
    description: 'الاتصال بأنظمة ERP و CRM والمخزون الموجودة. التكاملات وسير العمل المخصصة متاحة.',
    body: 'تربط مجموعة التكامل لدينا منصة Arabiq بأنظمة المؤسسات الموجودة من خلال REST APIs و webhooks والموصلات المخصصة. تتضمن مصادقة SSO ومزامنة البيانات وأتمتة سير العمل المخصصة.',
    icon: '🔗'
  }
];

// Industries data
const industriesEN = [
  { name: 'Retail & E-Commerce', slug: 'retail-ecommerce', icon: '🛍️', order: 1 },
  { name: 'Real Estate', slug: 'real-estate', icon: '🏢', order: 2 },
  { name: 'Tourism & Hospitality', slug: 'tourism-hospitality', icon: '✈️', order: 3 },
  { name: 'Events & Exhibitions', slug: 'events-exhibitions', icon: '🎪', order: 4 },
  { name: 'Education', slug: 'education', icon: '🎓', order: 5 },
  { name: 'Healthcare', slug: 'healthcare', icon: '⚕️', order: 6 }
];

const industriesAR = [
  { name: 'التجزئة والتجارة الإلكترونية', slug: 'retail-ecommerce', icon: '🛍️', order: 1 },
  { name: 'العقارات', slug: 'real-estate', icon: '🏢', order: 2 },
  { name: 'السياحة والضيافة', slug: 'tourism-hospitality', icon: '✈️', order: 3 },
  { name: 'الفعاليات والمعارض', slug: 'events-exhibitions', icon: '🎪', order: 4 },
  { name: 'التعليم', slug: 'education', icon: '🎓', order: 5 },
  { name: 'الرعاية الصحية', slug: 'healthcare', icon: '⚕️', order: 6 }
];

// Case Studies data
const caseStudiesEN = [
  {
    title: 'Alexandria Museum Digital Twin',
    slug: 'alexandria-museum-digital-twin',
    client: 'Alexandria National Museum',
    industry: 'Tourism',
    challenge: 'Preserve cultural heritage and reach global audiences',
    solution: 'Created immersive 3D virtual museum with Arabic/English narration',
    results: ['500K+ visitors in first year', '85% engagement rate', '120+ countries reached'],
    metrics: { visitors: '500000', engagement: '85', countries: '120' },
    order: 1
  },
  {
    title: 'Cairo Fashion Hub Virtual Mall',
    slug: 'cairo-fashion-hub-vmall',
    client: 'Cairo Fashion District',
    industry: 'Retail',
    challenge: 'Transition 50+ fashion vendors to online presence',
    solution: 'Built virtual 3D mall with individual branded stores',
    results: ['200% increase in foot traffic', '3x online sales', '24/7 accessibility'],
    metrics: { traffic: '200', sales: '300', uptime: '100' },
    order: 2
  },
  {
    title: 'Dubai Property Virtual Showcase',
    slug: 'dubai-property-showcase',
    client: 'Emirates Real Estate',
    industry: 'Real Estate',
    challenge: 'Remote property viewing for international buyers',
    solution: 'Virtual property tours with AI assistant in Arabic/English',
    results: ['60% reduction in site visits', '45% faster sales cycle', '90% client satisfaction'],
    metrics: { efficiency: '60', speed: '45', satisfaction: '90' },
    order: 3
  }
];

const caseStudiesAR = [
  {
    title: 'التوأم الرقمي لمتحف الإسكندرية',
    slug: 'alexandria-museum-digital-twin',
    client: 'متحف الإسكندرية القومي',
    industry: 'السياحة',
    challenge: 'الحفاظ على التراث الثقافي والوصول إلى الجماهير العالمية',
    solution: 'إنشاء متحف افتراضي ثلاثي الأبعاد غامر مع سرد عربي/إنجليزي',
    results: ['أكثر من 500 ألف زائر في السنة الأولى', 'معدل مشاركة 85٪', 'الوصول إلى أكثر من 120 دولة'],
    metrics: { visitors: '500000', engagement: '85', countries: '120' },
    order: 1
  },
  {
    title: 'مركز القاهرة للأزياء الافتراضي',
    slug: 'cairo-fashion-hub-vmall',
    client: 'حي القاهرة للأزياء',
    industry: 'التجزئة',
    challenge: 'نقل أكثر من 50 بائع أزياء إلى الحضور عبر الإنترنت',
    solution: 'بناء مركز تسوق افتراضي ثلاثي الأبعاد مع متاجر ذات علامات تجارية فردية',
    results: ['زيادة بنسبة 200٪ في حركة المرور', '3 أضعاف المبيعات عبر الإنترنت', 'إمكانية الوصول على مدار الساعة طوال أيام الأسبوع'],
    metrics: { traffic: '200', sales: '300', uptime: '100' },
    order: 2
  },
  {
    title: 'معرض العقارات الافتراضي في دبي',
    slug: 'dubai-property-showcase',
    client: 'الإمارات العقارية',
    industry: 'العقارات',
    challenge: 'مشاهدة العقارات عن بعد للمشترين الدوليين',
    solution: 'جولات عقارية افتراضية مع مساعد الذكاء الاصطناعي بالعربية/الإنجليزية',
    results: ['انخفاض بنسبة 60٪ في زيارات الموقع', 'دورة مبيعات أسرع بنسبة 45٪', 'رضا العملاء بنسبة 90٪'],
    metrics: { efficiency: '60', speed: '45', satisfaction: '90' },
    order: 3
  }
];

// Trusted Companies
const trustedCompanies = [
  { name: 'Saudi Aramco', logo: null, order: 1 },
  { name: 'Emaar Properties', logo: null, order: 2 },
  { name: 'SABIC', logo: null, order: 3 },
  { name: 'Etisalat', logo: null, order: 4 },
  { name: 'Qatar Airways', logo: null, order: 5 },
  { name: 'Dubai Mall', logo: null, order: 6 }
];

// Process Steps data
const processStepsEN = [
  {
    step: 1,
    title: 'Consultation & Planning',
    description: 'We understand your goals and design the perfect virtual experience',
    icon: '💬',
    order: 1
  },
  {
    step: 2,
    title: '3D Scanning & Capture',
    description: 'Professional on-site 3D scanning with photorealistic quality',
    icon: '📸',
    order: 2
  },
  {
    step: 3,
    title: 'Enhancement & Integration',
    description: 'Add interactive hotspots, AI features, and e-commerce capabilities',
    icon: '⚡',
    order: 3
  },
  {
    step: 4,
    title: 'Launch & Support',
    description: 'Go live with full analytics, training, and ongoing support',
    icon: '🚀',
    order: 4
  }
];

const processStepsAR = [
  {
    step: 1,
    title: 'الاستشارة والتخطيط',
    description: 'نفهم أهدافك ونصمم التجربة الافتراضية المثالية',
    icon: '💬',
    order: 1
  },
  {
    step: 2,
    title: 'المسح والتقاط ثلاثي الأبعاد',
    description: 'مسح ثلاثي الأبعاد احترافي في الموقع بجودة واقعية',
    icon: '📸',
    order: 2
  },
  {
    step: 3,
    title: 'التحسين والتكامل',
    description: 'إضافة نقاط ساخنة تفاعلية وميزات الذكاء الاصطناعي وقدرات التجارة الإلكترونية',
    icon: '⚡',
    order: 3
  },
  {
    step: 4,
    title: 'الإطلاق والدعم',
    description: 'الانطلاق مع التحليلات الكاملة والتدريب والدعم المستمر',
    icon: '🚀',
    order: 4
  }
];

// Team Members data
const teamMembersEN = [
  {
    name: 'Ahmed Al-Rashid',
    position: 'CEO & Founder',
    bio: '15+ years in tech, pioneering 3D commerce in MENA',
    image: null,
    order: 1
  },
  {
    name: 'Fatima Hassan',
    position: 'CTO',
    bio: 'AI & Computer Vision expert, MIT graduate',
    image: null,
    order: 2
  },
  {
    name: 'Omar Khalil',
    position: 'Head of Design',
    bio: 'Award-winning UX designer specializing in Arabic interfaces',
    image: null,
    order: 3
  },
  {
    name: 'Layla Mansour',
    position: 'VP of Sales',
    bio: 'Building partnerships across 12+ MENA countries',
    image: null,
    order: 4
  }
];

const teamMembersAR = [
  {
    name: 'أحمد الرشيد',
    position: 'الرئيس التنفيذي والمؤسس',
    bio: 'أكثر من 15 عامًا في التكنولوجيا، رائد التجارة ثلاثية الأبعاد في منطقة الشرق الأوسط وشمال إفريقيا',
    image: null,
    order: 1
  },
  {
    name: 'فاطمة حسن',
    position: 'المدير التنفيذي للتكنولوجيا',
    bio: 'خبير الذكاء الاصطناعي ورؤية الكمبيوتر، خريج معهد ماساتشوستس للتكنولوجيا',
    image: null,
    order: 2
  },
  {
    name: 'عمر خليل',
    position: 'رئيس التصميم',
    bio: 'مصمم تجربة مستخدم حائز على جوائز متخصص في الواجهات العربية',
    image: null,
    order: 3
  },
  {
    name: 'ليلى منصور',
    position: 'نائب رئيس المبيعات',
    bio: 'بناء الشراكات في أكثر من 12 دولة في منطقة الشرق الأوسط وشمال إفريقيا',
    image: null,
    order: 4
  }
];

// Values data
const valuesEN = [
  {
    title: 'Arabic-First',
    description: 'Built from the ground up for Arabic language and RTL design',
    icon: '🌍',
    order: 1
  },
  {
    title: 'Innovation',
    description: 'Pioneering the future of immersive commerce and digital experiences',
    icon: '💡',
    order: 2
  },
  {
    title: 'Quality',
    description: 'Photorealistic 3D, enterprise-grade security, 99.9% uptime',
    icon: '⭐',
    order: 3
  },
  {
    title: 'Partnership',
    description: 'Your success is our success - dedicated support every step',
    icon: '🤝',
    order: 4
  }
];

const valuesAR = [
  {
    title: 'العربية أولاً',
    description: 'مبني من الألف إلى الياء للغة العربية وتصميم من اليمين إلى اليسار',
    icon: '🌍',
    order: 1
  },
  {
    title: 'الابتكار',
    description: 'ريادة مستقبل التجارة الغامرة والتجارب الرقمية',
    icon: '💡',
    order: 2
  },
  {
    title: 'الجودة',
    description: 'ثلاثي الأبعاد واقعي، أمان على مستوى المؤسسات، وقت تشغيل 99.9٪',
    icon: '⭐',
    order: 3
  },
  {
    title: 'الشراكة',
    description: 'نجاحك هو نجاحنا - دعم مخصص في كل خطوة',
    icon: '🤝',
    order: 4
  }
];

async function seedAll() {
  console.log('🌱 Seeding all collections...\n');

  // Stats
  console.log('=== STATS ===');
  for (const stat of statsEN) await create('stats', stat, 'en');
  await sleep(100);
  for (const stat of statsAR) await create('stats', stat, 'ar');
  await sleep(100);

  // Features
  console.log('\n=== FEATURES ===');
  for (const feature of featuresEN) await create('features', feature, 'en');
  await sleep(100);
  for (const feature of featuresAR) await create('features', feature, 'ar');
  await sleep(100);

  // Solutions
  console.log('\n=== SOLUTIONS ===');
  for (const solution of solutionsEN) await create('solutions', solution, 'en');
  await sleep(100);
  for (const solution of solutionsAR) await create('solutions', solution, 'ar');
  await sleep(100);

  // Industries
  console.log('\n=== INDUSTRIES ===');
  for (const industry of industriesEN) await create('industries', industry, 'en');
  await sleep(100);
  for (const industry of industriesAR) await create('industries', industry, 'ar');
  await sleep(100);

  // Case Studies
  console.log('\n=== CASE STUDIES ===');
  for (const cs of caseStudiesEN) await create('case-studies', cs, 'en');
  await sleep(100);
  for (const cs of caseStudiesAR) await create('case-studies', cs, 'ar');
  await sleep(100);

  // Trusted Companies (no locale)
  console.log('\n=== TRUSTED COMPANIES ===');
  for (const company of trustedCompanies) {
    const url = `${STRAPI_URL}/api/trusted-companies`;
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ data: company }) });
    if (res.ok) {
      const json = await res.json();
      console.log(`✅ Created trusted-companies id=${json.data.id}`);
    } else {
      console.error(`❌ Failed trusted-companies: ${company.name}`);
    }
    await sleep(50);
  }

  // Process Steps
  console.log('\n=== PROCESS STEPS ===');
  for (const step of processStepsEN) await create('process-steps', step, 'en');
  await sleep(100);
  for (const step of processStepsAR) await create('process-steps', step, 'ar');
  await sleep(100);

  // Team Members
  console.log('\n=== TEAM MEMBERS ===');
  for (const member of teamMembersEN) await create('team-members', member, 'en');
  await sleep(100);
  for (const member of teamMembersAR) await create('team-members', member, 'ar');
  await sleep(100);

  // Values
  console.log('\n=== VALUES ===');
  for (const value of valuesEN) await create('values', value, 'en');
  await sleep(100);
  for (const value of valuesAR) await create('values', value, 'ar');

  console.log('\n🎉 All collections seeded successfully!');
}

seedAll().catch(console.error);

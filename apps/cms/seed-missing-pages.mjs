#!/usr/bin/env node

const STRAPI_URL = 'http://127.0.0.1:1337';
const TOKEN = process.argv[2] || process.env.SEED_TOKEN;

if (!TOKEN) {
  console.error('❌ Token required');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`
};

async function upsertSingle(apiPath, data, locale) {
  try {
    const res = await fetch(`${STRAPI_URL}${apiPath}?locale=${locale}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ data })
    });

    if (!res.ok) {
      const error = await res.text();
      console.error(`❌ Failed ${apiPath} (${locale}):`, error.substring(0, 150));
      return false;
    }

    console.log(`✅ Upserted ${apiPath} (${locale})`);
    return true;
  } catch (error) {
    console.error(`❌ Error ${apiPath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🌱 Filling missing content...\n');

  // Site Settings
  await upsertSingle('/api/site-setting', {
    title: 'Arabiq',
    description: 'Leading provider of virtual mall platforms, 3D scanning, and AI-powered solutions for businesses across the Middle East',
    contactEmail: 'contact@arabiq.tech',
    contactPhone: '+966 XX XXX XXXX',
    footerCompanyTitle: 'Company',
    footerProductsTitle: 'Products',
    footerResourcesTitle: 'Resources',
    footerConnectTitle: 'Connect',
    copyrightText: '© 2026 Arabiq. All rights reserved.',
    loginButtonText: 'Login'
  }, 'en');

  await upsertSingle('/api/site-setting', {
    title: 'عربق',
    description: 'المزود الرائد لمنصات المولات الافتراضية والمسح ثلاثي الأبعاد والحلول المدعومة بالذكاء الاصطناعي للشركات في الشرق الأوسط',
    contactEmail: 'contact@arabiq.tech',
    contactPhone: '+966 XX XXX XXXX',
    footerCompanyTitle: 'الشركة',
    footerProductsTitle: 'المنتجات',
    footerResourcesTitle: 'الموارد',
    footerConnectTitle: 'تواصل معنا',
    copyrightText: '© 2026 عربق. جميع الحقوق محفوظة.',
    loginButtonText: 'تسجيل الدخول'
  }, 'ar');

  // About Page
  await upsertSingle('/api/about-page', {
    heroTitle: 'About Arabiq',
    heroSubtitle: 'Pioneering Immersive Technology in the Middle East',
    missionTitle: 'Our Mission',
    missionText: 'To empower businesses across the Middle East with innovative immersive technology solutions that drive growth and digital transformation.',
    visionTitle: 'Our Vision',
    visionText: 'To become the regions most trusted partner for virtual experiences and digital innovation.',
    valuesTitle: 'Our Values',
    value1Title: 'Innovation',
    value1Text: 'We continuously push boundaries to deliver cutting-edge solutions.',
    value2Title: 'Excellence',
    value2Text: 'We maintain the highest standards in everything we do.',
    value3Title: 'Partnership',
    value3Text: 'We build lasting relationships with our clients based on trust and success.',
    teamTitle: 'Meet Our Team',
    teamSubtitle: 'Experts in immersive technology and digital transformation',
    ctaTitle: 'Ready to Transform Your Business?',
    ctaButton: 'Get Started'
  }, 'en');

  await upsertSingle('/api/about-page', {
    heroTitle: 'عن عربق',
    heroSubtitle: 'رواد التكنولوجيا الغامرة في الشرق الأوسط',
    missionTitle: 'مهمتنا',
    missionText: 'تمكين الشركات في جميع أنحاء الشرق الأوسط بحلول تكنولوجية غامرة ومبتكرة تدفع النمو والتحول الرقمي.',
    visionTitle: 'رؤيتنا',
    visionText: 'أن نصبح الشريك الأكثر ثقة في المنطقة للتجارب الافتراضية والابتكار الرقمي.',
    valuesTitle: 'قيمنا',
    value1Title: 'الابتكار',
    value1Text: 'نواصل دفع الحدود لتقديم حلول متطورة.',
    value2Title: 'التميز',
    value2Text: 'نحافظ على أعلى المعايير في كل ما نقوم به.',
    value3Title: 'الشراكة',
    value3Text: 'نبني علاقات دائمة مع عملائنا بناءً على الثقة والنجاح.',
    teamTitle: 'تعرف على فريقنا',
    teamSubtitle: 'خبراء في التكنولوجيا الغامرة والتحول الرقمي',
    ctaTitle: 'هل أنت مستعد لتحويل عملك؟',
    ctaButton: 'ابدأ الآن'
  }, 'ar');

  // Contact Page
  await upsertSingle('/api/contact-page', {
    heroTitle: 'Contact Us',
    heroSubtitle: 'Get in touch with our team',
    formTitle: 'Send us a message',
    nameLabel: 'Full Name',
    emailLabel: 'Email Address',
    phoneLabel: 'Phone Number',
    messageLabel: 'Your Message',
    submitButton: 'Send Message',
    infoTitle: 'Contact Information',
    email: 'contact@arabiq.tech',
    phone: '+966 XX XXX XXXX',
    address: 'Riyadh, Saudi Arabia',
    hoursTitle: 'Business Hours',
    hoursText: 'Sunday - Thursday: 9:00 AM - 6:00 PM\nFriday - Saturday: Closed'
  }, 'en');

  await upsertSingle('/api/contact-page', {
    heroTitle: 'اتصل بنا',
    heroSubtitle: 'تواصل مع فريقنا',
    formTitle: 'أرسل لنا رسالة',
    nameLabel: 'الاسم الكامل',
    emailLabel: 'البريد الإلكتروني',
    phoneLabel: 'رقم الهاتف',
    messageLabel: 'رسالتك',
    submitButton: 'إرسال الرسالة',
    infoTitle: 'معلومات الاتصال',
    email: 'contact@arabiq.tech',
    phone: '+966 XX XXX XXXX',
    address: 'الرياض، المملكة العربية السعودية',
    hoursTitle: 'ساعات العمل',
    hoursText: 'الأحد - الخميس: 9:00 صباحًا - 6:00 مساءً\nالجمعة - السبت: مغلق'
  }, 'ar');

  console.log('\n✨ Missing content filled!');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

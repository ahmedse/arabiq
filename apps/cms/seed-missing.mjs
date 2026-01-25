/**
 * Seed missing content fields in Strapi
 */

const STRAPI_URL = 'http://127.0.0.1:1337';
const TOKEN = process.env.SEED_TOKEN || (await import('fs').then(fs => 
  fs.readFileSync('.env.local', 'utf8').match(/SEED_TOKEN=(.+)/)?.[1]
));

if (!TOKEN) {
  console.error('Missing SEED_TOKEN in .env.local');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`
};

async function updateSingleType(apiId, locale, data) {
  // First get the documentId
  const getRes = await fetch(`${STRAPI_URL}/api/${apiId}?locale=${locale}`, { headers });
  const existing = await getRes.json();
  const documentId = existing.data?.documentId;
  
  if (!documentId) {
    console.log(`  Creating ${apiId} for ${locale}...`);
    const createRes = await fetch(`${STRAPI_URL}/api/${apiId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ data: { ...data, locale } })
    });
    if (!createRes.ok) {
      console.error(`  Failed to create: ${await createRes.text()}`);
      return false;
    }
    console.log(`  ✓ Created ${apiId} (${locale})`);
    return true;
  }
  
  // Update existing
  const updateRes = await fetch(`${STRAPI_URL}/api/${apiId}/${documentId}?locale=${locale}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ data })
  });
  
  if (!updateRes.ok) {
    console.error(`  Failed to update: ${await updateRes.text()}`);
    return false;
  }
  console.log(`  ✓ Updated ${apiId} (${locale})`);
  return true;
}

// ============================================================================
// SITE SETTINGS - Fill in missing footer labels
// ============================================================================
console.log('\n📋 Updating Site Settings...');

await updateSingleType('site-setting', 'en', {
  footerCompanyTitle: 'Company',
  footerProductsTitle: 'Products',
  footerResourcesTitle: 'Resources',
  footerConnectTitle: 'Connect',
  copyrightText: '© 2026 Arabiq. All rights reserved.',
  loginButtonText: 'Login'
});

await updateSingleType('site-setting', 'ar', {
  footerCompanyTitle: 'الشركة',
  footerProductsTitle: 'المنتجات',
  footerResourcesTitle: 'الموارد',
  footerConnectTitle: 'تواصل معنا',
  copyrightText: '© 2026 Arabiq. جميع الحقوق محفوظة.',
  loginButtonText: 'تسجيل الدخول'
});

console.log('\n✅ Done updating missing content!');

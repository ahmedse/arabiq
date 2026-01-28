#!/usr/bin/env node
const STRAPI_URL = 'http://127.0.0.1:1337';
const TOKEN = process.argv[2] || process.env.SEED_TOKEN;
if (!TOKEN) { console.error('Token required'); process.exit(1); }
const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` };

// expected mapping (small sample for header)
const expected = {
  '/|header': { en: 'Home', ar: 'الرئيسية' },
  '/solutions|header': { en: 'Solutions', ar: 'الحلول' },
  '/industries|header': { en: 'Industries', ar: 'الصناعات' },
  '/case-studies|header': { en: 'Case Studies', ar: 'دراسات الحالة' },
  '/demos|header': { en: 'Demos', ar: 'العروض التوضيحية' },
  '/about|header': { en: 'About', ar: 'من نحن' },
  '/contact|header': { en: 'Contact', ar: 'اتصل بنا' }
};

function hasArabic(s) { return /[\u0600-\u06FF]/.test(s); }
function hasLatin(s) { return /[A-Za-z]/.test(s); }

async function fetchAllNav() {
  const res = await fetch(`${STRAPI_URL}/api/nav-items?pagination[pageSize]=500`, { headers });
  if (!res.ok) throw new Error('Failed to fetch nav items');
  return (await res.json()).data || [];
}

async function updateLabel(id, locale, label) {
  const res = await fetch(`${STRAPI_URL}/api/nav-items/${id}?locale=${locale}`, { method: 'PUT', headers, body: JSON.stringify({ data: { label } }) });
  if (!res.ok) {
    const err = await res.text();
    console.error('❌ Update failed', id, locale, err.substring(0,200));
    return false;
  }
  await fetch(`${STRAPI_URL}/api/nav-items/${id}/actions/publish`, { method: 'POST', headers, body: '{}' }).catch(()=>{});
  console.log(`🔧 Updated id=${id} (${locale}) -> ${label}`);
  return true;
}

async function createNav(item) {
  const res = await fetch(`${STRAPI_URL}/api/nav-items?locale=${item.locale}`, { method: 'POST', headers, body: JSON.stringify({ data: item }) });
  if (!res.ok) { console.error('❌ Create failed', item); return false; }
  const json = await res.json();
  const id = json.data?.id;
  if (id) await fetch(`${STRAPI_URL}/api/nav-items/${id}/actions/publish`, { method: 'POST', headers, body: '{}' }).catch(()=>{});
  console.log(`➕ Created ${item.href} (${item.locale}) -> ${item.label}`);
  return true;
}

async function main() {
  console.log('🔍 Running nav locale audit...');
  const all = await fetchAllNav();

  // Build map by key = href|location|locale
  const map = new Map();
  for (const item of all) {
    const attrs = item.attributes || {};
    const key = `${attrs.href}|${attrs.location}|${attrs.locale}`;
    map.set(key, { id: item.id, label: attrs.label, href: attrs.href, location: attrs.location, locale: attrs.locale });
  }

  // 1) Fix wrong labels in existing entries
  for (const v of map.values()) {
    if (!v.label) continue;
    if (v.locale === 'en' && hasArabic(v.label)) {
      const eks = expected[`${v.href}|${v.location}`];
      if (eks && eks.en) {
        await updateLabel(v.id, 'en', eks.en);
      } else {
        console.log('⚠️ EN entry contains Arabic but no expected mapping:', v);
      }
    }
    if (v.locale === 'ar' && hasLatin(v.label)) {
      const eks = expected[`${v.href}|${v.location}`];
      if (eks && eks.ar) {
        await updateLabel(v.id, 'ar', eks.ar);
      } else {
        console.log('⚠️ AR entry contains Latin but no expected mapping:', v);
      }
    }
  }

  // 2) Ensure both locales exist per expected
  for (const [key, vals] of Object.entries(expected)) {
    const [href, location] = key.split('|');
    for (const locale of ['en','ar']) {
      const k = `${href}|${location}|${locale}`;
      if (!map.has(k)) {
        // create
        await createNav({ label: vals[locale], href, location, order: 1, locale, isExternal: false });
      }
    }
  }

  console.log('✅ Audit+fix completed');
}

main().catch(err => { console.error(err); process.exit(1); });
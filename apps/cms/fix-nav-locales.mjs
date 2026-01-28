#!/usr/bin/env node
/*
  fix-nav-locales.mjs
  - Reads the expected nav items mapping (EN + AR)
  - Finds existing nav-items by location+href+locale and updates label/order/isExternal
  - Creates items if missing
  - Publishes items after upsert
*/

const STRAPI_URL = 'http://127.0.0.1:1337';
const TOKEN = process.argv[2] || process.env.SEED_TOKEN;
if (!TOKEN) {
  console.error('❌ Token required: node fix-nav-locales.mjs <token>');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`
};

const expected = [
  // EN header
  { label: 'Home', href: '/', location: 'header', order: 1, locale: 'en', isExternal: false },
  { label: 'Solutions', href: '/solutions', location: 'header', order: 2, locale: 'en', isExternal: false },
  { label: 'Industries', href: '/industries', location: 'header', order: 3, locale: 'en', isExternal: false },
  { label: 'Case Studies', href: '/case-studies', location: 'header', order: 4, locale: 'en', isExternal: false },
  { label: 'Demos', href: '/demos', location: 'header', order: 5, locale: 'en', isExternal: false },
  { label: 'About', href: '/about', location: 'header', order: 6, locale: 'en', isExternal: false },
  { label: 'Contact', href: '/contact', location: 'header', order: 7, locale: 'en', isExternal: false },
  // AR header
  { label: 'الرئيسية', href: '/', location: 'header', order: 1, locale: 'ar', isExternal: false },
  { label: 'الحلول', href: '/solutions', location: 'header', order: 2, locale: 'ar', isExternal: false },
  { label: 'الصناعات', href: '/industries', location: 'header', order: 3, locale: 'ar', isExternal: false },
  { label: 'دراسات الحالة', href: '/case-studies', location: 'header', order: 4, locale: 'ar', isExternal: false },
  { label: 'العروض التوضيحية', href: '/demos', location: 'header', order: 5, locale: 'ar', isExternal: false },
  { label: 'من نحن', href: '/about', location: 'header', order: 6, locale: 'ar', isExternal: false },
  { label: 'اتصل بنا', href: '/contact', location: 'header', order: 7, locale: 'ar', isExternal: false },
  // Footer samples omitted for brevity; only fix header by default
];

async function findExisting(item) {
  const url = new URL('/api/nav-items', STRAPI_URL);
  url.searchParams.set('filters[location][$eq]', item.location);
  url.searchParams.set('filters[href][$eq]', item.href);
  url.searchParams.set('locale', item.locale);
  url.searchParams.set('pagination[pageSize]', '1');

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data?.[0] ?? null;
}

async function upsert(item) {
  const existing = await findExisting(item);
  if (existing) {
    const id = existing.id;
    const res = await fetch(`${STRAPI_URL}/api/nav-items/${id}?locale=${item.locale}`, {
      method: 'PUT', headers, body: JSON.stringify({ data: { label: item.label, order: item.order, isExternal: item.isExternal } })
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`❌ Failed update ${item.label} (${item.locale}):`, err.substring(0,200));
      return false;
    }
    console.log(`✅ Updated: ${item.location} ${item.href} (${item.locale}) -> ${item.label}`);
    // publish
    await fetch(`${STRAPI_URL}/api/nav-items/${id}/actions/publish`, { method: 'POST', headers, body: '{}' }).catch(()=>{});
    return true;
  } else {
    const res = await fetch(`${STRAPI_URL}/api/nav-items?locale=${item.locale}`, { method: 'POST', headers, body: JSON.stringify({ data: item }) });
    if (!res.ok) {
      const err = await res.text();
      console.error(`❌ Failed create ${item.label} (${item.locale}):`, err.substring(0,200));
      return false;
    }
    const json = await res.json();
    const id = json.data?.id;
    if (id) {
      await fetch(`${STRAPI_URL}/api/nav-items/${id}/actions/publish`, { method: 'POST', headers, body: '{}' }).catch(()=>{});
      console.log(`✅ Created: ${item.location} ${item.href} (${item.locale}) -> ${item.label}`);
      return true;
    }
    return false;
  }
}

async function main() {
  console.log('🔎 Auditing and fixing header nav locales...');
  let created = 0, updated = 0, failed = 0;
  for (const item of expected) {
    try {
      const ok = await upsert(item);
      if (ok) {
        // decide created vs updated by checking existence again
        const ex = await findExisting(item);
        if (ex) updated++; else created++;
      } else failed++;
      await new Promise(r => setTimeout(r, 120));
    } catch (err) {
      console.error('❌ Error:', err.message || err);
      failed++;
    }
  }
  console.log(`\n✨ Done. created:${created} updated:${updated} failed:${failed}`);
}

main().catch(err => { console.error(err); process.exit(1); });
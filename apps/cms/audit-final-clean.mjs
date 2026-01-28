#!/usr/bin/env node
/*
 * Final audit of all CMS content
 * Checks EN and AR for all collections and single-types
 */

const STRAPI_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';
const TOKEN = process.argv[2] || process.env.SEED_TOKEN;
if (!TOKEN) {
  console.error('❌ Token required. Usage: node audit-final.mjs <TOKEN>');
  process.exit(1);
}
const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` };

const collections = [
  'nav-items',
  'demos',
  'stats',
  'features',
  'solutions',
  'industries',
  'case-studies',
  'trusted-companies',
  'process-steps',
  'team-members',
  'values'
];

const singleTypes = [
  'site-setting',
  'homepage',
  'about-page',
  'contact-page'
];

const locales = ['en', 'ar'];

async function fetchAll(apiPath, locale) {
  const url = `${STRAPI_URL}/api/${apiPath}?locale=${locale}&pagination[pageSize]=500`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    return null;
  }
  const json = await res.json();
  return json.data;
}

async function fetchSingle(apiPath, locale) {
  const url = `${STRAPI_URL}/api/${apiPath}?locale=${locale}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    return null;
  }
  const json = await res.json();
  return json.data;
}

async function audit() {
  console.info('📊 Auditing CMS content...\n');

  // Audit collections
  console.info('=== COLLECTIONS ===');
  for (const collection of collections) {
    const enData = await fetchAll(collection, 'en');
    const arData = await fetchAll(collection, 'ar');
    
    const enCount = enData ? (Array.isArray(enData) ? enData.length : 1) : 0;
    const arCount = arData ? (Array.isArray(arData) ? arData.length : 1) : 0;
    
    const status = (enCount > 0 && arCount > 0) ? '✅' : '⚠️';
    console.info(`${status} ${collection.padEnd(25)} EN: ${enCount.toString().padStart(3)}  AR: ${arCount.toString().padStart(3)}`);
  }

  console.info('\n=== SINGLE TYPES ===');
  for (const singleType of singleTypes) {
    const enData = await fetchSingle(singleType, 'en');
    const arData = await fetchSingle(singleType, 'ar');
    
    const enExists = enData !== null;
    const arExists = arData !== null;
    
    const status = (enExists && arExists) ? '✅' : '⚠️';
    const enStatus = enExists ? '✓' : '✗';
    const arStatus = arExists ? '✓' : '✗';
    console.info(`${status} ${singleType.padEnd(25)} EN: ${enStatus}    AR: ${arStatus}`);
  }

  console.info('\n📋 Audit complete!');
}

audit().catch(console.error);

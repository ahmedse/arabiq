// seed/seed.js

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import StrapiClient from './strapi-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const rawArgs = process.argv.slice(2);
const tokenArg = rawArgs.find(a => !a.startsWith('-'));
const TOKEN = tokenArg || process.env.SEED_TOKEN;
const FRESH = rawArgs.includes('--fresh') || process.argv.includes('--fresh');

if (!TOKEN) {
  console.error('❌ Usage: node seed.js <TOKEN> [--fresh]');
  console.error('   Or: SEED_TOKEN=xxx node seed.js');
  process.exit(1);
}

const client = new StrapiClient(TOKEN);

// Delete order
const DELETE_ORDER = [
  'nav-items',
  'trusted-companies',
  'team-members',
  'stats',
  'process-steps',
  'features',
  'values',
  'testimonials',
  'faqs',
  'pricing-plans',
  'partners',
  'demos',
  'case-studies',
  'solutions',
  'industries',
];

// Single types
const SINGLE_TYPES = [
  'homepage',
  'about-page',
  'contact-page',
  'site-setting',
  'pricing-page',
  'solutions-page',
  'industries-page',
  'demos-page',
  'case-studies-page',
];

function loadJsonFile(filename) {
  const filepath = join(__dirname, filename);
  return JSON.parse(readFileSync(filepath, 'utf8'));
}

// ─────────────────────────────────────────────────────────────
// SINGLE-TYPE SEEDING
// ─────────────────────────────────────────────────────────────

async function seedSingleType(apiId) {
  const filename = `${apiId}.json`;
  let data;
  
  try {
    data = loadJsonFile(filename);
  } catch (err) {
    console.log(`   ⏭ ${apiId}: No data file found, skipping`);
    return;
  }

  console.log(`\n📄 ${apiId}`);
  
  try {
    // EN and AR are completely separate
    await client.upsertSingle(apiId, data.en, data.ar);
  } catch (err) {
    console.error(`   ❌ Failed: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────
// COLLECTION SEEDING
// ─────────────────────────────────────────────────────────────

async function seedCollection(apiId) {
  const filename = `${apiId}.json`;
  let data;
  
  try {
    data = loadJsonFile(filename);
  } catch (err) {
    console.log(`   ⏭ ${apiId}: No data file found, skipping`);
    return;
  }

  const { identifierField, items } = data;
  
  if (!items || !Array.isArray(items)) {
    console.log(`   ⏭ ${apiId}: No items array found, skipping`);
    return;
  }

  console.log(`\n📦 ${apiId} (${items.length} items)`);
  
  let created = 0, updated = 0, failed = 0;
  
  for (const item of items) {
    // Separate: en content, ar content, and non-localized fields
    const { en, ar, ...nonLocalizedFields } = item;
    
    try {
      const result = await client.upsertCollection(
        apiId, 
        identifierField, 
        en || {},      // English localized content
        ar || {},      // Arabic localized content
        nonLocalizedFields  // Non-localized: slug, order, icon, etc.
      );
      
      if (result.existed) updated++;
      else created++;
    } catch (err) {
      console.error(`   ⚠ Item failed: ${err.message}`);
      failed++;
    }
  }
  
  console.log(`   ✅ Created: ${created}, Updated: ${updated}${failed ? `, Failed: ${failed}` : ''}`);
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Arabiq CMS Seeder v2.1');
  console.log(`   Strapi: ${process.env.STRAPI_URL || 'http://127.0.0.1:1337'}`);
  console.log(`   Mode: ${FRESH ? 'FRESH (delete all first)' : 'UPSERT'}`);
  
  // Fresh mode: delete collections
  if (FRESH) {
    console.log('\n🗑️  Clearing collections...');
    for (const apiId of DELETE_ORDER) {
      try {
        const count = await client.deleteAll(apiId);
        if (count > 0) console.log(`   ${apiId}: ${count} deleted`);
      } catch (err) {
        // Collection might not exist
      }
    }
  }
  
  // Seed single-types first
  console.log('\n━━━ SINGLE TYPES ━━━');
  for (const apiId of SINGLE_TYPES) {
    await seedSingleType(apiId);
  }
  
  // Seed collections
  console.log('\n━━━ COLLECTIONS ━━━');
  for (const apiId of DELETE_ORDER) {
    await seedCollection(apiId);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Seeding complete!');
}

main().catch(err => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});
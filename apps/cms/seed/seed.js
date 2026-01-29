// apps/cms/seed/seed.js

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import StrapiClient from './lib/strapi-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const rawArgs = process.argv.slice(2);
const tokenArg = rawArgs.find(a => !a.startsWith('-'));
const TOKEN = tokenArg || process.env.SEED_TOKEN;
const FRESH = rawArgs.includes('--fresh') || process.argv.includes('--fresh');
const WIPE_SINGLE = rawArgs.includes('--wipe-single-types') || process.env.WIPE_SINGLE_TYPES === '1';

if (!TOKEN) {
  console.error('❌ Usage: node seed.js <TOKEN> [--fresh]');
  console.error('   Or: SEED_TOKEN=xxx node seed.js');
  process.exit(1);
}

const client = new StrapiClient(TOKEN);

function loadDataFiles() {
  const data = { singleTypes: [], collections: [] };
  
  const singleTypesDir = join(__dirname, 'data/single-types');
  for (const file of readdirSync(singleTypesDir).filter(f => f.endsWith('.json'))) {
    data.singleTypes.push(JSON.parse(readFileSync(join(singleTypesDir, file), 'utf8')));
  }
  
  const collectionsDir = join(__dirname, 'data/collections');
  for (const file of readdirSync(collectionsDir).filter(f => f.endsWith('.json'))) {
    data.collections.push(JSON.parse(readFileSync(join(collectionsDir, file), 'utf8')));
  }
  
  return data;
}

// ─────────────────────────────────────────────────────────────
// SINGLE-TYPE: Uses PUT (not POST)
// ─────────────────────────────────────────────────────────────
function baselineFrom(obj) {
  if (obj == null) return obj;
  if (Array.isArray(obj)) return [];
  if (typeof obj === 'string') return '';
  if (typeof obj === 'number') return 0;
  if (typeof obj === 'boolean') return false;
  if (typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj)) out[k] = baselineFrom(obj[k]);
    return out;
  }
  return obj;
}

async function wipeSingleTypes(data) {
  console.log('\n🧹 Wiping single-types to baseline values...');
  for (const config of data.singleTypes) {
    const { apiId, en, ar } = config;
    try {
      const enBaseline = baselineFrom(en || {});
      await client.putSingle(apiId, enBaseline, 'en');
      if (ar) {
        const arBaseline = baselineFrom(ar || {});
        try {
          await client.putSingle(apiId, arBaseline, 'ar');
        } catch {
          // best-effort, continue
        }
      }
      console.log(`   ✅ ${apiId}: wiped to baseline`);
    } catch (err) {
      console.warn(`   ⚠ ${apiId}: failed to wipe - ${err.message}`);
    }
  }
}

async function seedSingleType(config) {
  const { apiId, en, ar } = config;
  console.log(`\n📄 ${apiId}`);
  
  try {
    const result = await client.upsertSingle(apiId, en, ar);
    console.log(`   ✅ EN + AR: ${result.existed ? 'updated' : 'created'}`);
  } catch (err) {
    console.error(`   ❌ Failed: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────
// COLLECTION: Uses POST to create, PUT to update
// ─────────────────────────────────────────────────────────────
async function seedCollection(config) {
  const { apiId, identifierField, compositeKey, items } = config;
  
  if (compositeKey) {
    return seedCollectionWithCompositeKey(config);
  }
  
  console.log(`\n📦 ${apiId} (${items.length} items)`);
  
  let created = 0, updated = 0, failed = 0;
  
  for (const item of items) {
    try {
      const result = await client.upsertCollection(apiId, identifierField, item);
      if (result.existed) updated++;
      else created++;
    } catch (err) {
      console.error(`   ⚠ Item failed: ${err.message}`);
      failed++;
    }
  }
  
  console.log(`   ✅ Created: ${created}, Updated: ${updated}${failed ? `, Failed: ${failed}` : ''}`);
}

async function seedCollectionWithCompositeKey(config) {
  const { apiId, compositeKey, items } = config;
  console.log(`\n📦 ${apiId} (${items.length} items, composite key)`);
  
  let created = 0, updated = 0;
  
  for (const item of items) {
    const { en, ar, ...shared } = item;
    
    // Build composite filter
    const params = new URLSearchParams({ locale: 'en', 'pagination[limit]': '1' });
    for (const key of compositeKey) {
      params.set(`filters[${key}][$eq]`, shared[key]);
    }
    
    let existing = null;
    try {
      const res = await client.request(`/api/${apiId}?${params}`);
      existing = res?.data?.[0] || null;
    } catch {}
    
    const enData = { ...shared, ...en };
    let documentId = existing?.documentId;
    
    if (documentId) {
      await client.updateCollection(apiId, documentId, enData, 'en');
      updated++;
    } else {
      const result = await client.createCollection(apiId, enData, 'en');
      documentId = result?.documentId;
      created++;
    }
    
    // AR locale
    if (documentId && ar) {
      const arData = { ...shared, ...ar };
      try {
        await client.updateCollection(apiId, documentId, arData, 'ar');
      } catch {}
    }
  }
  
  console.log(`   ✅ Created: ${created}, Updated: ${updated}`);
}

async function main() {
  console.log('🌱 Arabiq CMS Seeder');
  console.log(`   Strapi: ${process.env.STRAPI_URL || 'http://127.0.0.1:1337'}`);
  console.log(`   Mode: ${FRESH ? 'FRESH' : 'UPSERT'}`);
  
  const data = loadDataFiles();
  console.log(`\n📊 Loaded: ${data.singleTypes.length} single-types, ${data.collections.length} collections`);
  
  // Fresh mode: delete collections only (single-types have no delete)
  if (FRESH) {
    console.log('\n🗑️  Clearing collections...');
    for (const config of data.collections) {
      const count = await client.deleteAll(config.apiId);
      if (count > 0) console.log(`   ${config.apiId}: ${count} deleted`);
    }
  }
  
  // Seed single-types first
  console.log('\n━━━ SINGLE TYPES ━━━');

  if (WIPE_SINGLE) {
    if (!process.env.FORCE_SEED) {
      console.error('Refusing to wipe single-types without FORCE_SEED=1 (safety). Aborting.');
      process.exit(1);
    }
    await wipeSingleTypes(data);
  }

  for (const config of data.singleTypes) {
    await seedSingleType(config);
  }
  
  // Seed collections
  console.log('\n━━━ COLLECTIONS ━━━');
  for (const config of data.collections) {
    await seedCollection(config);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ Done!');
}

main().catch(err => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});
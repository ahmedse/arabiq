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

import { appendFileSync, mkdirSync } from 'fs';

// Ensure logs directory exists and prepare seed log
const LOG_DIR = join(__dirname, '..', '.logs');
try { mkdirSync(LOG_DIR, { recursive: true }); } catch (e) { /* ignore */ }
const LOG_FILE = join(LOG_DIR, 'seed.log');
function appendLog(obj) {
  try {
    appendFileSync(LOG_FILE, JSON.stringify({ ts: new Date().toISOString(), ...obj }) + '\n');
  } catch (e) {
    console.error('Failed to write seed log:', e.message || e);
  }
}

// Safety: require explicit confirmation for destructive fresh mode
if (FRESH) {
  const allowed = process.env.SEED_ALLOW_FRESH === 'true' || process.argv.includes('--force') || rawArgs.includes('--force');
  if (!allowed) {
    console.error('❌ Dangerous operation: --fresh mode is disabled by default. Set SEED_ALLOW_FRESH=true or pass --force to proceed.');
    appendLog({ event: 'seed_blocked', mode: 'fresh', reason: 'no confirmation', cwd: process.cwd(), argv: process.argv.slice(2), user: process.env.USER || null });
    process.exit(2);
  }
  appendLog({ event: 'seed_fresh_confirmed', mode: 'fresh', cwd: process.cwd(), argv: process.argv.slice(2), user: process.env.USER || null });
} else {
  appendLog({ event: 'seed_start', mode: 'upsert', cwd: process.cwd(), argv: process.argv.slice(2), user: process.env.USER || null });
}

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

    // Try to create an audit entry in Strapi to record the destructive action
    try {
      await client.request('/api/user-audit-logs', {
        method: 'POST',
        body: JSON.stringify({ data: { user: null, action: 'seed.fresh.start', ipAddress: 'local', userAgent: 'seed-script', success: true, metadata: { mode: 'fresh' } } })
      });
    } catch (e) {
      // Best-effort; ignore failures
      appendLog({ event: 'seed_audit_start_failed', error: e.message || String(e) });
    }

    let totalDeleted = 0;
    for (const apiId of DELETE_ORDER) {
      try {
        const count = await client.deleteAll(apiId);
        if (count > 0) {
          console.log(`   ${apiId}: ${count} deleted`);
          appendLog({ event: 'seed_deleted_collection', collection: apiId, count });
          totalDeleted += count;
        }
      } catch (err) {
        appendLog({ event: 'seed_delete_error', collection: apiId, error: err.message || String(err) });
      }
    }

    appendLog({ event: 'seed_fresh_complete', totalDeleted });

    // Final audit entry
    try {
      await client.request('/api/user-audit-logs', {
        method: 'POST',
        body: JSON.stringify({ data: { user: null, action: 'seed.fresh.complete', ipAddress: 'local', userAgent: 'seed-script', success: true, metadata: { totalDeleted } } })
      });
    } catch (e) {
      appendLog({ event: 'seed_audit_complete_failed', error: e.message || String(e) });
    }
  }
  
  // Seed single-types first
  appendLog({ event: 'seed_stage', stage: 'single_types_start' });
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
  appendLog({ event: 'seed_complete', mode: FRESH ? 'fresh' : 'upsert' });

}

main().catch(err => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});
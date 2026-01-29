#!/usr/bin/env node
// Direct seeder that boots Strapi in-process and uses entityService to create entries
// Usage: NODE_ENV=development node scripts/seed-direct.mjs --fresh

import Strapi from '@strapi/strapi';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const FRESH = process.argv.includes('--fresh');

async function run() {
  const strapi = await Strapi().load();
  console.log('Strapi loaded');

  if (FRESH) {
    console.log('FRESH: truncating collections (best-effort)');
    // Try to delete all entries for known collections
    const collections = readdirSync(join(process.cwd(), 'src', 'api'))
      .map(name => `api::${name}.${name}`);
    for (const uid of collections) {
      try {
        // Find many ids and delete
        const entries = await strapi.entityService.findMany(uid, { limit: -1 });
        for (const e of entries) {
          await strapi.entityService.delete(uid, e.id);
        }
        console.log(`Cleared ${uid}`);
      } catch (err) {
        // ignore missing types
      }
    }
  }

  const dataDir = join(process.cwd(), 'seed', 'data', 'collections');
  const files = readdirSync(dataDir).filter(f => f.endsWith('.json'));
  for (const f of files) {
    const payload = JSON.parse(readFileSync(join(dataDir, f), 'utf8'));
    const apiId = payload.apiId; // plural
    const items = payload.items || [];

    // find uid by scanning src/api as before
    const apiDir = join(process.cwd(), 'src', 'api');
    const apis = readdirSync(apiDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
    let uid = null;
    for (const api of apis) {
      const ctDir = join(apiDir, api, 'content-types');
      try {
        const entries = readdirSync(ctDir, { withFileTypes: true });
        for (const e of entries) {
          try {
            const schemaPath = e.isDirectory() ? join(ctDir, e.name, 'schema.json') : join(ctDir, e.name);
            const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
            const plural = schema?.info?.pluralName || schema?.collectionName || '';
            if (plural === apiId || plural === apiId.replace('-', '_')) {
              uid = `api::${api}.${api}`;
              break;
            }
          } catch (err) {
            // ignore
          }
        }
      } catch (err) {
        // ignore
      }
      if (uid) break;
    }

    if (!uid) {
      console.warn(`Skipping ${f}: cannot find content type uid for plural '${apiId}'`);
      continue;
    }

    console.log(`Seeding ${items.length} items into ${uid}`);
    for (const it of items) {
      const item = { ...it };
      if (item.en) {
        Object.assign(item, item.en);
        delete item.en;
      } else if (item.ar && !item.title) {
        Object.assign(item, item.ar);
        delete item.ar;
      }
      delete item.ar;

      try {
        const created = await strapi.entityService.create(uid, { data: item });
        console.log(`  created id=${created.id}`);
      } catch (err) {
        console.error(`  error creating item: ${err.message}`);
      }
    }
  }

  console.log('Seeding complete');
  await strapi.destroy();
}

run().catch(err => {
  console.error('Seeder failed:', err);
  process.exit(1);
});
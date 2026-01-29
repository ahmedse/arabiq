#!/usr/bin/env node
// Seed content via Strapi Admin Content Manager API using STRAPI_API_TOKEN
// Usage: STRAPI_API_URL=http://127.0.0.1:1337 STRAPI_API_TOKEN=token node scripts/seed-via-admin.mjs

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const API_URL = process.env.STRAPI_API_URL || 'http://127.0.0.1:1337';
const TOKEN = process.env.STRAPI_API_TOKEN;
if (!TOKEN) {
  console.error('Set STRAPI_API_TOKEN env var');
  process.exit(1);
}

function findUidByApiId(apiId) {
  const apiDir = join(process.cwd(), 'src', 'api');
  const apis = readdirSync(apiDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
  for (const api of apis) {
    const ctDir = join(apiDir, api, 'content-types');
    try {
      const entries = readdirSync(ctDir, { withFileTypes: true });
      for (const e of entries) {
        try {
          if (e.isDirectory()) {
            const schemaPath = join(ctDir, e.name, 'schema.json');
            const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
            const plural = schema?.info?.pluralName || schema?.collectionName || '';
            if (plural === apiId || plural === apiId.replace('-', '_')) {
              return `api::${api}.${api}`;
            }
          } else if (e.isFile() && e.name.endsWith('.json')) {
            const schema = JSON.parse(readFileSync(join(ctDir, e.name), 'utf8'));
            const plural = schema?.info?.pluralName || schema?.collectionName || '';
            if (plural === apiId || plural === apiId.replace('-', '_')) {
              return `api::${api}.${api}`;
            }
          }
        } catch (err) {
          // ignore
        }
      }
    } catch (err) {
      // ignore
    }
  }
  return null;
}

function prepareItem(item) {
  const out = { ...item };
  // If localized versions exist, prefer English (en) as default
  if (out.en) {
    Object.assign(out, out.en);
    delete out.en;
  } else if (out.ar && !out.title) {
    Object.assign(out, out.ar);
    delete out.ar;
  }
  // remove any leftover nested locale keys
  delete out.ar;
  return out;
}

async function createEntry(uid, item) {
  const url = `${API_URL.replace(/\/$/, '')}/admin/content-manager/collection-types/${uid}/records`;
  const bodyData = { data: item };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyData),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${res.status} ${text}`);
  }
  return JSON.parse(text);
}

async function run() {
  const dataDir = join(process.cwd(), 'seed', 'data', 'collections');
  const files = readdirSync(dataDir).filter(f => f.endsWith('.json'));
  for (const f of files) {
    const full = join(dataDir, f);
    const payload = JSON.parse(readFileSync(full, 'utf8'));
    const apiId = payload.apiId; // plural name like 'case-studies'
    const items = payload.items || [];
    const uid = findUidByApiId(apiId);
    if (!uid) {
      console.warn(`Skipping ${f}: cannot find content type uid for plural '${apiId}'`);
      continue;
    }
    console.log(`Seeding ${items.length} items into ${uid} (from ${f})`);
    for (const it of items) {
      const prepared = prepareItem(it);
      try {
        const created = await createEntry(uid, prepared);
        console.log(`  created id=${created?.data?.id || 'unknown'}`);
      } catch (err) {
        console.error(`  error creating item: ${err.message}`);
      }
    }
  }
}

run().catch(err => {
  console.error('Seeder failed:', err);
  process.exit(1);
});
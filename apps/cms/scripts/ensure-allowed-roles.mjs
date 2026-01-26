#!/usr/bin/env node
// Simple utility: ensure content types have allowedRoles field via Strapi API (best-effort)
// Usage: STRAPI_API_URL=http://localhost:1337 STRAPI_API_TOKEN=token node scripts/ensure-allowed-roles.mjs

import fetch from 'node-fetch';

const apiUrl = process.env.STRAPI_API_URL;
const token = process.env.STRAPI_API_TOKEN;
if (!apiUrl || !token) {
  console.error('Set STRAPI_API_URL and STRAPI_API_TOKEN');
  process.exit(1);
}

const contentTypes = ['/content-type-builder/content-types/api::demo.demo', '/content-type-builder/content-types/api::solution.solution', '/content-type-builder/content-types/api::case-study.case-study'];

async function ensure(ct) {
  const url = `${apiUrl.replace(/\/$/, '')}/admin/content-types/${ct}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    console.error('Failed to fetch', ct, res.status, await res.text());
    return;
  }
  const body = await res.json();
  const schema = body?.data?.schema;
  if (!schema) {
    console.error('No schema found for', ct);
    return;
  }

  const attrs = schema.attributes || {};
  if (!attrs.allowedRoles) {
    attrs.allowedRoles = { type: 'json', default: [] };
    schema.attributes = attrs;

    const updateRes = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { schema } }),
    });

    if (!updateRes.ok) {
      console.error('Failed to update', ct, updateRes.status, await updateRes.text());
    } else {
      console.log('Updated content type:', ct);
    }
  } else {
    console.log('Already has allowedRoles:', ct);
  }
}

(async () => {
  for (const ct of contentTypes) await ensure(ct);
})();

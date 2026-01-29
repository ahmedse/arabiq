// apps/cms/seed/lib/strapi-client.js

import { slugify as trSlugify } from 'transliteration';

const STRAPI_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';

class StrapiClient {
  constructor(token) {
    if (!token) {
      throw new Error('API token required. Set SEED_TOKEN env or pass as argument.');
    }
    this.token = token;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async request(path, options = {}) {
    const url = `${STRAPI_URL}${path}`;
    const method = options.method || 'GET';
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(url, {
          ...options,
          headers: { ...this.headers, ...options.headers }
        });
        
        const text = await res.text();
        
        // Handle non-JSON responses (like 405 "Method Not Allowed")
        if (!res.ok) {
          let errorMsg = `${res.status} ${res.statusText}`;
          try {
            const errBody = JSON.parse(text);
            errorMsg = errBody?.error?.message || errorMsg;
          } catch {
            // Response wasn't JSON - use status text
            errorMsg = `${res.status}: ${text || res.statusText}`;
          }
          
          // Debug: log raw body for 4xx so we can see permission errors in CI/dev
          if (res.status >= 400 && res.status < 500) {
            console.error(`DEBUG Strapi ${method} ${path} => status:${res.status}, body:${text}`);
            throw new Error(`${method} ${path} → ${errorMsg}`);
          }
          
          throw new Error(errorMsg);
        }
        
        // Parse successful response
        return text ? JSON.parse(text) : null;
        
      } catch (err) {
        // Don't retry client errors
        if (err.message.includes('→')) throw err;
        
        // Connection refused - fail fast
        if (err.cause?.code === 'ECONNREFUSED') {
          throw new Error(`Cannot connect to Strapi at ${STRAPI_URL}`);
        }
        
        // Retry server errors
        if (attempt === 3) throw err;
        await this.sleep(200 * attempt);
      }
    }
  }

  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // Slugify using the upstream `transliteration` library for higher fidelity
  slugify(text) {
    if (!text) return '';
    return trSlugify(String(text || ''), { lowercase: true, separator: '-' });
  }

  // ─────────────────────────────────────────────────────────────
  // COLLECTION METHODS
  // ─────────────────────────────────────────────────────────────

  async findOne(apiId, field, value, locale) {
    const params = new URLSearchParams({
      [`filters[${field}][$eq]`]: value,
      'locale': locale,
      'pagination[limit]': '1'
    });

    try {
      const res = await this.request(`/api/${apiId}?${params}`);
      return res?.data?.[0] || null;
    } catch (err) {
      // Fallback: some Content Types return "Invalid key <field>" for filter queries (e.g., localized or computed fields)
      // In that case, fetch a page of items and search for a matching attribute locally.
      if (/Invalid key/i.test(err.message || '')) {
        try {
          const res2 = await this.request(`/api/${apiId}?locale=${locale}&pagination[pageSize]=500`);
          const items = res2?.data || [];
          return items.find(it => {
            // typical shapes: it.slug or it.attributes.slug
            const s = it?.slug ?? it?.attributes?.slug ?? null;
            return s === value;
          }) || null;
        } catch (err2) {
          // If fallback fails, rethrow original error to surface the root cause
          throw err;
        }
      }
      throw err;
    }
  }

  async createCollection(apiId, data, locale) {
    const res = await this.request(`/api/${apiId}`, {
      method: 'POST',
      body: JSON.stringify({
        data: { ...data, locale, publishedAt: new Date().toISOString() }
      })
    });
    return res?.data || null;
  }

  async updateCollection(apiId, documentId, data, locale) {
    const res = await this.request(`/api/${apiId}/${documentId}?locale=${locale}`, {
      method: 'PUT',
      body: JSON.stringify({
        data: { ...data, publishedAt: new Date().toISOString() }
      })
    });
    return res?.data || null;
  }

  async deleteAll(apiId) {
    const res = await this.request(`/api/${apiId}?pagination[pageSize]=500`);
    const items = res?.data || [];
    
    for (const item of items) {
      const id = item.documentId || item.id;
      try {
        await this.request(`/api/${apiId}/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn(`  ⚠ Delete ${apiId}/${id}: ${err.message}`);
      }
      await this.sleep(50);
    }
    return items.length;
  }

  // Upsert a collection item (handles EN + AR)
  async upsertCollection(apiId, identifierField, item) {
    const identifierValue = item[identifierField];
    if (!identifierValue) {
      throw new Error(`Missing identifier '${identifierField}' in item`);
    }

    const { en, ar, ...shared } = item;
    
    // Find existing by identifier
    const existing = await this.findOne(apiId, identifierField, identifierValue, 'en');
    let documentId = existing?.documentId;

    // EN locale
    const enData = { ...shared, ...en };
    if (documentId) {
      await this.updateCollection(apiId, documentId, enData, 'en');
    } else {
      const created = await this.createCollection(apiId, enData, 'en');
      documentId = created?.documentId;
    }

    // AR locale
    if (ar && documentId) {
      // Build AR data and deterministically generate/adjust slug from Arabic title
      const arData = { ...shared, ...ar };

      // If no explicit slug, try to generate one from a title-like field
      if (!arData.slug) {
        const source = (arData.title || arData.heading || shared.title || shared.name || '');
        const generated = this.slugify(source || '');
        if (generated) {
          arData.slug = generated;
        }
      }

      // If a slug exists (explicit or generated), ensure uniqueness in AR locale by numeric suffix
      if (arData.slug) {
        const base = arData.slug;
        let candidate = base;
        let suffix = 0;
        while (true) {
          const existing = await this.findOne(apiId, 'slug', candidate, 'ar');
          if (!existing || existing.documentId === documentId) break;
          suffix++;
          candidate = `${base}-${suffix}`;
        }
        if (candidate !== arData.slug) {
          arData.slug = candidate;
          console.log(`  ⚙ AR slug adjusted to ${candidate} for ${apiId}/${documentId}`);
        }
      }

      try {
        await this.updateCollection(apiId, documentId, arData, 'ar');
      } catch (err) {
        // Handle specific 'Invalid key slug' errors by retrying without slug
        if (/Invalid key slug/i.test(err.message || '')) {
          const { slug, ...withoutSlug } = arData;
          try {
            await this.updateCollection(apiId, documentId, withoutSlug, 'ar');
            console.log(`  ⚙ Removed slug and updated AR locale for ${apiId}/${documentId}`);
            return { documentId, existed: !!existing };
          } catch (err2) {
            console.warn(`  ⚠ AR update (without slug) failed for ${apiId}/${documentId}: ${err2.message}`);
            // Return result object so callers don't crash; we attempted the best-effort update
            return { documentId, existed: !!existing };
          }
        }

        // If slug still causes validation errors, log and skip AR update (preserve run success)
        const isSlugConflict = /unique|This attribute must be unique|slug must be a `string`/i.test(err.message || '');
        if (isSlugConflict) {
          console.warn(`  ⚠ Skipping AR update for ${apiId}/${documentId} due to slug conflict: ${err.message}`);
        } else {
          console.warn(`  ⚠ Could not add AR locale for ${apiId}/${documentId}: ${err.message}`);
        }
      }
    }

    return { documentId, existed: !!existing };
  }

  // ─────────────────────────────────────────────────────────────
  // SINGLE-TYPE METHODS (PUT only, no POST, no documentId in URL)
  // ─────────────────────────────────────────────────────────────

  async getSingle(apiId, locale) {
    try {
      const res = await this.request(`/api/${apiId}?locale=${locale}`);
      return res?.data || null;
    } catch (err) {
      // 404 means single-type not yet created - that's OK
      if (err.message.includes('404')) return null;
      throw err;
    }
  }

  async putSingle(apiId, data, locale) {
    // Single-types use PUT to both create and update (no POST!)
    const res = await this.request(`/api/${apiId}?locale=${locale}`, {
      method: 'PUT',
      body: JSON.stringify({
        data: { ...data, publishedAt: new Date().toISOString() }
      })
    });
    return res?.data || null;
  }

  // Upsert single-type (both locales)
  async upsertSingle(apiId, enData, arData) {
    const existingEn = await this.getSingle(apiId, 'en');
    
    // EN locale (PUT always works for single-types)
    await this.putSingle(apiId, enData, 'en');
    
    // AR locale
    if (arData) {
      await this.putSingle(apiId, arData, 'ar');
    }
    
    return { existed: !!existingEn };
  }
}

export default StrapiClient;
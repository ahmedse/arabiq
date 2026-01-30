// seed/strapi-client.js

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
        
        if (!res.ok) {
          let errorMsg = `${res.status} ${res.statusText}`;
          try {
            const errBody = JSON.parse(text);
            errorMsg = errBody?.error?.message || errorMsg;
          } catch {
            errorMsg = `${res.status}: ${text || res.statusText}`;
          }
          
          if (res.status >= 400 && res.status < 500) {
            console.error(`DEBUG Strapi ${method} ${path} => status:${res.status}, body:${text}`);
            throw new Error(`${method} ${path} → ${errorMsg}`);
          }
          
          throw new Error(errorMsg);
        }
        
        return text ? JSON.parse(text) : null;
        
      } catch (err) {
        if (err.message.includes('→')) throw err;
        
        if (err.cause?.code === 'ECONNREFUSED') {
          throw new Error(`Cannot connect to Strapi at ${STRAPI_URL}`);
        }
        
        if (attempt === 3) throw err;
        await this.sleep(200 * attempt);
      }
    }
  }

  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

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
      if (/Invalid key/i.test(err.message || '')) {
        try {
          const res2 = await this.request(`/api/${apiId}?locale=${locale}&pagination[pageSize]=500`);
          const items = res2?.data || [];
          return items.find(it => {
            const val = it?.[field] ?? it?.attributes?.[field] ?? null;
            return val === value;
          }) || null;
        } catch (err2) {
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

  async upsertCollection(apiId, identifierField, enData, arData, sharedData = {}) {
    const identifierValue = sharedData[identifierField] || enData[identifierField];
    if (!identifierValue) {
      throw new Error(`Missing identifier '${identifierField}' in item`);
    }

    const existing = await this.findOne(apiId, identifierField, identifierValue, 'en');
    let documentId = existing?.documentId;

    // EN locale
    const enPayload = { ...sharedData, ...enData };
    if (documentId) {
      await this.updateCollection(apiId, documentId, enPayload, 'en');
    } else {
      const created = await this.createCollection(apiId, enPayload, 'en');
      documentId = created?.documentId;
    }

    // AR locale
    if (arData && documentId) {
      const arPayload = { ...sharedData, ...arData };

      if (!arPayload.slug && arPayload.title) {
        arPayload.slug = this.slugify(arPayload.title);
      }

      if (arPayload.slug) {
        const base = arPayload.slug;
        let candidate = base;
        let suffix = 0;
        while (true) {
          const existingAr = await this.findOne(apiId, 'slug', candidate, 'ar');
          if (!existingAr || existingAr.documentId === documentId) break;
          suffix++;
          candidate = `${base}-${suffix}`;
        }
        arPayload.slug = candidate;
      }

      try {
        await this.updateCollection(apiId, documentId, arPayload, 'ar');
      } catch (err) {
        if (/Invalid key slug/i.test(err.message || '')) {
          const { slug, ...withoutSlug } = arPayload;
          try {
            await this.updateCollection(apiId, documentId, withoutSlug, 'ar');
          } catch (err2) {
            console.warn(`  ⚠ AR update failed for ${apiId}/${documentId}: ${err2.message}`);
          }
        } else {
          console.warn(`  ⚠ AR update failed for ${apiId}/${documentId}: ${err.message}`);
        }
      }
    }

    return { documentId, existed: !!existing };
  }

  // ─────────────────────────────────────────────────────────────
  // SINGLE-TYPE METHODS
  // ─────────────────────────────────────────────────────────────

  async getSingle(apiId, locale) {
    try {
      const res = await this.request(`/api/${apiId}?locale=${locale}`);
      return res?.data || null;
    } catch (err) {
      if (err.message.includes('404')) return null;
      throw err;
    }
  }

  async putSingle(apiId, data, locale) {
    const res = await this.request(`/api/${apiId}?locale=${locale}`, {
      method: 'PUT',
      body: JSON.stringify({
        data: { ...data, publishedAt: new Date().toISOString() }
      })
    });
    return res?.data || null;
  }

  async upsertSingle(apiId, enData, arData) {
    const existingEn = await this.getSingle(apiId, 'en');
    
    await this.putSingle(apiId, enData, 'en');
    
    if (arData) {
      await this.putSingle(apiId, arData, 'ar');
    }
    
    return { existed: !!existingEn };
  }
}

export default StrapiClient;
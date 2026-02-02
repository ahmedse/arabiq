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
    console.log(`      📤 POST /api/${apiId} (locale=${locale})`);
    const res = await this.request(`/api/${apiId}`, {
      method: 'POST',
      body: JSON.stringify({
        data: { ...data, locale, publishedAt: new Date().toISOString() }
      })
    });
    const result = res?.data || null;
    console.log(`      📥 Created: ${result?.documentId}, has ${result?.localizations?.length || 0} localizations`);
    return result;
  }

  async updateCollection(apiId, documentId, data, locale) {
    // Only publish EN explicitly; AR will be auto-published when created
    const payload = locale === 'en' 
      ? { ...data, publishedAt: new Date().toISOString() }
      : { ...data };
    
    console.log(`      📤 PUT /api/${apiId}/${documentId}?locale=${locale}`);  
    const res = await this.request(`/api/${apiId}/${documentId}?locale=${locale}`, {
      method: 'PUT',
      body: JSON.stringify({ data: payload })
    });
    const result = res?.data || null;
    console.log(`      📥 Updated: ${result?.documentId}, has ${result?.localizations?.length || 0} localizations`);
    return result;
  }

  /**
   * Create a new locale for an existing document
   * This uses POST with a special locale parameter to create a new locale variant
   */
  async createLocale(apiId, documentId, data, locale) {
    // Strapi v5: use locale-specific update to create the locale if missing
    return await this.updateCollection(apiId, documentId, data, locale);
  }

  async deleteAll(apiId) {
    // Fetch ALL items across all pages and locales
    let allItems = [];
    let page = 1;
    let hasMore = true;
    
    console.log(`   🔍 Fetching ${apiId} to delete...`);
    while (hasMore) {
      const res = await this.request(`/api/${apiId}?pagination[page]=${page}&pagination[pageSize]=100&locale=all`);
      const items = res?.data || [];
      console.log(`   📄 Page ${page}: found ${items.length} items`);
      allItems.push(...items);
      
      // Check if there are more pages
      const pagination = res?.meta?.pagination || {};
      hasMore = page < (pagination.pageCount || 1);
      page++;
    }
    
    console.log(`   💥 Deleting ${allItems.length} total items...`);
    
    // Delete all collected items
    for (const item of allItems) {
      const id = item.documentId || item.id;
      try {
        await this.request(`/api/${apiId}/${id}?locale=all`, { method: 'DELETE' });
      } catch (err) {
        console.warn(`  ⚠ Delete ${apiId}/${id}: ${err.message}`);
      }
      await this.sleep(50);
    }
    return allItems.length;
  }

  /**
   * Upsert collection item with separate EN and AR content
   * 
   * @param {string} apiId - API endpoint (e.g., 'solutions')
   * @param {string} identifierField - Field to identify record (e.g., 'slug')
   * @param {object} enData - Complete English content
   * @param {object} arData - Complete Arabic content  
   * @param {object} nonLocalizedFields - Fields that are NOT localized (e.g., slug, order, icon)
   */
  async upsertCollection(apiId, identifierField, enData, arData, nonLocalizedFields = {}) {
  const identifierValue = nonLocalizedFields[identifierField];
  if (!identifierValue) {
    throw new Error(`Missing identifier '${identifierField}' in nonLocalizedFields`);
  }

  const existing = await this.findOne(apiId, identifierField, identifierValue, 'en');
  let documentId = existing?.documentId;

  console.log(`   🔍 ${identifierValue}: ${documentId ? 'EXISTS' : 'NEW'} (docId: ${documentId || 'none'})`);

  // EN: non-localized fields + EN-specific localized content
  const enPayload = { ...nonLocalizedFields, ...enData };
  
  if (documentId) {
    console.log(`   ♻️  Updating EN for ${identifierValue}`);
    await this.updateCollection(apiId, documentId, enPayload, 'en');
  } else {
    console.log(`   ✨ Creating EN for ${identifierValue}`);
    const created = await this.createCollection(apiId, enPayload, 'en');
    documentId = created?.documentId;
    if (!documentId) {
      throw new Error(`Failed to create EN record for ${apiId}/${identifierValue}`);
    }
    console.log(`   📄 Created with docId: ${documentId}`);
  }

  // AR: Only send localized content, exclude non-localized fields  
  // Non-localized fields (slug, category, order, icon, etc.) are already set in EN
  // and shared across all locales. Including them in AR update causes "must be unique" errors.
  if (arData && documentId) {
    try {
      // Always update AR locale using the documentId from EN
      // Strapi v5 will create the locale if it doesn't exist
      console.log(`   🌐 Creating/updating AR for ${identifierValue}`);
      await this.updateCollection(apiId, documentId, arData, 'ar');
    } catch (err) {
      console.error(`   ❌ AR failed for ${identifierValue}: ${err.message}`);
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
    // EN
    try {
      await this.putSingle(apiId, enData, 'en');
      console.log(`   ✅ EN: created/updated`);
    } catch (err) {
      console.error(`   ❌ EN failed: ${err.message}`);
      throw err;
    }
    
    // AR - completely separate content
    if (arData) {
      try {
        await this.putSingle(apiId, arData, 'ar');
        console.log(`   ✅ AR: created/updated`);
      } catch (err) {
        console.error(`   ❌ AR failed: ${err.message}`);
      }
    }
    
    return { existed: false };
  }
}

export default StrapiClient;
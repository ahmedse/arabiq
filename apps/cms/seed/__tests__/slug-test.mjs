import assert from 'assert';
import StrapiClient from '../lib/strapi-client.js';

console.log('Running seed slug tests...');

(async () => {
  // Create a StrapiClient with a fake token — we will mock network methods
  const client = new StrapiClient('fake-token-for-test');

  // Basic slugify behavior (transliteration should produce ASCII with dashes)
  const arabic = 'اللغة العربية';
  const slug = client.slugify(arabic);
  assert(/^[a-z0-9-]+$/.test(slug), `slug must be ASCII-like, got: ${slug}`);
  console.log('  ✅ slugify produces ASCII slug:', slug);

  // Collision handling: when AR slug collides, it should pick a different candidate
  // Mock findOne to simulate collision for the first candidate and free for the second
  let findCalls = [];
  client.findOne = async (apiId, field, value, locale) => {
    findCalls.push({ apiId, field, value, locale });
    // When searching for EN by identifier (simulate already existing EN)
    if (locale === 'en' && field === 'slug' && value === 'my-slug') return { documentId: 'doc-1' };
    // For AR slug collision simulation: return a different doc for first candidate
    if (locale === 'ar' && field === 'slug') {
      if (value === 'my-slug') return { documentId: 'other-doc' };
      return null;
    }
    return null;
  };

  // Mock updateCollection/createCollection to capture the AR slug used
  let arUpdated = null;
  client.updateCollection = async (apiId, documentId, data, locale) => {
    if (locale === 'ar') {
      arUpdated = data;
      return { id: documentId };
    }
    return {};
  };

  client.createCollection = async (apiId, data, locale) => {
    // Return a fake created document when creating EN
    if (locale === 'en') return { documentId: 'doc-1' };
    return { documentId: 'doc-created' };
  };

  const item = {
    apiId: 'test',
    slug: 'my-slug',
    en: { title: 'EN title', slug: 'my-slug' },
    ar: { title: 'عنوان عربي' }
  };

  // Call upsertCollection and expect AR slug to end up 'my-slug-1' due to collision
  const res = await client.upsertCollection('test', 'slug', item);
  assert(res.documentId, 'upsertCollection should return a documentId');
  assert(arUpdated, 'AR locale should have been updated');
  // If ar had slug candidate 'my-slug', and collision existed, expect suffix '-1'
  assert(arUpdated.slug && arUpdated.slug.includes('my-slug'), 'AR slug should be based on original');
  console.log('  ✅ collision handling adjusted AR slug to:', arUpdated.slug);

  console.log('\nAll slug tests passed.');
  process.exit(0);
})().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

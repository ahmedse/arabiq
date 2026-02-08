/**
 * Seed Awni Electronics Demo
 * Run: node seed/seed-awni.js <TOKEN>
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import StrapiClient from './strapi-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TOKEN = process.argv[2] || process.env.SEED_TOKEN;
if (!TOKEN) {
  console.error('❌ Usage: node seed-awni.js <TOKEN>');
  console.error('   Or: SEED_TOKEN=xxx node seed-awni.js');
  process.exit(1);
}

// Load data
const awniData = JSON.parse(readFileSync(join(__dirname, 'awni-electronics.json'), 'utf-8'));
const client = new StrapiClient(TOKEN);

async function seedAwniDemo() {
  console.log('🚀 Seeding Awni Electronics Demo...\n');
  
  try {
    // 1. Upsert Demo Entry (update if exists, create if not)
    console.log('Upserting demo entry...');
    const { documentId, existed } = await client.upsertCollection(
      'demos',
      'slug',
      {
        title: awniData.demo.title,
        summary: awniData.demo.summary,
      },
      {
        title: awniData.demo.title_ar,
        summary: awniData.demo.summary_ar,
        businessName: awniData.demo.businessName_ar,
      },
      {
        slug: awniData.demo.slug,
        matterportModelId: awniData.demo.matterportModelId,
        demoType: awniData.demo.demoType,
        isActive: awniData.demo.isActive,
        businessName: awniData.demo.businessName,
        businessPhone: awniData.demo.businessPhone,
        businessEmail: awniData.demo.businessEmail,
        businessWhatsapp: awniData.demo.businessWhatsapp,
        enableVoiceOver: awniData.demo.enableVoiceOver,
        enableLiveChat: awniData.demo.enableLiveChat,
        enableAiChat: awniData.demo.enableAiChat,
      }
    );
    
    console.log(`✅ Demo ${existed ? 'updated' : 'created'}: DocumentID=${documentId}`);
    
    // Get the demo record for relations - use documentId for Strapi v5
    const demoRecord = await client.findOne('demos', 'slug', awniData.demo.slug, 'en');
    const demoDocumentId = demoRecord.documentId;
    
    // 2. Delete existing products for this demo and re-create
    console.log('\nCleaning up existing products...');
    await client.deleteRelatedByDemo('demo-products', demoDocumentId);
    
    // 3. Create Products
    console.log('\nCreating products...');
    for (const product of awniData.products) {
      const productResponse = await client.create('demo-products', {
        name: product.name,
        description: product.description,
        price: product.price,
        currency: product.currency,
        category: product.category,
        sku: product.sku,
        brand: product.brand || null,
        inStock: product.inStock,
        hotspotPosition: product.hotspotPosition || { x: 0, y: 0, z: 0 },
        demo: demoDocumentId,
      });
      
      const productDocumentId = productResponse.data.documentId;
      
      // Create Arabic localization
      await client.localize('demo-products', productDocumentId, 'ar', {
        name: product.name_ar,
        description: product.description_ar,
        category: product.category_ar,
      });
      
      console.log(`  ✅ ${product.name}`);
    }
    
    console.log('\n🎉 Awni Electronics Demo seeded successfully!');
    console.log(`\nDemo URL: http://localhost:3000/en/demos/awni-electronics`);
    console.log(`Admin URL: http://localhost:3000/en/demos/awni-electronics/admin`);
    
  } catch (error) {
    console.error('❌ Error seeding demo:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

seedAwniDemo();

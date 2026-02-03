/**
 * Seed Trust Co. Interior Design Showroom Demo
 * Run: node seed/seed-trust.js <TOKEN>
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import StrapiClient from './strapi-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TOKEN = process.argv[2] || process.env.SEED_TOKEN;
if (!TOKEN) {
  console.error('❌ Usage: node seed-trust.js <TOKEN>');
  console.error('   Or: SEED_TOKEN=xxx node seed-trust.js');
  process.exit(1);
}

// Load data
const trustData = JSON.parse(readFileSync(join(__dirname, 'trust-interior.json'), 'utf-8'));
const client = new StrapiClient(TOKEN);

async function seedTrustDemo() {
  console.log('🏠 Seeding Trust Co. Interior Design Showroom Demo...\n');
  
  try {
    // 0. Delete existing demo if exists
    console.log('Checking for existing demo...');
    await client.deleteBySlug('demos', trustData.demo.slug);
    
    // 1. Create Demo Entry (English)
    console.log('Creating demo entry...');
    const demoResponse = await client.create('demos', {
      title: trustData.demo.title,
      slug: trustData.demo.slug,
      summary: trustData.demo.summary,
      matterportModelId: trustData.demo.matterportModelId,
      demoType: trustData.demo.demoType,
      isActive: trustData.demo.isActive,
      businessName: trustData.demo.businessName,
      businessPhone: trustData.demo.businessPhone,
      businessEmail: trustData.demo.businessEmail,
      businessWhatsapp: trustData.demo.businessWhatsapp,
      enableVoiceOver: trustData.demo.enableVoiceOver,
      enableLiveChat: trustData.demo.enableLiveChat,
      enableAiChat: trustData.demo.enableAiChat,
    });
    
    const demoId = demoResponse.data.id;
    const demoDocumentId = demoResponse.data.documentId;
    console.log(`✅ Demo created: ID=${demoId}, DocumentID=${demoDocumentId}`);
    
    // 2. Create Arabic localization
    console.log('Creating Arabic localization...');
    await client.localize('demos', demoDocumentId, 'ar', {
      title: trustData.demo.title_ar,
      slug: trustData.demo.slug,
      summary: trustData.demo.summary_ar,
      businessName: trustData.demo.businessName_ar,
    });
    console.log('✅ Arabic localization created');
    
    // 3. Create Products (using demo-products)
    console.log('\nCreating furniture products...');
    for (const product of trustData.products) {
      const productResponse = await client.create('demo-products', {
        name: product.name,
        description: product.description,
        price: product.price,
        currency: product.currency,
        category: product.category,
        sku: product.sku,
        inStock: product.inStock,
        hotspotPosition: {
          x: product.hotspotPositionX || 0,
          y: product.hotspotPositionY || 0,
          z: product.hotspotPositionZ || 0,
        },
        demo: demoId,
      });
      
      const productDocumentId = productResponse.data.documentId;
      
      // Create Arabic localization
      await client.localize('demo-products', productDocumentId, 'ar', {
        name: product.name_ar,
        description: product.description_ar,
        category: product.category_ar,
      });
      
      console.log(`  ✅ ${product.name} (${product.sku})`);
    }
    
    console.log('\n🎉 Trust Co. Interior Design showroom demo seeded successfully!');
    console.log(`\nDemo URL: http://localhost:3000/en/demos/trust-interior`);
    console.log(`Admin URL: http://localhost:3000/en/demos/trust-interior/admin`);
    
  } catch (error) {
    console.error('❌ Error seeding demo:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

seedTrustDemo();

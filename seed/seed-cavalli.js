/**
 * Seed Cavalli Cafe Demo
 * Run: node seed/seed-cavalli.js <TOKEN>
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import StrapiClient from './strapi-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TOKEN = process.argv[2] || process.env.SEED_TOKEN;
if (!TOKEN) {
  console.error('❌ Usage: node seed-cavalli.js <TOKEN>');
  console.error('   Or: SEED_TOKEN=xxx node seed-cavalli.js');
  process.exit(1);
}

// Load data
const cavalliData = JSON.parse(readFileSync(join(__dirname, 'cavalli-cafe.json'), 'utf-8'));
const client = new StrapiClient(TOKEN);

async function seedCavalliDemo() {
  console.log('🚀 Seeding Cavalli Cafe Demo...\n');
  
  try {    // 0. Delete existing demo if exists
    console.log('Checking for existing demo...');
    await client.deleteBySlug('demos', cavalliData.demo.slug);
        // 1. Create Demo Entry (English)
    console.log('Creating demo entry...');
    const demoResponse = await client.create('demos', {
      title: cavalliData.demo.title,
      slug: cavalliData.demo.slug,
      summary: cavalliData.demo.summary,
      matterportModelId: cavalliData.demo.matterportModelId,
      demoType: cavalliData.demo.demoType,
      isActive: cavalliData.demo.isActive,
      businessName: cavalliData.demo.businessName,
      businessPhone: cavalliData.demo.businessPhone,
      businessEmail: cavalliData.demo.businessEmail,
      businessWhatsapp: cavalliData.demo.businessWhatsapp,
      enableVoiceOver: cavalliData.demo.enableVoiceOver,
      enableLiveChat: cavalliData.demo.enableLiveChat,
      enableAiChat: cavalliData.demo.enableAiChat,
    });
    
    const demoId = demoResponse.data.id;
    const demoDocumentId = demoResponse.data.documentId;
    console.log(`✅ Demo created: ID=${demoId}, DocumentID=${demoDocumentId}`);
    
    // 2. Create Arabic localization
    console.log('Creating Arabic localization...');
    await client.localize('demos', demoDocumentId, 'ar', {
      title: cavalliData.demo.title_ar,
      slug: cavalliData.demo.slug,
      summary: cavalliData.demo.summary_ar,
      businessName: cavalliData.demo.businessName_ar,
    });
    console.log('✅ Arabic localization created');
    
    // 3. Create Menu Items
    console.log('\nCreating menu items...');
    for (const item of cavalliData.menuItems) {
      const itemResponse = await client.create('demo-menu-items', {
        name: item.name,
        description: item.description,
        price: item.price,
        currency: item.currency,
        category: item.category,
        isAvailable: item.isAvailable,
        isVegetarian: item.isVegetarian,
        hotspotPosition: {
          x: item.hotspotPositionX || 0,
          y: item.hotspotPositionY || 0,
          z: item.hotspotPositionZ || 0,
        },
        demo: demoId,
      });
      
      const itemDocumentId = itemResponse.data.documentId;
      
      // Create Arabic localization
      await client.localize('demo-menu-items', itemDocumentId, 'ar', {
        name: item.name_ar,
        description: item.description_ar,
        category: item.category_ar,
      });
      
      console.log(`  ✅ ${item.name}`);
    }
    
    console.log('\n🎉 Cavalli Cafe Demo seeded successfully!');
    console.log(`\nDemo URL: http://localhost:3000/en/demos/cavalli-cafe`);
    console.log(`Admin URL: http://localhost:3000/en/demos/cavalli-cafe/admin`);
    
  } catch (error) {
    console.error('❌ Error seeding demo:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

seedCavalliDemo();

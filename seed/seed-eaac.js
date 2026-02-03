/**
 * Seed EAAC Training Center Demo
 * Run: node seed/seed-eaac.js <TOKEN>
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import StrapiClient from './strapi-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TOKEN = process.argv[2] || process.env.SEED_TOKEN;
if (!TOKEN) {
  console.error('❌ Usage: node seed-eaac.js <TOKEN>');
  console.error('   Or: SEED_TOKEN=xxx node seed-eaac.js');
  process.exit(1);
}

// Load data
const eaacData = JSON.parse(readFileSync(join(__dirname, 'eaac-training.json'), 'utf-8'));
const client = new StrapiClient(TOKEN);

async function seedEaacDemo() {
  console.log('🎓 Seeding EAAC Training Center Demo...\n');
  
  try {
    // 0. Delete existing demo if exists
    console.log('Checking for existing demo...');
    await client.deleteBySlug('demos', eaacData.demo.slug);
    
    // 1. Create Demo Entry (English)
    console.log('Creating demo entry...');
    const demoResponse = await client.create('demos', {
      title: eaacData.demo.title,
      slug: eaacData.demo.slug,
      summary: eaacData.demo.summary,
      matterportModelId: eaacData.demo.matterportModelId,
      demoType: eaacData.demo.demoType,
      isActive: eaacData.demo.isActive,
      businessName: eaacData.demo.businessName,
      businessPhone: eaacData.demo.businessPhone,
      businessEmail: eaacData.demo.businessEmail,
      businessWhatsapp: eaacData.demo.businessWhatsapp,
      enableVoiceOver: eaacData.demo.enableVoiceOver,
      enableLiveChat: eaacData.demo.enableLiveChat,
      enableAiChat: eaacData.demo.enableAiChat,
    });
    
    const demoId = demoResponse.data.id;
    const demoDocumentId = demoResponse.data.documentId;
    console.log(`✅ Demo created: ID=${demoId}, DocumentID=${demoDocumentId}`);
    
    // 2. Create Arabic localization
    console.log('Creating Arabic localization...');
    await client.localize('demos', demoDocumentId, 'ar', {
      title: eaacData.demo.title_ar,
      slug: eaacData.demo.slug,
      summary: eaacData.demo.summary_ar,
      businessName: eaacData.demo.businessName_ar,
    });
    console.log('✅ Arabic localization created');
    
    // 3. Create Facilities (using demo-rooms for training rooms/halls)
    console.log('\nCreating training facilities...');
    for (const facility of eaacData.facilities) {
      const facilityResponse = await client.create('demo-rooms', {
        name: facility.name,
        description: facility.description,
        roomType: facility.facilityType,
        maxGuests: facility.capacity,
        pricePerNight: facility.dailyRate,
        currency: facility.currency,
        size: facility.capacity,
        hotspotPosition: {
          x: facility.hotspotPositionX || 0,
          y: facility.hotspotPositionY || 0,
          z: facility.hotspotPositionZ || 0,
        },
        demo: demoId,
      });
      
      const facilityDocumentId = facilityResponse.data.documentId;
      
      // Create Arabic localization
      await client.localize('demo-rooms', facilityDocumentId, 'ar', {
        name: facility.name_ar,
        description: facility.description_ar,
        roomType: facility.facilityType,
      });
      
      console.log(`  ✅ ${facility.name} (capacity: ${facility.capacity})`);
    }
    
    console.log('\n🎉 EAAC Training Center demo seeded successfully!');
    console.log(`\nDemo URL: http://localhost:3000/en/demos/eaac-training`);
    console.log(`Admin URL: http://localhost:3000/en/demos/eaac-training/admin`);
    
  } catch (error) {
    console.error('❌ Error seeding demo:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

seedEaacDemo();

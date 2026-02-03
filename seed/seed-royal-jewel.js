/**
 * Seed Royal Jewel Hotel Demo
 * Run: node seed/seed-royal-jewel.js <TOKEN>
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import StrapiClient from './strapi-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TOKEN = process.argv[2] || process.env.SEED_TOKEN;
if (!TOKEN) {
  console.error('❌ Usage: node seed-royal-jewel.js <TOKEN>');
  console.error('   Or: SEED_TOKEN=xxx node seed-royal-jewel.js');
  process.exit(1);
}

// Load data
const hotelData = JSON.parse(readFileSync(join(__dirname, 'royal-jewel-hotel.json'), 'utf-8'));
const client = new StrapiClient(TOKEN);

async function seedRoyalJewelDemo() {
  console.log('🚀 Seeding Royal Jewel Hotel Demo...\n');
  
  try {    // 0. Delete existing demo if exists
    console.log('Checking for existing demo...');
    await client.deleteBySlug('demos', hotelData.demo.slug);
        // 1. Create Demo Entry (English)
    console.log('Creating demo entry...');
    const demoResponse = await client.create('demos', {
      title: hotelData.demo.title,
      slug: hotelData.demo.slug,
      summary: hotelData.demo.summary,
      matterportModelId: hotelData.demo.matterportModelId,
      demoType: hotelData.demo.demoType,
      isActive: hotelData.demo.isActive,
      businessName: hotelData.demo.businessName,
      businessPhone: hotelData.demo.businessPhone,
      businessEmail: hotelData.demo.businessEmail,
      businessWhatsapp: hotelData.demo.businessWhatsapp,
      enableVoiceOver: hotelData.demo.enableVoiceOver,
      enableLiveChat: hotelData.demo.enableLiveChat,
      enableAiChat: hotelData.demo.enableAiChat,
    });
    
    const demoId = demoResponse.data.id;
    const demoDocumentId = demoResponse.data.documentId;
    console.log(`✅ Demo created: ID=${demoId}, DocumentID=${demoDocumentId}`);
    
    // 2. Create Arabic localization
    console.log('Creating Arabic localization...');
    await client.localize('demos', demoDocumentId, 'ar', {
      title: hotelData.demo.title_ar,
      slug: hotelData.demo.slug,
      summary: hotelData.demo.summary_ar,
      businessName: hotelData.demo.businessName_ar,
    });
    console.log('✅ Arabic localization created');
    
    // 3. Create Rooms
    console.log('\nCreating rooms...');
    for (const room of hotelData.rooms) {
      const roomResponse = await client.create('demo-rooms', {
        name: room.name,
        description: room.description,
        roomType: room.roomType,
        pricePerNight: room.pricePerNight,
        currency: room.currency,
        maxGuests: room.capacity,
        bedType: room.bedType,
        size: room.size,
        amenities: room.amenities,
        isAvailable: room.isAvailable,
        hotspotPosition: {
          x: room.hotspotPositionX || 0,
          y: room.hotspotPositionY || 0,
          z: room.hotspotPositionZ || 0,
        },
        demo: demoId,
      });
      
      const roomDocumentId = roomResponse.data.documentId;
      
      // Create Arabic localization
      await client.localize('demo-rooms', roomDocumentId, 'ar', {
        name: room.name_ar,
        description: room.description_ar,
        roomType: room.roomType_ar || room.roomType,
        bedType: room.bedType_ar || room.bedType,
        amenities: room.amenities_ar || room.amenities,
      });
      
      console.log(`  ✅ ${room.name} (${room.pricePerNight} EGP/night)`);
    }
    
    console.log('\n🎉 Royal Jewel Hotel Demo seeded successfully!');
    console.log(`\nDemo URL: http://localhost:3000/en/demos/royal-jewel-hotel`);
    console.log(`Admin URL: http://localhost:3000/en/demos/royal-jewel-hotel/admin`);
    
  } catch (error) {
    console.error('❌ Error seeding demo:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

seedRoyalJewelDemo();

/**
 * Seed Office for Sale Demo
 * Run: node seed/seed-office.js <TOKEN>
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import StrapiClient from './strapi-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TOKEN = process.argv[2] || process.env.SEED_TOKEN;
if (!TOKEN) {
  console.error('❌ Usage: node seed-office.js <TOKEN>');
  console.error('   Or: SEED_TOKEN=xxx node seed-office.js');
  process.exit(1);
}

// Load data
const officeData = JSON.parse(readFileSync(join(__dirname, 'office-for-sale.json'), 'utf-8'));
const client = new StrapiClient(TOKEN);

async function seedOfficeDemo() {
  console.log('🏢 Seeding Office for Sale Demo...\n');
  
  try {
    // 0. Delete existing demo if exists
    console.log('Checking for existing demo...');
    await client.deleteBySlug('demos', officeData.demo.slug);
    
    // 1. Create Demo Entry (English)
    console.log('Creating demo entry...');
    const demoResponse = await client.create('demos', {
      title: officeData.demo.title,
      slug: officeData.demo.slug,
      summary: officeData.demo.summary,
      matterportModelId: officeData.demo.matterportModelId,
      demoType: officeData.demo.demoType,
      isActive: officeData.demo.isActive,
      businessName: officeData.demo.businessName,
      businessPhone: officeData.demo.businessPhone,
      businessEmail: officeData.demo.businessEmail,
      businessWhatsapp: officeData.demo.businessWhatsapp,
      enableVoiceOver: officeData.demo.enableVoiceOver,
      enableLiveChat: officeData.demo.enableLiveChat,
      enableAiChat: officeData.demo.enableAiChat,
    });
    
    const demoId = demoResponse.data.id;
    const demoDocumentId = demoResponse.data.documentId;
    console.log(`✅ Demo created: ID=${demoId}, DocumentID=${demoDocumentId}`);
    
    // 2. Create Arabic localization
    console.log('Creating Arabic localization...');
    await client.localize('demos', demoDocumentId, 'ar', {
      title: officeData.demo.title_ar,
      slug: officeData.demo.slug,
      summary: officeData.demo.summary_ar,
      businessName: officeData.demo.businessName_ar,
    });
    console.log('✅ Arabic localization created');
    
    // 3. Create Main Property
    console.log('\nCreating main property...');
    const propertyResponse = await client.create('demo-properties', {
      title: officeData.property.title,
      description: officeData.property.description,
      propertyType: officeData.property.propertyType,
      listingType: officeData.property.transactionType,
      price: officeData.property.price,
      currency: officeData.property.currency,
      area: officeData.property.size,
      areaUnit: 'sqm',
      bedrooms: officeData.property.bedrooms,
      bathrooms: officeData.property.bathrooms,
      address: officeData.property.address,
      isAvailable: officeData.property.isAvailable,
      demo: demoId,
    });
    
    const propertyDocumentId = propertyResponse.data.documentId;
    console.log(`  ✅ ${officeData.property.title}`);
    
    // Create Arabic localization for property
    await client.localize('demo-properties', propertyDocumentId, 'ar', {
      title: officeData.property.title_ar,
      description: officeData.property.description_ar,
      address: officeData.property.address_ar,
    });
    
    // 4. Create Areas (as demo-rooms or similar)
    console.log('\nCreating office areas...');
    for (const area of officeData.areas) {
      const areaResponse = await client.create('demo-rooms', {
        name: area.name,
        description: area.description,
        roomType: area.areaType,
        size: area.size,
        pricePerNight: 0,
        currency: 'EGP',
        hotspotPosition: {
          x: area.hotspotPositionX || 0,
          y: area.hotspotPositionY || 0,
          z: area.hotspotPositionZ || 0,
        },
        demo: demoId,
      });
      
      const areaDocumentId = areaResponse.data.documentId;
      
      // Create Arabic localization
      await client.localize('demo-rooms', areaDocumentId, 'ar', {
        name: area.name_ar,
        description: area.description_ar,
        roomType: area.areaType,
      });
      
      console.log(`  ✅ ${area.name}`);
    }
    
    console.log('\n🎉 Office for Sale demo seeded successfully!');
    console.log(`\nDemo URL: http://localhost:3000/en/demos/office-for-sale`);
    console.log(`Admin URL: http://localhost:3000/en/demos/office-for-sale/admin`);
    
  } catch (error) {
    console.error('❌ Error seeding demo:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

seedOfficeDemo();

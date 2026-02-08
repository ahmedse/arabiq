#!/usr/bin/env node
/**
 * Test script for Strapi Loader
 */

import { loadDemoFromCMS, getCacheStats } from './lib/ai-engine/strapi-loader.ts';

async function test() {
  console.log('Testing Strapi Loader...\n');
  
  try {
    const result = await loadDemoFromCMS('awni-electronics');
    
    console.log('Demo Config:');
    console.log('- Slug:', result.demo.slug);
    console.log('- Type:', result.demo.type);
    console.log('- Business Name:', result.demo.businessName);
    console.log('- Business Name (AR):', result.demo.businessNameAr);
    console.log('- Strapi ID:', result.demo.strapiId);
    console.log('');
    
    console.log('Items loaded:', result.items.length);
    console.log('');
    
    if (result.items.length > 0) {
      console.log('First 3 items:');
      result.items.slice(0, 3).forEach((item, idx) => {
        console.log(`\n${idx + 1}. ${item.title} (${item.titleAr || 'no AR'})`);
        console.log('   ID:', item.id);
        console.log('   Price:', item.price, item.currency);
        console.log('   Available:', item.available);
        if (item.specifications) {
          console.log('   Specs:', Object.keys(item.specifications).join(', '));
        }
      });
    }
    
    console.log('\n\nCache Stats:', getCacheStats());
    
  } catch (error) {
    console.error('Error:', error);
  }
}

test();

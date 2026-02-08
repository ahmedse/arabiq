/**
 * Process Awni Product Images with AI Vision
 * Extracts brand/product info from screenshots and creates CMS entries
 * 
 * Usage: node seed/process-awni-images.js <STRAPI_TOKEN> [POE_API_KEY]
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import axios from 'axios';

const __dirname = dirname(fileURLToPath(import.meta.url));

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.argv[2] || process.env.SEED_TOKEN;
const POE_API_KEY = process.argv[3] || process.env.POE_API_KEY;

if (!STRAPI_TOKEN) {
  console.error('❌ Usage: node process-awni-images.js <STRAPI_TOKEN> [POE_API_KEY]');
  console.error('   Or set SEED_TOKEN and POE_API_KEY env vars');
  process.exit(1);
}

const strapi = axios.create({
  baseURL: STRAPI_URL,
  headers: {
    'Authorization': `Bearer ${STRAPI_TOKEN}`,
  },
});

/**
 * Analyze image using AI vision to extract product details
 */
async function analyzeProductImage(imagePath, useVision = true) {
  const fileName = imagePath.split('/').pop();
  
  if (!useVision || !POE_API_KEY) {
    // Fallback: Extract basic info from filename
    console.log(`  ⚠️  No AI vision available, using filename heuristics for ${fileName}`);
    return {
      brand: 'Unknown Brand',
      productName_en: 'Product from ' + fileName.replace(/\.[^.]+$/, ''),
      productName_ar: 'منتج من ' + fileName.replace(/\.[^.]+$/, ''),
      category_en: 'Electronics',
      category_ar: 'أجهزة إلكترونية',
      description_en: 'Electronic product',
      description_ar: 'منتج إلكتروني',
      price: 999.99,
      currency: 'EGP',
      confidence: 'low'
    };
  }

  try {
    // Read image as base64
    const imageBuffer = readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

    console.log(`  🔍 Analyzing ${fileName} with Poe AI vision...`);

    const response = await axios.post(
      'https://api.poe.com/bot/GPT-4o-Mini',
      {
        version: '1.0',
        type: 'query',
        query: [
          {
            role: 'user',
            content: `Analyze this product image from an electronics store in Egypt. Extract:
1. Brand name (e.g., Samsung, LG, Toshiba, etc.)
2. Product name in English
3. Product name in Arabic
4. Product category in English (e.g., TV, Refrigerator, Washing Machine, Air Conditioner, etc.)
5. Product category in Arabic
6. Brief description in English (1-2 sentences)
7. Brief description in Arabic (1-2 sentences)
8. Estimated price in EGP (Egyptian Pounds)

Return ONLY valid JSON in this exact format:
{
  "brand": "Brand Name",
  "productName_en": "Product Name",
  "productName_ar": "اسم المنتج",
  "category_en": "Category",
  "category_ar": "الفئة",
  "description_en": "Description",
  "description_ar": "الوصف",
  "price": 9999.99,
  "currency": "EGP"
}`,
            content_type: 'text/plain',
            attachments: [
              {
                url: `data:${mimeType};base64,${base64Image}`,
                content_type: mimeType
              }
            ]
          }
        ],
        user_id: 'seed-script',
        conversation_id: '',
        message_id: ''
      },
      {
        headers: {
          'Authorization': `Bearer ${POE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Parse SSE response
    let fullText = '';
    if (response.data.text) {
      fullText = response.data.text;
    } else if (typeof response.data === 'string') {
      // Parse SSE format
      const lines = response.data.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.text) fullText += data.text;
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    // Extract JSON from response
    let jsonText = fullText.trim();
    const jsonMatch = fullText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      // Try to find raw JSON
      const rawJsonMatch = fullText.match(/(\{[\s\S]*?"currency"\s*:\s*"[A-Z]+"\s*\})/);
      if (rawJsonMatch) {
        jsonText = rawJsonMatch[1];
      }
    }
    
    const productData = JSON.parse(jsonText);
    productData.confidence = 'high';
    
    console.log(`  ✅ Extracted: ${productData.brand} - ${productData.productName_en}`);
    return productData;

  } catch (error) {
    console.error(`  ❌ Vision analysis failed for ${fileName}:`, error.message);
    // Fallback to heuristic
    return analyzeProductImage(imagePath, false);
  }
}

/**
 * Upload image to Strapi media library
 */
async function uploadImageToStrapi(imagePath) {
  const fileName = imagePath.split('/').pop();
  console.log(`  📤 Uploading ${fileName}...`);

  const formData = new FormData();
  formData.append('files', readFileSync(imagePath), fileName);

  try {
    const response = await strapi.post('/api/upload', formData, {
      headers: formData.getHeaders(),
    });

    const uploadedFile = response.data[0];
    console.log(`  ✅ Uploaded: ${uploadedFile.name} (ID: ${uploadedFile.id})`);
    return uploadedFile;
  } catch (error) {
    console.error(`  ❌ Upload failed for ${fileName}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create product in Strapi
 */
async function createProduct(productData, imageId, demoDocumentId) {
  try {
    // Create English version
    const response = await strapi.post('/api/demo-products', {
      data: {
        name: productData.productName_en,
        description: productData.description_en,
        brand: productData.brand,
        category: productData.category_en,
        price: productData.price,
        currency: productData.currency,
        inStock: true,
        images: [imageId],
        demo: demoDocumentId,
        locale: 'en',
        publishedAt: new Date().toISOString(),
      },
    });

    const productDocumentId = response.data.data.documentId;
    console.log(`  ✅ Created product: ${productData.productName_en} (${productDocumentId})`);

    // Create Arabic localization using Strapi v5 locale-specific update
    await strapi.put(`/api/demo-products/${productDocumentId}?locale=ar`, {
      data: {
        name: productData.productName_ar,
        description: productData.description_ar,
        category: productData.category_ar,
        publishedAt: new Date().toISOString(),
      },
    });

    console.log(`  ✅ Added Arabic localization`);
    return response.data.data;

  } catch (error) {
    console.error(`  ❌ Product creation failed:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Main processing function
 */
async function processAwniProducts() {
  console.log('🚀 Processing Awni Electronics Product Images\n');
  console.log(`📁 Image folder: /tmp/awni/`);
  console.log(`🔗 Strapi URL: ${STRAPI_URL}`);
  console.log(`🤖 AI Vision: ${POE_API_KEY ? 'Enabled (Poe GPT-4o-Mini)' : 'Disabled (using heuristics)'}\n`);

  try {
    // 1. Get Awni demo
    console.log('📋 Fetching Awni demo...');
    const demoResponse = await strapi.get('/api/demos', {
      params: {
        filters: { slug: { $eq: 'awni-electronics' } },
        locale: 'en',
      },
    });

    if (!demoResponse.data.data.length) {
      throw new Error('Awni demo not found. Run seed-awni.js first.');
    }

    const demoDocumentId = demoResponse.data.data[0].documentId;
    console.log(`✅ Found Awni demo: ${demoDocumentId}\n`);

    // 2. Get all images from tmp/awni
    const imagesDir = join(dirname(__dirname), 'tmp', 'awni');
    const imageFiles = readdirSync(imagesDir)
      .filter(f => /\.(png|jpg|jpeg)$/i.test(f))
      .map(f => join(imagesDir, f))
      .sort();

    console.log(`📸 Found ${imageFiles.length} images to process\n`);

    // 3. Process each image
    const results = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const imagePath = imageFiles[i];
      const fileName = imagePath.split('/').pop();
      
      console.log(`\n[${i + 1}/${imageFiles.length}] Processing: ${fileName}`);
      console.log('─'.repeat(60));

      try {
        // Analyze image
        const productData = await analyzeProductImage(imagePath, !!POE_API_KEY);

        // Upload image
        const uploadedFile = await uploadImageToStrapi(imagePath);

        // Create product
        const product = await createProduct(productData, uploadedFile.id, demoDocumentId);

        results.push({
          fileName,
          success: true,
          product: product.name,
          brand: productData.brand,
          confidence: productData.confidence,
        });

      } catch (error) {
        console.error(`  ❌ Failed to process ${fileName}`);
        results.push({
          fileName,
          success: false,
          error: error.message,
        });
      }
    }

    // 4. Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 PROCESSING SUMMARY');
    console.log('═'.repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
    if (successful.length > 0) {
      successful.forEach(r => {
        console.log(`   • ${r.product} (${r.brand}) [${r.confidence} confidence]`);
      });
    }

    if (failed.length > 0) {
      console.log(`\n❌ Failed: ${failed.length}/${results.length}`);
      failed.forEach(r => {
        console.log(`   • ${r.fileName}: ${r.error}`);
      });
    }

    console.log('\n🎉 Processing complete!');
    console.log(`\nView products at: http://localhost:3000/en/demos/awni-electronics`);

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  processAwniProducts().catch(console.error);
}

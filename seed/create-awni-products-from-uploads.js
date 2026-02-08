/**
 * Create Awni products from already-uploaded images
 * Simpler approach: manual product data
 */

import StrapiClient from './strapi-client.js';

const TOKEN = process.argv[2] || process.env.SEED_TOKEN;
if (!TOKEN) {
  console.error('❌ Usage: node create-awni-products-from-uploads.js <TOKEN>');
  process.exit(1);
}

const client = new StrapiClient(TOKEN);

// Product data for each image (IDs 1-11 already uploaded)
const products = [
  {
    imageId: 1,
    name_en: 'Samsung Refrigerator',
    name_ar: 'ثلاجة سامسونج',
    brand: 'Samsung',
    category_en: 'Refrigerators',
    category_ar: 'ثلاجات',
    description_en: 'Samsung side-by-side refrigerator with digital inverter technology',
    description_ar: 'ثلاجة سامسونج جانبية بتقنية العاكس الرقمي',
    price: 18999.00,
  },
  {
    imageId: 2,
    name_en: 'LG Washing Machine',
    name_ar: 'غسالة إل جي',
    brand: 'LG',
    category_en: 'Washing Machines',
    category_ar: 'غسالات',
    description_en: 'LG front load washing machine with AI DD technology',
    description_ar: 'غسالة إل جي أمامية بتقنية الذكاء الاصطناعي',
    price: 12499.00,
  },
  {
    imageId: 3,
    name_en: 'Samsung LED TV 55"',
    name_ar: 'تلفزيون سامسونج LED 55 بوصة',
    brand: 'Samsung',
    category_en: 'Televisions',
    category_ar: 'تلفزيونات',
    description_en: '55-inch 4K UHD Smart LED TV with Crystal Display',
    description_ar: 'تلفزيون ذكي 55 بوصة 4K UHD LED بشاشة الكريستال',
    price: 15999.00,
  },
  {
    imageId: 4,
    name_en: 'Toshiba Air Conditioner',
    name_ar: 'مكيف توشيبا',
    brand: 'Toshiba',
    category_en: 'Air Conditioners',
    category_ar: 'مكيفات',
    description_en: 'Toshiba split air conditioner 2.25 HP with plasma technology',
    description_ar: 'مكيف توشيبا اسبليت 2.25 حصان بتقنية البلازما',
    price: 9999.00,
  },
  {
    imageId: 5,
    name_en: 'Bosch Dishwasher',
    name_ar: 'غسالة صحون بوش',
    brand: 'Bosch',
    category_en: 'Dishwashers',
    category_ar: 'غسالات صحون',
    description_en: 'Bosch built-in dishwasher with 6 programs',
    description_ar: 'غسالة صحون بوش مدمجة بـ 6 برامج',
    price: 14999.00,
  },
  {
    imageId: 6,
    name_en: 'Sharp Microwave Oven',
    name_ar: 'فرن مايكروويف شارب',
    brand: 'Sharp',
    category_en: 'Microwave Ovens',
    category_ar: 'أفران مايكروويف',
    description_en: 'Sharp microwave oven with grill and convection',
    description_ar: 'فرن مايكروويف شارب مع شواية وحمل حراري',
    price: 3499.00,
  },
  {
    imageId: 7,
    name_en: 'Ariston Gas Cooker',
    name_ar: 'بوتاجاز أريستون',
    brand: 'Ariston',
    category_en: 'Gas Cookers',
    category_ar: 'بوتاجازات',
    description_en: 'Ariston 5 burner gas cooker with electric oven',
    description_ar: 'بوتاجاز أريستون 5 شعلة مع فرن كهربائي',
    price: 8999.00,
  },
  {
    imageId: 8,
    name_en: 'Electrolux Vacuum Cleaner',
    name_ar: 'مكنسة كهربائية إلكترولوكس',
    brand: 'Electrolux',
    category_en: 'Vacuum Cleaners',
    category_ar: 'مكانس كهربائية',
    description_en: 'Electrolux bagless vacuum cleaner 2000W',
    description_ar: 'مكنسة كهربائية إلكترولوكس بدون كيس 2000 وات',
    price: 2999.00,
  },
  {
    imageId: 9,
    name_en: 'Philips Air Fryer',
    name_ar: 'قلاية هوائية فيليبس',
    brand: 'Philips',
    category_en: 'Air Fryers',
    category_ar: 'قلايات هوائية',
    description_en: 'Philips Airfryer XXL with Rapid Air technology',
    description_ar: 'قلاية فيليبس الهوائية XXL بتقنية الهواء السريع',
    price: 4499.00,
  },
  {
    imageId: 10,
    name_en: 'Braun Coffee Maker',
    name_ar: 'ماكينة قهوة براون',
    brand: 'Braun',
    category_en: 'Coffee Makers',
    category_ar: 'ماكينات قهوة',
    description_en: 'Braun automatic coffee maker with grinder',
    description_ar: 'ماكينة قهوة براون أوتوماتيك مع مطحنة',
    price: 5999.00,
  },
  {
    imageId: 11,
    name_en: 'Tefal Electric Kettle',
    name_ar: 'غلاية كهربائية تيفال',
    brand: 'Tefal',
    category_en: 'Electric Kettles',
    category_ar: 'غلايات كهربائية',
    description_en: 'Tefal stainless steel electric kettle 1.7L',
    description_ar: 'غلاية تيفال الكهربائية ستانلس ستيل 1.7 لتر',
    price: 1299.00,
  },
];

async function createProducts() {
  console.log('🚀 Creating Awni products from uploaded images\n');

  try {
    // Get Awni demo
    const demo = await client.findOne('demos', 'slug', 'awni-electronics', 'en');
    if (!demo) throw new Error('Awni demo not found');
    
    const demoDocumentId = demo.documentId;
    console.log(`✅ Found demo: ${demoDocumentId}\n`);

    // Delete existing products
    console.log('Cleaning up existing products...');
    await client.deleteRelatedByDemo('demo-products', demoDocumentId);
    console.log('✅ Cleanup complete\n');

    // Create each product
    for (const product of products) {
      console.log(`Creating: ${product.name_en}...`);
      
      // Create English version
      const created = await client.createCollection('demo-products', {
        name: product.name_en,
        description: product.description_en,
        brand: product.brand,
        category: product.category_en,
        price: product.price,
        currency: 'EGP',
        inStock: true,
        images: [product.imageId],
        demo: demoDocumentId,
      }, 'en');

      // Create Arabic localization
      await client.createLocale('demo-products', created.documentId, {
        name: product.name_ar,
        description: product.description_ar,
        category: product.category_ar,
      }, 'ar');

      console.log(`  ✅ ${product.name_en} (${created.documentId})\n`);
    }

    console.log('🎉 All products created successfully!');
    console.log(`\nView at: http://localhost:3000/en/demos/awni-electronics`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

createProducts();

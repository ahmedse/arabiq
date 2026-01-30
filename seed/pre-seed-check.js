#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHECKS = {
  passed: [],
  failed: [],
  warnings: []
};

function log(type, message) {
  const icons = { pass: '✅', fail: '❌', warn: '⚠️', info: 'ℹ️' };
  console.log(`${icons[type]} ${message}`);

  if (type === 'pass') CHECKS.passed.push(message);
  if (type === 'fail') CHECKS.failed.push(message);
  if (type === 'warn') CHECKS.warnings.push(message);
}

async function checkStrapiRunning() {
  return new Promise((resolve) => {
    http.get('http://localhost:1337/api', (res) => {
      resolve(res.statusCode < 500);
    }).on('error', () => resolve(false));
  });
}

async function checkEndpoint(path) {
  return new Promise((resolve) => {
    http.get(`http://localhost:1337${path}`, (res) => {
      resolve(res.statusCode);
    }).on('error', () => resolve(0));
  });
}

async function runChecks() {
  console.log('═══════════════════════════════════════════');
  console.log('   STRAPI PRE-SEED PERFECTION CHECKLIST   ');
  console.log('═══════════════════════════════════════════\n');

  // 1. Check Strapi is running
  console.log('1️⃣  STRAPI SERVER');
  const strapiRunning = await checkStrapiRunning();
  if (strapiRunning) {
    log('pass', 'Strapi server is running');
  } else {
    log('fail', 'Strapi server not responding - run: cd cms && npm run develop');
    return;
  }

  // 2. Check data files exist
  console.log('\n2️⃣  DATA FILES');
  const dataDir = path.join(__dirname, 'data');
  const requiredFiles = [
    'faqs.json',
    'testimonials.json',
    'pricing-plans.json',
    'partners.json',
    'pricing-page.json',
    'solutions-page.json',
    'industries-page.json',
    'demos-page.json',
    'case-studies-page.json'
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (data.en && data.ar) {
          log('pass', `${file} - valid bilingual data`);
        } else {
          log('warn', `${file} - missing EN or AR content`);
        }
      } catch (e) {
        log('fail', `${file} - invalid JSON`);
      }
    } else {
      log('fail', `${file} - file not found`);
    }
  }

  // 3. Check API endpoints
  console.log('\n3️⃣  API ENDPOINTS');
  const endpoints = [
    '/api/faqs',
    '/api/testimonials',
    '/api/pricing-plans',
    '/api/partners',
    '/api/pricing-page',
    '/api/solutions-page',
    '/api/industries-page',
    '/api/demos-page',
    '/api/case-studies-page'
  ];

  for (const endpoint of endpoints) {
    const status = await checkEndpoint(endpoint);
    if (status === 200) {
      log('pass', `${endpoint} accessible`);
    } else if (status === 403) {
      log('warn', `${endpoint} returns 403 - check public permissions`);
    } else {
      log('fail', `${endpoint} returns ${status || 'no response'}`);
    }
  }

  // 4. Check i18n locales
  console.log('\n4️⃣  LOCALIZATION');
  const localesStatus = await checkEndpoint('/api/i18n/locales');
  if (localesStatus === 200) {
    log('pass', 'i18n locales endpoint accessible');
  } else {
    log('warn', 'Cannot verify locales - ensure EN and AR are configured');
  }

  // 5. Check content type schemas
  console.log('\n5️⃣  SCHEMA VALIDATION');
  const cmsApiDir = path.join(__dirname, '../cms/src/api');
  const contentTypes = [
    'faq',
    'testimonial',
    'pricing-plan',
    'partner',
    'pricing-page',
    'solutions-page',
    'industries-page',
    'demos-page',
    'case-studies-page'
  ];

  for (const type of contentTypes) {
    const schemaPath = path.join(cmsApiDir, type, 'content-types', type, 'schema.json');
    if (fs.existsSync(schemaPath)) {
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
      if (schema.pluginOptions?.i18n?.localized) {
        log('pass', `${type} schema - i18n enabled`);
      } else {
        log('warn', `${type} schema - i18n not enabled at root level`);
      }
    } else {
      log('fail', `${type} schema not found`);
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════');
  console.log('                 SUMMARY                   ');
  console.log('═══════════════════════════════════════════');
  console.log(`✅ Passed:   ${CHECKS.passed.length}`);
  console.log(`⚠️  Warnings: ${CHECKS.warnings.length}`);
  console.log(`❌ Failed:   ${CHECKS.failed.length}`);

  if (CHECKS.failed.length === 0) {
    console.log('\n🎉 ALL CRITICAL CHECKS PASSED!');
    console.log('   Safe to run: node seed.js $TOKEN --fresh');
  } else {
    console.log('\n🚫 FIX FAILED CHECKS BEFORE SEEDING');
    CHECKS.failed.forEach(f => console.log(`   - ${f}`));
  }
}

runChecks();
#!/usr/bin/env node

const STRAPI_URL = 'http://127.0.0.1:1337';
const TOKEN = process.env.SEED_TOKEN || '6ea9b21562ea143156a28f194a9ada7699ec78c6cbe9b81a7fc120f29b1966235a98e962c32092dea6efb4fdda3aef4493f770232f00da7ca6f8a63813bab944e380c803f811ad89314f8d1734a7bcdf14eeeeebcf57119a8442d0e7fefa849a20f6c15b7cc38fbf728cad331ecdffc8f2e2cfca7e48e2494d6b37fc6f3edf68';

const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${TOKEN}`
};

function assertJsonResponse(res, text) {
  const ct = res.headers && res.headers.get && res.headers.get('content-type');
  if (!res.ok) {
    console.error('❌ Request failed with status', res.status);
    console.error('Response:', text);
    process.exit(1);
  }
  if (!ct || !ct.includes('application/json')) {
    console.error('❌ Expected JSON response but got:', ct);
    console.error('Response body:', text);
    process.exit(1);
  }
}

async function enablePublicPermissions() {
  try {
    console.log('🔓 Enabling public API permissions...\n');
    
    // Get current public role
    const rolesRes = await fetch(`${STRAPI_URL}/admin/users-permissions/roles`, { headers });
    const rolesText = await rolesRes.text();
    assertJsonResponse(rolesRes, rolesText);
    const rolesData = JSON.parse(rolesText);
    const publicRole = rolesData.data?.find(r => r.type === 'public');
    
    if (!publicRole) {
      console.error('❌ Public role not found');
      process.exit(1);
    }
    
    console.log(`Found public role: ${publicRole.id}`);
    
    // Content types to enable
    const contentTypes = [
      'api::site-setting.site-setting',
      'api::homepage.homepage', 
      'api::about-page.about-page',
      'api::contact-page.contact-page',
      'api::nav-item.nav-item',
      'api::feature.feature',
      'api::stat.stat',
      'api::process-step.process-step',
      'api::trusted-company.trusted-company',
      'api::solution.solution',
      'api::industry.industry',
      'api::case-study.case-study',
      // 'api::demo.demo', // kept intentionally public listing is allowed, but detail view is restricted (see override below)
      'api::team-member.team-member',
      'api::value.value'
    ];
    
    // Build permissions object
    const permissions = {};
    for (const ct of contentTypes) {
      permissions[ct] = {
        controllers: {
          [ct.split('.')[1]]: {
            find: { enabled: true },
            findOne: { enabled: true }
          }
        }
      };
    }
    
    // Update public role with permissions
    const updateRes = await fetch(`${STRAPI_URL}/admin/users-permissions/roles/${publicRole.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        name: publicRole.name,
        description: publicRole.description,
        type: publicRole.type,
        permissions
      })
    });

    // Additionally, ensure demo detail (findOne) is disabled for public role to protect restricted demos
    // Fetch the permission id for demo.findOne and disable it
    const permsRes = await fetch(`${STRAPI_URL}/admin/users-permissions/roles/${publicRole.id}` , { headers });
    const permsText = await permsRes.text();
    assertJsonResponse(permsRes, permsText);
    const permsData = JSON.parse(permsText);
    const demoPermKey = 'api::demo.demo.controllers.demo.findOne';
    if (permsData?.permissions && permsData.permissions[demoPermKey]) {
      permsData.permissions[demoPermKey].enabled = false;
      const patchRes = await fetch(`${STRAPI_URL}/admin/users-permissions/roles/${publicRole.id}`, {
        method: 'PUT', headers, body: JSON.stringify({
          name: publicRole.name,
          description: publicRole.description,
          type: publicRole.type,
          permissions: permsData.permissions
        })
      });
      const patchText = await patchRes.text();
      if (patchRes.ok) {
        console.log('\n✅ Demo detail (findOne) disabled for public role');
      } else {
        console.error('❌ Failed to patch demo permission:', patchText);
      }
    }
    
    if (updateRes.ok) {
      console.log('\n✅ Public API permissions enabled successfully!');
      console.log('   All content types can now be accessed via /api endpoints\n');
    } else {
      const error = await updateRes.text();
      console.error('❌ Failed to update permissions:', error);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

enablePublicPermissions();

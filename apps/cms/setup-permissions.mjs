// Script to configure public permissions for all content types in Strapi 5
const ADMIN_EMAIL = 'admin@arabiq.sa';
const ADMIN_PASSWORD = 'AdminPass123';
const BASE_URL = 'http://127.0.0.1:1337';

const CONTENT_TYPES = [
  'about-page', 'case-study', 'contact-page', 'demo', 'feature',
  'homepage', 'industry', 'nav-item', 'process-step', 'site-setting',
  'solution', 'stat', 'trusted-company'
];

async function main() {
  console.log('🔐 Logging in as admin...');
  
  const loginRes = await fetch(`${BASE_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  
  if (!loginRes.ok) {
    throw new Error(`Login failed: ${await loginRes.text()}`);
  }
  
  const { data: loginData } = await loginRes.json();
  const jwt = loginData.token;
  console.log('✅ Logged in');
  
  // Get roles
  console.log('📋 Finding Public role...');
  const rolesRes = await fetch(`${BASE_URL}/users-permissions/roles`, {
    headers: { Authorization: `Bearer ${jwt}` }
  });
  
  if (!rolesRes.ok) {
    throw new Error(`Failed to get roles: ${await rolesRes.text()}`);
  }
  
  const rolesData = await rolesRes.json();
  const publicRole = rolesData.roles.find(r => r.type === 'public');
  
  if (!publicRole) {
    throw new Error('Public role not found');
  }
  
  console.log(`✅ Found Public role: id=${publicRole.id}`);
  
  // Get full role details
  const roleDetailRes = await fetch(`${BASE_URL}/users-permissions/roles/${publicRole.id}`, {
    headers: { Authorization: `Bearer ${jwt}` }
  });
  
  if (!roleDetailRes.ok) {
    throw new Error(`Failed to get role details: ${await roleDetailRes.text()}`);
  }
  
  const roleDetail = await roleDetailRes.json();
  const permissions = roleDetail.role.permissions || {};
  
  // Enable find and findOne for all content types
  console.log('🔧 Configuring permissions...');
  
  for (const ct of CONTENT_TYPES) {
    const key = `api::${ct}`;
    if (!permissions[key]) {
      permissions[key] = { controllers: {} };
    }
    if (!permissions[key].controllers) {
      permissions[key].controllers = {};
    }
    
    permissions[key].controllers[ct] = permissions[key].controllers[ct] || {};
    permissions[key].controllers[ct].find = { enabled: true };
    permissions[key].controllers[ct].findOne = { enabled: true };
    
    console.log(`  ✓ ${ct}: find + findOne enabled`);
  }
  
  // Update permissions
  console.log('📤 Saving permissions...');
  
  const updateRes = await fetch(`${BASE_URL}/users-permissions/roles/${publicRole.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`
    },
    body: JSON.stringify({
      ...roleDetail.role,
      permissions
    })
  });
  
  if (!updateRes.ok) {
    console.error('Update failed:', await updateRes.text());
    throw new Error('Failed to update permissions');
  }
  
  console.log('✅ Public permissions configured!');
  
  // Test API access
  console.log('\n🧪 Testing API access...');
  
  for (const ct of ['nav-items', 'homepage', 'solutions']) {
    const testRes = await fetch(`${BASE_URL}/api/${ct}?locale=en`);
    const testData = await testRes.json();
    const status = testRes.status === 200 ? '✅' : '❌';
    const count = testData.data ? (Array.isArray(testData.data) ? testData.data.length : 1) : 0;
    console.log(`  ${status} /api/${ct}: ${testRes.status} (${count} items)`);
  }
  
  console.log('\n🎉 Setup complete!');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

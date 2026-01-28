#!/usr/bin/env node
// Script to create the admin user directly for fresh databases

const BASE = 'http://127.0.0.1:1337';

async function main() {
  console.log('🔧 Creating admin user...');
  
  // Check if registration is needed
  const initRes = await fetch(`${BASE}/admin/init`);
  const initData = await initRes.json();
  
  if (initData.data?.hasAdmin) {
    console.log('✅ Admin user already exists');
    return;
  }
  
  // Register the first admin (values from env or defaults)
  const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL || 'admin@arabiq.tech';
  const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD || 'TestUser_132';
  const ADMIN_FIRSTNAME = process.env.ADMIN_SEED_FIRSTNAME || 'Admin';
  const ADMIN_LASTNAME = process.env.ADMIN_SEED_LASTNAME || '';

  const registerRes = await fetch(`${BASE}/admin/register-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      firstname: ADMIN_FIRSTNAME,
      lastname: ADMIN_LASTNAME,
      password: ADMIN_PASSWORD
    })
  });
  
  if (!registerRes.ok) {
    const text = await registerRes.text();
    console.error('❌ Registration failed:', text);
    process.exit(1);
  }
  
  const result = await registerRes.json();
  console.log('✅ Admin user created:', result.data?.user?.email);
  console.log('\n📝 Login credentials:');
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

const BASE = 'http://127.0.0.1:1337';
import { writeFileSync } from 'fs';

const loginRes = await fetch(BASE + '/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@arabiq.sa', password: 'AdminPass123' })
});
const { data } = await loginRes.json();
const jwt = data.token;
console.log('Logged in');

const createRes = await fetch(BASE + '/admin/api-tokens', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + jwt 
  },
  body: JSON.stringify({
    name: 'Seed Token ' + Date.now(),
    description: 'Token for seeding',
    type: 'full-access',
    lifespan: null
  })
});
const tokenData = await createRes.json();
if (!tokenData.data) {
  console.error('Error:', JSON.stringify(tokenData));
  process.exit(1);
}
const token = tokenData.data.accessKey;
console.log('Token created');

writeFileSync('.env.local', 'SEED_TOKEN=' + token + '\n');
console.log('Saved to .env.local');

const TOKEN = process.argv[2];
const data = { title: 'Test', slug: 'test', summary: 'test', description: 'test', body: 'test', icon: '🏬', allowedRoles: [] };
const res = await fetch('http://127.0.0.1:1337/api/solutions?locale=en', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
  body: JSON.stringify({ data })
});
console.log('Status:', res.status);
const text = await res.text();
console.log('Response:', text);

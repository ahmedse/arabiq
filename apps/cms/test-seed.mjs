const STRAPI_URL = 'http://127.0.0.1:1337';
const token = process.env.SEED_TOKEN || '20c2733db8dc217025b4ee4d81ab28154b2f84187524f708b6b26c56f1f2f3036b3fdc99dace408e3792168fbe65dcaab49a9e1fd4a268d2ca4acfa0b438beec8dba2992cf80a972053be0f46e6bf78a548c234c1b86d645fca52d655bc1e775ceb74957f3f72199e1abf5a0da7a56dbfe9c0aebd202bfa8deb0e576e7224d8a';

const res = await fetch(`${STRAPI_URL}/api/site-setting?locale=en`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    data: {
      title: 'Test Title',
      description: 'Test Description'
    }
  })
});

console.log('Status:', res.status);
const text = await res.text();
console.log('Response:', text.substring(0, 200));

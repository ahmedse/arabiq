const { Client } = require('pg');

const client = new Client({
  user: 'arabiq',
  host: '127.0.0.1',
  database: 'arabiq',
  password: 'IDI5+1dEhv8FBGBGgegZJe4D9p/M7ndU2cNypGTdtcc=',
  port: 5432,
});

(async () => {
  try {
    await client.connect();
    await client.query("ALTER TABLE up_users ADD COLUMN IF NOT EXISTS confirmation_token_expires_at timestamp;");
    console.log('ALTER TABLE executed');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Error running ALTER TABLE:', err);
    try { await client.end(); } catch(e){}
    process.exit(1);
  }
})();
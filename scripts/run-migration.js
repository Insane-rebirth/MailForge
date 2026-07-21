const fs = require('fs');
const https = require('https');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ymdgkivkaagfrdnvvqbr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is not set');
  process.exit(1);
}

const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: node scripts/run-migration.js <migration-file>');
  process.exit(1);
}

const sqlContent = fs.readFileSync(migrationFile, 'utf-8');

const options = {
  hostname: new URL(SUPABASE_URL).hostname,
  path: '/rest/v1/rpc/execute_sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
  },
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (res.statusCode === 200) {
        console.log('Migration executed successfully!');
        console.log('Result:', result);
      } else {
        console.error('Migration failed:', result);
        process.exit(1);
      }
    } catch (error) {
      console.error('Failed to parse response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('Error executing migration:', error);
  process.exit(1);
});

req.write(JSON.stringify({ sql: sqlContent }));
req.end();

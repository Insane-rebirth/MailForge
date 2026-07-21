const https = require('https');

const SUPABASE_URL = 'https://ymdgkivkaagfrdnvvqbr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZGdraXZrYWFnZnJkbnZ2cWJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODMwMDUzMCwiZXhwIjoyMDkzODc2NTMwfQ.P-F8ToqS-0xPJOM7YttY6qtYVJRN-ZbFcgYg7ZHRY-w';

console.log('Testing Supabase connection...');
console.log('URL:', SUPABASE_URL);
console.log('Key length:', SERVICE_ROLE_KEY.length);

const options = {
  hostname: new URL(SUPABASE_URL).hostname,
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + SERVICE_ROLE_KEY,
    'apikey': SERVICE_ROLE_KEY,
    'Accept': 'application/json'
  },
  timeout: 10000
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data.slice(0, 500));
  });
});

req.on('error', (err) => {
  console.error('Error:', err.message);
});

req.on('timeout', () => {
  console.error('Timeout');
  req.destroy();
});

req.end();

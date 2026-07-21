const https = require('https');

const SUPABASE_URL = 'https://ymdgkivkaagfrdnvvqbr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZGdraXZrYWFnZnJkbnZ2cWJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODMwMDUzMCwiZXhwIjoyMDkzODc2NTMwfQ.P-F8ToqS-0xPJOM7YttY6qtYVJRN-ZbFcgYg7ZHRY-w';

const checkTable = (tableName) => {
  return new Promise((resolve) => {
    const options = {
      hostname: new URL(SUPABASE_URL).hostname,
      path: `/rest/v1/${tableName}?limit=0`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + SERVICE_ROLE_KEY,
        'apikey': SERVICE_ROLE_KEY,
        'Accept': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const exists = res.statusCode === 200 || res.statusCode === 406;
        resolve({ table: tableName, exists, statusCode: res.statusCode });
      });
    });
    
    req.on('error', () => resolve({ table: tableName, exists: false, statusCode: -1 }));
    req.end();
  });
};

Promise.all([
  checkTable('profiles'),
  checkTable('email_history'),
  checkTable('pending_payments'),
  checkTable('crm_settings')
]).then(results => {
  console.log('Database Tables Status:');
  results.forEach(r => {
    const status = r.exists ? '✓ EXISTS' : '✗ NOT FOUND';
    console.log(`${status} - ${r.table} (status: ${r.statusCode})`);
  });
});

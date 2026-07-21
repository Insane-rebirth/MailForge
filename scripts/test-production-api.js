const https = require('https');

const BASE_URL = 'https://getmailforge.top';

const tests = [
  {
    name: 'Debug Environment',
    url: '/api/debug-env',
    method: 'GET',
  },
  {
    name: 'User Usage (unauthenticated)',
    url: '/api/user-usage',
    method: 'GET',
  },
  {
    name: 'Check Subscription (unauthenticated)',
    url: '/api/check-subscription',
    method: 'GET',
  },
  {
    name: 'Generate Email (unauthenticated)',
    url: '/api/generate-email',
    method: 'POST',
    body: JSON.stringify({ subject: 'Test', body: 'Test' }),
  },
];

async function runTest(test) {
  return new Promise((resolve) => {
    const url = new URL(test.url, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          ...test,
          statusCode: res.statusCode,
          response: data.slice(0, 300),
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        ...test,
        statusCode: -1,
        response: `Error: ${error.message}`,
      });
    });
    
    req.on('timeout', () => {
      resolve({
        ...test,
        statusCode: -2,
        response: 'Timeout',
      });
      req.destroy();
    });
    
    if (test.body) {
      req.write(test.body);
    }
    
    req.end();
  });
}

async function main() {
  console.log(`\n=== Testing Production API: ${BASE_URL} ===\n`);
  
  const results = await Promise.all(tests.map(runTest));
  
  results.forEach((result) => {
    console.log(`${result.name}`);
    console.log(`  URL: ${result.method} ${result.url}`);
    console.log(`  Status: ${result.statusCode}`);
    console.log(`  Response: ${result.response}`);
    console.log('');
  });
  
  const securityFixWorking = results.find(r => r.name.includes('Check Subscription'))?.statusCode === 401;
  console.log('=== Security Fix Status ===');
  console.log(securityFixWorking 
    ? '✓ check-subscription security fix IS deployed (returns 401)' 
    : '✗ check-subscription security fix is NOT deployed (still returns 200)'
  );
}

main();

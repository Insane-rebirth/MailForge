const https = require('https');

const BASE_URL = process.env.BASE_URL || 'https://getmailforge.top';

const tests = [
  {
    name: 'Homepage',
    url: '/',
    method: 'GET',
    expectedStatus: 200,
  },
  {
    name: 'Login Page',
    url: '/login',
    method: 'GET',
    expectedStatus: 200,
  },
  {
    name: 'Pricing Page',
    url: '/pricing',
    method: 'GET',
    expectedStatus: 200,
  },
  {
    name: 'Debug Env API',
    url: '/api/debug-env',
    method: 'GET',
    expectedStatus: 200,
  },
  {
    name: 'Generate Email API (unauthenticated)',
    url: '/api/generate-email',
    method: 'POST',
    body: JSON.stringify({ subject: 'Test', body: 'Test' }),
    expectedStatus: 401,
  },
  {
    name: 'Generate Emails API (unauthenticated)',
    url: '/api/generate-emails',
    method: 'POST',
    body: JSON.stringify({ clientName: 'Test', companyName: 'Test', product: 'Test', purpose: 'Test' }),
    expectedStatus: 401,
  },
  {
    name: 'Check Subscription API (unauthenticated)',
    url: '/api/check-subscription',
    method: 'GET',
    expectedStatus: 401,
  },
  {
    name: 'User Usage API (unauthenticated)',
    url: '/api/user-usage',
    method: 'GET',
    expectedStatus: 401,
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
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const passed = res.statusCode === test.expectedStatus;
        resolve({
          ...test,
          statusCode: res.statusCode,
          passed,
          response: data.slice(0, 200),
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        ...test,
        statusCode: -1,
        passed: false,
        response: `Error: ${error.message}`,
      });
    });
    
    if (test.body) {
      req.write(test.body);
    }
    
    req.end();
  });
}

async function main() {
  console.log(`\n=== Deployment Verification for ${BASE_URL} ===\n`);
  
  const results = await Promise.all(tests.map(runTest));
  
  let passedCount = 0;
  let failedCount = 0;
  
  results.forEach((result) => {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    const color = result.passed ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    
    console.log(`${color}${status}${reset} ${result.name}`);
    console.log(`  URL: ${result.method} ${result.url}`);
    console.log(`  Expected: ${result.expectedStatus}, Got: ${result.statusCode}`);
    
    if (!result.passed) {
      console.log(`  Response: ${result.response}`);
      failedCount++;
    } else {
      passedCount++;
    }
    
    console.log('');
  });
  
  console.log(`=== Results: ${passedCount} passed, ${failedCount} failed ===`);
  
  if (failedCount > 0) {
    process.exit(1);
  }
}

main();

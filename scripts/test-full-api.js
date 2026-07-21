const https = require('https');

const BASE_URL = 'https://getmailforge.top';

const tests = [
  {
    name: 'Score Email API',
    url: '/api/score-email',
    method: 'POST',
    body: JSON.stringify({ subject: 'Test subject', body: 'Test body content' }),
    checkAuth: true,
  },
  {
    name: 'Email History API',
    url: '/api/email-history',
    method: 'GET',
    checkAuth: true,
  },
  {
    name: 'Create Checkout Session API',
    url: '/api/create-checkout-session',
    method: 'POST',
    body: JSON.stringify({ 
      priceId: 'price_test',
      successUrl: 'https://getmailforge.top/success',
      cancelUrl: 'https://getmailforge.top/checkout'
    }),
    checkAuth: true,
  },
  {
    name: 'Create Payment Link API',
    url: '/api/create-payment-link',
    method: 'POST',
    body: JSON.stringify({ plan: 'pro', email: 'test@example.com' }),
    checkAuth: true,
  },
  {
    name: 'Verify Checkout API',
    url: '/api/verify-checkout',
    method: 'POST',
    body: JSON.stringify({ stripe_session_id: 'test_session' }),
    checkAuth: true,
  },
  {
    name: 'CRM API',
    url: '/api/crm?action=get-providers',
    method: 'GET',
    checkAuth: true,
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
        const expectedStatus = test.checkAuth ? 401 : 200;
        const isCorrect = res.statusCode === expectedStatus;
        
        resolve({
          ...test,
          statusCode: res.statusCode,
          expectedStatus,
          isCorrect,
          response: data.slice(0, 300),
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        ...test,
        statusCode: -1,
        isCorrect: false,
        response: `Error: ${error.message}`,
      });
    });
    
    req.on('timeout', () => {
      resolve({
        ...test,
        statusCode: -2,
        isCorrect: false,
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
  console.log(`\n=== Full API Test: ${BASE_URL} ===\n`);
  
  const results = await Promise.all(tests.map(runTest));
  
  let passed = 0;
  let failed = 0;
  
  results.forEach((result) => {
    const status = result.isCorrect ? '✓ PASS' : '✗ FAIL';
    const color = result.isCorrect ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    
    console.log(`${color}${status}${reset} ${result.name}`);
    console.log(`  URL: ${result.method} ${result.url}`);
    console.log(`  Expected: ${result.expectedStatus}, Got: ${result.statusCode}`);
    
    if (!result.isCorrect) {
      console.log(`  Response: ${result.response}`);
      failed++;
    } else {
      passed++;
    }
    
    console.log('');
  });
  
  console.log(`=== Results: ${passed} passed, ${failed} failed ===`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

main();

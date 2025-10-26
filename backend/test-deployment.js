#!/usr/bin/env node

/**
 * Test Deployment URLs
 * Run: node test-deployment.js <backend-url>
 * Example: node test-deployment.js https://group-10-backend.onrender.com
 */

const https = require('https');
const http = require('http');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

const BACKEND_URL = process.argv[2] || 'http://localhost:3001';

console.log(`\n${colors.blue}${colors.bold}🧪 Testing Deployment URLs${colors.reset}`);
console.log(`${colors.blue}Backend: ${BACKEND_URL}${colors.reset}\n`);

let passed = 0;
let failed = 0;

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testEndpoint(name, url, expectedStatus, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = body;
    }
    
    const response = await makeRequest(url, options);
    
    if (response.statusCode === expectedStatus) {
      console.log(`${colors.green}✅ ${name}${colors.reset}`);
      console.log(`   Status: ${response.statusCode}`);
      if (response.body) {
        console.log(`   Response: ${JSON.stringify(response.body).substring(0, 100)}...`);
      }
      passed++;
    } else {
      console.log(`${colors.red}❌ ${name}${colors.reset}`);
      console.log(`   Expected: ${expectedStatus}, Got: ${response.statusCode}`);
      if (response.body) {
        console.log(`   Response: ${JSON.stringify(response.body).substring(0, 100)}...`);
      }
      failed++;
    }
  } catch (error) {
    console.log(`${colors.red}❌ ${name}${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
  console.log('');
}

async function runTests() {
  console.log(`${colors.yellow}=== BACKEND TESTS ===${colors.reset}\n`);
  
  // Test 1: Health check
  await testEndpoint(
    'Health Check (/test)',
    `${BACKEND_URL}/test`,
    200
  );
  
  // Test 2: API routes check
  await testEndpoint(
    'Routes Debug (/_debug_routes)',
    `${BACKEND_URL}/_debug_routes`,
    200
  );
  
  // Test 3: Login endpoint (should return 400 for missing data)
  await testEndpoint(
    'Login Endpoint (/auth/login) - Missing data',
    `${BACKEND_URL}/auth/login`,
    400,
    'POST',
    {}
  );
  
  // Test 4: Signup endpoint (should return 400 for missing data)
  await testEndpoint(
    'Signup Endpoint (/auth/signup) - Missing data',
    `${BACKEND_URL}/auth/signup`,
    400,
    'POST',
    {}
  );
  
  // Test 5: Profile endpoint (should return 401 for no token)
  await testEndpoint(
    'Profile Endpoint (/profile) - No auth',
    `${BACKEND_URL}/profile`,
    401
  );
  
  // Summary
  console.log(`${colors.blue}${colors.bold}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.blue}${colors.bold}📊 TEST SUMMARY${colors.reset}`);
  console.log(`${colors.blue}${colors.bold}${'='.repeat(50)}${colors.reset}`);
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
  
  if (failed === 0) {
    console.log(`\n${colors.green}${colors.bold}🎉 All tests passed! Backend is ready.${colors.reset}\n`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Some tests failed. Check the errors above.${colors.reset}\n`);
  }
  
  // Instructions
  console.log(`${colors.blue}📋 Next Steps:${colors.reset}`);
  console.log(`1. Update frontend .env with: REACT_APP_API_URL=${BACKEND_URL}`);
  console.log(`2. Deploy frontend to Vercel`);
  console.log(`3. Update backend CORS with frontend URL`);
  console.log(`4. Test login flow\n`);
}

runTests().catch(console.error);

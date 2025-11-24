/**
 * Test Login API Route Locally
 * 
 * Usage: node test-login-api.js
 * 
 * This script tests the login API route to see what error is actually happening
 */

const http = require('http');

const testData = JSON.stringify({
  email: 'agent@gmail.com',
  password: 'your-password-here' // Replace with actual password
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': testData.length
  }
};

console.log('🧪 Testing login API route...\n');

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  console.log('\n');

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response Body:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(data);
      console.log('\n⚠️  Response is not JSON - this is the problem!');
      console.log('The API route is returning HTML instead of JSON.');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error);
  console.log('\n💡 Make sure the dev server is running: npm run dev');
});

req.write(testData);
req.end();


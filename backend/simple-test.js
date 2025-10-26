const http = require('http');

const testAPI = () => {
  const data = JSON.stringify({
    email: 'test@example.com'
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/auth/forgot-password',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(body);
        console.log('Response:', JSON.stringify(response, null, 2));
        
        if (response.success) {
          console.log('✅ Test PASSED - Forgot password API works!');
          if (response.resetToken) {
            console.log(`🎫 Reset Token: ${response.resetToken}`);
            console.log(`🔗 Reset URL: ${response.resetUrl}`);
          }
        } else {
          console.log('❌ Test FAILED - API returned error');
        }
      } catch (err) {
        console.log('❌ Invalid JSON response:', body);
      }
    });
  });

  req.on('error', (err) => {
    console.log('❌ Connection Error:', err.message);
    console.log('   Make sure server is running on http://localhost:3001');
  });

  req.write(data);
  req.end();
};

console.log('🚀 Testing Forgot Password API...');
testAPI();
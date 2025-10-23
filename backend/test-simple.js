// test-simple.js - Test server cơ bản
const axios = require('axios');

const testServer = async () => {
  try {
    console.log('Testing server connection...');
    
    // Test basic connection - try both ports
    for (const port of [3001, 5000, 3000]) {
      try {
        console.log(`Trying port ${port}...`);
        const response = await axios.get(`http://localhost:${port}/users`);
        console.log(`✅ Server is responding on port ${port}`);
        console.log('Response:', response.data);
        return;
      } catch (error) {
        console.log(`❌ Port ${port} failed:`, error.code);
      }
    }
    
    console.log('No server found on any port');
  } catch (error) {
    console.log('❌ Server test failed:');
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
  }
};

testServer();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Base URL
const BASE_URL = 'http://localhost:3001';

// Test user data
const testUser = {
  username: 'avatartest',
  email: 'avatartest@example.com',
  password: 'Test123!',
  fullName: 'Avatar Test User'
};

let accessToken = '';
let userId = '';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Step 1: Register or Login
async function authenticateUser() {
  try {
    log('\n🔐 Step 1: Authentication', 'blue');
    
    // Try to register first
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
      log('✅ User registered successfully', 'green');
      userId = registerResponse.data.user.id;
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        log('ℹ️  User already exists, proceeding to login...', 'yellow');
      } else {
        throw error;
      }
    }

    // Login to get token
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    accessToken = loginResponse.data.accessToken;
    userId = loginResponse.data.user.id;
    
    log('✅ Login successful', 'green');
    log(`📝 User ID: ${userId}`, 'yellow');
    log(`🎫 Access Token: ${accessToken.substring(0, 20)}...`, 'yellow');
    
  } catch (error) {
    log(`❌ Authentication failed: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

// Step 2: Upload Avatar
async function uploadAvatar() {
  try {
    log('\n📸 Step 2: Upload Avatar', 'blue');
    
    // Create a simple test image (1x1 pixel PNG)
    const testImagePath = path.join(__dirname, 'test-avatar.png');
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);
    
    fs.writeFileSync(testImagePath, pngBuffer);
    
    const formData = new FormData();
    formData.append('avatar', fs.createReadStream(testImagePath));

    const uploadResponse = await axios.post(`${BASE_URL}/users/avatar`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${accessToken}`
      }
    });

    log('✅ Avatar uploaded successfully', 'green');
    log(`🔗 Avatar URL: ${uploadResponse.data.data.avatarUrl}`, 'yellow');
    log(`☁️  Cloudinary ID: ${uploadResponse.data.data.cloudinaryId}`, 'yellow');
    
    // Clean up test file
    fs.unlinkSync(testImagePath);
    
    return uploadResponse.data.data.avatarUrl;
    
  } catch (error) {
    log(`❌ Upload failed: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

// Step 3: Get Avatar
async function getAvatar() {
  try {
    log('\n🖼️  Step 3: Get Avatar', 'blue');
    
    const getResponse = await axios.get(`${BASE_URL}/users/${userId}/avatar`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    log('✅ Avatar retrieved successfully', 'green');
    log(`🔗 Avatar URL: ${getResponse.data.avatarUrl}`, 'yellow');
    
    return getResponse.data.avatarUrl;
    
  } catch (error) {
    if (error.response?.status === 404) {
      log('ℹ️  No avatar found for user', 'yellow');
      return null;
    }
    log(`❌ Get avatar failed: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

// Step 4: Delete Avatar
async function deleteAvatar() {
  try {
    log('\n🗑️  Step 4: Delete Avatar', 'blue');
    
    const deleteResponse = await axios.delete(`${BASE_URL}/users/avatar`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    log('✅ Avatar deleted successfully', 'green');
    log(`📝 Message: ${deleteResponse.data.message}`, 'yellow');
    
  } catch (error) {
    if (error.response?.status === 404) {
      log('ℹ️  No avatar to delete', 'yellow');
      return;
    }
    log(`❌ Delete failed: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

// Step 5: Verify deletion
async function verifyDeletion() {
  try {
    log('\n✅ Step 5: Verify Deletion', 'blue');
    
    const getResponse = await axios.get(`${BASE_URL}/users/${userId}/avatar`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    log('⚠️  Avatar still exists (unexpected)', 'red');
    
  } catch (error) {
    if (error.response?.status === 404) {
      log('✅ Avatar successfully removed - verification passed', 'green');
    } else {
      log(`❌ Verification failed: ${error.response?.data?.message || error.message}`, 'red');
    }
  }
}

// Error Tests
async function testErrorCases() {
  try {
    log('\n🧪 Step 6: Error Testing', 'blue');
    
    // Test 1: Upload without auth
    try {
      log('\n📋 Test 1: Upload without authentication', 'yellow');
      const formData = new FormData();
      formData.append('avatar', Buffer.from('fake image'), 'test.jpg');
      
      await axios.post(`${BASE_URL}/users/avatar`, formData, {
        headers: formData.getHeaders()
      });
      
      log('❌ Should have failed without auth', 'red');
    } catch (error) {
      if (error.response?.status === 401) {
        log('✅ Correctly rejected request without authentication', 'green');
      } else {
        log(`❌ Unexpected error: ${error.response?.data?.message || error.message}`, 'red');
      }
    }
    
    // Test 2: Upload invalid file type
    try {
      log('\n📋 Test 2: Upload invalid file type', 'yellow');
      const formData = new FormData();
      formData.append('avatar', Buffer.from('This is not an image'), 'test.txt');
      
      await axios.post(`${BASE_URL}/users/avatar`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      log('❌ Should have failed with invalid file type', 'red');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('Invalid file type')) {
        log('✅ Correctly rejected invalid file type', 'green');
      } else {
        log(`❌ Unexpected error: ${error.response?.data?.message || error.message}`, 'red');
      }
    }
    
  } catch (error) {
    log(`❌ Error testing failed: ${error.message}`, 'red');
  }
}

// Main test function
async function runCompleteTest() {
  try {
    log('🚀 Starting Avatar Upload API Complete Test', 'bright');
    log('================================================', 'bright');
    
    await authenticateUser();
    const avatarUrl = await uploadAvatar();
    await getAvatar();
    await deleteAvatar();
    await verifyDeletion();
    await testErrorCases();
    
    log('\n🎉 All tests completed successfully!', 'green');
    log('================================================', 'bright');
    
  } catch (error) {
    log(`\n💥 Test failed: ${error.message}`, 'red');
    log('================================================', 'bright');
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`);
    log('✅ Server is running', 'green');
  } catch (error) {
    try {
      // Try alternative health check
      await axios.get(BASE_URL);
      log('✅ Server is running', 'green');
    } catch (error2) {
      log('❌ Server is not running. Please start the backend server first:', 'red');
      log('   cd backend && npm start', 'yellow');
      process.exit(1);
    }
  }
}

// Run the test
async function main() {
  await checkServer();
  await runCompleteTest();
}

if (require.main === module) {
  main();
}

module.exports = {
  runCompleteTest,
  authenticateUser,
  uploadAvatar,
  getAvatar,
  deleteAvatar,
  BASE_URL,
  testUser
};
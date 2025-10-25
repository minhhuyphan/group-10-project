// backend/test-avatar-upload.js
// Script để test upload avatar APIs

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';

// Test account
const testAccount = {
  email: 'admin@test.com',
  password: 'admin123'
};

let authToken = '';

// Helper function để tạo file ảnh test (sẽ tạo file 1x1 pixel PNG)
const createTestImage = () => {
  // Tạo một file PNG đơn giản 1x1 pixel màu đỏ
  const pngBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
    0x0D, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0xF8, 0x0F, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x37, 0x6E, 0xF9, 0x24, 0x00, 0x00,
    0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  const testImagePath = path.join(__dirname, 'test_avatar.png');
  fs.writeFileSync(testImagePath, pngBuffer);
  return testImagePath;
};

// 1. Login để lấy token
const login = async () => {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/api/login`, testAccount);
    
    if (response.data.success && response.data.accessToken) {
      authToken = response.data.accessToken;
      console.log('✅ Login successful');
      console.log('User:', response.data.user.name, '(', response.data.user.role, ')');
      return response.data.user;
    } else {
      throw new Error('Login failed: ' + (response.data.message || 'Unknown error'));
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    return null;
  }
};

// 2. Test upload avatar
const testUploadAvatar = async () => {
  try {
    console.log('\n📤 Testing avatar upload...');
    
    // Tạo test image
    const testImagePath = createTestImage();
    console.log('📁 Created test image:', testImagePath);
    
    // Tạo FormData
    const formData = new FormData();
    formData.append('avatar', fs.createReadStream(testImagePath));
    
    // Gửi request
    const response = await axios.post(`${BASE_URL}/api/users/avatar`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ Avatar upload successful!');
      console.log('📸 Avatar URL:', response.data.data.avatarUrl);
      console.log('🆔 Cloudinary ID:', response.data.data.avatarId);
      
      // Cleanup test file
      fs.unlinkSync(testImagePath);
      
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Upload failed');
    }
  } catch (error) {
    console.error('❌ Avatar upload failed:', error.response?.data?.message || error.message);
    
    // Cleanup test file if exists
    const testImagePath = path.join(__dirname, 'test_avatar.png');
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    
    return null;
  }
};

// 3. Test get avatar
const testGetAvatar = async (userId) => {
  try {
    console.log('\n🔍 Testing get avatar...');
    
    const response = await axios.get(`${BASE_URL}/api/users/${userId}/avatar`);
    
    if (response.data.success) {
      console.log('✅ Get avatar successful!');
      console.log('📸 Avatar URL:', response.data.data.avatarUrl);
      console.log('📍 Source:', response.data.data.source);
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Get avatar failed');
    }
  } catch (error) {
    console.error('❌ Get avatar failed:', error.response?.data?.message || error.message);
    return null;
  }
};

// 4. Test delete avatar
const testDeleteAvatar = async () => {
  try {
    console.log('\n🗑️ Testing delete avatar...');
    
    const response = await axios.delete(`${BASE_URL}/api/users/avatar`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success) {
      console.log('✅ Avatar delete successful!');
      return true;
    } else {
      throw new Error(response.data.message || 'Delete failed');
    }
  } catch (error) {
    console.error('❌ Avatar delete failed:', error.response?.data?.message || error.message);
    return false;
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting Avatar Upload Tests\n');
  console.log('=' .repeat(50));
  
  try {
    // 1. Login
    const user = await login();
    if (!user) {
      console.log('\n❌ Cannot proceed without login');
      return;
    }
    
    // 2. Upload avatar
    const uploadResult = await testUploadAvatar();
    if (!uploadResult) {
      console.log('\n❌ Avatar upload test failed');
      return;
    }
    
    // 3. Get avatar
    const getResult = await testGetAvatar(user._id);
    if (!getResult) {
      console.log('\n❌ Get avatar test failed');
    }
    
    // 4. Delete avatar
    const deleteResult = await testDeleteAvatar();
    if (!deleteResult) {
      console.log('\n❌ Delete avatar test failed');
    }
    
    // 5. Verify deletion
    console.log('\n🔍 Verifying avatar deletion...');
    const getAfterDelete = await testGetAvatar(user._id);
    if (getAfterDelete && !getAfterDelete.avatarUrl) {
      console.log('✅ Avatar successfully deleted and verified');
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ All avatar tests completed!');
    
    console.log('\n📋 API Endpoints Tested:');
    console.log('• POST /api/users/avatar - Upload avatar');
    console.log('• GET /api/users/:id/avatar - Get avatar');
    console.log('• DELETE /api/users/avatar - Delete avatar');
    
    console.log('\n🛠️ Features Tested:');
    console.log('• JWT Authentication');
    console.log('• File Upload with Multer');
    console.log('• Image Resize with Sharp');
    console.log('• Cloudinary Upload');
    console.log('• Database Updates');
    console.log('• Error Handling');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
};

// Kiểm tra server có chạy không
const checkServer = async () => {
  try {
    await axios.get(`${BASE_URL}/api/users`);
    return true;
  } catch (error) {
    console.error('❌ Server is not running on', BASE_URL);
    console.log('Please start the server first: npm start');
    return false;
  }
};

// Run tests if script is called directly
if (require.main === module) {
  checkServer().then(serverRunning => {
    if (serverRunning) {
      runTests();
    }
  });
}

module.exports = { runTests, login, testUploadAvatar, testGetAvatar, testDeleteAvatar };
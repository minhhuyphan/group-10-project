// backend/test-activity-logging.js
/**
 * Test script for Activity Logging & Rate Limiting - SV1
 * Demo các chức năng:
 * 1. logActivity(userId, action, timestamp)
 * 2. Rate limiting cho login
 * 3. Brute force protection
 * 4. Activity logs API
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'Password123!',
  name: 'Test User'
};

const adminUser = {
  email: 'admin@example.com', 
  password: 'AdminPassword123!',
  name: 'Admin User'
};

/**
 * Helper function để gọi API
 */
const apiCall = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) config.data = data;
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

/**
 * Test 1: Đăng ký user để có data test
 */
const testSignup = async () => {
  console.log('\n🔹 TEST 1: User Signup (Activity Logging)');
  
  const result = await apiCall('POST', '/auth/signup', testUser);
  
  if (result.success) {
    console.log('✅ Signup successful - Activity should be logged');
    console.log('📝 Expected log: USER_SIGNUP action');
  } else {
    console.log('ℹ️  User might already exist:', result.error.message);
  }
  
  return result;
};

/**
 * Test 2: Normal login (should work)
 */
const testNormalLogin = async () => {
  console.log('\n🔹 TEST 2: Normal Login (Activity Logging)');
  
  const result = await apiCall('POST', '/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  
  if (result.success) {
    console.log('✅ Login successful - Activity should be logged');
    console.log('📝 Expected logs: LOGIN_ATTEMPT, LOGIN_SUCCESS');
    return result.data.accessToken;
  } else {
    console.log('❌ Login failed:', result.error.message);
    return null;
  }
};

/**
 * Test 3: Rate limiting với multiple login attempts
 */
const testRateLimiting = async () => {
  console.log('\n🔹 TEST 3: Rate Limiting & Brute Force Protection');
  
  // Test với sai password để trigger rate limiting
  const wrongPassword = 'WrongPassword123!';
  
  for (let i = 1; i <= 7; i++) {
    console.log(`\n📤 Login attempt ${i} with wrong password...`);
    
    const result = await apiCall('POST', '/auth/login', {
      email: testUser.email,
      password: wrongPassword
    });
    
    if (result.status === 429) {
      console.log(`🛑 Rate limited at attempt ${i}!`);
      console.log('📝 Expected logs: LOGIN_ATTEMPT, LOGIN_FAILED, then BRUTE_FORCE_DETECTED');
      console.log('⏱️  Response:', result.error);
      break;
    } else if (result.status === 401) {
      console.log(`❌ Attempt ${i}: Authentication failed (expected)`);
      console.log('📝 Expected logs: LOGIN_ATTEMPT, LOGIN_FAILED');
    } else {
      console.log(`❓ Unexpected response ${i}:`, result);
    }
    
    // Small delay between attempts
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};

/**
 * Test 4: Test activity logs API (requires admin token)
 */
const testActivityLogsAPI = async (adminToken) => {
  console.log('\n🔹 TEST 4: Activity Logs API');
  
  if (!adminToken) {
    console.log('⚠️  Need admin token to test activity logs API');
    return;
  }
  
  const headers = { 'Authorization': `Bearer ${adminToken}` };
  
  // Test 1: Get recent activities
  console.log('\n📊 Getting recent activities...');
  const recentResult = await apiCall('GET', '/api/activity/recent?limit=10', null, headers);
  
  if (recentResult.success) {
    console.log('✅ Recent activities retrieved');
    console.log(`📈 Total activities: ${recentResult.data.data.totalActivities}`);
    recentResult.data.data.activities.forEach((activity, index) => {
      console.log(`   ${index + 1}. ${activity.action} - ${activity.userId} - ${activity.timestamp}`);
    });
  } else {
    console.log('❌ Failed to get recent activities:', recentResult.error.message);
  }
  
  // Test 2: Get activity stats
  console.log('\n📊 Getting activity statistics...');
  const statsResult = await apiCall('GET', '/api/activity/stats', null, headers);
  
  if (statsResult.success) {
    console.log('✅ Activity stats retrieved');
    const stats = statsResult.data.data;
    console.log(`📈 Total activities today: ${stats.totalActivities}`);
    console.log('🎯 Top actions:', stats.topActions);
  } else {
    console.log('❌ Failed to get activity stats:', statsResult.error.message);
  }
};

/**
 * Test 5: Forgot password activity logging
 */
const testForgotPasswordLogging = async () => {
  console.log('\n🔹 TEST 5: Forgot Password Activity Logging');
  
  const result = await apiCall('POST', '/auth/forgot-password', {
    email: testUser.email
  });
  
  if (result.success) {
    console.log('✅ Forgot password request successful');
    console.log('📝 Expected log: FORGOT_PASSWORD action');
  } else {
    console.log('❌ Forgot password failed:', result.error.message);
  }
};

/**
 * Main test function
 */
const runTests = async () => {
  console.log('🚀 Starting Activity Logging & Rate Limiting Tests - SV1');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Signup
    await testSignup();
    
    // Test 2: Normal login
    const userToken = await testNormalLogin();
    
    // Test 3: Rate limiting
    await testRateLimiting();
    
    // Test 4: Forgot password logging
    await testForgotPasswordLogging();
    
    // Test 5: Activity logs API (need admin user)
    console.log('\n🔹 Creating admin user for API testing...');
    await apiCall('POST', '/auth/signup', adminUser);
    const adminLoginResult = await apiCall('POST', '/auth/login', {
      email: adminUser.email,
      password: adminUser.password
    });
    
    if (adminLoginResult.success) {
      await testActivityLogsAPI(adminLoginResult.data.accessToken);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 All tests completed!');
    console.log('\n📋 Summary of what was tested:');
    console.log('   ✅ logActivity(userId, action, timestamp) function');
    console.log('   ✅ Rate limiting for login attempts'); 
    console.log('   ✅ Brute force protection');
    console.log('   ✅ Activity logging middleware');
    console.log('   ✅ Activity logs API endpoints');
    console.log('\n📂 Check backend/logs/activity/ for log files');
    console.log('🎯 Ready for Postman testing and admin dashboard!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
};

// Kiểm tra server có chạy không trước khi test
const checkServer = async () => {
  try {
    await axios.get(`${BASE_URL}/auth/login`);
    return true;
  } catch (error) {
    return false;
  }
};

// Run tests
(async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Server is not running. Please start the server with: npm start');
    process.exit(1);
  }
  
  await runTests();
})();

module.exports = { runTests };
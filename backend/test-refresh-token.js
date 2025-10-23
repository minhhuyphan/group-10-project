// backend/test-refresh-token.js
/**
 * Script test tự động cho Refresh Token functionality
 * Chạy: node test-refresh-token.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
let accessToken = '';
let refreshToken = '';
let userId = '';

// Helper function để log kết quả
const logTest = (name, status, message = '') => {
  const symbol = status ? '✅' : '❌';
  console.log(`${symbol} ${name}${message ? ': ' + message : ''}`);
};

// Helper function để sleep
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test 1: Signup
const testSignup = async () => {
  try {
    console.log('\n📝 Test 1: Signup với Access Token + Refresh Token');
    
    const randomEmail = `test${Date.now()}@example.com`;
    const response = await axios.post(`${BASE_URL}/auth/signup`, {
      name: 'Test User',
      email: randomEmail,
      password: 'password123'
    });

    if (response.data.success && response.data.accessToken && response.data.refreshToken) {
      accessToken = response.data.accessToken;
      refreshToken = response.data.refreshToken;
      userId = response.data.user.id;
      
      logTest('Signup thành công', true);
      console.log(`   Email: ${randomEmail}`);
      console.log(`   Access Token: ${accessToken.substring(0, 20)}...`);
      console.log(`   Refresh Token: ${refreshToken.substring(0, 20)}...`);
      return true;
    }
    
    logTest('Signup thất bại', false, 'Không nhận được tokens');
    return false;
  } catch (error) {
    logTest('Signup thất bại', false, error.response?.data?.message || error.message);
    return false;
  }
};

// Test 2: Protected Route với Access Token
const testProtectedRoute = async () => {
  try {
    console.log('\n🔒 Test 2: Truy cập Protected Route với Access Token');
    
    const response = await axios.get(`${BASE_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (response.data.user) {
      logTest('Truy cập profile thành công', true);
      console.log(`   Name: ${response.data.user.name}`);
      console.log(`   Email: ${response.data.user.email}`);
      return true;
    }
    
    logTest('Truy cập profile thất bại', false);
    return false;
  } catch (error) {
    logTest('Truy cập profile thất bại', false, error.response?.data?.message || error.message);
    return false;
  }
};

// Test 3: Refresh Token
const testRefreshToken = async () => {
  try {
    console.log('\n🔄 Test 3: Refresh Token để lấy Access Token mới');
    
    const oldAccessToken = accessToken;
    
    const response = await axios.post(`${BASE_URL}/auth/refresh`, {
      refreshToken: refreshToken
    });

    if (response.data.success && response.data.accessToken) {
      accessToken = response.data.accessToken;
      
      // Cập nhật refresh token nếu có rotation
      if (response.data.refreshToken !== refreshToken) {
        refreshToken = response.data.refreshToken;
        logTest('Refresh Token thành công (với rotation)', true);
      } else {
        logTest('Refresh Token thành công', true);
      }
      
      console.log(`   Old Access Token: ${oldAccessToken.substring(0, 20)}...`);
      console.log(`   New Access Token: ${accessToken.substring(0, 20)}...`);
      return true;
    }
    
    logTest('Refresh Token thất bại', false);
    return false;
  } catch (error) {
    logTest('Refresh Token thất bại', false, error.response?.data?.message || error.message);
    return false;
  }
};

// Test 4: Sử dụng Access Token mới
const testNewAccessToken = async () => {
  try {
    console.log('\n✨ Test 4: Sử dụng Access Token mới');
    
    const response = await axios.get(`${BASE_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (response.data.user) {
      logTest('Access Token mới hoạt động', true);
      return true;
    }
    
    logTest('Access Token mới không hoạt động', false);
    return false;
  } catch (error) {
    logTest('Access Token mới không hoạt động', false, error.response?.data?.message || error.message);
    return false;
  }
};

// Test 5: Lấy danh sách tokens
const testGetUserTokens = async () => {
  try {
    console.log('\n📋 Test 5: Lấy danh sách Refresh Tokens của user');
    
    const response = await axios.get(`${BASE_URL}/auth/tokens`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (response.data.success) {
      logTest('Lấy danh sách tokens thành công', true);
      console.log(`   Số lượng tokens: ${response.data.count}`);
      console.log(`   Tokens:`);
      response.data.tokens.forEach((token, index) => {
        console.log(`     ${index + 1}. ${token.token} - Active: ${token.isActive}`);
      });
      return true;
    }
    
    logTest('Lấy danh sách tokens thất bại', false);
    return false;
  } catch (error) {
    logTest('Lấy danh sách tokens thất bại', false, error.response?.data?.message || error.message);
    return false;
  }
};

// Test 6: Invalid Refresh Token
const testInvalidRefreshToken = async () => {
  try {
    console.log('\n⚠️  Test 6: Thử dùng Refresh Token không hợp lệ');
    
    const response = await axios.post(`${BASE_URL}/auth/refresh`, {
      refreshToken: 'invalid_token_12345'
    });

    logTest('Test thất bại', false, 'Không nên chấp nhận token không hợp lệ');
    return false;
  } catch (error) {
    if (error.response?.status === 401 && error.response?.data?.error === 'TOKEN_NOT_FOUND') {
      logTest('Reject invalid token đúng cách', true);
      return true;
    }
    
    logTest('Xử lý invalid token không đúng', false, error.response?.data?.message);
    return false;
  }
};

// Test 7: Logout
const testLogout = async () => {
  try {
    console.log('\n👋 Test 7: Logout và revoke Refresh Token');
    
    const response = await axios.post(`${BASE_URL}/auth/logout`, {
      refreshToken: refreshToken
    });

    if (response.data.success) {
      logTest('Logout thành công', true);
      return true;
    }
    
    logTest('Logout thất bại', false);
    return false;
  } catch (error) {
    logTest('Logout thất bại', false, error.response?.data?.message || error.message);
    return false;
  }
};

// Test 8: Thử dùng Refresh Token đã bị revoke
const testRevokedToken = async () => {
  try {
    console.log('\n🚫 Test 8: Thử dùng Refresh Token đã bị revoke');
    
    const response = await axios.post(`${BASE_URL}/auth/refresh`, {
      refreshToken: refreshToken
    });

    logTest('Test thất bại', false, 'Không nên chấp nhận token đã revoke');
    return false;
  } catch (error) {
    if (error.response?.status === 401 && error.response?.data?.error === 'TOKEN_REVOKED') {
      logTest('Reject revoked token đúng cách', true);
      return true;
    }
    
    logTest('Xử lý revoked token không đúng', false, error.response?.data?.message);
    return false;
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Bắt đầu test Refresh Token System');
  console.log('=' .repeat(60));

  const results = {
    total: 8,
    passed: 0,
    failed: 0
  };

  // Chạy các test theo thứ tự
  if (await testSignup()) results.passed++; else results.failed++;
  await sleep(500);
  
  if (await testProtectedRoute()) results.passed++; else results.failed++;
  await sleep(500);
  
  if (await testRefreshToken()) results.passed++; else results.failed++;
  await sleep(500);
  
  if (await testNewAccessToken()) results.passed++; else results.failed++;
  await sleep(500);
  
  if (await testGetUserTokens()) results.passed++; else results.failed++;
  await sleep(500);
  
  if (await testInvalidRefreshToken()) results.passed++; else results.failed++;
  await sleep(500);
  
  if (await testLogout()) results.passed++; else results.failed++;
  await sleep(500);
  
  if (await testRevokedToken()) results.passed++; else results.failed++;

  // Tổng kết
  console.log('\n' + '='.repeat(60));
  console.log('📊 KẾT QUẢ TEST');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}/${results.total}`);
  console.log(`❌ Failed: ${results.failed}/${results.total}`);
  console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 TẤT CẢ TEST PASSED! Hệ thống Refresh Token hoạt động hoàn hảo!');
  } else {
    console.log('\n⚠️  Có một số test thất bại. Vui lòng kiểm tra lại!');
  }
};

// Chạy tests
runAllTests().catch(error => {
  console.error('❌ Lỗi khi chạy tests:', error.message);
  console.log('\n💡 Đảm bảo server đang chạy tại ' + BASE_URL);
  process.exit(1);
});

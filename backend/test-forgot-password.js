const axios = require('axios');
const crypto = require('crypto');

// Base URL
const BASE_URL = 'http://localhost:3001';

// Test user data
const testUser = {
  name: 'Reset Test User',
  email: 'resettest@example.com',
  password: 'Test123!'
};

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

// Step 1: Register test user
async function registerTestUser() {
  try {
    log('\n🔐 Step 1: Register Test User', 'blue');
    
    const response = await axios.post(`${BASE_URL}/auth/signup`, testUser);
    log('✅ User registered successfully', 'green');
    log(`📧 Email: ${testUser.email}`, 'yellow');
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      log('ℹ️  User already exists, continuing...', 'yellow');
      return { success: true };
    }
    log(`❌ Registration failed: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

// Step 2: Test forgot password
async function testForgotPassword() {
  try {
    log('\n🔑 Step 2: Test Forgot Password', 'blue');
    
    const response = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: testUser.email
    });
    
    log('✅ Forgot password request successful', 'green');
    log(`📝 Message: ${response.data.message}`, 'yellow');
    
    if (response.data.resetToken) {
      log(`🎫 Reset Token: ${response.data.resetToken}`, 'yellow');
      log(`🔗 Reset URL: ${response.data.resetUrl}`, 'yellow');
      return response.data.resetToken;
    }
    
    return null;
  } catch (error) {
    log(`❌ Forgot password failed: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

// Step 3: Test validate reset token
async function testValidateResetToken(resetToken) {
  try {
    log('\n✅ Step 3: Test Validate Reset Token', 'blue');
    
    const response = await axios.get(`${BASE_URL}/auth/validate-reset-token/${resetToken}`);
    
    log('✅ Token validation successful', 'green');
    log(`📧 Associated email: ${response.data.email}`, 'yellow');
    log(`📝 Message: ${response.data.message}`, 'yellow');
    
    return response.data;
  } catch (error) {
    log(`❌ Token validation failed: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

// Step 4: Test reset password
async function testResetPassword(resetToken) {
  try {
    log('\n🔄 Step 4: Test Reset Password', 'blue');
    
    const newPassword = 'NewPassword123!';
    
    const response = await axios.post(`${BASE_URL}/auth/reset-password/${resetToken}`, {
      password: newPassword,
      confirmPassword: newPassword
    });
    
    log('✅ Password reset successful', 'green');
    log(`📝 Message: ${response.data.message}`, 'yellow');
    
    // Update test user password for login test
    testUser.password = newPassword;
    
    return response.data;
  } catch (error) {
    log(`❌ Password reset failed: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

// Step 5: Test login with new password
async function testLoginWithNewPassword() {
  try {
    log('\n🔓 Step 5: Test Login with New Password', 'blue');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    log('✅ Login with new password successful', 'green');
    log(`👤 User: ${response.data.user.name}`, 'yellow');
    log(`🎫 Access Token: ${response.data.accessToken.substring(0, 20)}...`, 'yellow');
    
    return response.data;
  } catch (error) {
    log(`❌ Login failed: ${error.response?.data?.message || error.message}`, 'red');
    throw error;
  }
}

// Error Tests
async function testErrorCases() {
  try {
    log('\n🧪 Step 6: Error Testing', 'blue');
    
    // Test 1: Forgot password with invalid email
    try {
      log('\n📋 Test 1: Forgot password with invalid email', 'yellow');
      await axios.post(`${BASE_URL}/auth/forgot-password`, {
        email: 'nonexistent@example.com'
      });
      log('✅ Request processed (no error for security)', 'green');
    } catch (error) {
      log(`ℹ️  Expected behavior: ${error.response?.data?.message || error.message}`, 'yellow');
    }
    
    // Test 2: Validate invalid token
    try {
      log('\n📋 Test 2: Validate invalid reset token', 'yellow');
      const fakeToken = crypto.randomBytes(32).toString('hex');
      await axios.get(`${BASE_URL}/auth/validate-reset-token/${fakeToken}`);
      log('❌ Should have failed with invalid token', 'red');
    } catch (error) {
      if (error.response?.status === 400) {
        log('✅ Correctly rejected invalid token', 'green');
      } else {
        log(`❌ Unexpected error: ${error.response?.data?.message || error.message}`, 'red');
      }
    }
    
    // Test 3: Reset password with invalid token
    try {
      log('\n📋 Test 3: Reset password with invalid token', 'yellow');
      const fakeToken = crypto.randomBytes(32).toString('hex');
      await axios.post(`${BASE_URL}/auth/reset-password/${fakeToken}`, {
        password: 'NewPass123!',
        confirmPassword: 'NewPass123!'
      });
      log('❌ Should have failed with invalid token', 'red');
    } catch (error) {
      if (error.response?.status === 400) {
        log('✅ Correctly rejected invalid token', 'green');
      } else {
        log(`❌ Unexpected error: ${error.response?.data?.message || error.message}`, 'red');
      }
    }
    
    // Test 4: Reset password with mismatched passwords
    const validToken = await testForgotPassword();
    if (validToken) {
      try {
        log('\n📋 Test 4: Reset password with mismatched passwords', 'yellow');
        await axios.post(`${BASE_URL}/auth/reset-password/${validToken}`, {
          password: 'Password1',
          confirmPassword: 'Password2'
        });
        log('❌ Should have failed with mismatched passwords', 'red');
      } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.message?.includes('do not match')) {
          log('✅ Correctly rejected mismatched passwords', 'green');
        } else {
          log(`❌ Unexpected error: ${error.response?.data?.message || error.message}`, 'red');
        }
      }
    }
    
    // Test 5: Reset password with weak password
    const validToken2 = await testForgotPassword();
    if (validToken2) {
      try {
        log('\n📋 Test 5: Reset password with weak password', 'yellow');
        await axios.post(`${BASE_URL}/auth/reset-password/${validToken2}`, {
          password: '123',
          confirmPassword: '123'
        });
        log('❌ Should have failed with weak password', 'red');
      } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.message?.includes('at least 6 characters')) {
          log('✅ Correctly rejected weak password', 'green');
        } else {
          log(`❌ Unexpected error: ${error.response?.data?.message || error.message}`, 'red');
        }
      }
    }
    
  } catch (error) {
    log(`❌ Error testing failed: ${error.message}`, 'red');
  }
}

// Main test function
async function runForgotPasswordTest() {
  try {
    log('🚀 Starting Forgot Password & Reset Password Test', 'bright');
    log('=======================================================', 'bright');
    
    await registerTestUser();
    const resetToken = await testForgotPassword();
    
    if (resetToken) {
      await testValidateResetToken(resetToken);
      await testResetPassword(resetToken);
      await testLoginWithNewPassword();
    }
    
    await testErrorCases();
    
    log('\n🎉 All forgot password tests completed successfully!', 'green');
    log('=======================================================', 'bright');
    
  } catch (error) {
    log(`\n💥 Test failed: ${error.message}`, 'red');
    log('=======================================================', 'bright');
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(BASE_URL);
    log('✅ Server is running', 'green');
  } catch (error) {
    log('❌ Server is not running. Please start the backend server first:', 'red');
    log('   cd backend && npm start', 'yellow');
    process.exit(1);
  }
}

// Run the test
async function main() {
  await checkServer();
  await runForgotPasswordTest();
}

if (require.main === module) {
  main();
}

module.exports = {
  runForgotPasswordTest,
  testForgotPassword,
  testResetPassword,
  testUser,
  BASE_URL
};
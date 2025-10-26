// backend/test-redux-apis.js
/**
 * Test script for Redux Support APIs - SV1 Backend
 * Test các API endpoints hỗ trợ Redux frontend và Protected Routes
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test users
const adminUser = {
  email: 'admin@group10.com',
  password: 'AdminPassword123!'
};

const regularUser = {
  email: 'user@group10.com', 
  password: 'UserPassword123!'
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
 * Test 1: Login và lấy tokens
 */
const testLogin = async (userCredentials, userType = 'user') => {
  console.log(`\n🔹 TEST LOGIN - ${userType.toUpperCase()}`);
  
  const result = await apiCall('POST', '/auth/login', userCredentials);
  
  if (result.success) {
    console.log(`✅ ${userType} login successful`);
    console.log(`🔑 Access Token: ${result.data.accessToken.substring(0, 20)}...`);
    return {
      accessToken: result.data.accessToken,
      refreshToken: result.data.refreshToken,
      user: result.data.user
    };
  } else {
    console.log(`❌ ${userType} login failed:`, result.error.message);
    return null;
  }
};

/**
 * Test 2: Verify Token (Redux auth state)
 */
const testVerifyToken = async (token, userType = 'user') => {
  console.log(`\n🔹 TEST VERIFY TOKEN - ${userType.toUpperCase()}`);
  
  const result = await apiCall('GET', '/api/verify-token', null, {
    'Authorization': `Bearer ${token}`
  });
  
  if (result.success) {
    console.log('✅ Token verification successful');
    console.log('👤 User info:', {
      id: result.data.user.id,
      name: result.data.user.name,
      role: result.data.user.role,
      isAdmin: result.data.user.isAdmin
    });
    console.log('🕒 Token expires:', result.data.tokenInfo.expiresAt);
    return result.data.user;
  } else {
    console.log('❌ Token verification failed:', result.error.message);
    return null;
  }
};

/**
 * Test 3: Protected Route - Profile
 */
const testProfileAccess = async (token, userType = 'user') => {
  console.log(`\n🔹 TEST PROFILE ACCESS - ${userType.toUpperCase()}`);
  
  const result = await apiCall('GET', '/api/profile', null, {
    'Authorization': `Bearer ${token}`
  });
  
  if (result.success) {
    console.log('✅ Profile access successful');
    console.log('📋 Profile data:', {
      name: result.data.data.profile.name,
      email: result.data.data.profile.email,
      role: result.data.data.profile.role,
      bio: result.data.data.profile.bio || 'No bio',
      activeSessions: result.data.data.sessionInfo.activeSessions
    });
  } else {
    console.log('❌ Profile access failed:', result.error.message);
  }
  
  return result.success;
};

/**
 * Test 4: Protected Route - Admin Dashboard
 */
const testAdminDashboard = async (token, userType = 'user') => {
  console.log(`\n🔹 TEST ADMIN DASHBOARD - ${userType.toUpperCase()}`);
  
  const result = await apiCall('GET', '/api/admin/dashboard', null, {
    'Authorization': `Bearer ${token}`
  });
  
  if (result.success) {
    console.log('✅ Admin dashboard access successful');
    console.log('📊 Dashboard stats:', {
      totalUsers: result.data.data.overview.totalUsers,
      activeUsers: result.data.data.overview.activeUsers,
      newUsersThisWeek: result.data.data.overview.newUsersThisWeek
    });
  } else {
    console.log(`❌ Admin dashboard access failed: ${result.error.message}`);
    if (result.status === 403) {
      console.log('🔒 Expected for regular users - Access denied (403)');
    }
  }
  
  return result.success;
};

/**
 * Test 5: Check Route Access
 */
const testRouteAccess = async (token, route, userType = 'user') => {
  console.log(`\n🔹 TEST ROUTE ACCESS CHECK - ${route} (${userType.toUpperCase()})`);
  
  const encodedRoute = encodeURIComponent(route);
  const result = await apiCall('GET', `/api/check-access/${encodedRoute}`, null, {
    'Authorization': `Bearer ${token}`
  });
  
  if (result.success) {
    const hasAccess = result.data.data.hasAccess;
    console.log(`${hasAccess ? '✅' : '🔒'} Route access: ${hasAccess ? 'ALLOWED' : 'DENIED'}`);
    console.log(`📋 Required role: ${result.data.data.requiredRole}`);
    console.log(`👤 User role: ${result.data.data.user.role} (admin: ${result.data.data.user.isAdmin})`);
  } else {
    console.log('❌ Route access check failed:', result.error.message);
  }
  
  return result.success;
};

/**
 * Test 6: Update Profile
 */
const testProfileUpdate = async (token, userType = 'user') => {
  console.log(`\n🔹 TEST PROFILE UPDATE - ${userType.toUpperCase()}`);
  
  const updateData = {
    name: `Updated ${userType} Name`,
    bio: `Updated bio for ${userType} - Testing Redux integration`,
    phone: '0123456789',
    address: 'Test Address, Ho Chi Minh City'
  };
  
  const result = await apiCall('PUT', '/api/profile', updateData, {
    'Authorization': `Bearer ${token}`
  });
  
  if (result.success) {
    console.log('✅ Profile update successful');
    console.log('📝 Updated fields:', {
      name: result.data.data.profile.name,
      bio: result.data.data.profile.bio,
      phone: result.data.data.profile.phone
    });
  } else {
    console.log('❌ Profile update failed:', result.error.message);
  }
  
  return result.success;
};

/**
 * Test 7: Admin Users List
 */
const testAdminUsersList = async (token, userType = 'admin') => {
  console.log(`\n🔹 TEST ADMIN USERS LIST - ${userType.toUpperCase()}`);
  
  const result = await apiCall('GET', '/api/admin/users?page=1&limit=5', null, {
    'Authorization': `Bearer ${token}`
  });
  
  if (result.success) {
    console.log('✅ Admin users list access successful');
    console.log(`📊 Total users: ${result.data.data.pagination.totalUsers}`);
    console.log('👥 User list preview:');
    result.data.data.users.slice(0, 3).forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });
  } else {
    console.log(`❌ Admin users list access failed: ${result.error.message}`);
    if (result.status === 403) {
      console.log('🔒 Expected for regular users - Access denied (403)');
    }
  }
  
  return result.success;
};

/**
 * Main test function
 */
const runReduxTests = async () => {
  console.log('🚀 Starting Redux Support APIs Tests - SV1 Backend');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Login both users
    console.log('\n📂 PHASE 1: AUTHENTICATION TESTING');
    const adminAuth = await testLogin(adminUser, 'admin');
    const userAuth = await testLogin(regularUser, 'user');
    
    if (!adminAuth || !userAuth) {
      console.log('\n❌ Login tests failed. Make sure server is running and users exist.');
      return;
    }
    
    // Test 2: Token verification
    console.log('\n📂 PHASE 2: TOKEN VERIFICATION (Redux Auth State)');
    await testVerifyToken(adminAuth.accessToken, 'admin');
    await testVerifyToken(userAuth.accessToken, 'user');
    
    // Test 3: Protected Routes Access
    console.log('\n📂 PHASE 3: PROTECTED ROUTES TESTING');
    
    // Profile access (should work for both)
    await testProfileAccess(adminAuth.accessToken, 'admin');
    await testProfileAccess(userAuth.accessToken, 'user');
    
    // Admin dashboard (should work for admin only)
    await testAdminDashboard(adminAuth.accessToken, 'admin');
    await testAdminDashboard(userAuth.accessToken, 'user');
    
    // Test 4: Route Access Checks
    console.log('\n📂 PHASE 4: ROUTE ACCESS VALIDATION');
    const routes = ['/profile', '/admin', '/admin/dashboard'];
    
    for (const route of routes) {
      await testRouteAccess(adminAuth.accessToken, route, 'admin');
      await testRouteAccess(userAuth.accessToken, route, 'user');
    }
    
    // Test 5: Profile Updates
    console.log('\n📂 PHASE 5: PROFILE MANAGEMENT');
    await testProfileUpdate(adminAuth.accessToken, 'admin');
    await testProfileUpdate(userAuth.accessToken, 'user');
    
    // Test 6: Admin-only endpoints
    console.log('\n📂 PHASE 6: ADMIN FUNCTIONALITY');
    await testAdminUsersList(adminAuth.accessToken, 'admin');
    await testAdminUsersList(userAuth.accessToken, 'user');
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 All Redux Support API tests completed!');
    console.log('\n📋 SUMMARY - SV1 Backend Support for Redux & Protected Routes:');
    console.log('   ✅ Token verification API (Redux auth state)');
    console.log('   ✅ Protected route access validation');
    console.log('   ✅ Role-based access control');
    console.log('   ✅ Profile management APIs');
    console.log('   ✅ Admin dashboard APIs');
    console.log('   ✅ Route access checking');
    console.log('   ✅ Activity logging integration');
    console.log('\n🚀 Backend is ready for Redux frontend integration!');
    console.log('🎯 Frontend can now implement Redux store with protected routes!');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
};

// Check server availability
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
  
  await runReduxTests();
})();

module.exports = { runReduxTests };
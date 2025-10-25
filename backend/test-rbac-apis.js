// backend/test-rbac-apis.js
// Script để test các API RBAC

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test accounts
const testAccounts = {
  admin: { email: 'admin@test.com', password: 'admin123' },
  moderator: { email: 'moderator@test.com', password: 'mod123' },
  user: { email: 'user1@test.com', password: 'user123' }
};

let tokens = {};

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data
    };

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

// Login and get tokens
const loginAllUsers = async () => {
  console.log('🔐 Logging in all test users...\n');
  
  for (const [role, credentials] of Object.entries(testAccounts)) {
    console.log(`Logging in ${role}...`);
    const result = await makeRequest('POST', '/login', credentials);
    
    if (result.success) {
      tokens[role] = result.data.accessToken;
      console.log(`✅ ${role} logged in successfully`);
    } else {
      console.log(`❌ ${role} login failed:`, result.error);
    }
  }
  console.log('\n');
};

// Test role information
const testRoleInfo = async () => {
  console.log('📋 Testing role information...\n');
  
  for (const [role, token] of Object.entries(tokens)) {
    console.log(`--- ${role.toUpperCase()} Role Info ---`);
    const result = await makeRequest('GET', '/rbac/me', null, token);
    
    if (result.success) {
      const { data } = result.data;
      console.log(`Role: ${data.role}`);
      console.log(`Permissions: ${data.permissions.join(', ')}`);
      console.log(`Active: ${data.isActive}`);
    } else {
      console.log(`❌ Error:`, result.error);
    }
    console.log('');
  }
};

// Test user listing with RBAC
const testUserListing = async () => {
  console.log('👥 Testing user listing with RBAC...\n');
  
  for (const [role, token] of Object.entries(tokens)) {
    console.log(`--- ${role.toUpperCase()} viewing users ---`);
    const result = await makeRequest('GET', '/rbac/users', null, token);
    
    if (result.success) {
      const { data, total, userRole } = result.data;
      console.log(`Can see ${total} users (as ${userRole}):`);
      data.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    } else {
      console.log(`❌ Error:`, result.error);
    }
    console.log('');
  }
};

// Test user statistics
const testUserStats = async () => {
  console.log('📊 Testing user statistics...\n');
  
  for (const [role, token] of Object.entries(tokens)) {
    console.log(`--- ${role.toUpperCase()} viewing stats ---`);
    const result = await makeRequest('GET', '/rbac/stats', null, token);
    
    if (result.success) {
      const { data } = result.data;
      console.log(`Total users: ${data.totalUsers}`);
      console.log('Role breakdown:');
      data.roleStats.forEach(stat => {
        console.log(`  - ${stat.role}: ${stat.count} total, ${stat.activeUsers} active`);
      });
    } else {
      console.log(`❌ Error (${result.status}):`, result.error?.message || result.error);
    }
    console.log('');
  }
};

// Test role updates (admin only)
const testRoleUpdate = async () => {
  console.log('🔧 Testing role updates...\n');
  
  // First get a user to update (we'll try to find user2)
  const usersResult = await makeRequest('GET', '/rbac/users', null, tokens.admin);
  if (!usersResult.success) {
    console.log('❌ Cannot get users for role update test');
    return;
  }
  
  const targetUser = usersResult.data.data.find(u => u.email === 'user2@test.com');
  if (!targetUser) {
    console.log('❌ Cannot find user2@test.com for role update test');
    return;
  }

  console.log(`Target user: ${targetUser.name} (${targetUser.email}) - Current role: ${targetUser.role}`);
  console.log('');

  // Test with different roles
  for (const [role, token] of Object.entries(tokens)) {
    console.log(`--- ${role.toUpperCase()} trying to update role ---`);
    const result = await makeRequest('PUT', `/rbac/users/${targetUser._id}/role`, 
      { role: 'moderator' }, token);
    
    if (result.success) {
      console.log(`✅ Successfully updated role to moderator`);
    } else {
      console.log(`❌ Error (${result.status}):`, result.error?.message || result.error);
    }
    console.log('');
  }
};

// Test status updates (admin and moderator)
const testStatusUpdate = async () => {
  console.log('🔄 Testing status updates...\n');
  
  // Get users list
  const usersResult = await makeRequest('GET', '/rbac/users', null, tokens.admin);
  if (!usersResult.success) {
    console.log('❌ Cannot get users for status update test');
    return;
  }
  
  const targetUser = usersResult.data.data.find(u => u.email === 'user2@test.com');
  if (!targetUser) {
    console.log('❌ Cannot find user2@test.com for status update test');
    return;
  }

  console.log(`Target user: ${targetUser.name} - Current status: ${targetUser.isActive ? 'Active' : 'Inactive'}`);
  console.log('');

  // Test with different roles
  for (const [role, token] of Object.entries(tokens)) {
    console.log(`--- ${role.toUpperCase()} trying to update status ---`);
    const result = await makeRequest('PUT', `/rbac/users/${targetUser._id}/status`, 
      { isActive: false }, token);
    
    if (result.success) {
      console.log(`✅ Successfully updated status to inactive`);
    } else {
      console.log(`❌ Error (${result.status}):`, result.error?.message || result.error);
    }
    console.log('');
  }
};

// Main test function
const runTests = async () => {
  console.log('🚀 Starting RBAC API Tests\n');
  console.log('=' .repeat(50));
  console.log('');

  try {
    await loginAllUsers();
    
    if (Object.keys(tokens).length === 0) {
      console.log('❌ No users logged in successfully. Please check your server and database.');
      return;
    }

    await testRoleInfo();
    console.log('=' .repeat(50));
    
    await testUserListing();
    console.log('=' .repeat(50));
    
    await testUserStats();
    console.log('=' .repeat(50));
    
    await testRoleUpdate();
    console.log('=' .repeat(50));
    
    await testStatusUpdate();
    console.log('=' .repeat(50));
    
    console.log('✅ All RBAC tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run tests if script is called directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, makeRequest, testAccounts };
// backend/create-test-accounts.js
// Script để tạo tài khoản test qua API signup

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test accounts to create
const testAccounts = [
  {
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'Moderator User', 
    email: 'moderator@test.com',
    password: 'mod123',
    role: 'moderator'
  },
  {
    name: 'Regular User 1',
    email: 'user1@test.com',
    password: 'user123',
    role: 'user'
  },
  {
    name: 'Regular User 2',
    email: 'user2@test.com', 
    password: 'user123',
    role: 'user'
  }
];

const createAccount = async (account) => {
  try {
    console.log(`Creating account: ${account.email}`);
    
    // First signup
    const signupResponse = await axios.post(`${BASE_URL}/signup`, {
      name: account.name,
      email: account.email,
      password: account.password,
      age: 25
    });
    
    console.log(`✅ Account created: ${account.email}`);
    
    // If not admin, we need to update role
    if (account.role !== 'user') {
      // Login as the new user first to get their ID
      const loginResponse = await axios.post(`${BASE_URL}/login`, {
        email: account.email,
        password: account.password
      });
      
      const userId = loginResponse.data.user._id;
      
      // We'll need to manually update role in database or create admin account first
      console.log(`📝 Note: ${account.email} created as 'user', need to update role to '${account.role}' manually`);
    }
    
    return { success: true, account };
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      console.log(`⚠️ Account ${account.email} already exists`);
      return { success: true, account, exists: true };
    } else {
      console.log(`❌ Failed to create ${account.email}:`, error.response?.data?.message || error.message);
      return { success: false, account, error: error.response?.data || error.message };
    }
  }
};

const testLogin = async (email, password) => {
  try {
    const response = await axios.post(`${BASE_URL}/login`, {
      email,
      password
    });
    
    console.log(`✅ Login successful: ${email} (Role: ${response.data.user.role})`);
    return response.data;
  } catch (error) {
    console.log(`❌ Login failed for ${email}:`, error.response?.data?.message || error.message);
    return null;
  }
};

const main = async () => {
  console.log('🚀 Creating test accounts...\n');
  
  // Create all accounts
  for (const account of testAccounts) {
    await createAccount(account);
    console.log('');
  }
  
  console.log('🔐 Testing login for all accounts...\n');
  
  // Test login for all accounts
  for (const account of testAccounts) {
    await testLogin(account.email, account.password);
  }
  
  console.log('\n📋 Manual Steps Needed:');
  console.log('1. Update moderator@test.com role to "moderator"');
  console.log('2. Update admin@test.com role to "admin"');
  console.log('\nYou can do this by:');
  console.log('- Connecting to MongoDB and updating documents directly');
  console.log('- Or creating an admin API to update roles');
  console.log('\n✅ Account creation completed!');
};

if (require.main === module) {
  main();
}
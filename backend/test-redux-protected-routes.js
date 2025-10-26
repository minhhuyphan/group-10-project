// backend/test-redux-protected-routes.js
// SV3 - Database & Integration Testing for Redux & Protected Routes
// Test API endpoints để support Redux state management và protected routes

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const RefreshToken = require('./models/RefreshToken');
const ActivityLog = require('./models/ActivityLog');

// Stats tracking
let passedTests = 0;
let failedTests = 0;

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

// Helper to run a test
async function runTest(testName, testFunction) {
  try {
    await testFunction();
    console.log(`${colors.green}✅ ${testName}${colors.reset}`);
    passedTests++;
  } catch (error) {
    console.log(`${colors.red}❌ ${testName}${colors.reset}`);
    console.log(`   ${colors.red}Error: ${error.message}${colors.reset}`);
    failedTests++;
  }
}

// Test data
const testUser = {
  name: 'Redux Test User',
  email: 'redux.test@example.com',
  password: 'redux123',
  role: 'user',
  isAdmin: false
};

const testAdmin = {
  name: 'Redux Admin User',
  email: 'redux.admin@example.com',
  password: 'admin123',
  role: 'admin',
  isAdmin: true
};

let testUserId;
let testAdminId;
let testAccessToken;
let testRefreshToken;

// ==================== TESTS ====================

// 1. Test User schema có đủ fields cho Redux state
async function testUserSchemaForRedux() {
  await runTest('User schema has fields for Redux state (name, email, role, isAdmin)', async () => {
    const user = await User.create(testUser);
    testUserId = user._id;
    
    if (!user.name) throw new Error('User missing name field');
    if (!user.email) throw new Error('User missing email field');
    if (!user.role) throw new Error('User missing role field');
    if (user.isAdmin === undefined) throw new Error('User missing isAdmin field');
    if (!user.createdAt) throw new Error('User missing createdAt timestamp');
    
    console.log(`   📝 User created: ${user.email} (role: ${user.role}, isAdmin: ${user.isAdmin})`);
  });
}

// 2. Test Admin user schema
async function testAdminUserSchema() {
  await runTest('Admin user has isAdmin=true flag', async () => {
    const admin = await User.create(testAdmin);
    testAdminId = admin._id;
    
    if (!admin.isAdmin) throw new Error('Admin user should have isAdmin=true');
    if (admin.role !== 'admin') throw new Error('Admin user should have role=admin');
    
    console.log(`   📝 Admin created: ${admin.email} (role: ${admin.role}, isAdmin: ${admin.isAdmin})`);
  });
}

// 3. Test User.profile virtual property (cho Redux state)
async function testUserProfileVirtual() {
  await runTest('User.profile virtual includes all necessary info for Redux', async () => {
    const user = await User.findById(testUserId);
    const profile = user.profile;
    
    if (!profile) throw new Error('User.profile virtual not working');
    if (!profile._id) throw new Error('Profile missing _id');
    if (!profile.name) throw new Error('Profile missing name');
    if (!profile.email) throw new Error('Profile missing email');
    if (!profile.role) throw new Error('Profile missing role');
    if (profile.isAdmin === undefined) throw new Error('Profile missing isAdmin');
    
    console.log(`   📝 Profile fields: ${Object.keys(profile).join(', ')}`);
  });
}

// 4. Test RefreshToken được tạo đúng cách (cho Redux persistence)
async function testRefreshTokenCreation() {
  await runTest('RefreshToken created correctly for Redux token storage', async () => {
    const token = require('crypto').randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    const refreshToken = await RefreshToken.create({
      token,
      userId: testUserId,
      expiresAt,
      createdByIp: '127.0.0.1'
    });
    
    testRefreshToken = token;
    
    if (!refreshToken.token) throw new Error('RefreshToken missing token');
    if (!refreshToken.userId) throw new Error('RefreshToken missing userId');
    if (!refreshToken.expiresAt) throw new Error('RefreshToken missing expiresAt');
    if (!refreshToken.isActive) throw new Error('RefreshToken should be active');
    
    console.log(`   📝 RefreshToken created for user ${testUserId}`);
  });
}

// 5. Test Query user by ID (cho Redux thunk API calls)
async function testQueryUserById() {
  await runTest('Query user by ID (for Redux thunk getUserInfo)', async () => {
    const user = await User.findById(testUserId);
    
    if (!user) throw new Error('User not found by ID');
    if (user._id.toString() !== testUserId.toString()) throw new Error('Wrong user returned');
    
    console.log(`   📝 User found: ${user.email}`);
  });
}

// 6. Test Query admin user (cho Protected Admin Routes)
async function testQueryAdminUser() {
  await runTest('Query admin user (for Protected Admin Routes)', async () => {
    const admins = await User.find({ isAdmin: true });
    
    if (admins.length === 0) throw new Error('No admin users found');
    
    const ourAdmin = admins.find(a => a._id.toString() === testAdminId.toString());
    if (!ourAdmin) throw new Error('Test admin not found');
    if (!ourAdmin.isAdmin) throw new Error('Admin flag not set correctly');
    
    console.log(`   📝 Found ${admins.length} admin user(s)`);
  });
}

// 7. Test Query regular users (cho User List trong Admin Dashboard)
async function testQueryRegularUsers() {
  await runTest('Query regular users (for User List in Admin Dashboard)', async () => {
    const regularUsers = await User.find({ isAdmin: false });
    
    if (regularUsers.length === 0) throw new Error('No regular users found');
    
    const ourUser = regularUsers.find(u => u._id.toString() === testUserId.toString());
    if (!ourUser) throw new Error('Test user not found');
    if (ourUser.isAdmin) throw new Error('Regular user should have isAdmin=false');
    
    console.log(`   📝 Found ${regularUsers.length} regular user(s)`);
  });
}

// 8. Test ActivityLog tracking (cho Redux actions logging)
async function testActivityLogging() {
  await runTest('ActivityLog tracks user actions (for Redux state sync)', async () => {
    // Log login action
    const loginLog = await ActivityLog.create({
      userId: testUserId,
      action: 'login',
      ipAddress: '127.0.0.1',
      userAgent: 'Redux-Test-Agent',
      status: 'success',
      details: { source: 'redux-test' }
    });
    
    if (!loginLog) throw new Error('ActivityLog not created');
    if (loginLog.action !== 'login') throw new Error('Wrong action type');
    if (loginLog.status !== 'success') throw new Error('Wrong status');
    
    // Query logs by user
    const userLogs = await ActivityLog.find({ userId: testUserId });
    if (userLogs.length === 0) throw new Error('No logs found for user');
    
    console.log(`   📝 ActivityLog created: ${loginLog.action} (${loginLog.status})`);
  });
}

// 9. Test User update (cho Redux profile update)
async function testUserUpdate() {
  await runTest('User profile update (for Redux profile actions)', async () => {
    const user = await User.findById(testUserId);
    
    // Update profile fields
    user.bio = 'Redux integration test user';
    user.phone = '0123456789';
    user.address = '123 Test Street';
    user.preferences.theme = 'dark';
    
    await user.save();
    
    // Verify update
    const updated = await User.findById(testUserId);
    if (updated.bio !== 'Redux integration test user') throw new Error('Bio not updated');
    if (updated.phone !== '0123456789') throw new Error('Phone not updated');
    if (updated.preferences.theme !== 'dark') throw new Error('Theme not updated');
    
    console.log(`   📝 User profile updated: bio, phone, address, theme`);
  });
}

// 10. Test RefreshToken query by token (cho Redux token refresh)
async function testQueryRefreshToken() {
  await runTest('Query RefreshToken by token (for Redux token refresh)', async () => {
    const tokenDoc = await RefreshToken.findOne({ token: testRefreshToken });
    
    if (!tokenDoc) throw new Error('RefreshToken not found');
    if (tokenDoc.userId.toString() !== testUserId.toString()) throw new Error('Wrong user ID in token');
    if (!tokenDoc.isActive) throw new Error('Token should be active');
    if (tokenDoc.isExpired) throw new Error('Token should not be expired');
    
    console.log(`   📝 RefreshToken found and validated`);
  });
}

// 11. Test Token revocation (cho Redux logout)
async function testTokenRevocation() {
  await runTest('Token revocation (for Redux logout action)', async () => {
    const tokenDoc = await RefreshToken.findOne({ token: testRefreshToken });
    
    // Revoke token
    tokenDoc.revokedAt = new Date();
    tokenDoc.revokedByIp = '127.0.0.1';
    await tokenDoc.save();
    
    // Verify revocation
    const revoked = await RefreshToken.findOne({ token: testRefreshToken });
    if (!revoked.revokedAt) throw new Error('Token not revoked');
    if (revoked.isActive) throw new Error('Revoked token should not be active');
    
    console.log(`   📝 Token revoked successfully`);
  });
}

// 12. Test User role check (cho Protected Routes authorization)
async function testUserRoleCheck() {
  await runTest('User role check (for Protected Routes authorization)', async () => {
    const user = await User.findById(testUserId);
    const admin = await User.findById(testAdminId);
    
    // Check user permissions using isAdmin flag
    if (user.isAdmin !== false) throw new Error('Regular user should have isAdmin=false');
    if (user.role !== 'user') throw new Error('Regular user should have role=user');
    
    // Check admin permissions using isAdmin flag
    if (admin.isAdmin !== true) throw new Error('Admin should have isAdmin=true');
    if (admin.role !== 'admin') throw new Error('Admin should have role=admin');
    
    console.log(`   📝 Role checks working: user.isAdmin=${user.isAdmin}, admin.isAdmin=${admin.isAdmin}`);
  });
}

// 13. Test lastLogin update (cho Redux login state)
async function testLastLoginUpdate() {
  await runTest('lastLogin timestamp update (for Redux login state)', async () => {
    const user = await User.findById(testUserId);
    
    const beforeLogin = user.lastLogin;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    
    const updated = await User.findById(testUserId);
    if (!updated.lastLogin) throw new Error('lastLogin not set');
    if (beforeLogin && updated.lastLogin.getTime() === beforeLogin.getTime()) {
      throw new Error('lastLogin not updated');
    }
    
    console.log(`   📝 lastLogin updated: ${updated.lastLogin.toISOString()}`);
  });
}

// 14. Test User count by role (cho Admin Dashboard stats)
async function testUserCountByRole() {
  await runTest('Count users by role (for Admin Dashboard statistics)', async () => {
    const stats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    if (stats.length === 0) throw new Error('No stats returned');
    
    const adminCount = stats.find(s => s._id === 'admin')?.count || 0;
    const userCount = stats.find(s => s._id === 'user')?.count || 0;
    
    console.log(`   📝 Stats: ${adminCount} admin(s), ${userCount} user(s)`);
  });
}

// 15. Test Active users query (cho Protected Routes access control)
async function testActiveUsersQuery() {
  await runTest('Query active users (for Protected Routes access control)', async () => {
    const activeUsers = await User.find({ isActive: true });
    
    if (activeUsers.length === 0) throw new Error('No active users found');
    
    const ourUser = activeUsers.find(u => u._id.toString() === testUserId.toString());
    if (!ourUser) throw new Error('Test user should be active');
    
    console.log(`   📝 Found ${activeUsers.length} active user(s)`);
  });
}

// 16. Test User preferences (cho Redux user settings)
async function testUserPreferences() {
  await runTest('User preferences storage (for Redux user settings)', async () => {
    const user = await User.findById(testUserId);
    
    if (!user.preferences) throw new Error('User missing preferences');
    if (!user.preferences.theme) throw new Error('User missing theme preference');
    if (!user.preferences.language) throw new Error('User missing language preference');
    if (!user.preferences.notifications) throw new Error('User missing notifications preference');
    
    console.log(`   📝 Preferences: theme=${user.preferences.theme}, lang=${user.preferences.language}`);
  });
}

// 17. Test Failed login tracking (cho Redux error handling)
async function testFailedLoginTracking() {
  await runTest('Failed login tracking (for Redux error handling)', async () => {
    // Log failed login
    const failedLog = await ActivityLog.create({
      userId: testUserId,
      action: 'failed_login',
      ipAddress: '127.0.0.1',
      userAgent: 'Redux-Test-Agent',
      status: 'failed',
      errorMessage: 'Invalid credentials',
      details: { source: 'redux-test' }
    });
    
    // Query failed logins
    const failedLogins = await ActivityLog.find({
      userId: testUserId,
      action: 'failed_login'
    });
    
    if (failedLogins.length === 0) throw new Error('No failed logins found');
    
    console.log(`   📝 Failed login logged: ${failedLogins.length} attempt(s)`);
  });
}

// 18. Test Integration: Complete login flow
async function testCompleteLoginFlow() {
  await runTest('Integration: Complete login flow (Redux thunk simulation)', async () => {
    // 1. Find user
    const user = await User.findById(testUserId).select('+password');
    if (!user) throw new Error('User not found');
    
    // 2. Verify password (simulated)
    if (!user.password) throw new Error('Password not loaded');
    
    // 3. Create refresh token
    const token = require('crypto').randomBytes(40).toString('hex');
    const refreshToken = await RefreshToken.create({
      token,
      userId: user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdByIp: '127.0.0.1'
    });
    
    // 4. Update lastLogin
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    
    // 5. Log activity
    await ActivityLog.create({
      userId: user._id,
      action: 'login',
      ipAddress: '127.0.0.1',
      status: 'success'
    });
    
    // 6. Get user profile
    const profile = user.profile;
    
    if (!profile) throw new Error('Profile not generated');
    if (!refreshToken.isActive) throw new Error('Token not active');
    
    console.log(`   📝 Complete flow: user found → token created → login logged → profile ready`);
  });
}

// ==================== MAIN EXECUTION ====================

async function runAllTests() {
  console.log(`\n${colors.blue}${colors.bold}🧪 Redux & Protected Routes Database Test Suite${colors.reset}`);
  console.log(`${colors.blue}${colors.bold}📦 SV3 - Database & Integration Testing${colors.reset}\n`);
  
  console.log(`📦 Database: ${process.env.MONGO_URI?.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://<credentials>@') || 'Not configured'}\n`);

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`${colors.green}🔌 Connected to MongoDB${colors.reset}\n`);

    // Clean up test data from previous runs
    await User.deleteMany({ email: { $in: [testUser.email, testAdmin.email] } });
    await ActivityLog.deleteMany({ details: { source: 'redux-test' } });

    console.log(`${colors.yellow}=== USER & ADMIN SCHEMA TESTS ===${colors.reset}\n`);
    await testUserSchemaForRedux();
    await testAdminUserSchema();
    await testUserProfileVirtual();
    await testUserRoleCheck();
    
    console.log(`\n${colors.yellow}=== TOKEN MANAGEMENT TESTS ===${colors.reset}\n`);
    await testRefreshTokenCreation();
    await testQueryRefreshToken();
    await testTokenRevocation();
    
    console.log(`\n${colors.yellow}=== USER QUERY TESTS ===${colors.reset}\n`);
    await testQueryUserById();
    await testQueryAdminUser();
    await testQueryRegularUsers();
    await testActiveUsersQuery();
    await testUserCountByRole();
    
    console.log(`\n${colors.yellow}=== USER UPDATE TESTS ===${colors.reset}\n`);
    await testUserUpdate();
    await testLastLoginUpdate();
    await testUserPreferences();
    
    console.log(`\n${colors.yellow}=== ACTIVITY LOGGING TESTS ===${colors.reset}\n`);
    await testActivityLogging();
    await testFailedLoginTracking();
    
    console.log(`\n${colors.yellow}=== INTEGRATION TESTS ===${colors.reset}\n`);
    await testCompleteLoginFlow();

    // Summary
    console.log(`\n${colors.blue}${colors.bold}${'='.repeat(50)}${colors.reset}`);
    console.log(`${colors.blue}${colors.bold}📊 TEST SUMMARY${colors.reset}`);
    console.log(`${colors.blue}${colors.bold}${'='.repeat(50)}${colors.reset}`);
    console.log(`Total Tests: ${passedTests + failedTests}`);
    console.log(`${colors.green}✅ Passed: ${passedTests}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${failedTests}${colors.reset}`);
    
    const successRate = ((passedTests / (passedTests + failedTests)) * 100).toFixed(1);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`${colors.blue}${colors.bold}${'='.repeat(50)}${colors.reset}\n`);

    if (failedTests === 0) {
      console.log(`${colors.green}${colors.bold}🎉 All tests passed! Redux & Protected Routes database is ready.${colors.reset}\n`);
    } else {
      console.log(`${colors.yellow}⚠️  Some tests failed. Please review the errors above.${colors.reset}\n`);
    }

    // Sample data summary
    const userCount = await User.countDocuments();
    const tokenCount = await RefreshToken.countDocuments();
    const logCount = await ActivityLog.countDocuments();
    const adminCount = await User.countDocuments({ isAdmin: true });
    
    console.log(`${colors.blue}📋 Sample Data:${colors.reset}`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Admins: ${adminCount}`);
    console.log(`   Refresh Tokens: ${tokenCount}`);
    console.log(`   Activity Logs: ${logCount}\n`);

  } catch (error) {
    console.error(`\n${colors.red}❌ Test execution error:${colors.reset}`, error);
  } finally {
    await mongoose.disconnect();
    console.log(`${colors.green}🔌 Disconnected from MongoDB${colors.reset}`);
    process.exit(failedTests > 0 ? 1 : 0);
  }
}

// Run all tests
runAllTests();

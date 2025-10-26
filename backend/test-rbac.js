/**
 * RBAC Database Test Script
 * Tests role-based access control, permissions, and role queries
 * Author: SV3 - Database & Integration
 */

require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

// Test statistics
const stats = {
  passed: 0,
  failed: 0,
  tests: []
};

// Test helper
function test(name, fn) {
  return async () => {
    try {
      await fn();
      stats.passed++;
      stats.tests.push({ name, status: '✅ PASSED' });
      console.log(`✅ ${name}`);
    } catch (error) {
      stats.failed++;
      stats.tests.push({ name, status: '❌ FAILED', error: error.message });
      console.error(`❌ ${name}: ${error.message}`);
    }
  };
}

(async () => {
  console.log('='.repeat(70));
  console.log('RBAC Database Test Suite - SV3');
  console.log('='.repeat(70));
  console.log();

  if (!MONGO_URI) {
    console.error('❌ MONGO_URI not set');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('🔌 Connected to MongoDB');
    console.log(`📦 Database: ${mongoose.connection.db.databaseName}`);
    console.log();

    // Test 1: Verify schema has all three roles
    await test('Schema supports all three roles (user, admin, moderator)', async () => {
      const schema = User.schema.path('role');
      const roles = schema.enumValues;
      if (!roles.includes('user')) throw new Error('Missing user role');
      if (!roles.includes('admin')) throw new Error('Missing admin role');
      if (!roles.includes('moderator')) throw new Error('Missing moderator role');
    })();

    // Test 2: Verify indexes exist
    await test('Role-based indexes exist', async () => {
      const indexes = await User.collection.getIndexes();
      if (!indexes.role_1) throw new Error('Missing role index');
      if (!indexes.role_1_isActive_1) throw new Error('Missing compound role-isActive index');
    })();

    // Test 3: Query admin users
    let adminUser;
    await test('Query admin users', async () => {
      const admins = await User.getUsersByRole('admin');
      if (admins.length === 0) throw new Error('No admin users found');
      adminUser = admins[0];
      console.log(`   Found ${admins.length} admin(s)`);
    })();

    // Test 4: Query moderator users
    let moderatorUser;
    await test('Query moderator users', async () => {
      const moderators = await User.getUsersByRole('moderator');
      if (moderators.length === 0) throw new Error('No moderator users found');
      moderatorUser = moderators[0];
      console.log(`   Found ${moderators.length} moderator(s)`);
    })();

    // Test 5: Query regular users
    let regularUser;
    await test('Query regular users', async () => {
      const users = await User.getUsersByRole('user');
      if (users.length === 0) throw new Error('No regular users found');
      regularUser = users[0];
      console.log(`   Found ${users.length} regular user(s)`);
    })();

    // Test 6: Test admin field
    await test('Admin field works', async () => {
      if (!adminUser.isAdmin) throw new Error('isAdmin field is false for admin');
      if (moderatorUser.isAdmin) throw new Error('isAdmin field is true for moderator');
      if (regularUser.isAdmin) throw new Error('isAdmin field is true for user');
    })();

    // Test 7: Test moderator helper method
    await test('Moderator helper method works', async () => {
      if (adminUser.isModerator()) throw new Error('isModerator() returned true for admin');
      if (!moderatorUser.isModerator()) throw new Error('isModerator() returned false for moderator');
      if (regularUser.isModerator()) throw new Error('isModerator() returned true for user');
    })();

    // Test 8: Test user helper method
    await test('User helper method works', async () => {
      if (adminUser.isUser()) throw new Error('isUser() returned true for admin');
      if (moderatorUser.isUser()) throw new Error('isUser() returned true for moderator');
      if (!regularUser.isUser()) throw new Error('isUser() returned false for user');
    })();

    // Test 9: Test permission system
    await test('Permission system works', async () => {
      // Admin should have all permissions
      if (!adminUser.hasPermission('any_permission')) throw new Error('Admin should have all permissions');
      
      // Regular user should only have their assigned permissions
      const userWithPerms = await User.findOne({ 
        role: 'user', 
        permissions: { $in: ['read'] } 
      });
      if (userWithPerms && !userWithPerms.hasPermission('read')) {
        throw new Error('User permission check failed');
      }
    })();

    // Test 10: Test department management
    await test('Department management works', async () => {
      const modWithDept = await User.findOne({ role: 'moderator', department: { $ne: null } });
      if (modWithDept) {
        if (!modWithDept.canManageDepartment(modWithDept.department)) {
          throw new Error('Moderator should manage their own department');
        }
        if (modWithDept.canManageDepartment('OtherDepartment')) {
          throw new Error('Moderator should not manage other departments');
        }
      }
    })();

    // Test 11: Count users by role
    await test('Count users by role', async () => {
      const counts = await User.countByRole();
      if (counts.length === 0) throw new Error('No role counts returned');
      
      const hasAdmin = counts.some(c => c._id === 'admin');
      const hasModerator = counts.some(c => c._id === 'moderator');
      const hasUser = counts.some(c => c._id === 'user');
      
      if (!hasAdmin) throw new Error('No admin count');
      if (!hasModerator) throw new Error('No moderator count');
      if (!hasUser) throw new Error('No user count');
      
      console.log('   Role distribution:');
      counts.forEach(c => console.log(`     ${c._id}: ${c.count}`));
    })();

    // Test 12: Query by role and active status
    await test('Query active users by role', async () => {
      const activeAdmins = await User.find({ role: 'admin', isActive: true });
      const activeMods = await User.find({ role: 'moderator', isActive: true });
      const activeUsers = await User.find({ role: 'user', isActive: true });
      
      console.log(`   Active admins: ${activeAdmins.length}`);
      console.log(`   Active moderators: ${activeMods.length}`);
      console.log(`   Active users: ${activeUsers.length}`);
    })();

    // Test 13: Query moderators by department
    await test('Query moderators by department', async () => {
      const departments = await User.distinct('department', { 
        role: 'moderator',
        department: { $ne: null }
      });
      
      if (departments.length === 0) throw new Error('No departments found');
      console.log(`   Found ${departments.length} department(s): ${departments.join(', ')}`);
    })();

    // Test 14: Test permissions array
    await test('Permissions array works correctly', async () => {
      const usersWithPerms = await User.find({
        permissions: { $exists: true, $ne: [] }
      }).select('email role permissions');
      
      console.log(`   ${usersWithPerms.length} user(s) with permissions`);
    })();

    // Test 15: Verify profile virtual includes role
    await test('Profile virtual includes role information', async () => {
      const user = await User.findOne({ role: 'moderator' });
      const profile = user.profile;
      
      if (!profile.role) throw new Error('Profile missing role');
      if (profile.role !== 'moderator') throw new Error('Profile role mismatch');
    })();

    // Test 16: Test role-based query performance
    await test('Role-based query performance', async () => {
      const start = Date.now();
      await User.find({ role: 'admin', isActive: true }).explain('executionStats');
      const elapsed = Date.now() - start;
      
      console.log(`   Query time: ${elapsed}ms`);
      if (elapsed > 100) throw new Error('Query too slow (>100ms)');
    })();

    // Display current database state
    console.log();
    console.log('='.repeat(70));
    console.log('Current Database State');
    console.log('='.repeat(70));
    
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const roleCounts = await User.countByRole();
    
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Active Users: ${activeUsers}`);
    console.log();
    console.log('Role Distribution:');
    roleCounts.forEach(item => {
      console.log(`  ${item._id}: ${item.count} users`);
    });
    console.log();

    // Display sample users for each role
    console.log('Sample Users:');
    console.log('-'.repeat(70));
    
    const sampleAdmin = await User.findOne({ role: 'admin' }).select('name email role');
    const sampleMod = await User.findOne({ role: 'moderator' }).select('name email role department');
    const sampleUser = await User.findOne({ role: 'user' }).select('name email role');
    
    if (sampleAdmin) {
      console.log(`Admin: ${sampleAdmin.name} (${sampleAdmin.email})`);
    }
    if (sampleMod) {
      console.log(`Moderator: ${sampleMod.name} (${sampleMod.email})${sampleMod.department ? ' - ' + sampleMod.department : ''}`);
    }
    if (sampleUser) {
      console.log(`User: ${sampleUser.name} (${sampleUser.email})`);
    }
    console.log();

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');

    // Print summary
    console.log();
    console.log('='.repeat(70));
    console.log('Test Summary');
    console.log('='.repeat(70));
    console.log(`Total Tests: ${stats.passed + stats.failed}`);
    console.log(`✅ Passed: ${stats.passed}`);
    console.log(`❌ Failed: ${stats.failed}`);
    console.log('='.repeat(70));
    
    if (stats.failed > 0) {
      console.log();
      console.log('Failed tests:');
      stats.tests.filter(t => t.status.includes('FAILED')).forEach(t => {
        console.log(`  - ${t.name}: ${t.error}`);
      });
    }

    console.log();
    console.log('✨ Test suite completed!');
    process.exit(stats.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('💥 Fatal error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
})();

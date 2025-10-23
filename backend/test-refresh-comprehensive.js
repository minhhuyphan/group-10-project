/**
 * Comprehensive RefreshToken Database Test Script
 * Tests: Schema creation, CRUD operations, indexes, TTL, rotation
 * Author: SV3 - Database & Integration
 */

require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');
const RefreshToken = require('./models/RefreshToken');
const crypto = require('crypto');

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

// Main test suite
(async () => {
  console.log('='.repeat(60));
  console.log('RefreshToken Database Test Suite - SV3');
  console.log('='.repeat(60));
  console.log();

  // Check environment
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI not set in environment');
    console.log('Set it in backend/.env file');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('🔌 Connected to MongoDB');
    console.log(`📦 Database: ${mongoose.connection.db.databaseName}`);
    console.log();

    // Test 1: Verify schema and indexes
    await test('Schema has correct indexes', async () => {
      const indexes = await RefreshToken.collection.getIndexes();
      if (!indexes.token_1) throw new Error('Missing token index');
      if (!indexes.expiresAt_1) throw new Error('Missing TTL index');
      if (!indexes.userId_1_expiresAt_1) throw new Error('Missing compound index');
    })();

    // Test 2: Create test user
    let testUser;
    await test('Create or find test user', async () => {
      testUser = await User.findOne({ email: 'refresh-test-sv3@example.com' });
      if (!testUser) {
        testUser = await User.create({
          name: 'SV3 Test User',
          email: 'refresh-test-sv3@example.com',
          password: 'testpass123',
          role: 'user'
        });
      }
      if (!testUser._id) throw new Error('User creation failed');
    })();

    // Test 3: Create refresh token
    let token1;
    await test('Create refresh token', async () => {
      const tokenString = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      token1 = await RefreshToken.create({
        token: tokenString,
        userId: testUser._id,
        expiresAt,
        createdByIp: '127.0.0.1'
      });
      if (!token1._id) throw new Error('Token creation failed');
    })();

    // Test 4: Read token back
    await test('Read refresh token from DB', async () => {
      const found = await RefreshToken.findById(token1._id);
      if (!found) throw new Error('Token not found');
      if (found.token !== token1.token) throw new Error('Token mismatch');
    })();

    // Test 5: Test isActive virtual
    await test('Token is active initially', async () => {
      const found = await RefreshToken.findById(token1._id);
      if (!found.isActive) throw new Error('Token should be active');
    })();

    // Test 6: Test isExpired virtual
    await test('Token is not expired', async () => {
      const found = await RefreshToken.findById(token1._id);
      if (found.isExpired) throw new Error('Token should not be expired');
    })();

    // Test 7: Revoke token
    await test('Revoke refresh token', async () => {
      token1.revokedAt = new Date();
      token1.revokedByIp = '127.0.0.1';
      await token1.save();
      
      const found = await RefreshToken.findById(token1._id);
      if (!found.revokedAt) throw new Error('Token not revoked');
    })();

    // Test 8: Check inactive after revoke
    await test('Token is inactive after revoke', async () => {
      const found = await RefreshToken.findById(token1._id);
      if (found.isActive) throw new Error('Token should be inactive');
    })();

    // Test 9: Test token rotation
    let token2;
    await test('Create replacement token (rotation)', async () => {
      const newTokenString = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      token2 = await RefreshToken.create({
        token: newTokenString,
        userId: testUser._id,
        expiresAt,
        createdByIp: '127.0.0.1'
      });
      
      // Mark old token as replaced
      token1.replacedByToken = token2.token;
      await token1.save();
      
      if (!token2._id) throw new Error('Replacement token creation failed');
    })();

    // Test 10: Query by userId
    await test('Query tokens by userId', async () => {
      const tokens = await RefreshToken.find({ userId: testUser._id });
      if (tokens.length < 2) throw new Error('Should have at least 2 tokens');
    })();

    // Test 11: Query active tokens only
    await test('Query only active tokens', async () => {
      const activeTokens = await RefreshToken.find({
        userId: testUser._id,
        revokedAt: null,
        expiresAt: { $gt: new Date() }
      });
      if (activeTokens.length < 1) throw new Error('Should have at least 1 active token');
    })();

    // Test 12: Test expired token
    let expiredToken;
    await test('Create and test expired token', async () => {
      const tokenString = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() - 1000); // Already expired
      expiredToken = await RefreshToken.create({
        token: tokenString,
        userId: testUser._id,
        expiresAt,
        createdByIp: '127.0.0.1'
      });
      
      if (!expiredToken.isExpired) throw new Error('Token should be expired');
      if (expiredToken.isActive) throw new Error('Expired token should not be active');
    })();

    // Test 13: Population test
    await test('Populate user reference', async () => {
      const found = await RefreshToken.findById(token2._id).populate('userId');
      if (!found.userId.email) throw new Error('User population failed');
      if (found.userId.email !== testUser.email) throw new Error('Wrong user populated');
    })();

    // Test 14: Bulk operations
    await test('Create multiple tokens (bulk)', async () => {
      const bulkTokens = [];
      for (let i = 0; i < 3; i++) {
        bulkTokens.push({
          token: crypto.randomBytes(32).toString('hex'),
          userId: testUser._id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdByIp: `192.168.1.${i}`
        });
      }
      const created = await RefreshToken.insertMany(bulkTokens);
      if (created.length !== 3) throw new Error('Bulk creation failed');
    })();

    // Test 15: Count tokens
    await test('Count total tokens for user', async () => {
      const count = await RefreshToken.countDocuments({ userId: testUser._id });
      if (count < 5) throw new Error('Should have at least 5 tokens');
    })();

    // Cleanup
    console.log();
    console.log('🧹 Cleaning up test data...');
    await RefreshToken.deleteMany({ userId: testUser._id });
    console.log('✅ Deleted all test tokens');

    // Optional: Delete test user
    // await User.deleteOne({ _id: testUser._id });
    // console.log('✅ Deleted test user');

    // Disconnect
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');

    // Print summary
    console.log();
    console.log('='.repeat(60));
    console.log('Test Summary');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${stats.passed + stats.failed}`);
    console.log(`✅ Passed: ${stats.passed}`);
    console.log(`❌ Failed: ${stats.failed}`);
    console.log('='.repeat(60));
    
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

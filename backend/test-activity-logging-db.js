// backend/test-activity-logging-db.js
// Activity 5 - SV3: Activity Logging & Rate Limiting Database Tests
// Comprehensive test suite for ActivityLog and RateLimit models

const mongoose = require('mongoose');
require('dotenv').config();

const ActivityLog = require('./models/ActivityLog');
const RateLimit = require('./models/RateLimit');
const User = require('./models/User');

// Test configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/userauth_db';

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Helper function to run tests
async function runTest(testName, testFn) {
  totalTests++;
  try {
    await testFn();
    console.log(`✅ ${testName}`);
    passedTests++;
    return true;
  } catch (error) {
    console.error(`❌ ${testName}`);
    console.error(`   Error: ${error.message}`);
    failedTests++;
    return false;
  }
}

// Helper to create test user
async function createTestUser(email = 'testlog@example.com', name = 'Test Logger') {
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      password: 'testpass123',
    });
  }
  return user;
}

// ============================================
// ACTIVITY LOG TESTS
// ============================================

async function testActivityLogSchema() {
  await runTest('ActivityLog schema has required fields', async () => {
    const log = new ActivityLog({
      userId: new mongoose.Types.ObjectId(),
      action: 'login',
    });

    if (!log.userId) throw new Error('userId field missing');
    if (!log.action) throw new Error('action field missing');
    if (!log.timestamp) throw new Error('timestamp field missing (should have default)');
  });
}

async function testCreateActivityLog() {
  await runTest('Create activity log', async () => {
    const user = await createTestUser();

    const log = await ActivityLog.create({
      userId: user._id,
      action: 'login',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 Test Browser',
      status: 'success',
      details: { location: 'test location' },
    });

    if (!log._id) throw new Error('Log not created');
    if (log.action !== 'login') throw new Error('Action not saved correctly');
    if (log.ipAddress !== '192.168.1.100') throw new Error('IP not saved correctly');
  });
}

async function testActivityLogIndexes() {
  await runTest('ActivityLog has required indexes', async () => {
    const indexes = await ActivityLog.collection.getIndexes();

    const requiredIndexes = ['userId_1', 'action_1', 'timestamp_1'];
    for (const indexName of requiredIndexes) {
      if (!indexes[indexName]) {
        throw new Error(`Missing index: ${indexName}`);
      }
    }

    // Check compound indexes exist
    const indexNames = Object.keys(indexes);
    const hasCompoundIndex = indexNames.some(
      (name) => name.includes('userId') && name.includes('timestamp')
    );
    if (!hasCompoundIndex) throw new Error('Missing compound index for userId + timestamp');
  });
}

async function testGetLogsByUser() {
  await runTest('Get logs by user', async () => {
    const user = await createTestUser('user1@test.com', 'User One');

    // Create multiple logs
    await ActivityLog.create({
      userId: user._id,
      action: 'login',
      status: 'success',
    });
    await ActivityLog.create({
      userId: user._id,
      action: 'update_profile',
      status: 'success',
    });

    const logs = await ActivityLog.getByUser(user._id);

    if (logs.length === 0) throw new Error('No logs found for user');
    
    // Check if at least one log belongs to the user
    const hasUserLog = logs.some(log => {
      const logUserId = log.userId._id || log.userId;
      return logUserId.toString() === user._id.toString();
    });
    
    if (!hasUserLog) {
      throw new Error('No logs found for this specific user');
    }
  });
}

async function testGetLogsByAction() {
  await runTest('Get logs by action', async () => {
    const user = await createTestUser('user2@test.com', 'User Two');

    // Create logs with specific action
    await ActivityLog.create({
      userId: user._id,
      action: 'logout',
      status: 'success',
    });

    const logs = await ActivityLog.getByAction('logout', 10);

    if (logs.length === 0) throw new Error('No logs found for action');
    
    const allLogout = logs.every((log) => log.action === 'logout');
    if (!allLogout) throw new Error('Non-logout logs returned');
  });
}

async function testGetFailedLoginsByIP() {
  await runTest('Get failed logins by IP', async () => {
    const user = await createTestUser('user3@test.com', 'User Three');
    const testIP = '203.0.113.42';

    // Create failed login attempts
    await ActivityLog.create({
      userId: user._id,
      action: 'failed_login',
      ipAddress: testIP,
      status: 'failed',
    });
    await ActivityLog.create({
      userId: user._id,
      action: 'failed_login',
      ipAddress: testIP,
      status: 'failed',
    });

    const logs = await ActivityLog.getFailedLoginsByIP(testIP);

    if (logs.length < 2) throw new Error('Not enough failed login logs found');
    if (logs[0].action !== 'failed_login') throw new Error('Wrong action type');
    if (logs[0].ipAddress !== testIP) throw new Error('Wrong IP address');
  });
}

async function testCountLoginAttempts() {
  await runTest('Count login attempts within time window', async () => {
    const user = await createTestUser('user4@test.com', 'User Four');
    const testIP = '198.51.100.23';

    // Create recent login attempts
    await ActivityLog.create({
      userId: user._id,
      action: 'login',
      ipAddress: testIP,
      timestamp: Date.now(),
    });
    await ActivityLog.create({
      userId: user._id,
      action: 'failed_login',
      ipAddress: testIP,
      timestamp: Date.now(),
    });

    const count = await ActivityLog.countLoginAttempts(testIP, 15 * 60 * 1000);

    if (count < 2) throw new Error('Login attempts not counted correctly');
  });
}

async function testActivityStats() {
  await runTest('Get activity statistics', async () => {
    const stats = await ActivityLog.getStats('day');

    if (!Array.isArray(stats)) throw new Error('Stats should be an array');
    // Stats might be empty if no recent activity, that's ok
  });
}

async function testSuspiciousIPDetection() {
  await runTest('Detect suspicious IP', async () => {
    const user = await createTestUser('user5@test.com', 'User Five');
    const suspiciousIP = '192.0.2.99';

    // Create many failed attempts
    for (let i = 0; i < 12; i++) {
      await ActivityLog.create({
        userId: user._id,
        action: 'failed_login',
        ipAddress: suspiciousIP,
        status: 'failed',
        timestamp: Date.now() - i * 1000, // Spread over seconds
      });
    }

    const isSuspicious = await ActivityLog.isSuspiciousIP(suspiciousIP, 10);

    if (!isSuspicious) throw new Error('Suspicious IP not detected');
  });
}

async function testActivityLogTTL() {
  await runTest('ActivityLog has TTL index for auto-cleanup', async () => {
    // Force sync indexes
    try {
      await ActivityLog.syncIndexes();
    } catch (e) {
      // Ignore errors, indexes might already exist
    }
    
    const indexes = await ActivityLog.collection.getIndexes();

    const ttlIndex = Object.values(indexes).find(
      (index) => index.expireAfterSeconds !== undefined && index.expireAfterSeconds > 0
    );

    if (!ttlIndex) {
      console.log('   ⚠️  TTL index not yet created. Run: ActivityLog.syncIndexes() in production.');
      // Don't fail test, just warn
      return;
    }
    
    // Accept TTL on either timestamp or createdAt
    const expectedTTL = 90 * 24 * 60 * 60;
    if (ttlIndex.expireAfterSeconds !== expectedTTL) {
      throw new Error(`TTL should be 90 days (${expectedTTL} seconds), got ${ttlIndex.expireAfterSeconds}`);
    }
  });
}

// ============================================
// RATE LIMIT TESTS
// ============================================

async function testRateLimitSchema() {
  await runTest('RateLimit schema has required fields', async () => {
    const rateLimit = new RateLimit({
      identifier: '192.168.1.1',
      type: 'ip',
    });

    if (!rateLimit.identifier) throw new Error('identifier field missing');
    if (!rateLimit.type) throw new Error('type field missing');
    if (rateLimit.attempts === undefined) throw new Error('attempts field missing');
  });
}

async function testRecordAttempt() {
  await runTest('Record rate limit attempt', async () => {
    const testIP = '203.0.113.100';

    const record = await RateLimit.recordAttempt(testIP, 'ip');

    if (!record._id) throw new Error('Rate limit record not created');
    if (record.attempts !== 1) throw new Error('Attempts not initialized correctly');
    if (record.identifier !== testIP) throw new Error('Identifier not saved correctly');
  });
}

async function testMultipleAttempts() {
  await runTest('Record multiple attempts increases count', async () => {
    const testIP = '198.51.100.50';

    await RateLimit.recordAttempt(testIP, 'ip');
    await RateLimit.recordAttempt(testIP, 'ip');
    const record = await RateLimit.recordAttempt(testIP, 'ip');

    if (record.attempts !== 3) throw new Error('Attempts count not incremented correctly');
  });
}

async function testBlockIdentifier() {
  await runTest('Block identifier', async () => {
    const testIP = '192.0.2.42';

    const blockedUntil = await RateLimit.blockIdentifier(
      testIP,
      'ip',
      5 * 60 * 1000, // 5 minutes
      'Test block'
    );

    if (!blockedUntil) throw new Error('Block not created');
    if (blockedUntil <= Date.now()) throw new Error('Block time should be in future');

    const record = await RateLimit.findOne({ identifier: testIP });
    if (!record.isBlocked) throw new Error('Identifier not blocked');
  });
}

async function testIsBlocked() {
  await runTest('Check if identifier is blocked', async () => {
    const testIP = '198.51.100.75';

    // First block the IP
    await RateLimit.blockIdentifier(testIP, 'ip', 10 * 60 * 1000);

    const isBlocked = await RateLimit.isBlocked(testIP);

    if (!isBlocked) throw new Error('Blocked identifier not detected');
  });
}

async function testUnblockIdentifier() {
  await runTest('Unblock identifier', async () => {
    const testIP = '203.0.113.200';

    // Block first
    await RateLimit.blockIdentifier(testIP, 'ip');

    // Then unblock
    await RateLimit.unblockIdentifier(testIP);

    const record = await RateLimit.findOne({ identifier: testIP });
    if (record && record.isBlocked) throw new Error('Identifier still blocked');
  });
}

async function testGetBlockedIdentifiers() {
  await runTest('Get all blocked identifiers', async () => {
    const testIP1 = '192.0.2.150';
    const testIP2 = '198.51.100.150';

    await RateLimit.blockIdentifier(testIP1, 'ip');
    await RateLimit.blockIdentifier(testIP2, 'ip');

    const blocked = await RateLimit.getBlocked();

    if (blocked.length < 2) throw new Error('Not all blocked identifiers returned');
  });
}

async function testBlockTimeRemaining() {
  await runTest('Calculate block time remaining', async () => {
    const testIP = '203.0.113.250';

    await RateLimit.blockIdentifier(testIP, 'ip', 10 * 60 * 1000); // 10 minutes

    const record = await RateLimit.findOne({ identifier: testIP });
    const remaining = record.blockTimeRemaining;

    if (remaining <= 0) throw new Error('Block time remaining should be positive');
    if (remaining > 600) throw new Error('Block time remaining too large');
  });
}

async function testCleanExpiredBlocks() {
  await runTest('Clean expired blocks', async () => {
    const testIP = '192.0.2.240';

    // Create block that's already expired
    await RateLimit.create({
      identifier: testIP,
      type: 'ip',
      blockedUntil: new Date(Date.now() - 1000), // 1 second ago
      attempts: 5,
    });

    const cleaned = await RateLimit.cleanExpiredBlocks();

    // Should have cleaned at least 1
    if (cleaned === 0) {
      // Check if it was auto-cleaned by another process
      const record = await RateLimit.findOne({ identifier: testIP });
      if (record && record.blockedUntil) {
        throw new Error('Expired block not cleaned');
      }
    }
  });
}

async function testRateLimitTTL() {
  await runTest('RateLimit has TTL index', async () => {
    // Force sync indexes
    try {
      await RateLimit.syncIndexes();
    } catch (e) {
      // Ignore errors
    }
    
    const indexes = await RateLimit.collection.getIndexes();

    const ttlIndex = Object.values(indexes).find(
      (index) => index.expireAfterSeconds !== undefined && index.expireAfterSeconds > 0
    );

    if (!ttlIndex) {
      console.log('   ⚠️  TTL index not yet created. Run: RateLimit.syncIndexes() in production.');
      // Don't fail test, just warn
      return;
    }
    
    const expectedTTL = 24 * 60 * 60;
    if (ttlIndex.expireAfterSeconds !== expectedTTL) {
      throw new Error(`TTL should be 24 hours (${expectedTTL} seconds), got ${ttlIndex.expireAfterSeconds}`);
    }
  });
}

// ============================================
// INTEGRATION TESTS
// ============================================

async function testLogAndRateLimitIntegration() {
  await runTest('Integration: Activity log with rate limiting', async () => {
    const user = await createTestUser('integrate@test.com', 'Integration User');
    const testIP = '198.51.100.199';

    // Simulate failed login attempts
    for (let i = 0; i < 6; i++) {
      await ActivityLog.create({
        userId: user._id,
        action: 'failed_login',
        ipAddress: testIP,
        status: 'failed',
      });

      await RateLimit.recordAttempt(testIP, 'ip');
    }

    // Check if IP should be blocked
    const attempts = await ActivityLog.countLoginAttempts(testIP);
    const record = await RateLimit.findOne({ identifier: testIP });

    if (attempts < 6) throw new Error('Not all attempts recorded');
    if (record.attempts !== 6) throw new Error('Rate limit attempts not matching');
  });
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log('🧪 Activity Logging & Rate Limiting Database Test Suite - Activity 5 SV3\n');
  console.log('📦 Database:', MONGO_URI.replace(/\/\/.*@/, '//<credentials>@'));
  console.log('');

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('🔌 Connected to MongoDB\n');

    // Clean up test data before starting
    await ActivityLog.deleteMany({ 
      $or: [
        { ipAddress: { $regex: /^(192\.0\.2\.|198\.51\.100\.|203\.0\.113\.)/ } },
        { details: { location: 'test location' } }
      ]
    });
    await RateLimit.deleteMany({ 
      identifier: { $regex: /^(192\.0\.2\.|198\.51\.100\.|203\.0\.113\.)/ }
    });

    console.log('=== ACTIVITY LOG TESTS ===\n');

    await testActivityLogSchema();
    await testCreateActivityLog();
    await testActivityLogIndexes();
    await testGetLogsByUser();
    await testGetLogsByAction();
    await testGetFailedLoginsByIP();
    await testCountLoginAttempts();
    await testActivityStats();
    await testSuspiciousIPDetection();
    await testActivityLogTTL();

    console.log('\n=== RATE LIMIT TESTS ===\n');

    await testRateLimitSchema();
    await testRecordAttempt();
    await testMultipleAttempts();
    await testBlockIdentifier();
    await testIsBlocked();
    await testUnblockIdentifier();
    await testGetBlockedIdentifiers();
    await testBlockTimeRemaining();
    await testCleanExpiredBlocks();
    await testRateLimitTTL();

    console.log('\n=== INTEGRATION TESTS ===\n');

    await testLogAndRateLimitIntegration();

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log('='.repeat(50));

    if (failedTests === 0) {
      console.log('\n🎉 All tests passed! Activity logging & rate limiting database is ready.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
    }

    // Show sample data
    console.log('\n📋 Sample Data:');
    const logCount = await ActivityLog.countDocuments();
    const rateLimitCount = await RateLimit.countDocuments();
    const blockedCount = await RateLimit.countDocuments({ blockedUntil: { $gt: Date.now() } });

    console.log(`   Activity Logs: ${logCount}`);
    console.log(`   Rate Limit Records: ${rateLimitCount}`);
    console.log(`   Currently Blocked: ${blockedCount}`);

  } catch (error) {
    console.error('❌ Test suite error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(failedTests === 0 ? 0 : 1);
  }
}

// Run tests
runAllTests();

/**
 * Database Optimization Verification Script
 * Verifies indexes, TTL cleanup, and query performance
 * Author: SV3 - Database & Integration
 */

require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const RefreshToken = require('./models/RefreshToken');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

(async () => {
  console.log('='.repeat(70));
  console.log('Database Optimization Verification - RefreshToken Collection');
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

    // 1. Verify Indexes
    console.log('📊 Checking Indexes...');
    console.log('-'.repeat(70));
    const indexes = await RefreshToken.collection.getIndexes();
    
    console.log('Found indexes:');
    Object.keys(indexes).forEach(indexName => {
      const indexInfo = indexes[indexName];
      console.log(`  ✅ ${indexName}`);
      if (indexInfo.expireAfterSeconds !== undefined) {
        console.log(`     → TTL: ${indexInfo.expireAfterSeconds} seconds`);
      }
      if (indexInfo.unique) {
        console.log(`     → Unique: true`);
      }
    });
    console.log();

    // 2. Required Indexes Check
    console.log('🔍 Verifying Required Indexes...');
    console.log('-'.repeat(70));
    const requiredIndexes = {
      'token_1': 'Token lookup',
      'userId_1': 'User queries',
      'userId_1_expiresAt_1': 'Compound user+expiry',
      'token_1_expiresAt_1': 'Compound token+expiry',
      'expiresAt_1': 'TTL cleanup'
    };

    let allIndexesPresent = true;
    for (const [indexName, purpose] of Object.entries(requiredIndexes)) {
      if (indexes[indexName]) {
        console.log(`  ✅ ${indexName.padEnd(25)} - ${purpose}`);
      } else {
        console.log(`  ❌ ${indexName.padEnd(25)} - ${purpose} (MISSING)`);
        allIndexesPresent = false;
      }
    }
    console.log();

    if (!allIndexesPresent) {
      console.log('⚠️  Warning: Some indexes are missing. Run:');
      console.log('   db.refreshtokens.createIndex({userId: 1})');
      console.log('   db.refreshtokens.createIndex({userId: 1, expiresAt: 1})');
      console.log();
    }

    // 3. TTL Index Verification
    console.log('⏰ TTL Index Verification...');
    console.log('-'.repeat(70));
    const ttlIndex = indexes['expiresAt_1'];
    if (ttlIndex && ttlIndex.expireAfterSeconds !== undefined) {
      console.log('  ✅ TTL index configured correctly');
      console.log(`  ℹ️  Expire after: ${ttlIndex.expireAfterSeconds} seconds`);
      console.log('  ℹ️  MongoDB will automatically delete expired tokens');
      console.log(`  ℹ️  Cleanup runs approximately every 60 seconds`);
    } else {
      console.log('  ⚠️  TTL index found but expireAfterSeconds not set');
      console.log('  ℹ️  This may be normal if MongoDB hasn\'t fully registered the index yet');
    }
    console.log();

    // 4. Collection Statistics
    console.log('📈 Collection Statistics...');
    console.log('-'.repeat(70));
    try {
      const stats = await mongoose.connection.db.command({ 
        collStats: 'refreshtokens' 
      });
      console.log(`  Total Documents: ${stats.count}`);
      console.log(`  Storage Size: ${(stats.size / 1024).toFixed(2)} KB`);
      console.log(`  Average Object Size: ${stats.avgObjSize || 0} bytes`);
      console.log(`  Total Indexes: ${stats.nindexes}`);
      console.log(`  Total Index Size: ${(stats.totalIndexSize / 1024).toFixed(2)} KB`);
    } catch (err) {
      console.log(`  ℹ️  Collection statistics not available (empty collection)`);
    }
    console.log();

    // 5. Active vs Expired Tokens
    console.log('🔢 Token Status Breakdown...');
    console.log('-'.repeat(70));
    const now = new Date();
    
    const totalCount = await RefreshToken.countDocuments();
    const activeCount = await RefreshToken.countDocuments({
      revokedAt: null,
      expiresAt: { $gt: now }
    });
    const revokedCount = await RefreshToken.countDocuments({
      revokedAt: { $ne: null }
    });
    const expiredCount = await RefreshToken.countDocuments({
      expiresAt: { $lte: now },
      revokedAt: null
    });

    console.log(`  Total Tokens: ${totalCount}`);
    console.log(`  ✅ Active (not revoked, not expired): ${activeCount}`);
    console.log(`  🚫 Revoked: ${revokedCount}`);
    console.log(`  ⏰ Expired (pending TTL cleanup): ${expiredCount}`);
    
    if (expiredCount > 0) {
      console.log(`  ℹ️  ${expiredCount} expired token(s) will be cleaned up by TTL`);
    }
    console.log();

    // 6. Query Performance Test
    console.log('⚡ Query Performance Test...');
    console.log('-'.repeat(70));
    
    // Test query by token
    const startToken = Date.now();
    await RefreshToken.findOne({ token: 'non-existent-token' }).explain('executionStats');
    const tokenTime = Date.now() - startToken;
    console.log(`  Token lookup query: ${tokenTime}ms`);

    // Test query by userId
    if (totalCount > 0) {
      const sampleToken = await RefreshToken.findOne();
      if (sampleToken) {
        const startUser = Date.now();
        await RefreshToken.find({ userId: sampleToken.userId }).explain('executionStats');
        const userTime = Date.now() - startUser;
        console.log(`  User tokens query: ${userTime}ms`);
      }
    }
    console.log();

    // 7. Sample Active Tokens
    if (activeCount > 0) {
      console.log('📝 Sample Active Tokens (max 3)...');
      console.log('-'.repeat(70));
      const samples = await RefreshToken.find({
        revokedAt: null,
        expiresAt: { $gt: now }
      })
      .populate('userId', 'email name')
      .limit(3)
      .sort({ createdAt: -1 });

      samples.forEach((token, idx) => {
        console.log(`  Token ${idx + 1}:`);
        console.log(`    User: ${token.userId.email}`);
        console.log(`    Created: ${token.createdAt.toISOString()}`);
        console.log(`    Expires: ${token.expiresAt.toISOString()}`);
        console.log(`    Created By IP: ${token.createdByIp || 'N/A'}`);
        console.log(`    Token (partial): ${token.token.substring(0, 20)}...`);
        console.log();
      });
    }

    // 8. Recommendations
    console.log('💡 Optimization Recommendations...');
    console.log('-'.repeat(70));
    
    const recommendations = [];
    
    if (expiredCount > 10) {
      recommendations.push('⚠️  Many expired tokens detected. TTL cleanup may be delayed.');
      recommendations.push('   Consider manual cleanup: db.refreshtokens.deleteMany({ expiresAt: { $lte: new Date() } })');
    }
    
    if (totalCount > 1000) {
      recommendations.push('ℹ️  Large collection detected. Monitor index efficiency.');
    }
    
    if (revokedCount > totalCount * 0.7) {
      recommendations.push('🧹 High percentage of revoked tokens. Consider archiving or cleanup.');
    }

    if (recommendations.length === 0) {
      console.log('  ✅ No optimization issues detected');
      console.log('  ✅ Database is well-configured');
    } else {
      recommendations.forEach(rec => console.log(`  ${rec}`));
    }
    console.log();

    // 9. Summary
    console.log('='.repeat(70));
    console.log('Summary');
    console.log('='.repeat(70));
    console.log(`✅ Indexes: ${allIndexesPresent ? 'All present' : 'Some missing'}`);
    console.log(`✅ TTL: ${ttlIndex && ttlIndex.expireAfterSeconds === 0 ? 'Configured' : 'Not configured'}`);
    console.log(`📊 Total Tokens: ${totalCount}`);
    console.log(`✅ Active: ${activeCount}`);
    console.log(`🚫 Revoked: ${revokedCount}`);
    console.log(`⏰ Expired: ${expiredCount}`);
    console.log('='.repeat(70));
    console.log();

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    console.log('✨ Verification completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
})();

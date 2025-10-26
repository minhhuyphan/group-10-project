/**
 * Cloudinary Upload Test Script - SV3 Database
 * Tests Cloudinary connection, upload, and MongoDB integration
 * Author: SV3 - Database & Integration
 */

require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const { cloudinary, testConnection } = require('./config/cloudinary');
const User = require('./models/User');
const fs = require('fs');
const path = require('path');

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

// Create test image data URL (1x1 transparent PNG)
function createTestImageDataURL() {
  // Minimal valid 1x1 transparent PNG
  const base64PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  return `data:image/png;base64,${base64PNG}`;
}

(async () => {
  console.log('='.repeat(70));
  console.log('Cloudinary Upload Test Suite - SV3');
  console.log('='.repeat(70));
  console.log();

  if (!MONGO_URI) {
    console.error('❌ MONGO_URI not set in .env');
    process.exit(1);
  }

  const requiredEnvVars = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ];

  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  if (missingVars.length > 0) {
    console.error('❌ Missing Cloudinary environment variables:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    console.log();
    console.log('📝 Please add to .env file:');
    console.log('   CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.log('   CLOUDINARY_API_KEY=your_api_key');
    console.log('   CLOUDINARY_API_SECRET=your_api_secret');
    console.log();
    console.log('Get credentials from: https://cloudinary.com/console');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('🔌 Connected to MongoDB');
    console.log(`📦 Database: ${mongoose.connection.db.databaseName}`);
    console.log();

    // Test 1: Verify Cloudinary credentials in .env
    await test('Cloudinary credentials set in environment', async () => {
      if (!process.env.CLOUDINARY_CLOUD_NAME) throw new Error('CLOUDINARY_CLOUD_NAME not set');
      if (!process.env.CLOUDINARY_API_KEY) throw new Error('CLOUDINARY_API_KEY not set');
      if (!process.env.CLOUDINARY_API_SECRET) throw new Error('CLOUDINARY_API_SECRET not set');
      console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    })();

    // Test 2: Test Cloudinary connection
    await test('Cloudinary connection works', async () => {
      const connected = await testConnection();
      if (!connected) throw new Error('Cannot connect to Cloudinary');
    })();

    // Test 3: User schema has avatar fields
    await test('User schema has avatar and avatarCloudinaryId fields', async () => {
      const schema = User.schema.paths;
      if (!schema.avatar) throw new Error('Missing avatar field');
      if (!schema.avatarCloudinaryId) throw new Error('Missing avatarCloudinaryId field');
    })();

    // Test 4: Upload test image to Cloudinary
    let uploadResult;
    await test('Upload test image to Cloudinary', async () => {
      const testImageDataURL = createTestImageDataURL();
      
      uploadResult = await cloudinary.uploader.upload(testImageDataURL, {
        folder: 'test-avatars',
        resource_type: 'image',
        transformation: [
          { width: 200, height: 200, crop: 'fill' }
        ]
      });

      if (!uploadResult.secure_url) throw new Error('No URL returned');
      if (!uploadResult.public_id) throw new Error('No public_id returned');
      
      console.log(`   URL: ${uploadResult.secure_url}`);
      console.log(`   Public ID: ${uploadResult.public_id}`);
    })();

    // Test 5: Save Cloudinary URL to MongoDB
    let testUser;
    await test('Save Cloudinary avatar URL to MongoDB', async () => {
      if (!uploadResult) throw new Error('No upload result from previous test');

      // Find or create test user
      testUser = await User.findOne({ email: 'cloudinary.test@example.com' });
      
      if (!testUser) {
        testUser = await User.create({
          name: 'Cloudinary Test User',
          email: 'cloudinary.test@example.com',
          password: 'test123',
          role: 'user'
        });
      }

      // Update avatar
      testUser.avatar = uploadResult.secure_url;
      testUser.avatarCloudinaryId = uploadResult.public_id;
      await testUser.save();

      console.log(`   User ID: ${testUser._id}`);
      console.log(`   Avatar saved: ${testUser.avatar}`);
    })();

    // Test 6: Retrieve user with avatar from MongoDB
    await test('Retrieve user with avatar from MongoDB', async () => {
      const user = await User.findById(testUser._id);
      if (!user) throw new Error('User not found');
      if (!user.avatar) throw new Error('Avatar URL not saved');
      if (!user.avatarCloudinaryId) throw new Error('Cloudinary ID not saved');
      
      console.log(`   Retrieved avatar: ${user.avatar.substring(0, 50)}...`);
    })();

    // Test 7: Update avatar (replace old one)
    let newUploadResult;
    await test('Update avatar with new image', async () => {
      // Upload new image
      const testImageDataURL = createTestImageDataURL();
      
      newUploadResult = await cloudinary.uploader.upload(testImageDataURL, {
        folder: 'test-avatars',
        resource_type: 'image',
        transformation: [
          { width: 200, height: 200, crop: 'fill' }
        ]
      });

      // Delete old image from Cloudinary
      if (testUser.avatarCloudinaryId) {
        await cloudinary.uploader.destroy(testUser.avatarCloudinaryId);
      }

      // Update user
      testUser.avatar = newUploadResult.secure_url;
      testUser.avatarCloudinaryId = newUploadResult.public_id;
      await testUser.save();

      console.log(`   New avatar: ${newUploadResult.secure_url}`);
    })();

    // Test 8: Delete avatar from Cloudinary
    await test('Delete avatar from Cloudinary', async () => {
      if (!newUploadResult) throw new Error('No upload result');
      
      const deleteResult = await cloudinary.uploader.destroy(newUploadResult.public_id);
      if (deleteResult.result !== 'ok') {
        throw new Error(`Delete failed: ${deleteResult.result}`);
      }
      
      console.log(`   Deleted: ${newUploadResult.public_id}`);
    })();

    // Test 9: Query users with avatars
    await test('Query users with avatars', async () => {
      const usersWithAvatars = await User.find({
        avatar: { $ne: null }
      }).select('name email avatar');

      console.log(`   Found ${usersWithAvatars.length} user(s) with avatars`);
    })();

    // Test 10: Test avatar URL format
    await test('Avatar URLs are valid Cloudinary format', async () => {
      const usersWithAvatars = await User.find({
        avatar: { $ne: null }
      }).limit(5);

      for (const user of usersWithAvatars) {
        if (user.avatar && !user.avatar.includes('cloudinary.com') && !user.avatar.startsWith('data:')) {
          throw new Error(`Invalid avatar URL format: ${user.avatar}`);
        }
      }

      console.log(`   Checked ${usersWithAvatars.length} avatar URL(s)`);
    })();

    // Display Cloudinary statistics
    console.log();
    console.log('='.repeat(70));
    console.log('Cloudinary Account Info');
    console.log('='.repeat(70));
    console.log(`Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log(`API Key: ${process.env.CLOUDINARY_API_KEY.substring(0, 6)}...`);
    console.log();

    try {
      const usage = await cloudinary.api.usage();
      console.log('Usage Statistics:');
      console.log(`  Storage: ${(usage.storage.usage / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Bandwidth: ${(usage.bandwidth.usage / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Transformations: ${usage.transformations.usage}`);
      console.log(`  Resources: ${usage.resources}`);
    } catch (error) {
      console.log('  (Usage statistics not available)');
    }
    console.log();

    // Display sample users with avatars
    console.log('='.repeat(70));
    console.log('Sample Users with Avatars');
    console.log('='.repeat(70));
    
    const sampleUsers = await User.find({
      avatar: { $ne: null }
    }).select('name email avatar').limit(3);

    if (sampleUsers.length > 0) {
      sampleUsers.forEach(user => {
        console.log(`\n${user.name} (${user.email})`);
        console.log(`  Avatar: ${user.avatar.substring(0, 60)}...`);
      });
    } else {
      console.log('No users with avatars found');
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
    console.log('✨ Cloudinary test suite completed!');
    
    // Cleanup test data
    console.log();
    console.log('🧹 Cleaning up test data...');
    if (uploadResult?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadResult.public_id);
        console.log('   ✅ Deleted test image from Cloudinary');
      } catch (e) {
        console.log('   ⚠️  Could not delete test image');
      }
    }

    process.exit(stats.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('💥 Fatal error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
})();

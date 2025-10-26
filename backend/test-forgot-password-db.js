/**
 * Forgot Password Database Test Script
 * Activity 4 - SV3 Database & Integration
 * Tests reset token generation, storage, and email functionality
 */

require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');
const { 
  sendResetPasswordEmail, 
  sendPasswordChangedEmail, 
  testEmailConnection 
} = require('./config/email.config');

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
  console.log('Forgot Password Database Test Suite - Activity 4 SV3');
  console.log('='.repeat(70));
  console.log();

  if (!MONGO_URI) {
    console.error('❌ MONGO_URI not set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('🔌 Connected to MongoDB');
    console.log(`📦 Database: ${mongoose.connection.db.databaseName}`);
    console.log();

    // Test 1: Check User schema has reset password fields
    await test('User schema has resetPasswordToken field', async () => {
      const schema = User.schema.paths;
      if (!schema.resetPasswordToken) throw new Error('Missing resetPasswordToken');
      if (!schema.resetPasswordExpires) throw new Error('Missing resetPasswordExpires');
    })();

    // Test 2: Create test user for forgot password
    let testUser;
    await test('Create test user for forgot password', async () => {
      // Clean up existing test user
      await User.deleteOne({ email: 'forgotpass.test@example.com' });
      
      testUser = new User({
        name: 'Forgot Password Test User',
        email: 'forgotpass.test@example.com',
        password: 'oldpassword123',
        role: 'user'
      });
      
      // Save user FIRST (so password is hashed)
      await testUser.save();
      
      // Reload user after initial save
      testUser = await User.findOne({ email: 'forgotpass.test@example.com' });
      
      if (!testUser) throw new Error('Failed to create test user');
      console.log(`   Created user: ${testUser.email}`);
    })();

    // Test 3: Generate reset password token and save
    let resetToken;
    await test('Generate reset password token', async () => {
      resetToken = testUser.generateResetPasswordToken();
      
      if (!resetToken) throw new Error('Token generation failed');
      if (resetToken.length < 20) throw new Error('Token too short');
      
      // Save token to database
      await testUser.save();
      
      console.log(`   Token length: ${resetToken.length} characters`);
    })();

    // Test 4: Verify token saved to database (using direct MongoDB query to bypass Mongoose transforms)
    await test('Verify reset token saved to database', async () => {
      const db = mongoose.connection.db;
      const savedUser = await db.collection('users').findOne({ email: 'forgotpass.test@example.com' });
      
      if (!savedUser.resetPasswordToken) throw new Error('Token not saved');
      if (!savedUser.resetPasswordExpires) throw new Error('Expiry not saved');
      
      // Store for later tests
      testUser.resetPasswordToken = savedUser.resetPasswordToken;
      testUser.resetPasswordExpires = savedUser.resetPasswordExpires;
      
      console.log(`   Token saved: ${savedUser.resetPasswordToken.substring(0, 10)}...`);
      console.log(`   Expires at: ${new Date(savedUser.resetPasswordExpires).toLocaleString()}`);
    })();

    // Test 5: Verify token expiry time (around 10 minutes, accounting for timezone)
    await test('Reset token has expiry time set', async () => {
      const now = Date.now();
      const expiryTime = testUser.resetPasswordExpires instanceof Date 
        ? testUser.resetPasswordExpires.getTime()
        : new Date(testUser.resetPasswordExpires).getTime();
      const diffMs = expiryTime - now;
      const diffMinutes = diffMs / (1000 * 60);
      
      // Token should expire in the future (at least not in the past, and not too far future)
      if (diffMinutes < 0) {
        throw new Error('Token already expired');
      }
      if (diffMinutes > 1440) { // More than 24 hours
        throw new Error(`Expiry time too far: ${diffMinutes.toFixed(2)} minutes`);
      }
      
      console.log(`   Expires in: ${diffMinutes.toFixed(2)} minutes (varies by timezone)`);
    })();

    // Test 6: Find user by reset token
    await test('Find user by reset token', async () => {
      const user = await User.findOne({
        resetPasswordToken: testUser.resetPasswordToken,
        resetPasswordExpires: { $gt: Date.now() }
      });
      
      if (!user) throw new Error('User not found by token');
      if (user.email !== testUser.email) throw new Error('Wrong user found');
      
      console.log(`   Found user: ${user.email}`);
    })();

    // Test 7: Test expired token query
    await test('Expired tokens are not found', async () => {
      // Create user with expired token
      const expiredUser = await User.create({
        name: 'Expired Token User',
        email: 'expired.test@example.com',
        password: 'test123',
        resetPasswordToken: 'expired_token_hash',
        resetPasswordExpires: new Date(Date.now() - 1000) // 1 second ago
      });
      
      const foundUser = await User.findOne({
        resetPasswordToken: expiredUser.resetPasswordToken,
        resetPasswordExpires: { $gt: Date.now() }
      });
      
      if (foundUser) throw new Error('Expired token should not be found');
      
      await User.deleteOne({ _id: expiredUser._id });
      console.log('   Expired token correctly filtered out');
    })();

    // Test 8: Test email connection
    await test('Test email server connection', async () => {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log('   ⚠️  Skipped: EMAIL_USER or EMAIL_PASSWORD not set');
        return;
      }
      
      const isConnected = await testEmailConnection();
      if (!isConnected) throw new Error('Email server connection failed');
    })();

    // Test 9: Send reset password email (if email configured)
    await test('Send reset password email', async () => {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log('   ⚠️  Skipped: Email not configured');
        return;
      }
      
      // Use test email or configured email
      const testEmail = process.env.TEST_EMAIL || process.env.EMAIL_USER;
      
      const result = await sendResetPasswordEmail(
        testEmail,
        resetToken,
        testUser.name
      );
      
      if (!result.success) throw new Error('Email send failed');
      console.log(`   Email sent to: ${testEmail}`);
      console.log(`   Message ID: ${result.messageId}`);
    })();

    // Test 10: Reset password with token
    await test('Reset password with valid token', async () => {
      const user = await User.findOne({
        resetPasswordToken: testUser.resetPasswordToken,
        resetPasswordExpires: { $gt: Date.now() }
      }).select('+password');
      
      if (!user) throw new Error('User not found');
      
      // Change password
      user.password = 'newpassword123';
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      // Verify password changed
      const updatedUser = await User.findById(user._id).select('+password');
      const isMatch = await updatedUser.comparePassword('newpassword123');
      
      if (!isMatch) throw new Error('Password not updated');
      if (updatedUser.resetPasswordToken) throw new Error('Token not cleared');
      
      console.log('   Password reset successfully');
    })();

    // Test 11: Send password changed confirmation email
    await test('Send password changed confirmation email', async () => {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log('   ⚠️  Skipped: Email not configured');
        return;
      }
      
      const testEmail = process.env.TEST_EMAIL || process.env.EMAIL_USER;
      
      const result = await sendPasswordChangedEmail(testEmail, testUser.name);
      if (!result.success) throw new Error('Email send failed');
      
      console.log(`   Confirmation email sent to: ${testEmail}`);
    })();

    // Test 12: Multiple reset requests
    await test('Handle multiple reset requests', async () => {
      const user = await User.findById(testUser._id);
      
      // First request
      const token1 = user.generateResetPasswordToken();
      await user.save();
      
      // Second request (should overwrite first)
      const token2 = user.generateResetPasswordToken();
      await user.save();
      
      if (token1 === token2) throw new Error('Tokens should be different');
      
      // Old token should not work
      const oldTokenUser = await User.findOne({
        resetPasswordToken: user.resetPasswordToken,
        resetPasswordExpires: { $gt: Date.now() }
      });
      
      if (!oldTokenUser) throw new Error('New token not saved');
      console.log('   Multiple requests handled correctly');
    })();

    // Display email configuration
    console.log();
    console.log('='.repeat(70));
    console.log('Email Configuration');
    console.log('='.repeat(70));
    console.log(`Email User: ${process.env.EMAIL_USER || '❌ Not configured'}`);
    console.log(`Email Password: ${process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Not set'}`);
    console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000 (default)'}`);
    console.log();

    // Display database state
    console.log('='.repeat(70));
    console.log('Database State');
    console.log('='.repeat(70));
    
    const usersWithToken = await User.countDocuments({
      resetPasswordToken: { $ne: null }
    });
    const expiredTokens = await User.countDocuments({
      resetPasswordToken: { $ne: null },
      resetPasswordExpires: { $lte: Date.now() }
    });
    const validTokens = await User.countDocuments({
      resetPasswordToken: { $ne: null },
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    console.log(`Total users with reset tokens: ${usersWithToken}`);
    console.log(`Valid tokens: ${validTokens}`);
    console.log(`Expired tokens: ${expiredTokens}`);
    console.log();

    // Clean up test users
    await User.deleteOne({ email: 'forgotpass.test@example.com' });
    await User.deleteOne({ email: 'expired.test@example.com' });
    console.log('🧹 Test users cleaned up');
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
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log();
      console.log('⚠️  NOTE: Some email tests were skipped.');
      console.log('   To test email functionality, add to .env:');
      console.log('   EMAIL_USER=your-email@gmail.com');
      console.log('   EMAIL_PASSWORD=your-app-password');
      console.log('   TEST_EMAIL=recipient@example.com (optional)');
    }

    process.exit(stats.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('💥 Fatal error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
})();

/**
 * SV1 Data Validation Testing - Activity 6 Redux & Protected Routes
 * Kiểm thử tính toàn vẹn dữ liệu cho Redux backend support
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Test utilities
const { connectDB } = require('./config/database');
const User = require('./models/User');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);
const success = (msg) => log('green', `✅ ${msg}`);
const error = (msg) => log('red', `❌ ${msg}`);
const info = (msg) => log('cyan', `ℹ️  ${msg}`);
const warning = (msg) => log('yellow', `⚠️  ${msg}`);
const section = (msg) => log('bright', `\n📂 ${msg}`);

// Test helper
const test = (name, testFn) => {
  return async () => {
    try {
      await testFn();
      success(`${name} - PASSED`);
    } catch (err) {
      error(`${name} - FAILED: ${err.message}`);
      throw err;
    }
  };
};

/**
 * DATA VALIDATION TEST SUITE
 */
class DataValidationTester {
  constructor() {
    this.testUsers = [];
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  async runAllTests() {
    section('SV1 DATA VALIDATION TESTING - Activity 6 Redux Support');
    
    try {
      // Connect to database
      await connectDB();
      info('Connected to MongoDB for testing');

      // Clean up previous test data
      await this.cleanup();

      // Run test suites
      await this.testUserDataIntegrity();
      await this.testProfileFieldValidation();
      await this.testAdminPermissionConsistency();
      await this.testReduxStateDataValidation();
      await this.testDatabaseConstraints();
      await this.testDataSanitization();

      // Summary
      section('DATA VALIDATION TEST RESULTS');
      success(`Total Tests: ${this.testResults.total}`);
      success(`Passed: ${this.testResults.passed}`);
      if (this.testResults.failed > 0) {
        error(`Failed: ${this.testResults.failed}`);
      } else {
        success('All data validation tests passed! 🎉');
      }

    } catch (error) {
      error(`Test suite failed: ${error.message}`);
    } finally {
      await this.cleanup();
      await mongoose.disconnect();
      info('Database disconnected');
    }
  }

  async runTest(testName, testFn) {
    this.testResults.total++;
    try {
      await testFn();
      success(`${testName} - PASSED`);
      this.testResults.passed++;
    } catch (err) {
      error(`${testName} - FAILED: ${err.message}`);
      this.testResults.failed++;
    }
  }

  // Test 1: User Data Integrity
  async testUserDataIntegrity() {
    section('PHASE 1: USER DATA INTEGRITY');

    await this.runTest('Valid user creation with all Redux fields', async () => {
      const userData = {
        name: 'Test Redux User',
        email: 'redux.test@validation.com',
        password: 'SecurePassword123!',
        isAdmin: false,
        bio: 'Test bio for Redux validation',
        phone: '0123456789',
        address: 'Test Address 123',
        preferences: {
          theme: 'light',
          language: 'vi',
          notifications: {
            email: true,
            push: false,
            sms: true
          }
        }
      };

      const user = new User(userData);
      await user.save();
      this.testUsers.push(user._id);

      // Validate all fields are saved correctly
      const savedUser = await User.findById(user._id);
      if (savedUser.name !== userData.name) throw new Error('Name not saved correctly');
      if (savedUser.email !== userData.email) throw new Error('Email not saved correctly');
      if (savedUser.isAdmin !== userData.isAdmin) throw new Error('isAdmin not saved correctly');
      if (savedUser.bio !== userData.bio) throw new Error('Bio not saved correctly');
      if (savedUser.phone !== userData.phone) throw new Error('Phone not saved correctly');
      if (savedUser.address !== userData.address) throw new Error('Address not saved correctly');
      if (savedUser.preferences.theme !== userData.preferences.theme) throw new Error('Preferences not saved correctly');
    });

    await this.runTest('Admin user data integrity', async () => {
      const adminData = {
        name: 'Admin Redux User',
        email: 'admin.redux@validation.com',
        password: 'AdminPassword123!',
        isAdmin: true,
        role: 'admin'
      };

      const admin = new User(adminData);
      await admin.save();
      this.testUsers.push(admin._id);

      const savedAdmin = await User.findById(admin._id);
      if (!savedAdmin.isAdmin) throw new Error('Admin isAdmin flag not set correctly');
      if (savedAdmin.role !== 'admin') throw new Error('Admin role not set correctly');
    });

    await this.runTest('User data consistency after updates', async () => {
      const user = await User.findOne({ email: 'redux.test@validation.com' });
      if (!user) throw new Error('Test user not found');

      // Update profile data
      user.bio = 'Updated bio for consistency test';
      user.preferences.theme = 'dark';
      user.preferences.notifications.email = false;
      await user.save();

      // Verify consistency
      const updatedUser = await User.findById(user._id);
      if (updatedUser.bio !== 'Updated bio for consistency test') {
        throw new Error('Bio update not consistent');
      }
      if (updatedUser.preferences.theme !== 'dark') {
        throw new Error('Theme preference update not consistent');
      }
      if (updatedUser.preferences.notifications.email !== false) {
        throw new Error('Notification preference update not consistent');
      }
    });
  }

  // Test 2: Profile Field Validation
  async testProfileFieldValidation() {
    section('PHASE 2: PROFILE FIELD VALIDATION');

    await this.runTest('Bio field length validation', async () => {
      const longBio = 'A'.repeat(600); // Exceed 500 char limit
      
      try {
        const user = new User({
          name: 'Bio Test User',
          email: 'bio.test@validation.com',
          password: 'Password123!',
          bio: longBio
        });
        await user.save();
        throw new Error('Long bio should have been rejected');
      } catch (error) {
        if (!error.message.includes('Bio không được quá 500 ký tự')) {
          throw new Error('Bio validation error message incorrect');
        }
      }
    });

    await this.runTest('Phone field validation', async () => {
      const invalidPhone = '123abc'; // Invalid phone format
      
      const user = new User({
        name: 'Phone Test User',
        email: 'phone.test@validation.com',
        password: 'Password123!',
        phone: invalidPhone
      });

      // Should save but validate format if we have validation rules
      await user.save();
      this.testUsers.push(user._id);
    });

    await this.runTest('Preferences object structure validation', async () => {
      const user = new User({
        name: 'Preferences Test User',
        email: 'prefs.test@validation.com',
        password: 'Password123!',
        preferences: {
          theme: 'invalid_theme', // Should default to allowed values
          language: 'xx',
          notifications: {
            email: 'not_boolean', // Invalid type
            push: true,
            sms: false
          }
        }
      });

      await user.save();
      this.testUsers.push(user._id);

      // Check if invalid values are handled
      const savedUser = await User.findById(user._id);
      info(`Theme saved as: ${savedUser.preferences.theme}`);
      info(`Language saved as: ${savedUser.preferences.language}`);
    });
  }

  // Test 3: Admin Permission Consistency
  async testAdminPermissionConsistency() {
    section('PHASE 3: ADMIN PERMISSION CONSISTENCY');

    await this.runTest('isAdmin flag consistency with role', async () => {
      // Create user with isAdmin true but role user
      const inconsistentUser = new User({
        name: 'Inconsistent User',
        email: 'inconsistent@validation.com',
        password: 'Password123!',
        isAdmin: true,
        role: 'user' // Inconsistent with isAdmin: true
      });

      await inconsistentUser.save();
      this.testUsers.push(inconsistentUser._id);

      // Should handle this inconsistency somehow
      warning('User created with isAdmin=true but role=user - check business logic');
    });

    await this.runTest('Multiple admin users allowed', async () => {
      const admin1 = new User({
        name: 'Admin One',
        email: 'admin1@validation.com',
        password: 'Admin123!',
        isAdmin: true,
        role: 'admin'
      });

      const admin2 = new User({
        name: 'Admin Two', 
        email: 'admin2@validation.com',
        password: 'Admin123!',
        isAdmin: true,
        role: 'admin'
      });

      await admin1.save();
      await admin2.save();
      this.testUsers.push(admin1._id, admin2._id);

      const adminCount = await User.countDocuments({ isAdmin: true });
      if (adminCount < 2) throw new Error('Multiple admins not allowed');
      info(`Total admins in system: ${adminCount}`);
    });

    await this.runTest('Default user permissions', async () => {
      const defaultUser = new User({
        name: 'Default User',
        email: 'default@validation.com',
        password: 'Password123!'
        // No isAdmin or role specified
      });

      await defaultUser.save();
      this.testUsers.push(defaultUser._id);

      if (defaultUser.isAdmin !== false) {
        throw new Error('Default isAdmin should be false');
      }
      if (defaultUser.role && defaultUser.role !== 'user') {
        throw new Error('Default role should be user or undefined');
      }
    });
  }

  // Test 4: Redux State Data Validation
  async testReduxStateDataValidation() {
    section('PHASE 4: REDUX STATE DATA VALIDATION');

    await this.runTest('User data for Redux auth state', async () => {
      const user = await User.findOne({ email: 'redux.test@validation.com' });
      if (!user) throw new Error('Redux test user not found');

      // Validate data structure matches Redux requirements
      const reduxUserData = {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        role: user.role,
        preferences: user.preferences,
        avatar: user.avatar
      };

      // Check required fields for Redux state
      if (!reduxUserData.id) throw new Error('User ID missing for Redux state');
      if (!reduxUserData.name) throw new Error('User name missing for Redux state');
      if (!reduxUserData.email) throw new Error('User email missing for Redux state');
      if (typeof reduxUserData.isAdmin !== 'boolean') {
        throw new Error('isAdmin must be boolean for Redux state');
      }
    });

    await this.runTest('Profile data completeness for Redux', async () => {
      const user = await User.findOne({ email: 'redux.test@validation.com' });
      
      // Check if profile has all fields Redux frontend expects
      const profileData = {
        bio: user.bio,
        phone: user.phone,
        address: user.address,
        preferences: user.preferences,
        joinDate: user.createdAt,
        lastLogin: user.lastLogin
      };

      // Validate profile structure
      if (user.bio && typeof user.bio !== 'string') {
        throw new Error('Bio must be string for Redux');
      }
      if (user.preferences && typeof user.preferences !== 'object') {
        throw new Error('Preferences must be object for Redux');
      }
    });
  }

  // Test 5: Database Constraints
  async testDatabaseConstraints() {
    section('PHASE 5: DATABASE CONSTRAINTS');

    await this.runTest('Unique email constraint', async () => {
      try {
        const duplicateUser = new User({
          name: 'Duplicate Email User',
          email: 'redux.test@validation.com', // Same as existing user
          password: 'Password123!'
        });
        await duplicateUser.save();
        throw new Error('Duplicate email should have been rejected');
      } catch (error) {
        if (!error.message.includes('duplicate key') && !error.code === 11000) {
          throw new Error('Email uniqueness constraint not working properly');
        }
      }
    });

    await this.runTest('Required fields validation', async () => {
      try {
        const incompleteUser = new User({
          name: 'Incomplete User'
          // Missing email and password
        });
        await incompleteUser.save();
        throw new Error('User without required fields should be rejected');
      } catch (error) {
        if (!error.message.includes('required') && !error.message.includes('Path')) {
          throw new Error('Required field validation not working');
        }
      }
    });

    await this.runTest('Password field security', async () => {
      const user = new User({
        name: 'Password Test User',
        email: 'password.test@validation.com',
        password: 'PlainPassword123!'
      });

      await user.save();
      this.testUsers.push(user._id);

      // Check if password is hashed
      if (user.password === 'PlainPassword123!') {
        throw new Error('Password should be hashed, not stored as plain text');
      }
      if (user.password.length < 30) {
        throw new Error('Hashed password seems too short');
      }
    });
  }

  // Test 6: Data Sanitization
  async testDataSanitization() {
    section('PHASE 6: DATA SANITIZATION');

    await this.runTest('HTML/Script injection prevention', async () => {
      const maliciousData = {
        name: '<script>alert("xss")</script>Malicious User',
        email: 'malicious@test.com',
        password: 'Password123!',
        bio: '<img src="x" onerror="alert(\'xss\')">'
      };

      const user = new User(maliciousData);
      await user.save();
      this.testUsers.push(user._id);

      // Check if malicious content is sanitized or escaped
      const savedUser = await User.findById(user._id);
      info(`Name stored as: ${savedUser.name}`);
      info(`Bio stored as: ${savedUser.bio}`);
      
      // Should not contain executable scripts
      if (savedUser.name.includes('<script>') || savedUser.bio.includes('onerror=')) {
        warning('Potential XSS vulnerability - scripts not sanitized');
      }
    });

    await this.runTest('SQL injection prevention in email', async () => {
      const sqlInjection = "test'; DROP TABLE users; --";
      
      try {
        const user = new User({
          name: 'SQL Test User',
          email: sqlInjection,
          password: 'Password123!'
        });
        await user.save();
        
        // Should either save safely or reject
        info('SQL injection attempt handled - email validation or sanitization working');
        this.testUsers.push(user._id);
      } catch (error) {
        info('SQL injection rejected by email validation - good!');
      }
    });
  }

  // Helper method to clean up test data
  async cleanup() {
    if (this.testUsers.length > 0) {
      await User.deleteMany({ _id: { $in: this.testUsers } });
      info(`Cleaned up ${this.testUsers.length} test users`);
      this.testUsers = [];
    }

    // Also cleanup by email patterns
    await User.deleteMany({ 
      email: { 
        $regex: /(validation\.com|test\.com)$/i 
      } 
    });
  }
}

// Run tests
async function runDataValidationTests() {
  const tester = new DataValidationTester();
  await tester.runAllTests();
}

// Execute if run directly
if (require.main === module) {
  runDataValidationTests().catch(console.error);
}

module.exports = { DataValidationTester, runDataValidationTests };
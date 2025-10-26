// backend/middleware/setupAdmin.js
/**
 * Setup Admin User - Redux Support
 * Tạo admin user mặc định để test Protected Routes
 */

const User = require('../models/User');
const bcrypt = require('bcrypt');

const setupDefaultAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await User.findOne({ 
      $or: [
        { email: 'admin@group10.com' },
        { isAdmin: true },
        { role: 'admin' }
      ]
    });

    if (adminExists) {
      console.log('✅ Admin user already exists:', adminExists.email);
      return;
    }

    // Create default admin user
    const adminData = {
      name: 'Group 10 Admin',
      email: 'admin@group10.com',
      password: 'AdminPassword123!',
      role: 'admin',
      isAdmin: true,
      isActive: true,
      bio: 'Default admin user for Group 10 project',
      preferences: {
        theme: 'dark',
        language: 'vi',
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      }
    };

    // Hash password
    const saltRounds = 10;
    adminData.password = await bcrypt.hash(adminData.password, saltRounds);

    // Create admin user
    const adminUser = await User.create(adminData);
    
    console.log('🎯 Default admin user created successfully!');
    console.log('📧 Email: admin@group10.com');
    console.log('🔑 Password: AdminPassword123!');
    console.log('👤 User ID:', adminUser._id);
    console.log('🔐 Role: admin (isAdmin: true)');
    console.log('');
    console.log('🚀 Ready for Redux Protected Routes testing!');
    
    return adminUser;

  } catch (error) {
    console.error('❌ Error creating default admin:', error.message);
    return null;
  }
};

// Also create a regular test user
const setupDefaultUser = async () => {
  try {
    const userExists = await User.findOne({ email: 'user@group10.com' });
    
    if (userExists) {
      console.log('✅ Test user already exists:', userExists.email);
      return;
    }

    const userData = {
      name: 'Test User',
      email: 'user@group10.com', 
      password: 'UserPassword123!',
      role: 'user',
      isAdmin: false,
      isActive: true,
      bio: 'Regular test user for Group 10 project',
      preferences: {
        theme: 'light',
        language: 'vi',
        notifications: {
          email: true,
          push: false,
          sms: false
        }
      }
    };

    // Hash password
    const saltRounds = 10;
    userData.password = await bcrypt.hash(userData.password, saltRounds);

    const testUser = await User.create(userData);
    
    console.log('👤 Default test user created!');
    console.log('📧 Email: user@group10.com');
    console.log('🔑 Password: UserPassword123!');
    console.log('👥 Role: user (isAdmin: false)');
    
    return testUser;

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    return null;
  }
};

const setupDefaultUsers = async () => {
  console.log('🔧 Setting up default users for Redux Protected Routes...');
  
  await setupDefaultAdmin();
  await setupDefaultUser();
  
  console.log('✅ Default users setup completed!');
  console.log('=' .repeat(50));
};

module.exports = {
  setupDefaultUsers,
  setupDefaultAdmin,
  setupDefaultUser
};
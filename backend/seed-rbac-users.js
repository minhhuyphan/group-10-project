/**
 * RBAC Seed Data Script
 * Creates sample users with different roles: admin, moderator, user
 * Author: SV3 - Database & Integration
 */

require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

// Sample users with different roles
const sampleUsers = [
  // Admin users
  {
    name: 'Super Admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin',
    permissions: [], // Admin has all permissions by default
    age: 30,
  },
  {
    name: 'Admin Two',
    email: 'admin2@example.com',
    password: 'admin123',
    role: 'admin',
    permissions: [],
    age: 28,
  },
  
  // Moderator users
  {
    name: 'Content Moderator',
    email: 'moderator.content@example.com',
    password: 'mod123',
    role: 'moderator',
    department: 'Content',
    permissions: ['read', 'write', 'manage_content'],
    age: 26,
  },
  {
    name: 'User Support Moderator',
    email: 'moderator.support@example.com',
    password: 'mod123',
    role: 'moderator',
    department: 'Support',
    permissions: ['read', 'write', 'manage_users'],
    age: 25,
  },
  {
    name: 'Community Moderator',
    email: 'moderator.community@example.com',
    password: 'mod123',
    role: 'moderator',
    department: 'Community',
    permissions: ['read', 'write', 'manage_content'],
    age: 24,
  },
  
  // Regular users
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'user123',
    role: 'user',
    permissions: ['read'],
    age: 22,
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    password: 'user123',
    role: 'user',
    permissions: ['read', 'write'],
    age: 23,
  },
  {
    name: 'Bob Wilson',
    email: 'bob.wilson@example.com',
    password: 'user123',
    role: 'user',
    permissions: ['read'],
    age: 21,
  },
  {
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    password: 'user123',
    role: 'user',
    permissions: ['read', 'write'],
    age: 24,
  },
  {
    name: 'Test User',
    email: 'test.user@example.com',
    password: 'user123',
    role: 'user',
    permissions: ['read'],
    age: 20,
  }
];

(async () => {
  console.log('='.repeat(70));
  console.log('RBAC Seed Data Script - SV3');
  console.log('='.repeat(70));
  console.log();

  if (!MONGO_URI) {
    console.error('❌ MONGO_URI not set in environment');
    process.exit(1);
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('🔌 Connected to MongoDB');
    console.log(`📦 Database: ${mongoose.connection.db.databaseName}`);
    console.log();

    // Ask user if they want to clear existing data
    console.log('📋 Sample Users to Create:');
    console.log('-'.repeat(70));
    
    const roleCount = {
      admin: sampleUsers.filter(u => u.role === 'admin').length,
      moderator: sampleUsers.filter(u => u.role === 'moderator').length,
      user: sampleUsers.filter(u => u.role === 'user').length
    };
    
    console.log(`  Admin: ${roleCount.admin} users`);
    console.log(`  Moderator: ${roleCount.moderator} users`);
    console.log(`  User: ${roleCount.user} users`);
    console.log(`  Total: ${sampleUsers.length} users`);
    console.log();

    // Create users
    let created = 0;
    let skipped = 0;
    let errors = 0;

    console.log('🔄 Creating users...');
    console.log('-'.repeat(70));

    for (const userData of sampleUsers) {
      try {
        // Check if user already exists
        const existing = await User.findOne({ email: userData.email });
        
        if (existing) {
          console.log(`⏭️  Skipped: ${userData.email} (already exists)`);
          skipped++;
          continue;
        }

        // Create new user
        const user = await User.create(userData);
        console.log(`✅ Created: ${user.email} (${user.role}${user.department ? ' - ' + user.department : ''})`);
        created++;
        
      } catch (error) {
        console.error(`❌ Error creating ${userData.email}: ${error.message}`);
        errors++;
      }
    }

    console.log();
    console.log('='.repeat(70));
    console.log('Summary');
    console.log('='.repeat(70));
    console.log(`✅ Created: ${created} users`);
    console.log(`⏭️  Skipped: ${skipped} users (already exist)`);
    console.log(`❌ Errors: ${errors} users`);
    console.log('='.repeat(70));
    console.log();

    // Display role distribution
    const counts = await User.countByRole();
    console.log('📊 Current User Distribution:');
    console.log('-'.repeat(70));
    counts.forEach(item => {
      console.log(`  ${item._id}: ${item.count} users`);
    });
    console.log();

    // Display sample login credentials
    if (created > 0) {
      console.log('🔐 Sample Login Credentials:');
      console.log('-'.repeat(70));
      console.log('  Admin:');
      console.log('    Email: admin@example.com');
      console.log('    Password: admin123');
      console.log();
      console.log('  Moderator:');
      console.log('    Email: moderator.content@example.com');
      console.log('    Password: mod123');
      console.log();
      console.log('  User:');
      console.log('    Email: john.doe@example.com');
      console.log('    Password: user123');
      console.log('='.repeat(70));
      console.log();
    }

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    console.log('✨ Seed completed successfully!');

  } catch (error) {
    console.error('💥 Fatal error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
})();

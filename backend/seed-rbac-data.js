// backend/seed-rbac-data.js
// Script để tạo dữ liệu mẫu cho RBAC testing

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rbac_demo');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Sample users with different roles
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin',
    age: 30,
    isActive: true
  },
  {
    name: 'Moderator User',
    email: 'moderator@test.com',
    password: 'mod123',
    role: 'moderator',
    age: 28,
    isActive: true
  },
  {
    name: 'Regular User 1',
    email: 'user1@test.com',
    password: 'user123',
    role: 'user',
    age: 25,
    isActive: true
  },
  {
    name: 'Regular User 2',
    email: 'user2@test.com',
    password: 'user123',
    role: 'user',
    age: 27,
    isActive: true
  },
  {
    name: 'Inactive User',
    email: 'inactive@test.com',
    password: 'inactive123',
    role: 'user',
    age: 24,
    isActive: false
  }
];

const seedData = async () => {
  try {
    console.log('🌱 Starting to seed RBAC data...');

    // Clear existing users (optional - comment out if you want to keep existing data)
    // await User.deleteMany({});
    // console.log('🗑️  Cleared existing users');

    for (const userData of sampleUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const user = new User({
        ...userData,
        password: hashedPassword
      });

      await user.save();
      console.log(`✅ Created ${userData.role}: ${userData.email}`);
    }

    console.log('\n🎉 RBAC data seeding completed!');
    console.log('\n📋 Test Accounts Created:');
    console.log('Admin: admin@test.com / admin123');
    console.log('Moderator: moderator@test.com / mod123');
    console.log('User 1: user1@test.com / user123');
    console.log('User 2: user2@test.com / user123');
    console.log('Inactive: inactive@test.com / inactive123');
    console.log('\n🔗 Test the RBAC APIs:');
    console.log('1. Login with different accounts');
    console.log('2. Test GET /api/rbac/me');
    console.log('3. Test GET /api/rbac/users (different results based on role)');
    console.log('4. Test GET /api/rbac/stats (admin/moderator only)');
    console.log('5. Test PUT /api/rbac/users/:id/role (admin only)');
    console.log('6. Test PUT /api/rbac/users/:id/status (admin/moderator only)');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📪 Database connection closed');
  }
};

// Run the seeding
const runSeed = async () => {
  await connectDB();
  await seedData();
};

// Check if script is run directly
if (require.main === module) {
  runSeed();
}

module.exports = { seedData, connectDB };
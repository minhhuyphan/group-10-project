// Simple test script to validate RefreshToken model saving/reading/revoking
require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');
const RefreshToken = require('./models/RefreshToken');
const crypto = require('crypto');

const MONGO_URI = process.env.MONGO_URI;

(async () => {
  if (!MONGO_URI) {
    console.error('MONGO_URI not set in environment. Set it in backend/.env or environment variables.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI, { });
  console.log('Connected to MongoDB');

  // Ensure a test user exists
  let user = await User.findOne({ email: 'refresh-test@example.com' });
  if (!user) {
    user = new User({ name: 'Refresh Test', email: 'refresh-test@example.com', password: 'password123' });
    await user.save();
    console.log('Created test user:', user.email);
  } else {
    console.log('Found existing test user:', user.email);
  }

  // Create a refresh token
  const tokenPlain = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
  const rt = await RefreshToken.create({ token: tokenPlain, userId: user._id, expiresAt, createdByIp: '127.0.0.1' });
  console.log('Saved refresh token id:', rt._id.toString());

  // Read back
  const found = await RefreshToken.findOne({ token: tokenPlain });
  console.log('Found token active?', found.isActive);

  // Revoke
  found.revokedAt = new Date();
  found.revokedByIp = '127.0.0.1';
  await found.save();
  console.log('Token revoked');

  // Verify revoked
  const found2 = await RefreshToken.findById(found._id);
  console.log('Is active after revoke?', found2.isActive);

  // Cleanup: delete test token
  await RefreshToken.deleteOne({ _id: found2._id });
  console.log('Deleted test token');

  // Optionally delete the test user
  // await User.deleteOne({ _id: user._id });

  await mongoose.disconnect();
  console.log('Disconnected. Test complete.');
  process.exit(0);
})();
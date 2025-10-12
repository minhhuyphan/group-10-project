const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

// Helper to generate JWT token
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || JWT_SECRET;
  if (!secret) throw new Error('JWT secret is not configured');
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id }, secret, { expiresIn });
};

// Signup
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing name/email/password' });

    const exist = await User.findOne({ email: email.toLowerCase() });
    if (exist) return res.status(409).json({ message: 'Email already in use' });

    // Using create triggers pre-save hooks which hash the password
    const user = await User.create({ name, email: email.toLowerCase(), password });
    const token = generateToken(user._id);

    res.status(201).json({ message: 'User created', token, user: user.profile });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing email/password' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user._id);
    res.json({ message: 'Login successful', token, user: user.profile });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
};

// Forgot password - generate reset token and optionally return it in debug
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
    if (!user) return res.json({ message: 'If email exists, a reset token was created', success: true });

    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const debugReturn = process.env.DEBUG_RETURN_RESET_TOKEN === 'true' || process.env.NODE_ENV === 'development';
    const payload = { message: 'Reset token created', success: true };
    if (debugReturn) payload.resetToken = resetToken;
    res.json(payload);
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
};

// Reset password with token
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'Token and newPassword required' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password too short' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpires: { $gt: Date.now() }, isActive: true });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.loginAttempts = undefined;
    user.lockUntil = undefined;

    await user.save();
    res.json({ message: 'Password reset successful', success: true });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
};

// Upload avatar (accepts data URL base64 and saves to user's avatarData/avatarMime)
exports.uploadAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ message: 'Avatar is required' });

    // req.user may not be present; accept userId fallback
    const userId = (req.user && req.user._id) || req.body.userId;
    if (!userId) return res.status(401).json({ message: 'Authentication required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // If data URL
    if (typeof avatar === 'string' && avatar.startsWith('data:')) {
      const matches = avatar.match(/^data:(.+);base64,(.*)$/);
      if (!matches) return res.status(400).json({ message: 'Invalid data URL' });
      const mime = matches[1];
      const b64 = matches[2];
      user.avatarData = Buffer.from(b64, 'base64');
      user.avatarMime = mime;
      user.avatar = null;
      await user.save();
      return res.json({ message: 'Avatar uploaded', success: true, user: user.profile });
    }

    // Plain URL
    user.avatar = avatar;
    user.avatarData = undefined;
    user.avatarMime = undefined;
    await user.save();
    return res.json({ message: 'Avatar updated', success: true, user: user.profile });
  } catch (err) {
    console.error('Upload avatar error:', err);
    return res.status(500).json({ message: err.message || 'Internal server error' });
  }
};

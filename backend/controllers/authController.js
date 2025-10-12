const User = require('../models/User');
frontend
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const SALT_ROUNDS = 10;

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing name/email/password' });
    }

    // Check existing
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const user = new User({ name, email, password: hashed });
    await user.save();

    // Do not send password back
    const userSafe = { id: user._id, name: user.name, email: user.email, role: user.role };

    res.status(201).json({ message: 'User created', user: userSafe });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing email/password' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password || '');
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ sub: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const userSafe = { id: user._id, name: user.name, email: user.email, role: user.role };
    res.json({ token, user: userSafe });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Hàm tạo token
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // throw a helpful error so server logs show why signing fails
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  // Support multiple env var names and provide a sensible default
  const expiresIn = process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '7d';
  return jwt.sign({ id }, secret, { expiresIn });
};

// Đăng ký
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ message: 'Email đã tồn tại' });

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    // return token and basic user profile for frontend
    res.status(201).json({ message: 'Đăng ký thành công', token, user: user.profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('[login] received for:', email);
    console.log('[login] finding user...');
    // include password field (password has select: false in schema)
    const user = await User.findOne({ email }).select('+password');
    console.log('[login] after findOne, user=', !!user);
    if (!user) {
      console.log('[login] user not found');
      return res.status(400).json({ message: 'Không tìm thấy tài khoản' });
    }

    console.log('[login] comparing password...');
    // use comparePassword() defined on User schema
    const isMatch = await user.comparePassword(password);
    console.log('[login] after compare, isMatch=', isMatch);
    if (!isMatch) {
      console.log('[login] password mismatch');
      return res.status(400).json({ message: 'Sai mật khẩu' });
    }

    console.log('[login] generating token...');
    const token = generateToken(user._id);
    // include user profile so frontend can immediately show user info
    console.log('[login] Login success for:', user.email);
    res.json({ message: 'Đăng nhập thành công', token, user: user.profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Forgot password - generate reset token and return it (for testing)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
    if (!user) {
      return res.json({ message: 'If email exists, a reset token was created', success: true });
    }

    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

  console.log('Reset token generated for:', email);
  // Return the token only in development or when explicitly enabled for debugging
  const debugReturn = process.env.DEBUG_RETURN_RESET_TOKEN === 'true' || process.env.NODE_ENV === 'development';
  const payload = { message: 'Reset token created', success: true };
  if (debugReturn) payload.resetToken = resetToken;
  res.json(payload);
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: err.message });
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
    res.status(500).json({ message: err.message });
  }
};

// Upload avatar (accepts data URL base64 and saves to user's avatarData/avatarMime)
exports.uploadAvatar = async (req, res) => {
  try {
    // Must be authenticated - ensure req.user is set by middleware when this controller is used via protected route
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ message: 'Avatar is required' });

    // Expect data URL
    if (typeof avatar === 'string' && avatar.startsWith('data:')) {
      const matches = avatar.match(/^data:(.+);base64,(.*)$/);
      if (!matches) return res.status(400).json({ message: 'Invalid data URL' });

      const mime = matches[1];
      const b64 = matches[2];
      const buf = Buffer.from(b64, 'base64');

      // req.user may not be present if route isn't protected; require user id from body as fallback
      const userId = (req.user && req.user._id) || req.body.userId;
      if (!userId) return res.status(401).json({ message: 'Authentication required' });

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      user.avatarData = buf;
      user.avatarMime = mime;
      user.avatar = null;
      await user.save();

      return res.json({ message: 'Avatar uploaded', success: true, user: user.profile });
    }

    // If avatar is a plain URL, just save as avatar string
    const userId = (req.user && req.user._id) || req.body.userId;
    if (!userId) return res.status(401).json({ message: 'Authentication required' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.avatar = avatar;
    user.avatarData = undefined;
    user.avatarMime = undefined;
    await user.save();

    return res.json({ message: 'Avatar updated', success: true, user: user.profile });
  } catch (err) {
    console.error('Upload avatar error:', err);
    return res.status(500).json({ message: err.message });
backend
  }
};

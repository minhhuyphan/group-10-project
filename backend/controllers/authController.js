const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const RefreshToken = require('../models/RefreshToken');

// === Helper: Tạo token ===
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || JWT_SECRET;
  if (!secret) throw new Error('JWT secret is not configured');
  const expiresIn = process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '7d';
  return jwt.sign({ id }, secret, { expiresIn });
};

// Create and persist a refresh token for a user. Returns the plain token string.
const createAndSaveRefreshToken = async (userId, ipAddress) => {
  const expiresInSec = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN_SECONDS || 7 * 24 * 60 * 60); // default 7 days
  const { doc, token } = RefreshToken.createToken(userId, expiresInSec);
  if (ipAddress) doc.createdByIp = ipAddress;
  await doc.save();
  return token;
};

// === Đăng ký tài khoản ===
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing name/email/password' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const user = await User.create({ name, email: email.toLowerCase(), password });
    const token = generateToken(user._id);
    const refreshToken = await createAndSaveRefreshToken(user._id, req.ip);

    res.status(201).json({ message: 'Đăng ký thành công', token, refreshToken, user: user.profile });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
};

// === Đăng nhập ===
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing email/password' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(400).json({ message: 'Không tìm thấy tài khoản' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Sai mật khẩu' });

    const token = generateToken(user._id);
    const refreshToken = await createAndSaveRefreshToken(user._id, req.ip);
    res.json({ message: 'Đăng nhập thành công', token, refreshToken, user: user.profile });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
};

// POST /auth/refresh - Rotate refresh token and issue new access token
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

    const hashed = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const stored = await RefreshToken.findOne({ token: hashed }).populate('user');
    if (!stored || !stored.isActive) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // rotate: revoke current and issue a new one
    stored.revoked = new Date();
    stored.revokedByIp = req.ip;

    const newTokenPlain = await createAndSaveRefreshToken(stored.user._id, req.ip);
    stored.replacedByToken = crypto.createHash('sha256').update(newTokenPlain).digest('hex');
    await stored.save();

    const accessToken = generateToken(stored.user._id);
    res.json({ accessToken, refreshToken: newTokenPlain });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
};

// POST /auth/logout - revoke refresh token (client should call with refreshToken)
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

    const hashed = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const stored = await RefreshToken.findOne({ token: hashed });
    if (!stored) return res.json({ message: 'Logged out', success: true });

    stored.revoked = new Date();
    stored.revokedByIp = req.ip;
    await stored.save();

    res.json({ message: 'Logged out', success: true });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
};

// === Quên mật khẩu: tạo reset token ===
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
    if (!user) {
      // tránh lộ thông tin tài khoản tồn tại hay không
      return res.json({ message: 'If email exists, a reset token was created', success: true });
    }

    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const debugReturn =
      process.env.DEBUG_RETURN_RESET_TOKEN === 'true' || process.env.NODE_ENV === 'development';
    const payload = { message: 'Reset token created', success: true };
    if (debugReturn) payload.resetToken = resetToken;

    res.json(payload);
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
};

// === Đặt lại mật khẩu ===
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and newPassword required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
      isActive: true,
    });

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

// === Upload avatar ===
exports.uploadAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ message: 'Avatar is required' });

    const userId = (req.user && req.user._id) || req.body.userId;
    if (!userId) return res.status(401).json({ message: 'Authentication required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Nếu avatar là base64
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

    // Nếu chỉ là URL
    user.avatar = avatar;
    user.avatarData = undefined;
    user.avatarMime = undefined;
    await user.save();

    res.json({ message: 'Avatar updated', success: true, user: user.profile });
  } catch (err) {
    console.error('Upload avatar error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
};

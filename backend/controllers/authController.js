 const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key';

// === Helper: Tạo Access Token ===
const generateAccessToken = (id) => {
  const secret = process.env.JWT_SECRET || JWT_SECRET;
  if (!secret) throw new Error('JWT secret is not configured');
  // Access token có thời gian sống ngắn (15 phút)
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  return jwt.sign({ id }, secret, { expiresIn });
};

// === Helper: Tạo Refresh Token ===
const generateRefreshToken = () => {
  // Tạo random token
  return crypto.randomBytes(40).toString('hex');
};

// === Helper: Lưu Refresh Token vào DB ===
const saveRefreshToken = async (userId, token, ip = null) => {
  // Refresh token có thời gian sống dài (7 ngày)
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const expiresAt = new Date();
  
  // Parse thời gian từ string như '7d', '30d'
  const match = expiresIn.match(/(\d+)([d|h|m])/);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];
    
    if (unit === 'd') {
      expiresAt.setDate(expiresAt.getDate() + value);
    } else if (unit === 'h') {
      expiresAt.setHours(expiresAt.getHours() + value);
    } else if (unit === 'm') {
      expiresAt.setMinutes(expiresAt.getMinutes() + value);
    }
  } else {
    // Default 7 ngày
    expiresAt.setDate(expiresAt.getDate() + 7);
  }

  const refreshToken = await RefreshToken.create({
    token,
    userId,
    expiresAt,
    createdByIp: ip,
  });

  return refreshToken;
};

// Backward compatibility
const generateToken = (id) => {
  return generateAccessToken(id);
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
    
    // Tạo access token và refresh token
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken();
    
    // Lấy IP address
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // Lưu refresh token vào database
    await saveRefreshToken(user._id, refreshToken, ipAddress);

    res.status(201).json({ 
      success: true,
      message: 'Đăng ký thành công', 
      accessToken,
      refreshToken,
      user: user.profile 
    });
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

    // Tạo access token và refresh token
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken();
    
    // Lấy IP address
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    // Lưu refresh token vào database
    await saveRefreshToken(user._id, refreshToken, ipAddress);

    // Cập nhật lastLogin
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    res.json({ 
      success: true,
      message: 'Đăng nhập thành công', 
      accessToken,
      refreshToken,
      user: user.profile 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
};

// === Quên mật khẩu: tạo reset token và gửi email ===
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
    if (!user) {
      // tránh lộ thông tin tài khoản tồn tại hay không
      return res.json({ 
        message: 'Nếu email tồn tại, email đặt lại mật khẩu đã được gửi', 
        success: true 
      });
    }

    // Tạo reset token
    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Kiểm tra xem có gửi email thật không (dựa vào EMAIL_USER và EMAIL_PASS)
    const emailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;
    
    if (emailConfigured) {
      // Gửi email thật
      try {
        await sendPasswordResetEmail(user.email, resetToken, user.name);
        console.log('✅ Password reset email sent to:', user.email);
        
        res.json({ 
          message: 'Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.', 
          success: true 
        });
      } catch (emailError) {
        console.error('❌ Failed to send email:', emailError.message);
        
        // Nếu gửi email thất bại, vẫn return debug token nếu đang ở dev mode
        const debugReturn = process.env.DEBUG_RETURN_RESET_TOKEN === 'true' || 
                           process.env.NODE_ENV === 'development';
        
        if (debugReturn) {
          return res.json({ 
            message: 'Không thể gửi email. Token debug đã được tạo.', 
            success: true,
            resetToken: resetToken,
            error: 'Email sending failed: ' + emailError.message
          });
        }
        
        return res.status(500).json({ 
          message: 'Không thể gửi email. Vui lòng thử lại sau.', 
          success: false 
        });
      }
    } else {
      // Email chưa được config - trả về debug token
      console.warn('⚠️  Email not configured. Returning debug token.');
      const debugReturn = process.env.DEBUG_RETURN_RESET_TOKEN === 'true' || 
                         process.env.NODE_ENV === 'development';
      
      const payload = { 
        message: 'Email chưa được cấu hình. Token debug đã được tạo.', 
        success: true 
      };
      
      if (debugReturn) {
        payload.resetToken = resetToken;
      }
      
      res.json(payload);
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
};

// === Đặt lại mật khẩu ===
exports.resetPassword = async (req, res) => {
  try {
    // Accept token from URL param or body
    const token = req.params.token || req.body.token;
    const { newPassword } = req.body;
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

// ============================================
// REFRESH TOKEN ENDPOINTS
// ============================================

/**
 * POST /auth/refresh
 * Làm mới access token bằng refresh token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Tìm refresh token trong database
    const tokenDoc = await RefreshToken.findOne({ token: refreshToken });

    if (!tokenDoc) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        error: 'TOKEN_NOT_FOUND',
      });
    }

    // Kiểm tra token đã bị revoke chưa
    if (tokenDoc.revokedAt) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has been revoked',
        error: 'TOKEN_REVOKED',
      });
    }

    // Kiểm tra token đã hết hạn chưa
    if (tokenDoc.expiresAt < Date.now()) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired',
        error: 'TOKEN_EXPIRED',
      });
    }

    // Kiểm tra user có tồn tại không
    const user = await User.findById(tokenDoc.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
        error: 'USER_INVALID',
      });
    }

    // Tạo access token mới
    const newAccessToken = generateAccessToken(user._id);

    // Optional: Rotation - tạo refresh token mới và revoke token cũ
    const rotateRefreshToken = process.env.ROTATE_REFRESH_TOKEN === 'true';
    let newRefreshToken = refreshToken;

    if (rotateRefreshToken) {
      // Revoke token cũ
      const ipAddress = req.ip || req.connection.remoteAddress;
      newRefreshToken = generateRefreshToken();
      
      tokenDoc.revokedAt = Date.now();
      tokenDoc.revokedByIp = ipAddress;
      tokenDoc.replacedByToken = newRefreshToken;
      await tokenDoc.save();

      // Tạo token mới
      await saveRefreshToken(user._id, newRefreshToken, ipAddress);
    }

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/**
 * POST /auth/logout
 * Đăng xuất và revoke refresh token
 */
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Tìm và revoke token
    const tokenDoc = await RefreshToken.findOne({ token: refreshToken });

    if (tokenDoc && !tokenDoc.revokedAt) {
      const ipAddress = req.ip || req.connection.remoteAddress;
      tokenDoc.revokedAt = Date.now();
      tokenDoc.revokedByIp = ipAddress;
      await tokenDoc.save();
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/**
 * POST /auth/revoke-token
 * Revoke một refresh token cụ thể (Admin hoặc chính user đó)
 */
exports.revokeToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required',
      });
    }

    const tokenDoc = await RefreshToken.findOne({ token });

    if (!tokenDoc) {
      return res.status(404).json({
        success: false,
        message: 'Token not found',
      });
    }

    // Kiểm tra quyền: chỉ admin hoặc chính user đó mới được revoke
    if (req.user.role !== 'admin' && tokenDoc.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
    }

    if (tokenDoc.revokedAt) {
      return res.status(400).json({
        success: false,
        message: 'Token already revoked',
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    tokenDoc.revokedAt = Date.now();
    tokenDoc.revokedByIp = ipAddress;
    await tokenDoc.save();

    res.json({
      success: true,
      message: 'Token revoked successfully',
    });
  } catch (err) {
    console.error('Revoke token error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

/**
 * GET /auth/tokens
 * Lấy danh sách refresh tokens của user (Protected route)
 */
exports.getUserTokens = async (req, res) => {
  try {
    const userId = req.user._id;

    const tokens = await RefreshToken.find({
      userId,
      expiresAt: { $gt: Date.now() }, // Chỉ lấy token chưa hết hạn
    })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      count: tokens.length,
      tokens: tokens.map((t) => ({
        token: t.token.substring(0, 10) + '...', // Chỉ show một phần token
        createdAt: t.createdAt,
        expiresAt: t.expiresAt,
        isActive: t.isActive,
        revokedAt: t.revokedAt,
        createdByIp: t.createdByIp,
      })),
    });
  } catch (err) {
    console.error('Get user tokens error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
};

// === Validate Reset Token: Kiểm tra token hợp lệ ===
exports.validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required'
      });
    }

    // Hash the token to compare with stored token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reset token is valid',
      email: user.email // Return email for form pre-fill
    });

  } catch (err) {
    console.error('Validate reset token error:', err);
    res.status(500).json({
      success: false,
      message: 'Error validating reset token'
    });
  }
};



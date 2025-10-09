const User = require('../models/User');
const jwt = require('jsonwebtoken');

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

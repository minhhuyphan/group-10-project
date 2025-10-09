const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Hàm tạo token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

// Đăng ký
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ message: 'Email đã tồn tại' });

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    res.status(201).json({ message: 'Đăng ký thành công', token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Không tìm thấy tài khoản' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Sai mật khẩu' });

    const token = generateToken(user._id);
    res.json({ message: 'Đăng nhập thành công', token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

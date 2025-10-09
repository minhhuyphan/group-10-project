const User = require('../models/User');
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
  }
};

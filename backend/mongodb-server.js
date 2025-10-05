require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: "http://localhost:3001" }));
app.use(express.json());

// ========================
//  SCHEMA & MODEL
// ========================
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number, min: 1, max: 150 }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// ========================
//  MOCK DATA (fallback)
// ========================
let isMongoConnected = false;
let mockUsers = [
  { _id: '1', name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', age: 25 },
  { _id: '2', name: 'Trần Thị B', email: 'tranthib@example.com', age: 30 },
  { _id: '3', name: 'Lê Văn C', email: 'levanc@example.com', age: 28 }
];

// ========================
//  ROUTES
// ========================
app.get('/users', async (req, res) => {
  try {
    if (isMongoConnected) {
      const users = await User.find().sort({ createdAt: -1 });
      return res.json(users);
    }
    res.json(mockUsers);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.json(mockUsers);
  }
});

app.post('/users', async (req, res) => {
  try {
    const { name, email, age } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Tên và email là bắt buộc' });

    if (isMongoConnected) {
      const newUser = new User({ name, email, age });
      const saved = await newUser.save();
      return res.status(201).json(saved);
    }

    const exists = mockUsers.find(u => u.email === email);
    if (exists) return res.status(400).json({ message: 'Email đã tồn tại' });

    const mockUser = { _id: (mockUsers.length + 1).toString(), name, email, age };
    mockUsers.push(mockUser);
    res.status(201).json(mockUser);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ message: 'Lỗi khi tạo user', error: err.message });
  }
});

// ========================
//  DATABASE CONNECT
// ========================
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) throw new Error('MONGO_URI not found');

    await mongoose.connect(mongoURI);
    isMongoConnected = true;
    console.log('✅ Connected to MongoDB');

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected — fallback to mock data');
      isMongoConnected = false;
    });
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    isMongoConnected = false;
  }
};

// ========================
//  START SERVER
// ========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await connectDB();
});

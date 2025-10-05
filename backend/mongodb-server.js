require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  age: {
    type: Number,
    min: 1,
    max: 150
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Routes
// GET /users - Lấy danh sách user từ MongoDB hoặc mock data
app.get('/users', async (req, res) => {
  try {
    if (isMongoConnected) {
      console.log('GET /users - Fetching from MongoDB...');
      const users = await User.find().sort({ createdAt: -1 });
      console.log(`Found ${users.length} users from MongoDB`);
      res.json(users);
    } else {
      console.log('GET /users - Using mock data...');
      console.log(`Returning ${mockUsers.length} mock users`);
      res.json(mockUsers);
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    console.log('Falling back to mock data...');
    res.json(mockUsers);
  }
});

// POST /users - Thêm user mới vào MongoDB hoặc mock data
app.post('/users', async (req, res) => {
  try {
    console.log('POST /users - Received data:', req.body);
    
    const { name, email, age } = req.body;
    
    // Validate input
    if (!name || !email) {
      return res.status(400).json({ 
        message: 'Tên và email là bắt buộc',
        error: 'Missing required fields' 
      });
    }
    
    if (isMongoConnected) {
      // Save to MongoDB
      const userData = {
        name: name.trim(),
        email: email.trim()
      };
      
      if (age) {
        userData.age = parseInt(age);
      }
      
      const newUser = new User(userData);
      const savedUser = await newUser.save();
      
      console.log('User saved to MongoDB:', savedUser);
      res.status(201).json(savedUser);
    } else {
      // Save to mock data
      console.log('Saving to mock data...');
      
      // Check if email already exists
      const existingUser = mockUsers.find(user => user.email === email.trim());
      if (existingUser) {
        return res.status(400).json({ 
          message: 'Email đã tồn tại',
          error: 'Email already exists' 
        });
      }
      
      const newMockUser = {
        _id: (mockUsers.length + 1).toString(),
        name: name.trim(),
        email: email.trim(),
        ...(age && { age: parseInt(age) })
      };
      
      mockUsers.push(newMockUser);
      console.log('User saved to mock data:', newMockUser);
      res.status(201).json(newMockUser);
    }
    
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.code === 11000) {
      // Duplicate email error
      return res.status(400).json({ 
        message: 'Email đã tồn tại',
        error: 'Email already exists' 
      });
    }
    
    res.status(400).json({ 
      message: 'Không thể tạo người dùng mới',
      error: error.message 
    });
  }
});

const PORT = 3001;

// Global variable to track MongoDB connection status
let isMongoConnected = false;

// Mock data fallback
let mockUsers = [
  { _id: '1', name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', age: 25 },
  { _id: '2', name: 'Trần Thị B', email: 'tranthib@example.com', age: 30 },
  { _id: '3', name: 'Lê Văn C', email: 'levanc@example.com', age: 28 }
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MONGO_URI not found in environment variables');
    }
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    isMongoConnected = true;
    console.log('✅ Connected to MongoDB successfully!');
    
    // Add some sample data if collection is empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Adding sample data...');
      const sampleUsers = [
        { name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', age: 25 },
        { name: 'Trần Thị B', email: 'tranthib@example.com', age: 30 },
        { name: 'Lê Văn C', email: 'levanc@example.com', age: 28 }
      ];
      await User.insertMany(sampleUsers);
      console.log('✅ Sample data added!');
    }
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('🔄 Falling back to mock data mode');
    isMongoConnected = false;
  }
};

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 MongoDB server is running on port ${PORT}`);
  await connectDB();
});
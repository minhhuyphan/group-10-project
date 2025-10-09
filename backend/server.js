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

// PUT /users/:id - Cập nhật user theo ID
app.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, age } = req.body;
    
    console.log(`PUT /users/${id} - Received data:`, req.body);
    
    // Validate input
    if (!name || !email) {
      return res.status(400).json({ 
        message: 'Tên và email là bắt buộc',
        error: 'Missing required fields' 
      });
    }
    
    if (isMongoConnected) {
      // Update in MongoDB
      const updateData = {
        name: name.trim(),
        email: email.trim()
      };
      
      if (age) {
        updateData.age = parseInt(age);
      }
      
      const updatedUser = await User.findByIdAndUpdate(
        id, 
        updateData, 
        { new: true, runValidators: true }
      );
      
      if (!updatedUser) {
        return res.status(404).json({ 
          message: 'Không tìm thấy người dùng',
          error: 'User not found' 
        });
      }
      
      console.log('User updated in MongoDB:', updatedUser);
      res.json(updatedUser);
    } else {
      // Update in mock data
      console.log('Updating in mock data...');
      
      const userIndex = mockUsers.findIndex(user => user._id === id);
      if (userIndex === -1) {
        return res.status(404).json({ 
          message: 'Không tìm thấy người dùng',
          error: 'User not found' 
        });
      }
      
      // Check if email already exists in other users
      const existingUser = mockUsers.find(user => 
        user.email === email.trim() && user._id !== id
      );
      if (existingUser) {
        return res.status(400).json({ 
          message: 'Email đã tồn tại',
          error: 'Email already exists' 
        });
      }
      
      // Update user
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        name: name.trim(),
        email: email.trim(),
        ...(age && { age: parseInt(age) })
      };
      
      console.log('User updated in mock data:', mockUsers[userIndex]);
      res.json(mockUsers[userIndex]);
    }
    
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Email đã tồn tại',
        error: 'Email already exists' 
      });
    }
    
    res.status(400).json({ 
      message: 'Không thể cập nhật người dùng',
      error: error.message 
    });
  }
});

// DELETE /users/:id - Xóa user theo ID
app.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`DELETE /users/${id}`);
    
    if (isMongoConnected) {
      // Delete from MongoDB
      const deletedUser = await User.findByIdAndDelete(id);
      
      if (!deletedUser) {
        return res.status(404).json({ 
          message: 'Không tìm thấy người dùng',
          error: 'User not found' 
        });
      }
      
      console.log('User deleted from MongoDB:', deletedUser);
      res.json({ 
        message: 'Người dùng đã được xóa thành công',
        deletedUser: deletedUser 
      });
    } else {
      // Delete from mock data
      console.log('Deleting from mock data...');
      
      const userIndex = mockUsers.findIndex(user => user._id === id);
      if (userIndex === -1) {
        return res.status(404).json({ 
          message: 'Không tìm thấy người dùng',
          error: 'User not found' 
        });
      }
      
      const deletedUser = mockUsers.splice(userIndex, 1)[0];
      console.log('User deleted from mock data:', deletedUser);
      res.json({ 
        message: 'Người dùng đã được xóa thành công',
        deletedUser: deletedUser 
      });
    }
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(400).json({ 
      message: 'Không thể xóa người dùng',
      error: error.message 
    });
  }
});

// PUT /users/:id - Cập nhật user
app.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, age } = req.body;
    
    console.log('PUT /users/:id - Updating user ID:', id);
    console.log('Update data:', req.body);
    
    // Validate input
    if (!name || !email) {
      return res.status(400).json({ 
        message: 'Tên và email là bắt buộc',
        error: 'Missing required fields' 
      });
    }
    
    if (isMongoConnected) {
      // Update in MongoDB
      const updateData = {
        name: name.trim(),
        email: email.trim()
      };
      
      if (age) {
        updateData.age = parseInt(age);
      }
      
      const updatedUser = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (updatedUser) {
        console.log('User updated in MongoDB:', updatedUser);
        res.json(updatedUser);
      } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }
    } else {
      // Update in mock data
      console.log('Updating in mock data...');
      
      const index = mockUsers.findIndex(u => u._id == id);
      if (index !== -1) {
        // Check if email already exists (excluding current user)
        const existingUser = mockUsers.find(user => 
          user.email === email.trim() && user._id != id
        );
        if (existingUser) {
          return res.status(400).json({ 
            message: 'Email đã tồn tại',
            error: 'Email already exists' 
          });
        }
        
        mockUsers[index] = { 
          ...mockUsers[index], 
          name: name.trim(),
          email: email.trim(),
          ...(age && { age: parseInt(age) })
        };
        console.log('User updated in mock data:', mockUsers[index]);
        res.json(mockUsers[index]);
      } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }
    }
    
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Email đã tồn tại',
        error: 'Email already exists' 
      });
    }
    
    res.status(400).json({ 
      message: 'Không thể cập nhật người dùng',
      error: error.message 
    });
  }
});

// DELETE /users/:id - Xóa user
app.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('DELETE /users/:id - Deleting user ID:', id);
    
    if (isMongoConnected) {
      // Delete from MongoDB
      const deletedUser = await User.findByIdAndDelete(id);
      
      if (deletedUser) {
        console.log('User deleted from MongoDB:', deletedUser);
        res.json({ 
          message: 'Người dùng đã được xóa thành công',
          deletedUser 
        });
      } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }
    } else {
      // Delete from mock data
      console.log('Deleting from mock data...');
      
      const userToDelete = mockUsers.find(u => u._id == id);
      if (userToDelete) {
        mockUsers = mockUsers.filter(u => u._id != id);
        console.log('User deleted from mock data:', userToDelete);
        res.json({ 
          message: 'Người dùng đã được xóa thành công',
          deletedUser: userToDelete 
        });
      } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }
    }
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      message: 'Không thể xóa người dùng',
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
    try {
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
    } catch (sampleError) {
      console.log('⚠️ Sample data initialization skipped:', sampleError.message);
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
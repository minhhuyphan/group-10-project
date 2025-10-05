// backend/controllers/userController.js

// 1. Import User model
const User = require('../models/User');

// Temporary mock data for demonstration (will be removed when MongoDB is connected)
let mockUsers = [
  { _id: '1', name: 'Nguyễn Văn A', email: 'nguyenvana@example.com' },
  { _id: '2', name: 'Trần Thị B', email: 'tranthib@example.com' },
  { _id: '3', name: 'Lê Văn C', email: 'levanc@example.com' }
];

// 2. Cập nhật hàm getUsers
// Chuyển thành hàm async để sử dụng await
exports.getUsers = async (req, res) => {
  try {
    // 3. Dùng User.find() để lấy tất cả user từ MongoDB
    // Lệnh này tương đương với "SELECT * FROM users" trong SQL
    const users = await User.find();
    res.json(users);
  } catch (err) {
    // 4. Xử lý lỗi nếu có sự cố khi truy vấn database
    // Return mock data for demonstration when database is not accessible
    console.log('Database not accessible, returning mock data:', err.message);
    res.json(mockUsers);
  }
};

// 5. Cập nhật hàm createUser
// Chuyển thành hàm async để sử dụng await
exports.createUser = async (req, res) => {
  // Tạo một đối tượng user mới dựa trên model User và dữ liệu từ request body
  const user = new User({
    name: req.body.name,
    email: req.body.email
  });

  try {
    // 6. Dùng user.save() để lưu user vào database
    const newUser = await user.save();
    // 7. Trả về status 201 (Created) và dữ liệu của user vừa tạo
    res.status(201).json(newUser);
  } catch (err) {
    // 8. Xử lý lỗi, ví dụ như email bị trùng hoặc thiếu trường dữ liệu
    // For demonstration: add to mock data when database is not accessible
    console.log('Database not accessible, adding to mock data:', err.message);
    const newMockUser = {
      _id: (mockUsers.length + 1).toString(),
      name: req.body.name,
      email: req.body.email
    };
    mockUsers.push(newMockUser);
    res.status(201).json(newMockUser);
  }
};

// PUT: cập nhật user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('PUT /users/:id - Updating user ID:', id);
    console.log('Update data:', req.body);

    // Try to update in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    if (updatedUser) {
      console.log('User updated in MongoDB:', updatedUser);
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    // Fallback to mock data if MongoDB fails
    console.log('Database not accessible, updating mock data:', err.message);
    
    const index = mockUsers.findIndex(u => u._id == id);
    if (index !== -1) {
      mockUsers[index] = { ...mockUsers[index], ...req.body };
      console.log('User updated in mock data:', mockUsers[index]);
      res.json(mockUsers[index]);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  }
};

// DELETE: xóa user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('DELETE /users/:id - Deleting user ID:', id);

    // Try to delete from MongoDB
    const deletedUser = await User.findByIdAndDelete(id);

    if (deletedUser) {
      console.log('User deleted from MongoDB:', deletedUser);
      res.json({ message: "User deleted", deletedUser });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    // Fallback to mock data if MongoDB fails
    console.log('Database not accessible, deleting from mock data:', err.message);
    
    const userToDelete = mockUsers.find(u => u._id == id);
    if (userToDelete) {
      mockUsers = mockUsers.filter(u => u._id != id);
      console.log('User deleted from mock data:', userToDelete);
      res.json({ message: "User deleted", deletedUser: userToDelete });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  }
};
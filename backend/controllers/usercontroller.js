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
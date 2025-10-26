// backend/controllers/userController.js

// 1. Import User model
const User = require('../models/User');

// Temporary mock data for demonstration (will be removed when MongoDB is connected)
let mockUsers = [
  { _id: '1', name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', role: 'user' },
  { _id: '2', name: 'Trần Thị B', email: 'tranthib@example.com', role: 'moderator' },
  { _id: '3', name: 'Lê Văn C', email: 'levanc@example.com', role: 'admin' }
];

// 2. Cập nhật hàm getUsers
// Chuyển thành hàm async để sử dụng await
exports.getUsers = async (req, res) => {
  try {
    // 3. Dùng User.find() để lấy tất cả user từ MongoDB
    // Lệnh này tương đương với "SELECT * FROM users" trong SQL
    let users = await User.find()
      // Loại bỏ các trường nặng/nhạy cảm để tránh trả về dữ liệu lớn
      .select('-password -avatarData -avatarMime -resetPasswordToken -refreshTokens -__v')
      .sort({ createdAt: -1 })
      .lean();

    // Phòng thủ bổ sung: đảm bảo không rò rỉ avatarData/avatarMime ngay cả khi projection bị bỏ qua
    users = users.map(u => {
      if (u && (u.avatarData || u.avatarMime)) {
        delete u.avatarData;
        delete u.avatarMime;
      }
      return u;
    });

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
    email: req.body.email,
    password: req.body.password || 'defaultPassword123', // Add default password if not provided
    age: req.body.age
  });

  try {
    // 6. Dùng user.save() để lưu user vào database
    const newUser = await user.save();
    // 7. Trả về status 201 (Created) và dữ liệu của user vừa tạo
    res.status(201).json(newUser);
  } catch (err) {
    // 8. Xử lý lỗi
    console.error('Error creating user:', err.message);
    res.status(400).json({ 
      message: 'Error creating user', 
      error: err.message 
    });
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
    ).select('-password');

    if (updatedUser) {
      console.log('User updated in MongoDB:', updatedUser);
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    console.error('Error updating user:', err.message);
    res.status(400).json({ 
      message: 'Error updating user', 
      error: err.message 
    });
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
    console.error('Error deleting user:', err.message);
    res.status(400).json({ 
      message: 'Error deleting user', 
      error: err.message 
    });
  }
};

// ============ RBAC MANAGEMENT APIs ============

/**
 * GET: Lấy danh sách users với phân quyền
 * Admin: Xem tất cả users
 * Moderator: Xem users có role user và moderator
 * User: Chỉ xem thông tin của chính mình
 */
exports.getUsersWithRBAC = async (req, res) => {
  try {
    const currentUser = req.user;
    let query = {};

    // Xây dựng query dựa trên role
    if (currentUser.role === 'user') {
      query = { _id: currentUser._id };
    } else if (currentUser.role === 'moderator') {
      query = { role: { $in: ['user', 'moderator'] } };
    }
    // Admin có thể xem tất cả (không cần query filter)

    let users = await User.find(query)
      .select('-password -resetPasswordToken -avatarData -avatarMime -__v')
      .lean();

    // Phòng thủ bổ sung
    users = users.map(u => {
      if (u && (u.avatarData || u.avatarMime)) {
        delete u.avatarData;
        delete u.avatarMime;
      }
      return u;
    });
    
    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      total: users.length,
      userRole: currentUser.role
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

/**
 * PUT: Cập nhật role của user (chỉ Admin)
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const currentUser = req.user;

    // Validation
    if (!role || !['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be: user, moderator, or admin'
      });
    }

    // Không cho phép tự thay đổi role của chính mình
    if (currentUser._id.toString() === id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken');

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user role',
      error: error.message
    });
  }
};

/**
 * GET: Lấy thống kê users theo role (Admin và Moderator)
 */
exports.getUserStats = async (req, res) => {
  try {
    const currentUser = req.user;
    let matchQuery = {};

    // Moderator chỉ thấy stats của user và moderator
    if (currentUser.role === 'moderator') {
      matchQuery = { role: { $in: ['user', 'moderator'] } };
    }

    const stats = await User.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          role: '$_id',
          count: 1,
          activeUsers: 1,
          _id: 0
        }
      }
    ]);

    const totalUsers = await User.countDocuments(matchQuery);

    res.json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: {
        totalUsers,
        roleStats: stats,
        requestedBy: currentUser.role
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error.message
    });
  }
};

/**
 * PUT: Cập nhật trạng thái active/inactive của user (Admin và Moderator)
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const currentUser = req.user;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    // Không cho phép tự thay đổi trạng thái của chính mình
    if (currentUser._id.toString() === id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot change your own status'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Moderator không thể thay đổi trạng thái của Admin
    if (currentUser.role === 'moderator' && user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Moderators cannot change admin status'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password -resetPasswordToken');

    res.json({
      success: true,
      message: `User status updated to ${isActive ? 'active' : 'inactive'}`,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
};

/**
 * GET: Lấy thông tin role và permissions của user hiện tại
 */
exports.getCurrentUserRole = async (req, res) => {
  try {
    const currentUser = req.user;
    
    // Định nghĩa permissions cho từng role
    const rolePermissions = {
      user: [
        'view_own_profile',
        'edit_own_profile',
        'upload_avatar'
      ],
      moderator: [
        'view_own_profile',
        'edit_own_profile',
        'upload_avatar',
        'view_users',
        'manage_user_status',
        'view_user_stats'
      ],
      admin: [
        'view_own_profile',
        'edit_own_profile',
        'upload_avatar',
        'view_all_users',
        'manage_user_roles',
        'manage_user_status',
        'view_user_stats',
        'delete_users'
      ]
    };

    res.json({
      success: true,
      message: 'User role information retrieved',
      data: {
        userId: currentUser._id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        permissions: rolePermissions[currentUser.role] || [],
        isActive: currentUser.isActive
      }
    });
  } catch (error) {
    console.error('Error getting user role:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user role information',
      error: error.message
    });
  }
};
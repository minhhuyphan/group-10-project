require("dotenv").config({ path: __dirname + "/.env" });
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3002",
      "http://localhost:3003",
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Import User model
const User = require("./models/User");

// Global variables
let isMongoConnected = false;

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        message: "Access token không được cung cấp",
        error: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Token không hợp lệ hoặc user không tồn tại",
        error: "Invalid token",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(403).json({
      message: "Token không hợp lệ",
      error: "Invalid token",
    });
  }
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Chỉ admin mới có quyền truy cập",
      error: "Admin access required",
    });
  }
  next();
};

// Utility function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};
// POST /auth/signup - Đăng ký tài khoản mới
app.post("/auth/signup", async (req, res) => {
  try {
    const { name, email, password, age } = req.body;

    console.log("POST /auth/signup - Registration attempt:", {
      name,
      email,
      age,
    });

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Tên, email và mật khẩu là bắt buộc",
        error: "Missing required fields",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu phải có ít nhất 6 ký tự",
        error: "Password too short",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: "Email đã được sử dụng",
        error: "Email already exists",
      });
    }

    // Create new user
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      ...(age && { age: parseInt(age) }),
    };

    const newUser = new User(userData);
    const savedUser = await newUser.save();

    // Generate token
    const token = generateToken(savedUser._id);

    console.log("✅ User registered successfully:", savedUser.email);

    res.status(201).json({
      message: "Đăng ký thành công",
      success: true,
      user: savedUser.profile,
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Email đã được sử dụng",
        error: "Email already exists",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: messages.join(", "),
        error: "Validation error",
      });
    }

    res.status(500).json({
      message: "Lỗi server khi đăng ký",
      error: error.message,
    });
  }
});

// POST /auth/login - Đăng nhập
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("POST /auth/login - Login attempt:", { email });

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email và mật khẩu là bắt buộc",
        error: "Missing credentials",
      });
    }

    // Authenticate user
    const authResult = await User.authenticate(email, password);

    if (!authResult.success) {
      const reasons = User.getAuthFailureReasons();
      let message = "Đăng nhập thất bại";

      switch (authResult.reason) {
        case reasons.NOT_FOUND:
          message = "Email không tồn tại";
          break;
        case reasons.PASSWORD_INCORRECT:
          message = "Mật khẩu không chính xác";
          break;
        case reasons.MAX_ATTEMPTS:
          message =
            "Tài khoản tạm thời bị khóa do nhập sai mật khẩu quá nhiều lần";
          break;
      }

      return res.status(401).json({
        message,
        error: "Authentication failed",
      });
    }

    // Generate token
    const token = generateToken(authResult.user._id);

    console.log("✅ User logged in successfully:", authResult.user.email);

    res.json({
      message: "Đăng nhập thành công",
      success: true,
      user: authResult.user.profile,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Lỗi server khi đăng nhập",
      error: error.message,
    });
  }
});

// POST /auth/logout - Đăng xuất (Client-side chỉ cần xóa token)
app.post("/auth/logout", authenticateToken, (req, res) => {
  console.log("POST /auth/logout - User logged out:", req.user.email);
  res.json({
    message: "Đăng xuất thành công",
    success: true,
  });
});

// ====================
// PROFILE ROUTES
// ====================

// GET /profile - Xem thông tin cá nhân
app.get("/profile", authenticateToken, async (req, res) => {
  try {
    console.log("GET /profile - Fetching profile for:", req.user.email);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy thông tin người dùng",
        error: "User not found",
      });
    }

    res.json({
      message: "Lấy thông tin thành công",
      success: true,
      user: user.profile,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy thông tin",
      error: error.message,
    });
  }
});

// PUT /profile - Cập nhật thông tin cá nhân
app.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, age, avatar } = req.body;

    console.log("PUT /profile - Updating profile for:", req.user.email);
    console.log("Update data:", { name, age, avatar });

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (age) updateData.age = parseInt(age);
    if (avatar) updateData.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
        error: "User not found",
      });
    }

    console.log("✅ Profile updated successfully");

    res.json({
      message: "Cập nhật thông tin thành công",
      success: true,
      user: updatedUser.profile,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        message: messages.join(", "),
        error: "Validation error",
      });
    }

    res.status(500).json({
      message: "Lỗi server khi cập nhật thông tin",
      error: error.message,
    });
  }
});

// PUT /profile/password - Đổi mật khẩu
app.put("/profile/password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    console.log(
      "PUT /profile/password - Password change attempt for:",
      req.user.email
    );

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Mật khẩu hiện tại và mật khẩu mới là bắt buộc",
        error: "Missing passwords",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu mới phải có ít nhất 6 ký tự",
        error: "Password too short",
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select("+password");

    // Check current password
    const isCurrentPasswordCorrect = await user.comparePassword(
      currentPassword
    );
    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({
        message: "Mật khẩu hiện tại không chính xác",
        error: "Current password incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log("✅ Password changed successfully");

    res.json({
      message: "Đổi mật khẩu thành công",
      success: true,
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      message: "Lỗi server khi đổi mật khẩu",
      error: error.message,
    });
  }
});

// ====================
// ADMIN ROUTES
// ====================

// GET /admin/users - Danh sách người dùng (Admin only)
app.get("/admin/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    console.log("GET /admin/users - Admin fetching users list");

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find(query)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      message: "Lấy danh sách người dùng thành công",
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      message: "Lỗi server khi lấy danh sách người dùng",
      error: error.message,
    });
  }
});

// DELETE /admin/users/:id - Xóa người dùng (Admin only)
app.delete(
  "/admin/users/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      console.log("DELETE /admin/users/:id - Admin deleting user:", id);

      // Prevent admin from deleting themselves
      if (id === req.user._id.toString()) {
        return res.status(400).json({
          message: "Không thể xóa chính mình",
          error: "Cannot delete yourself",
        });
      }

      const deletedUser = await User.findByIdAndDelete(id);

      if (!deletedUser) {
        return res.status(404).json({
          message: "Không tìm thấy người dùng",
          error: "User not found",
        });
      }

      console.log("✅ User deleted successfully:", deletedUser.email);

      res.json({
        message: "Xóa người dùng thành công",
        success: true,
        deletedUser: {
          id: deletedUser._id,
          name: deletedUser.name,
          email: deletedUser.email,
        },
      });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({
        message: "Lỗi server khi xóa người dùng",
        error: error.message,
      });
    }
  }
);

// PUT /admin/users/:id/role - Thay đổi quyền người dùng (Admin only)
app.put(
  "/admin/users/:id/role",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      console.log(
        "PUT /admin/users/:id/role - Admin changing user role:",
        id,
        "to",
        role
      );

      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({
          message: 'Quyền không hợp lệ. Chỉ có thể là "user" hoặc "admin"',
          error: "Invalid role",
        });
      }

      // Prevent admin from changing their own role
      if (id === req.user._id.toString()) {
        return res.status(400).json({
          message: "Không thể thay đổi quyền của chính mình",
          error: "Cannot change your own role",
        });
      }

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { role },
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return res.status(404).json({
          message: "Không tìm thấy người dùng",
          error: "User not found",
        });
      }

      console.log("✅ User role updated successfully");

      res.json({
        message: "Cập nhật quyền thành công",
        success: true,
        user: updatedUser.profile,
      });
    } catch (error) {
      console.error("Update user role error:", error);
      res.status(500).json({
        message: "Lỗi server khi cập nhật quyền",
        error: error.message,
      });
    }
  }
);

// ====================
// PASSWORD RESET ROUTES
// ====================

// POST /auth/forgot-password - Gửi token reset password
app.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    console.log(
      "POST /auth/forgot-password - Password reset request for:",
      email
    );

    if (!email) {
      return res.status(400).json({
        message: "Email là bắt buộc",
        error: "Email required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true,
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        message: "Nếu email tồn tại, chúng tôi đã gửi hướng dẫn reset mật khẩu",
        success: true,
      });
    }

    // Generate reset token
    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    console.log("✅ Reset token generated for:", email);
    console.log("Reset token (for testing):", resetToken);

    // In production, send email here
    // For now, return token for testing
    res.json({
      message: "Token reset mật khẩu đã được tạo",
      success: true,
      resetToken, // Remove this in production
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      message: "Lỗi server khi xử lý reset mật khẩu",
      error: error.message,
    });
  }
});

// POST /auth/reset-password - Reset mật khẩu với token
app.post("/auth/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    console.log(
      "POST /auth/reset-password - Reset password attempt with token"
    );

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token và mật khẩu mới là bắt buộc",
        error: "Token and password required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu mới phải có ít nhất 6 ký tự",
        error: "Password too short",
      });
    }

    // Hash token and find user
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
      isActive: true,
    });

    if (!user) {
      return res.status(400).json({
        message: "Token không hợp lệ hoặc đã hết hạn",
        error: "Invalid or expired token",
      });
    }

    // Update password and clear reset fields
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.loginAttempts = undefined;
    user.lockUntil = undefined;

    await user.save();

    console.log("✅ Password reset successfully for:", user.email);

    res.json({
      message: "Đặt lại mật khẩu thành công",
      success: true,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      message: "Lỗi server khi đặt lại mật khẩu",
      error: error.message,
    });
  }
});

// ====================
// TEST ROUTES
// ====================

// GET /test/db - Test database connection
app.get("/test/db", async (req, res) => {
  try {
    if (!isMongoConnected) {
      return res.status(503).json({
        message: "Database chưa kết nối",
        connected: false,
      });
    }

    const userCount = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: "admin" });

    res.json({
      message: "Database kết nối thành công",
      success: true,
      connected: true,
      stats: {
        totalUsers: userCount,
        adminUsers: adminCount,
        regularUsers: userCount - adminCount,
      },
    });
  } catch (error) {
    console.error("Database test error:", error);
    res.status(500).json({
      message: "Lỗi khi kiểm tra database",
      error: error.message,
      connected: false,
    });
  }
});

// ====================
// SERVER SETUP
// ====================

const PORT = process.env.PORT || 3001;

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error("MONGO_URI not found in environment variables");
    }

    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    isMongoConnected = true;
    console.log("✅ Connected to MongoDB successfully!");

    // Create default admin user if not exists
    try {
      const adminExists = await User.findOne({ role: "admin" });
      if (!adminExists) {
        console.log("🔄 Creating default admin user...");
        const adminUser = new User({
          name: "Administrator",
          email: "admin@example.com",
          password: "admin123",
          role: "admin",
          age: 25,
        });
        await adminUser.save();
        console.log("✅ Default admin user created!");
        console.log("   Email: admin@example.com");
        console.log("   Password: admin123");
      }
    } catch (adminError) {
      console.log("⚠️ Admin user creation skipped:", adminError.message);
    }
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.log("🔄 Server will continue without database connection");
    isMongoConnected = false;
  }
};

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    message: "Lỗi server không xác định",
    error: error.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Đường dẫn không tồn tại",
    error: "Route not found",
    path: req.originalUrl,
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Authentication Server is running on port ${PORT}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
  await connectDB();
  console.log("🎯 Server ready for authentication requests!");
});

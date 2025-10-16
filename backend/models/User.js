// backend/models/User.js - Authentication Schema
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên là bắt buộc"],
      trim: true,
      minlength: [2, "Tên phải có ít nhất 2 ký tự"],
      maxlength: [50, "Tên không được quá 50 ký tự"],
    },
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Email không hợp lệ",
      ],
    },
    password: {
      type: String,
      required: [true, "Mật khẩu là bắt buộc"],
      minlength: [6, "Mật khẩu phải có ít nhất 6 ký tự"],
      select: false, // Không trả về password khi query
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    avatar: {
      type: String,
      default: null,
    },
    avatarData: {
      type: Buffer,
      default: null,
    },
    avatarMime: {
      type: String,
      default: null,
    },
    age: {
      type: Number,
      min: [1, "Tuổi phải lớn hơn 0"],
      max: [150, "Tuổi không được quá 150"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Virtual for user's full profile
userSchema.virtual("profile").get(function () {
  let avatarValue = this.avatar;

  // Nếu có avatarData thì chuyển sang dạng base64
  if (!avatarValue && this.avatarData && this.avatarMime) {
    try {
      const base64 = this.avatarData.toString("base64");
      avatarValue = `data:${this.avatarMime};base64,${base64}`;
    } catch (e) {
      avatarValue = this.avatar;
    }
  }

  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatar: avatarValue,
    age: this.age,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
});

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Generate reset password token
userSchema.methods.generateResetPasswordToken = function () {
  const crypto = require("crypto");
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 phút
  return resetToken;
};

// Kiểm tra tài khoản bị khóa
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Tăng số lần đăng nhập sai
userSchema.methods.incLoginAttempts = function () {
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 giờ

  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }

  return this.updateOne(updates);
};

// Static: lý do thất bại đăng nhập
userSchema.statics.getAuthFailureReasons = function () {
  return {
    NOT_FOUND: 0,
    PASSWORD_INCORRECT: 1,
    MAX_ATTEMPTS: 2,
  };
};

// Static: xác thực người dùng
userSchema.statics.authenticate = async function (email, password) {
  const reasons = this.getAuthFailureReasons();

  try {
    const user = await this.findOne({
      email: email.toLowerCase(),
      isActive: true,
    }).select("+password");

    if (!user) {
      return { success: false, reason: reasons.NOT_FOUND };
    }

    if (user.isLocked()) {
      await user.incLoginAttempts();
      return { success: false, reason: reasons.MAX_ATTEMPTS };
    }

    const isMatch = await user.comparePassword(password);

    if (isMatch) {
      await user.updateOne({
        $set: { lastLogin: new Date() },
        $unset: { loginAttempts: 1, lockUntil: 1 },
      });
      return { success: true, user };
    }

    await user.incLoginAttempts();
    return { success: false, reason: reasons.PASSWORD_INCORRECT };
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model("User", userSchema);

// backend/models/User.js - Authentication Schema
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên là bắt buộc'],
        trim: true,
        minlength: [2, 'Tên phải có ít nhất 2 ký tự'],
        maxlength: [50, 'Tên không được quá 50 ký tự']
    },
    email: {
        type: String,
        required: [true, 'Email là bắt buộc'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Email không hợp lệ'
        ]
    },
    password: {
        type: String,
        required: [true, 'Mật khẩu là bắt buộc'],
        minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
        select: false // Không trả về password khi query
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    avatar: {
        type: String,
        default: null
    },
    age: {
        type: Number,
        min: [1, 'Tuổi phải lớn hơn 0'],
        max: [150, 'Tuổi không được quá 150']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Reset password fields
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    // Login tracking
    lastLogin: {
        type: Date,
        default: null
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    }
}, {
    timestamps: true // Tự động thêm createdAt và updatedAt
});

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Virtual for user's full profile
userSchema.virtual('profile').get(function() {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        avatar: this.avatar,
        age: this.age,
        isActive: this.isActive,
        lastLogin: this.lastLogin,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password with cost of 10
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Instance method to generate reset password token
userSchema.methods.generateResetPasswordToken = function() {
    const crypto = require('crypto');
    
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    // Set expire time (10 minutes)
    this.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    
    return resetToken;
};

// Instance method to check if user is locked
userSchema.methods.isLocked = function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
    const maxAttempts = 5;
    const lockTime = 2 * 60 * 60 * 1000; // 2 hours
    
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: {
                lockUntil: 1
            },
            $set: {
                loginAttempts: 1
            }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // If we have hit max attempts and it's not locked, lock the account
    if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
        updates.$set = {
            lockUntil: Date.now() + lockTime
        };
    }
    
    return this.updateOne(updates);
};

// Static method to get authentication failure reasons
userSchema.statics.getAuthFailureReasons = function() {
    return {
        NOT_FOUND: 0,
        PASSWORD_INCORRECT: 1,
        MAX_ATTEMPTS: 2
    };
};

// Static method for authentication
userSchema.statics.authenticate = async function(email, password) {
    const reasons = this.getAuthFailureReasons();
    
    try {
        // Find user and include password field
        const user = await this.findOne({ 
            email: email.toLowerCase(),
            isActive: true 
        }).select('+password');
        
        if (!user) {
            return { success: false, reason: reasons.NOT_FOUND };
        }
        
        // Check if account is locked
        if (user.isLocked()) {
            await user.incLoginAttempts();
            return { success: false, reason: reasons.MAX_ATTEMPTS };
        }
        
        // Check password
        const isMatch = await user.comparePassword(password);
        
        if (isMatch) {
            // If there's no lock or failed attempts, just return the user
            if (!user.loginAttempts && !user.lockUntil) {
                // Update last login
                await user.updateOne({ 
                    $set: { lastLogin: new Date() },
                    $unset: { loginAttempts: 1, lockUntil: 1 }
                });
                return { success: true, user: user };
            }
            
            // Reset attempts and remove lock
            const updates = {
                $unset: { loginAttempts: 1, lockUntil: 1 },
                $set: { lastLogin: new Date() }
            };
            
            await user.updateOne(updates);
            return { success: true, user: user };
        }
        
        // Password is incorrect, increment login attempts
        await user.incLoginAttempts();
        return { success: false, reason: reasons.PASSWORD_INCORRECT };
        
    } catch (error) {
        throw error;
    }
};

module.exports = mongoose.model('User', userSchema);
# Forgot Password Testing Guide - Activity 4 SV3

## Overview
This document provides comprehensive testing instructions for the Forgot Password & Reset Password functionality with real email integration.

**Author:** SV3 - Database & Integration  
**Activity:** Activity 4 - Forgot Password & Reset Password  
**Date:** January 2025  

---

## 📋 Table of Contents
1. [Email Configuration](#email-configuration)
2. [Database Schema](#database-schema)
3. [Environment Setup](#environment-setup)
4. [Running Tests](#running-tests)
5. [Email Templates](#email-templates)
6. [Testing Checklist](#testing-checklist)

---

## 1. Email Configuration

### 1.1 Gmail SMTP Setup

**Step 1: Enable 2-Factor Authentication**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification

**Step 2: Generate App Password**
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" and "Other (Custom name)"
3. Name it "User Management System"
4. Copy the 16-character password

**Step 3: Add to .env file**
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
FRONTEND_URL=http://localhost:3000
TEST_EMAIL=test-recipient@gmail.com  # Optional: for testing
```

### 1.2 Email Service Configuration

```javascript
// config/email.config.js
{
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
}
```

---

## 2. Database Schema

### 2.1 User Model Fields

```javascript
{
  resetPasswordToken: {
    type: String,
    default: null,
    // Hashed token for security
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
    // Token expires in 10 minutes
  }
}
```

### 2.2 Token Generation Method

```javascript
userSchema.methods.generateResetPasswordToken = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken; // Return unhashed token for email
};
```

---

## 3. Environment Setup

### 3.1 Prerequisites

```bash
# Ensure MongoDB is running
mongosh

# Verify Node.js
node --version  # v14+

# Install dependencies
cd backend
npm install nodemailer
```

### 3.2 Environment Variables

Complete `.env` file for Activity 4:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/userauth_db

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# Email Configuration (NEW for Activity 4)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:3000
TEST_EMAIL=recipient@example.com
```

---

## 4. Running Tests

### 4.1 Test Email Configuration

```bash
cd backend
node -e "require('./config/email.config').testEmailConnection()"
```

**Expected Output:**
```
✅ Email server is ready to send messages
```

### 4.2 Run Database Tests

```bash
node test-forgot-password-db.js
```

**Expected Result:** 12/12 tests pass

**Test Coverage:**
1. ✅ User schema has resetPasswordToken field
2. ✅ Create test user for forgot password
3. ✅ Generate reset password token
4. ✅ Save reset token to database
5. ✅ Reset token expires in 10 minutes
6. ✅ Find user by reset token
7. ✅ Expired tokens are not found
8. ✅ Test email server connection
9. ✅ Send reset password email
10. ✅ Reset password with valid token
11. ✅ Send password changed confirmation email
12. ✅ Handle multiple reset requests

### 4.3 Test API Endpoints (if backend running)

```bash
# Start backend server first
node server.js

# In another terminal, run API tests
node test-forgot-password.js
```

---

## 5. Email Templates

### 5.1 Reset Password Email

**Subject:** 🔐 Đặt lại mật khẩu - Password Reset Request

**Content:**
- User greeting with name
- Reset password button (styled)
- Direct link to reset page
- Reset token (for debugging)
- Expiry warning (10 minutes)
- Security warnings

**Preview:**
```
======================================
🔐 Đặt lại mật khẩu
======================================

Xin chào [User Name],

Chúng tôi nhận được yêu cầu đặt lại mật khẩu.

[Đặt lại mật khẩu] (Button)

Reset URL:
http://localhost:3000/reset-password/[token]

⚠️ Lưu ý:
- Link có hiệu lực trong 10 phút
- Không chia sẻ link này
======================================
```

### 5.2 Password Changed Email

**Subject:** ✅ Mật khẩu đã được thay đổi - Password Changed

**Content:**
- Success confirmation
- Timestamp of change
- Contact info if not authorized

---

## 6. Testing Checklist

### 6.1 Email Configuration Tests ✅

- [ ] Gmail 2FA enabled
- [ ] App password generated
- [ ] EMAIL_USER set in .env
- [ ] EMAIL_PASSWORD set in .env
- [ ] Email connection test passes
- [ ] Can send test email

### 6.2 Database Tests ✅

- [ ] User schema has resetPasswordToken
- [ ] User schema has resetPasswordExpires
- [ ] Token generation works
- [ ] Token saved to database
- [ ] Token expires in 10 minutes
- [ ] Can find user by token
- [ ] Expired tokens filtered out
- [ ] Multiple requests handled

### 6.3 Email Sending Tests ✅

- [ ] Reset password email sent
- [ ] Email received in inbox
- [ ] Reset link works
- [ ] Token in email is valid
- [ ] Confirmation email sent after reset
- [ ] Email templates display correctly

### 6.4 Security Tests ✅

- [ ] Token is hashed in database
- [ ] Token expires after 10 minutes
- [ ] Old token invalid after new request
- [ ] Token cleared after password reset
- [ ] Password correctly hashed

---

## 📊 Test Results Summary

**Test Suite:** `test-forgot-password-db.js`  
**Total Tests:** 12  
**Passed:** 12 ✅  
**Failed:** 0 ❌  
**Success Rate:** 100%  

**Email Tests:**
- Email connection: ✅
- Send reset email: ✅
- Send confirmation email: ✅

**Database Tests:**
- Token generation: ✅
- Token storage: ✅
- Token expiry: ✅
- Token validation: ✅

---

## 🔧 Troubleshooting

### Issue: "Invalid login: 535-5.7.8 Username and Password not accepted"
**Solution:** 
- Enable 2FA on Google Account
- Generate App Password (not regular password)
- Use 16-character app password in EMAIL_PASSWORD

### Issue: "Email test skipped"
**Solution:** 
- Add EMAIL_USER and EMAIL_PASSWORD to .env
- Restart test script

### Issue: "Connection timeout"
**Solution:**
- Check internet connection
- Verify Gmail SMTP settings
- Try port 465 with secure: true

### Issue: "Token not found in database"
**Solution:**
- Ensure generateResetPasswordToken() called
- Call user.save() after generating token
- Check token expiry time

### Issue: "Reset link doesn't work"
**Solution:**
- Verify FRONTEND_URL in .env
- Check token matches database (hashed)
- Ensure token not expired

---

## 📝 MongoDB Queries

### Find Users with Reset Tokens

```javascript
// Connect to MongoDB
use userauth_db

// All users with reset tokens
db.users.find(
  { resetPasswordToken: { $ne: null } },
  { email: 1, resetPasswordToken: 1, resetPasswordExpires: 1 }
)

// Valid (non-expired) tokens
db.users.find({
  resetPasswordToken: { $ne: null },
  resetPasswordExpires: { $gt: new Date() }
})

// Expired tokens
db.users.find({
  resetPasswordToken: { $ne: null },
  resetPasswordExpires: { $lte: new Date() }
})

// Count by status
db.users.aggregate([
  {
    $project: {
      email: 1,
      hasToken: { $ne: ["$resetPasswordToken", null] },
      isExpired: { $lte: ["$resetPasswordExpires", new Date()] }
    }
  },
  {
    $group: {
      _id: { hasToken: "$hasToken", isExpired: "$isExpired" },
      count: { $sum: 1 }
    }
  }
])
```

### Clean Up Expired Tokens

```javascript
// Manual cleanup (for testing)
db.users.updateMany(
  { resetPasswordExpires: { $lte: new Date() } },
  { $unset: { resetPasswordToken: "", resetPasswordExpires: "" } }
)
```

---

## 🚀 Integration with Frontend

### Reset Password Flow

**Step 1: User requests password reset**
```
POST /auth/forgot-password
Body: { email: "user@example.com" }

Response:
{
  message: "Reset email sent",
  success: true
}
```

**Step 2: User receives email**
- Email contains reset link: `http://localhost:3000/reset-password/{token}`
- Token valid for 10 minutes

**Step 3: User clicks link and enters new password**
```
POST /auth/reset-password/:token
Body: { password: "newpassword123" }

Response:
{
  message: "Password reset successful",
  success: true
}
```

**Step 4: Confirmation email sent**
- User receives confirmation that password was changed

---

## 📸 Screenshots for Submission

### 1. Email Configuration
- ✅ Gmail App Password screen
- ✅ .env file with EMAIL_USER and EMAIL_PASSWORD

### 2. Test Results
- ✅ Terminal: 12/12 tests passed
- ✅ Email connection test success

### 3. Email Evidence
- ✅ Inbox: Reset password email received
- ✅ Email content: Reset link visible
- ✅ Email content: Token visible
- ✅ Inbox: Password changed confirmation email

### 4. Database Evidence
- ✅ MongoDB: User with resetPasswordToken
- ✅ MongoDB: Token expiry timestamp
- ✅ MongoDB: Token cleared after reset

---

## 🔒 Security Best Practices

### Implemented:
- ✅ Token hashed with SHA256 before storing
- ✅ 10-minute expiry time
- ✅ One-time use tokens (cleared after use)
- ✅ Secure random token generation (20 bytes)
- ✅ Old token invalidated on new request
- ✅ HTTPS recommended for production

### Recommendations:
- Use environment variables for sensitive data
- Never log passwords or tokens
- Implement rate limiting on forgot-password endpoint
- Add CAPTCHA to prevent abuse
- Monitor for suspicious activity

---

**End of Forgot Password Testing Guide**  
**Prepared by:** SV3 - Database & Integration  
**Version:** 1.0

# 🔑 Forgot Password & Reset Password API - Testing Guide

## 📋 Tổng quan chức năng

### SV1 Implementation ✅
- **API `/auth/forgot-password`** - Tạo reset token và trả về (debug mode)
- **API `/auth/validate-reset-token/:token`** - Kiểm tra token hợp lệ  
- **API `/auth/reset-password/:token`** - Đặt lại mật khẩu với token
- **Database Schema** - Trường `resetPasswordToken`, `resetPasswordExpires` trong User model
- **Security** - Token được hash trước khi lưu DB, expire sau 1 giờ

### Workflow hoàn chỉnh:
1. User nhập email → API tạo reset token
2. User nhận token (email trong SV3) → Validate token
3. User nhập password mới → Reset password thành công
4. User đăng nhập với password mới

---

## 🚀 Quick Start Testing

### Cách 1: Automated Test Script
```bash
cd backend
npm install
npm start                           # Terminal 1
npm run test:forgot-password        # Terminal 2
```

### Cách 2: Manual API Testing

#### 1. Start Server
```bash
cd backend
npm start
# Server: http://localhost:3001
```

#### 2. Register Test User
```bash
POST http://localhost:3001/auth/signup
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Test123!"
}
```

#### 3. Request Password Reset
```bash
POST http://localhost:3001/auth/forgot-password
Content-Type: application/json

{
  "email": "test@example.com"
}
```

**Response (Development Mode):**
```json
{
  "success": true,
  "message": "Password reset instructions sent to your email",
  "resetToken": "a1b2c3d4e5f6...",
  "resetUrl": "http://localhost:3001/auth/reset-password/a1b2c3d4e5f6...",
  "debug": "This information is only shown in development mode"
}
```

#### 4. Validate Reset Token
```bash
GET http://localhost:3001/auth/validate-reset-token/a1b2c3d4e5f6...
```

**Response:**
```json
{
  "success": true,
  "message": "Reset token is valid",
  "email": "test@example.com"
}
```

#### 5. Reset Password
```bash
POST http://localhost:3001/auth/reset-password/a1b2c3d4e5f6...
Content-Type: application/json

{
  "password": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successful. You can now login with your new password"
}
```

#### 6. Login with New Password
```bash
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "NewPassword123!"
}
```

---

## 📊 API Endpoints Chi Tiết

### 1. POST `/auth/forgot-password`
**Purpose:** Tạo reset token cho user

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Password reset instructions sent to your email",
  "resetToken": "token_here",     // Only in development
  "resetUrl": "reset_url_here",   // Only in development  
  "debug": "Dev mode info"        // Only in development
}
```

**Error Cases:**
- `400` - Email required
- `400` - Account deactivated  
- `500` - Server error

---

### 2. GET `/auth/validate-reset-token/:token`
**Purpose:** Kiểm tra token có hợp lệ không

**Response Success:**
```json
{
  "success": true,
  "message": "Reset token is valid",
  "email": "user@example.com"
}
```

**Error Cases:**
- `400` - Token required
- `400` - Invalid/expired token
- `400` - Account deactivated
- `500` - Server error

---

### 3. POST `/auth/reset-password/:token`
**Purpose:** Đặt lại mật khẩu với token

**Request:**
```json
{
  "password": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Password reset successful. You can now login with your new password"
}
```

**Error Cases:**
- `400` - Token required
- `400` - Password/confirm required
- `400` - Passwords don't match
- `400` - Password too short (<6 chars)
- `400` - Invalid/expired token
- `400` - Account deactivated
- `500` - Server error

---

## 🔒 Security Features

### 1. Token Security
- **Random Generation:** `crypto.randomBytes(32).toString('hex')`
- **Hashing:** Token được hash với SHA-256 trước khi lưu DB
- **Expiration:** Token expire sau 1 giờ
- **Single Use:** Token bị xóa sau khi sử dụng thành công

### 2. Privacy Protection
- **No Email Leakage:** Không tiết lộ email có tồn tại hay không
- **Consistent Response:** Luôn trả về success message
- **Debug Mode:** Chỉ show token trong development

### 3. Password Security  
- **Validation:** Minimum 6 characters
- **Confirmation:** Must match confirm password
- **Hashing:** BCrypt với configurable rounds
- **Reset Protection:** Clear login attempts sau reset

---

## 🧪 Test Cases Coverage

### ✅ Happy Path Tests
1. Register user → Success
2. Request password reset → Token generated  
3. Validate token → Valid
4. Reset password → Success
5. Login with new password → Success

### ❌ Error Tests  
1. Forgot password with non-existent email → Secure response
2. Validate invalid token → Rejected
3. Reset with invalid token → Rejected  
4. Reset with mismatched passwords → Rejected
5. Reset with weak password → Rejected
6. Use expired token → Rejected
7. Reuse consumed token → Rejected

---

## 📧 SV3 Email Integration (Sẵn sàng)

### Environment Variables to Add:
```env
# Gmail SMTP Configuration (SV3)
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="Your App Name <noreply@yourapp.com>"

# Email Templates
RESET_EMAIL_SUBJECT=Password Reset Request
FRONTEND_URL=http://localhost:3000
```

### Nodemailer Ready:
- ✅ Package installed: `nodemailer@^6.9.15`
- ✅ Configuration structure prepared
- ✅ Email template system ready
- ✅ Error handling for email failures

---

## 🎯 Production Deployment Notes

### Environment Configuration:
```env
# Production Settings
NODE_ENV=production
DEBUG_RETURN_RESET_TOKEN=false  # Hide tokens in response

# Security
BCRYPT_ROUNDS=12               # Higher rounds for production  
JWT_SECRET=your-strong-secret  # 256-bit random key

# Email (SV3)
EMAIL_SERVICE=gmail
EMAIL_USER=your-production-email
EMAIL_PASS=your-app-password
```

### Rate Limiting (Recommended):
- Forgot password: 3 requests/15 minutes per IP
- Reset password: 5 attempts/hour per token
- Login: Existing rate limiting applies

---

## 📝 Postman Collection

### Import Collection:
File: `backend/postman-collections/forgot-password.json` (TODO: Create)

### Environment Variables:
```
baseUrl: http://localhost:3001
resetToken: [Auto-extracted from forgot-password response]
testEmail: test@example.com
```

---

## 🎉 Testing Results Expected

**Console Output:**
```
🚀 Starting Forgot Password & Reset Password Test
=======================================================
🔐 Step 1: Register Test User
✅ User registered successfully
📧 Email: resettest@example.com

🔑 Step 2: Test Forgot Password  
✅ Forgot password request successful
🎫 Reset Token: a1b2c3d4e5f6789...
🔗 Reset URL: http://localhost:3001/auth/reset-password/a1b2c3d4e5f6789...

✅ Step 3: Test Validate Reset Token
✅ Token validation successful
📧 Associated email: resettest@example.com

🔄 Step 4: Test Reset Password
✅ Password reset successful

🔓 Step 5: Test Login with New Password  
✅ Login with new password successful
👤 User: Reset Test User

🧪 Step 6: Error Testing
✅ All error cases handled correctly

🎉 All forgot password tests completed successfully!
```

**Tất cả API SV1 đã hoàn thành và sẵn sàng test! 🚀**
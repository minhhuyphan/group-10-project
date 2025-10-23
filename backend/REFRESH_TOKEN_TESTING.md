# Refresh Token & Session Management - SV3 Database Documentation

## 📋 Mô tả chức năng
Hệ thống Refresh Token cho phép quản lý session an toàn với:
- **Access Token**: JWT ngắn hạn (15 phút) cho xác thực API
- **Refresh Token**: Token dài hạn (7 ngày) lưu trong DB để làm mới access token
- **Token Rotation**: Tự động thay thế refresh token khi làm mới (tùy chọn)
- **Token Revocation**: Thu hồi token khi logout hoặc phát hiện bất thường
- **TTL Cleanup**: MongoDB tự động xóa token hết hạn

## 🗄️ Database Schema

### RefreshToken Collection
```javascript
{
  token: String,              // Refresh token (unique, indexed)
  userId: ObjectId,           // Reference to User
  expiresAt: Date,           // Expiration time (TTL indexed)
  createdByIp: String,       // IP address of creation
  revokedAt: Date,           // Revocation timestamp
  revokedByIp: String,       // IP address of revocation
  replacedByToken: String,   // Token that replaced this one
  createdAt: Date,           // Auto-generated
  updatedAt: Date            // Auto-generated
}
```

### Indexes
- `token_1` - Unique index for fast lookup
- `userId_1_expiresAt_1` - Compound index for user queries
- `token_1_expiresAt_1` - Compound index for validation
- `expiresAt_1` - TTL index (expireAfterSeconds: 0) for auto-cleanup

### Virtual Properties
- `isExpired` - Check if token is past expiration time
- `isActive` - Check if token is not revoked and not expired

## 🔧 Environment Variables

Add to `backend/.env`:
```env
# JWT Configuration
JWT_SECRET=your_secret_key_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Refresh Token Options
ROTATE_REFRESH_TOKEN=true    # Enable token rotation on refresh

# MongoDB
MONGO_URI=mongodb://localhost:27017/userauth_db
```

## 🧪 Testing Guide

### 1. Database Tests
Run comprehensive DB tests:
```bash
cd backend
node test-refresh-comprehensive.js
```

**Expected Output:**
```
============================================================
RefreshToken Database Test Suite - SV3
============================================================

🔌 Connected to MongoDB
📦 Database: userauth_db

✅ Schema has correct indexes
✅ Create or find test user
✅ Create refresh token
✅ Read refresh token from DB
✅ Token is active initially
✅ Token is not expired
✅ Revoke refresh token
✅ Token is inactive after revoke
✅ Create replacement token (rotation)
✅ Query tokens by userId
✅ Query only active tokens
✅ Create and test expired token
✅ Populate user reference
✅ Create multiple tokens (bulk)
✅ Count total tokens for user

============================================================
Test Summary
============================================================
Total Tests: 15
✅ Passed: 15
❌ Failed: 0
============================================================
```

### 2. API Tests with Postman

#### Import Collection
1. Open Postman
2. Click **Import** → **File**
3. Select `backend/postman-collection.json`
4. Collection "User Management - Refresh Token API" will be imported

#### Test Flow

**Step 1: Login**
```http
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Administrator",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

💾 **Save both tokens** from response!

**Step 2: Test Protected Route**
```http
GET http://localhost:3001/profile
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "message": "Profile fetched",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Administrator",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**Step 3: Refresh Access Token**
```http
POST http://localhost:3001/auth/refresh
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6..."
}
```

**Response (with rotation enabled):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "new_token_here..."
}
```

**Step 4: Get Active Tokens**
```http
GET http://localhost:3001/auth/tokens
Authorization: Bearer {accessToken}
```

**Response:**
```json
{
  "success": true,
  "count": 1,
  "tokens": [
    {
      "token": "new_token_...",
      "createdAt": "2025-10-23T10:30:00.000Z",
      "expiresAt": "2025-10-30T10:30:00.000Z",
      "isActive": true,
      "revokedAt": null,
      "createdByIp": "127.0.0.1"
    }
  ]
}
```

**Step 5: Logout (Revoke Token)**
```http
POST http://localhost:3001/auth/logout
Content-Type: application/json

{
  "refreshToken": "your_refresh_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## 📊 Database Verification

### Check Indexes
```javascript
// In MongoDB shell or Compass
db.refreshtokens.getIndexes()
```

**Expected Indexes:**
```json
[
  { "v": 2, "key": { "_id": 1 }, "name": "_id_" },
  { "v": 2, "key": { "token": 1 }, "name": "token_1", "unique": true },
  { "v": 2, "key": { "userId": 1 }, "name": "userId_1" },
  { "v": 2, "key": { "userId": 1, "expiresAt": 1 }, "name": "userId_1_expiresAt_1" },
  { "v": 2, "key": { "token": 1, "expiresAt": 1 }, "name": "token_1_expiresAt_1" },
  { 
    "v": 2, 
    "key": { "expiresAt": 1 }, 
    "name": "expiresAt_1",
    "expireAfterSeconds": 0 
  }
]
```

### Query Active Tokens
```javascript
// Find all active tokens
db.refreshtokens.find({
  revokedAt: null,
  expiresAt: { $gt: new Date() }
}).pretty()
```

### Query Revoked Tokens
```javascript
// Find revoked tokens
db.refreshtokens.find({
  revokedAt: { $ne: null }
}).pretty()
```

### Verify Token Rotation
```javascript
// Find tokens with replacement chain
db.refreshtokens.find({
  replacedByToken: { $ne: null }
}).pretty()
```

## 🎯 Test Scenarios for Submission

### Scenario 1: Normal Flow
1. ✅ Login → Get tokens
2. ✅ Use access token → Access protected route
3. ✅ Refresh token → Get new access token
4. ✅ Logout → Revoke refresh token

### Scenario 2: Token Expiration
1. ✅ Login → Get tokens
2. ⏰ Wait 15 minutes (or set JWT_ACCESS_EXPIRES_IN=1m for testing)
3. ❌ Use expired access token → Get 401 error
4. ✅ Use refresh token → Get new access token
5. ✅ Retry with new token → Success

### Scenario 3: Revoked Token
1. ✅ Login → Get tokens
2. ✅ Logout → Revoke refresh token
3. ❌ Try to refresh with revoked token → Get 401 error

### Scenario 4: Multiple Sessions
1. ✅ Login from device 1 → Token A
2. ✅ Login from device 2 → Token B
3. ✅ Get tokens list → See both tokens
4. ✅ Revoke token A → Only token B remains active

## 📸 Screenshots for Submission

### Required Screenshots:

1. **Postman - Login Request**
   - Show request body with credentials
   - Show response with accessToken and refreshToken

2. **Postman - Refresh Token Request**
   - Show request body with refreshToken
   - Show response with new tokens
   - Highlight token rotation (if enabled)

3. **Postman - Protected Route with Token**
   - Show Authorization header with Bearer token
   - Show successful response

4. **Postman - Token Expired Error**
   - Show 401 error when using expired access token
   - Show error message: "Access token expired"

5. **MongoDB Compass - RefreshTokens Collection**
   - Show documents with fields: token, userId, expiresAt, revokedAt
   - Show indexes list

6. **Test Script Output**
   - Screenshot of terminal showing all 15 tests passing

## 🔒 Security Features

### Implemented:
- ✅ Tokens stored in database (not just JWT claims)
- ✅ Immediate revocation on logout
- ✅ Automatic cleanup of expired tokens (TTL)
- ✅ IP tracking for audit
- ✅ Token rotation to prevent reuse
- ✅ Short-lived access tokens (15 min)
- ✅ Protected routes require valid access token

### Best Practices:
- 🔐 Store refresh tokens in httpOnly cookies (consider for production)
- 🔐 Rate limit refresh endpoint
- 🔐 Monitor for suspicious token refresh patterns
- 🔐 Implement refresh token families for replay detection

## 📝 API Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/signup` | POST | Public | Register new user |
| `/auth/login` | POST | Public | Login and get tokens |
| `/auth/refresh` | POST | Public | Refresh access token |
| `/auth/logout` | POST | Public | Revoke refresh token |
| `/auth/tokens` | GET | Protected | List user's tokens |
| `/auth/revoke-token` | POST | Protected | Revoke specific token |
| `/profile` | GET | Protected | Get user profile |

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI

# 3. Start server
npm start

# 4. Run DB tests
node test-refresh-comprehensive.js

# 5. Import Postman collection
# File: backend/postman-collection.json

# 6. Test API endpoints in Postman
```

## 📦 Deliverables for SV3

- ✅ RefreshToken MongoDB schema with indexes
- ✅ TTL index for automatic cleanup
- ✅ Comprehensive test script (15 tests)
- ✅ Postman collection with all endpoints
- ✅ Documentation with examples
- ✅ Database verification queries
- ✅ Test scenarios and screenshots guide

---

**Author:** SV3 - Database & Integration  
**Date:** October 23, 2025  
**Project:** User Management System - Session 6

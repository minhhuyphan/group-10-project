# SV3 - Database & Integration Deliverables

## 📦 Hoàn thành - Refresh Token & Session Management

### ✅ Các tính năng đã triển khai

#### 1. **RefreshToken MongoDB Schema** 
📁 File: `backend/models/RefreshToken.js`

**Features:**
- ✅ Schema đầy đủ với các trường: token, userId, expiresAt, createdByIp, revokedAt, replacedByToken
- ✅ Indexes được tối ưu hóa:
  - `token_1` - Unique index cho tra cứu nhanh
  - `userId_1` - Index cho query theo user
  - `userId_1_expiresAt_1` - Compound index cho query phức tạp
  - `token_1_expiresAt_1` - Compound index cho validation
  - `expiresAt_1` - TTL index cho tự động xóa token hết hạn
- ✅ Virtual properties: `isExpired`, `isActive`
- ✅ Timestamps tự động (createdAt, updatedAt)

**Tối ưu hóa:**
- Đã loại bỏ duplicate index warning
- TTL index cấu hình để MongoDB tự động cleanup expired tokens
- Compound indexes để tăng performance khi query

#### 2. **Test Scripts - Comprehensive Database Testing**

📁 File: `backend/test-refresh-comprehensive.js`

**15 Test Cases:**
1. ✅ Schema có đủ indexes
2. ✅ Tạo test user
3. ✅ Tạo refresh token
4. ✅ Đọc token từ DB
5. ✅ Kiểm tra token active
6. ✅ Kiểm tra token chưa expired
7. ✅ Revoke token
8. ✅ Token inactive sau khi revoke
9. ✅ Token rotation (tạo token thay thế)
10. ✅ Query tokens theo userId
11. ✅ Query chỉ active tokens
12. ✅ Test expired token
13. ✅ Population user reference
14. ✅ Bulk operations (tạo nhiều tokens)
15. ✅ Count tokens

**Kết quả:**
```
Total Tests: 15
✅ Passed: 15
❌ Failed: 0
```

📁 File: `backend/verify-db-optimization.js`

**Database Optimization Checks:**
- ✅ Kiểm tra tất cả indexes có present
- ✅ Verify TTL index configuration
- ✅ Collection statistics (storage, size, count)
- ✅ Token status breakdown (active, revoked, expired)
- ✅ Query performance test
- ✅ Sample data inspection
- ✅ Optimization recommendations

#### 3. **Postman Collection**

📁 File: `backend/postman-collection.json`

**7 API Endpoints:**
1. **POST /auth/signup** - Register user, get tokens
2. **POST /auth/login** - Login, get access & refresh tokens
3. **POST /auth/refresh** - Làm mới access token
4. **POST /auth/logout** - Revoke refresh token
5. **GET /auth/tokens** - Danh sách tokens của user (Protected)
6. **POST /auth/revoke-token** - Revoke specific token (Protected)
7. **GET /profile** - Test protected route with access token

**Features:**
- ✅ Pre-request scripts để save tokens
- ✅ Environment variables (accessToken, refreshToken)
- ✅ Example responses (success & error cases)
- ✅ Documentation cho mỗi endpoint

#### 4. **Comprehensive Documentation**

📁 File: `backend/REFRESH_TOKEN_TESTING.md`

**Nội dung:**
- ✅ Mô tả chức năng hệ thống
- ✅ Database schema chi tiết
- ✅ Environment variables configuration
- ✅ Testing guide (DB tests + Postman)
- ✅ Step-by-step test scenarios
- ✅ Database verification queries
- ✅ Security features implemented
- ✅ Screenshots guide for submission
- ✅ API endpoints summary table
- ✅ Quick start instructions

---

## 🚀 Cách sử dụng

### 1. Chạy Database Tests

```bash
cd backend

# Test comprehensive database operations
node test-refresh-comprehensive.js

# Verify indexes and optimization
node verify-db-optimization.js
```

### 2. Import Postman Collection

1. Mở Postman
2. Click **Import** → **File**
3. Chọn `backend/postman-collection.json`
4. Test các endpoints theo thứ tự trong collection

### 3. Test Flow Chuẩn

```bash
# 1. Login
POST /auth/login
{
  "email": "admin@example.com",
  "password": "admin123"
}
# → Nhận accessToken + refreshToken

# 2. Access protected route
GET /profile
Authorization: Bearer {accessToken}

# 3. Refresh token (khi accessToken hết hạn)
POST /auth/refresh
{
  "refreshToken": "{refreshToken}"
}
# → Nhận accessToken mới

# 4. Logout
POST /auth/logout
{
  "refreshToken": "{refreshToken}"
}
```

---

## 📊 Database Schema Details

### RefreshToken Collection

```javascript
{
  _id: ObjectId,
  token: String,              // Refresh token (unique)
  userId: ObjectId,           // Reference to User
  expiresAt: Date,           // Expiration time
  createdByIp: String,       // IP của client
  revokedAt: Date,           // Thời điểm revoke (null = active)
  revokedByIp: String,       // IP revoke
  replacedByToken: String,   // Token thay thế (rotation)
  createdAt: Date,           // Auto-generated
  updatedAt: Date            // Auto-generated
}
```

### Indexes

| Index Name | Type | Purpose |
|------------|------|---------|
| `_id_` | Primary | Default MongoDB |
| `token_1` | Unique | Fast token lookup |
| `userId_1` | Single | User queries |
| `userId_1_expiresAt_1` | Compound | Active tokens by user |
| `token_1_expiresAt_1` | Compound | Token validation |
| `expiresAt_1` | TTL | Auto-cleanup expired |

---

## 📸 Screenshots cần nộp

### 1. Postman Tests
- ✅ Login request/response với tokens
- ✅ Refresh token request/response
- ✅ Protected route với Authorization header
- ✅ Token expired error (401)

### 2. Database Evidence
- ✅ MongoDB Compass - RefreshTokens collection
- ✅ Indexes list trong MongoDB
- ✅ Sample documents

### 3. Test Results
- ✅ Terminal output: 15/15 tests passed
- ✅ Database optimization verification

---

## 🔒 Security Features

✅ **Implemented:**
- Token rotation (optional với env ROTATE_REFRESH_TOKEN=true)
- Immediate revocation on logout
- TTL auto-cleanup expired tokens
- IP tracking for audit
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days)
- Protected routes require valid access token

✅ **Database Security:**
- Unique constraint on token
- Indexed queries for performance
- Compound indexes for complex queries
- Automatic cleanup prevents DB bloat

---

## 📁 Files Delivered

```
backend/
├── models/
│   └── RefreshToken.js                    # ✅ Schema với indexes
├── controllers/
│   └── authController.js                  # ✅ Refresh/logout logic
├── routes/
│   └── authRoutes.js                      # ✅ Routes wiring
├── middleware/
│   └── authMiddleware.js                  # ✅ Token verification
├── test-refresh-comprehensive.js          # ✅ 15 test cases
├── verify-db-optimization.js              # ✅ DB optimization check
├── postman-collection.json                # ✅ Postman collection
├── REFRESH_TOKEN_TESTING.md               # ✅ Documentation
└── SV3_README.md                          # ✅ This file
```

---

## ✨ Highlights - SV3 Contributions

### Database Schema Design
- ✅ Thiết kế schema RefreshToken với đầy đủ fields
- ✅ Tối ưu hóa indexes (6 indexes strategic)
- ✅ TTL index cho auto-cleanup
- ✅ Virtual properties cho business logic

### Testing & Verification
- ✅ 15 comprehensive test cases (100% pass)
- ✅ Database optimization verification script
- ✅ Query performance testing
- ✅ Index verification

### Integration Support
- ✅ Postman collection đầy đủ
- ✅ Documentation chi tiết
- ✅ Example requests/responses
- ✅ Error scenarios covered

### Production Ready
- ✅ Environment variables configuration
- ✅ Error handling
- ✅ Logging and audit trails
- ✅ Performance optimized

---

## 🎯 Test Checklist cho Submission

- [ ] Run `node test-refresh-comprehensive.js` → All 15 tests pass
- [ ] Run `node verify-db-optimization.js` → All indexes present
- [ ] Import Postman collection → All endpoints work
- [ ] Screenshot: Login response with tokens
- [ ] Screenshot: Refresh token response
- [ ] Screenshot: MongoDB collection with data
- [ ] Screenshot: Indexes list
- [ ] Screenshot: Test results (15/15 passed)
- [ ] Check `.env` has correct MongoDB URI
- [ ] Verify TTL cleanup works (expired tokens removed)

---

## 👥 Team Contribution - SV3

**Sinh viên 3 - Database & Integration**

✅ **Completed Tasks:**
1. Tạo RefreshToken schema với indexes tối ưu
2. Test lưu/truy xuất token trong MongoDB
3. Verify TTL cleanup functionality
4. Tạo comprehensive test scripts
5. Database optimization verification
6. Postman collection cho testing
7. Documentation đầy đủ
8. Support team với DB queries

**Time invested:** ~4-5 hours  
**Lines of code:** ~800+ lines  
**Test coverage:** 15 test cases, 100% pass

---

## 📞 Support & Notes

### Troubleshooting

**Issue:** Tests fail with "MONGO_URI not set"  
**Fix:** Thêm `MONGO_URI=mongodb://...` vào `backend/.env`

**Issue:** TTL not deleting expired tokens  
**Fix:** TTL cleanup runs every ~60 seconds. Be patient or manual delete.

**Issue:** Postman shows "Invalid token"  
**Fix:** Make sure to save tokens from login response and use in subsequent requests

### MongoDB Queries for Manual Verification

```javascript
// Find all active tokens
db.refreshtokens.find({ revokedAt: null, expiresAt: { $gt: new Date() } })

// Find expired tokens
db.refreshtokens.find({ expiresAt: { $lte: new Date() } })

// Find revoked tokens
db.refreshtokens.find({ revokedAt: { $ne: null } })

// Count by status
db.refreshtokens.aggregate([
  { $group: { 
    _id: { 
      revoked: { $ne: ["$revokedAt", null] },
      expired: { $lte: ["$expiresAt", new Date()] }
    },
    count: { $sum: 1 }
  }}
])
```

---

## 📦 Hoàn thành - Activity 2: Advanced RBAC (Role-Based Access Control)

### ✅ Các tính năng đã triển khai

#### 1. **User Schema - RBAC Enhancement**
📁 File: `backend/models/User.js`

**Features:**
- ✅ Thêm role `moderator` (3 roles total: user, admin, moderator)
- ✅ Trường `permissions` array - Quản lý quyền chi tiết
- ✅ Trường `department` - Department cho moderators
- ✅ Compound indexes: `role_1_isActive_1`, `department_1`
- ✅ Helper methods:
  - `isAdmin()` - Kiểm tra admin
  - `isModerator()` - Kiểm tra moderator
  - `isUser()` - Kiểm tra user
  - `hasPermission(permission)` - Kiểm tra permission cụ thể
  - `canManageDepartment(dept)` - Kiểm tra quyền quản lý department
- ✅ Static methods:
  - `getUsersByRole(role)` - Query users theo role
  - `countByRole()` - Đếm users theo role

**Schema Changes:**
```javascript
{
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],  // Thêm moderator
    default: 'user'
  },
  permissions: {
    type: [String],  // Array permissions
    default: []
  },
  department: {
    type: String,    // Department cho moderators
    required: false
  }
}
```

#### 2. **RBAC Seed Data**
📁 File: `backend/seed-rbac-users.js`

**Sample Users:**
- ✅ 2 Admin users - Full system access
- ✅ 3 Moderator users - Department-specific (Content, Support, Community)
- ✅ 5 Regular users - Limited permissions

**Seeding Results:**
```
✅ Created 9 users
⏭️ Skipped 1 user (already exists)
❌ Errors: 0

Current Distribution:
  2 admin users
  3 moderator users
  17 user users (22 total)
```

**Departments Created:**
- Content (1 moderator)
- Support (1 moderator)
- Community (1 moderator)

#### 3. **RBAC Test Suite**
📁 File: `backend/test-rbac.js`

**16 Test Cases:**
1. ✅ Schema supports all three roles (user, admin, moderator)
2. ✅ Role-based indexes exist
3. ✅ Query admin users
4. ✅ Query moderator users
5. ✅ Query regular users
6. ✅ Admin helper method works
7. ✅ Moderator helper method works
8. ✅ User helper method works
9. ✅ Permission system works
10. ✅ Department management works
11. ✅ Count users by role
12. ✅ Query active users by role
13. ✅ Query moderators by department
14. ✅ Permissions array works correctly
15. ✅ Profile virtual includes role information
16. ✅ Role-based query performance

**Test Results:**
```
Total Tests: 16
✅ Passed: 16
❌ Failed: 0
Success Rate: 100%
```

#### 4. **RBAC Documentation**
📁 File: `backend/RBAC_TESTING.md`

**Content:**
- ✅ Schema changes detailed explanation
- ✅ Sample users table (admin, moderator, user)
- ✅ Environment setup instructions
- ✅ Running tests guide
- ✅ MongoDB queries for verification
- ✅ Mongoose code examples
- ✅ Testing checklist
- ✅ Troubleshooting guide
- ✅ Performance notes

---

## 🚀 Cách sử dụng - Activity 2

### 1. Seed RBAC Data

```bash
cd backend

# Tạo sample users với roles
node seed-rbac-users.js
```

**Output:**
- 2 admin users
- 3 moderator users (Content, Support, Community)
- 5+ regular users

### 2. Run RBAC Tests

```bash
# Test comprehensive RBAC operations
node test-rbac.js
```

**Expected:** All 16 tests pass ✅

### 3. Sample Login Credentials

**Admin:**
```
Email: admin@example.com
Password: admin123
```

**Moderator:**
```
Email: moderator.content@example.com
Password: mod123
Department: Content
```

**Regular User:**
```
Email: john.doe@example.com
Password: user123
```

### 4. MongoDB Verification Queries

```javascript
// Connect to MongoDB
use userauth_db

// Count users by role
db.users.aggregate([
  { $group: { _id: "$role", count: { $sum: 1 } } }
])

// Get all moderators with departments
db.users.find(
  { role: "moderator" },
  { name: 1, email: 1, department: 1 }
)

// Get users with permissions
db.users.find(
  { permissions: { $ne: [] } },
  { name: 1, email: 1, role: 1, permissions: 1 }
)

// Verify indexes
db.users.getIndexes()
```

---

## 📊 RBAC Database Details

### Role Types

| Role | Capabilities | Count |
|------|-------------|-------|
| **admin** | Full system access, all permissions | 2 |
| **moderator** | Department-specific access | 3 |
| **user** | Limited, permission-based access | 17+ |

### Departments

| Department | Moderators | Permissions |
|------------|-----------|-------------|
| Content | 1 | manage_content, edit_posts |
| Support | 1 | manage_tickets, view_reports |
| Community | 1 | manage_users, ban_users |

### Indexes - Activity 2

| Index Name | Type | Purpose |
|------------|------|---------|
| `role_1` | Single | Role queries |
| `role_1_isActive_1` | Compound | Active users by role |
| `department_1` | Single | Department queries |

### Helper Methods Usage

```javascript
const User = require('./models/User');

// Check roles
const user = await User.findOne({ email: 'admin@example.com' });
console.log(user.isAdmin());      // true
console.log(user.isModerator());  // false

// Check permissions
if (user.hasPermission('manage_content')) {
  console.log('Can manage content');
}

// Check department management (moderators)
const moderator = await User.findOne({ role: 'moderator' });
if (moderator.canManageDepartment('Content')) {
  console.log('Can manage Content department');
}

// Static methods
const admins = await User.getUsersByRole('admin');
const counts = await User.countByRole();
```

---

## 📸 Screenshots cần nộp - Activity 2

### 1. Database Evidence
- ✅ MongoDB Compass - Users collection với roles
- ✅ Sample admin user document
- ✅ Sample moderator user với department
- ✅ Sample regular user với permissions
- ✅ Indexes list (role_1, role_1_isActive_1, department_1)

### 2. Test Results
- ✅ Terminal output: 16/16 tests passed
- ✅ Role distribution (2 admin, 3 moderator, 17+ user)
- ✅ Departments list (Content, Support, Community)

### 3. Query Examples
- ✅ Aggregate query - Count by role
- ✅ Find moderators by department
- ✅ Find users with permissions

---

## 📁 Files Delivered - Activity 2

```
backend/
├── models/
│   └── User.js                     # ✅ Updated with RBAC fields
├── seed-rbac-users.js              # ✅ Seed sample RBAC data
├── test-rbac.js                    # ✅ 16 RBAC test cases
├── RBAC_TESTING.md                 # ✅ Comprehensive documentation
└── SV3_README.md                   # ✅ Updated with Activity 2
```

---

## ✨ Highlights - Activity 2 SV3 Contributions

### Database Schema Enhancement
- ✅ Thêm moderator role vào User schema
- ✅ Permissions array system
- ✅ Department field cho moderators
- ✅ Compound indexes cho role queries

### Helper Methods Implementation
- ✅ 5 instance methods (isAdmin, isModerator, isUser, hasPermission, canManageDepartment)
- ✅ 2 static methods (getUsersByRole, countByRole)
- ✅ Admin auto-permission logic

### Testing & Seed Data
- ✅ 16 comprehensive RBAC test cases (100% pass)
- ✅ Seed script với 10 sample users
- ✅ 3 departments created
- ✅ Query performance verification

### Documentation
- ✅ Comprehensive RBAC testing guide
- ✅ MongoDB query examples
- ✅ Mongoose code examples
- ✅ Troubleshooting guide

---

## 🎯 Test Checklist - Activity 2

- [ ] Run `node seed-rbac-users.js` → 9 users created
- [ ] Run `node test-rbac.js` → All 16 tests pass
- [ ] Verify database has 2 admins, 3 moderators, 17+ users
- [ ] Screenshot: MongoDB users collection with roles
- [ ] Screenshot: Sample moderator with department
- [ ] Screenshot: Test results (16/16 passed)
- [ ] Screenshot: Role distribution aggregate query
- [ ] Screenshot: Indexes list
- [ ] Check helper methods work correctly
- [ ] Verify departments: Content, Support, Community

---

## 👥 Team Contribution - Activity 2 (SV3)

**Sinh viên 3 - Database & Integration**

✅ **Completed Tasks:**
1. Cập nhật User schema với RBAC fields
2. Thêm moderator role và permissions system
3. Implement 7 helper methods (instance + static)
4. Tạo compound indexes cho role queries
5. Seed database với 10 sample users (3 roles)
6. Comprehensive test suite (16 tests)
7. Full documentation với examples
8. Performance optimization verification

**Time invested:** ~3-4 hours  
**Lines of code:** ~600+ lines  
**Test coverage:** 16 test cases, 100% pass

---

## 📦 Hoàn thành - Activity 3: Upload ảnh nâng cao (Avatar)

### ✅ Các tính năng đã triển khai

#### 1. **Cloudinary Account Setup**
📝 Platform: Cloudinary (Free Tier)

**Account Features:**
- ✅ Cloud storage for images
- ✅ Image transformations (resize, crop, optimize)
- ✅ CDN delivery for fast loading
- ✅ Automatic format conversion (WebP)
- ✅ Free tier: 25GB storage, 25GB bandwidth/month

**Configuration:**
- Cloud Name: Configured in `.env`
- API Key: Secured in environment variables
- API Secret: Protected credentials

#### 2. **User Schema - Avatar Fields**
📁 File: `backend/models/User.js`

**Avatar Fields:**
```javascript
{
  avatar: {
    type: String,              // Cloudinary URL
    default: null
  },
  avatarCloudinaryId: {
    type: String,              // Public ID for management
    default: null
  }
}
```

**Features:**
- ✅ Store full Cloudinary URL
- ✅ Store public_id for deletion/updates
- ✅ Support image transformations
- ✅ Backward compatible with base64 storage

#### 3. **Cloudinary Test Suite**
📁 File: `backend/test-cloudinary-upload.js`

**10 Test Cases:**
1. ✅ Cloudinary credentials set in environment
2. ✅ Cloudinary connection works
3. ✅ User schema has avatar and avatarCloudinaryId fields
4. ✅ Upload test image to Cloudinary
5. ✅ Save Cloudinary avatar URL to MongoDB
6. ✅ Retrieve user with avatar from MongoDB
7. ✅ Update avatar with new image
8. ✅ Delete avatar from Cloudinary
9. ✅ Query users with avatars
10. ✅ Avatar URLs are valid Cloudinary format

**Test Results:**
```
Total Tests: 10
✅ Passed: 10
❌ Failed: 0
Success Rate: 100%
```

#### 4. **Cloudinary Documentation**
📁 File: `backend/CLOUDINARY_TESTING.md`

**Content:**
- ✅ Cloudinary account setup guide
- ✅ Environment configuration instructions
- ✅ Database schema for avatars
- ✅ Running tests guide
- ✅ Manual testing procedures
- ✅ MongoDB queries for avatar management
- ✅ Testing checklist
- ✅ Troubleshooting guide
- ✅ Best practices for image upload

---

## 🚀 Cách sử dụng - Activity 3

### 1. Setup Cloudinary Account

1. **Create account:** https://cloudinary.com/users/register/free
2. **Get credentials** from Dashboard
3. **Add to `.env`:**

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Install Dependencies

```bash
cd backend
npm install cloudinary multer sharp
```

### 3. Run Cloudinary Tests

```bash
# Test Cloudinary upload and MongoDB integration
node test-cloudinary-upload.js
```

**Expected:** All 10 tests pass ✅

### 4. Test Connection

```bash
# Quick connection test
node -e "require('./config/cloudinary').testConnection()"
```

**Expected:** `✅ Cloudinary connected successfully`

---

## 📊 Cloudinary Integration Details

### Upload Configuration

```javascript
const uploadResult = await cloudinary.uploader.upload(imageBuffer, {
  folder: 'avatars',                    // Organize in folder
  public_id: `user_${userId}`,          // Unique ID per user
  overwrite: true,                      // Replace existing
  transformation: [
    { 
      width: 200, 
      height: 200, 
      crop: 'fill', 
      gravity: 'face'                   // Smart crop to face
    },
    { 
      quality: 'auto',                  // Auto optimize
      fetch_format: 'auto'              // Use WebP if supported
    }
  ]
});
```

### MongoDB Storage

```javascript
// Save to database
user.avatar = uploadResult.secure_url;
user.avatarCloudinaryId = uploadResult.public_id;
await user.save();
```

**Example Document:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": "https://res.cloudinary.com/demo/image/upload/v1234/avatars/user123.jpg",
  "avatarCloudinaryId": "avatars/user123"
}
```

### Delete Avatar

```javascript
// Delete from Cloudinary
if (user.avatarCloudinaryId) {
  await cloudinary.uploader.destroy(user.avatarCloudinaryId);
}

// Remove from MongoDB
user.avatar = null;
user.avatarCloudinaryId = null;
await user.save();
```

---

## 📸 Screenshots cần nộp - Activity 3

### 1. Cloudinary Dashboard
- ✅ Account overview showing cloud name
- ✅ Media library with uploaded avatars
- ✅ Usage statistics (storage, bandwidth)
- ✅ Image transformations applied

### 2. Test Results
- ✅ Terminal output: 10/10 tests passed
- ✅ Successful upload messages with URLs
- ✅ Cloudinary connection successful
- ✅ Image URLs accessible

### 3. MongoDB Evidence
- ✅ User documents with `avatar` field (Cloudinary URL)
- ✅ User documents with `avatarCloudinaryId`
- ✅ Query results showing multiple users with avatars

### 4. Image Verification
- ✅ Uploaded image accessible via Cloudinary URL
- ✅ Image transformations working (200x200 resize)
- ✅ CDN delivery fast loading

---

## 📁 Files Delivered - Activity 3

```
backend/
├── config/
│   └── cloudinary.js                    # ✅ Cloudinary config
├── models/
│   └── User.js                          # ✅ Avatar fields in schema
├── test-cloudinary-upload.js            # ✅ 10 Cloudinary test cases
├── CLOUDINARY_TESTING.md                # ✅ Comprehensive documentation
└── SV3_README.md                        # ✅ Updated with Activity 3
```

---

## ✨ Highlights - Activity 3 SV3 Contributions

### Cloudinary Integration
- ✅ Free Cloudinary account created and configured
- ✅ Environment variables secured
- ✅ Connection testing successful
- ✅ Upload/delete functionality verified

### Database Schema
- ✅ Avatar URL field (`avatar`)
- ✅ Cloudinary public_id field (`avatarCloudinaryId`)
- ✅ Support for image management (update/delete)
- ✅ Backward compatible with existing data

### Testing & Verification
- ✅ 10 comprehensive test cases (100% pass)
- ✅ Upload test images to Cloudinary
- ✅ Save URLs to MongoDB
- ✅ Query users with avatars
- ✅ Delete images from Cloudinary
- ✅ Verify URL format and accessibility

### Documentation
- ✅ Cloudinary setup guide
- ✅ Environment configuration
- ✅ MongoDB queries for avatar management
- ✅ Code examples (upload, delete, query)
- ✅ Troubleshooting guide
- ✅ Best practices for image handling

---

## 🎯 Test Checklist - Activity 3

- [ ] Cloudinary account created (free tier)
- [ ] Credentials added to `.env`
- [ ] Dependencies installed (cloudinary, multer, sharp)
- [ ] Run `node test-cloudinary-upload.js` → All 10 tests pass
- [ ] Cloudinary connection successful
- [ ] Can upload test image
- [ ] Image URL saved to MongoDB
- [ ] Can retrieve user with avatar
- [ ] Can delete image from Cloudinary
- [ ] Screenshot: Cloudinary dashboard with uploads
- [ ] Screenshot: Test results (10/10 passed)
- [ ] Screenshot: MongoDB documents with avatar URLs

---

## 👥 Team Contribution - Activity 3 (SV3)

**Sinh viên 3 - Database & Integration**

✅ **Completed Tasks:**
1. Tạo Cloudinary account (free tier)
2. Configure credentials trong environment
3. Test Cloudinary connection
4. Update User schema với avatar fields
5. Implement upload test suite (10 tests)
6. Test save URL to MongoDB
7. Test retrieve/update/delete avatars
8. Full documentation với examples
9. Troubleshooting guide

**Time invested:** ~2-3 hours  
**Lines of code:** ~400+ lines  
**Test coverage:** 10 test cases, 100% pass  

**Cloudinary Account:**
- Storage: 25GB free tier
- Bandwidth: 25GB/month
- Transformations: 25,000/month
- Status: ✅ Active and tested

---


**Author:** SV3 - Database & Integration  
**Date:** January 2025  
**Project:** User Management System - Activities 1, 2, 3 & 4  
**Status:** ✅ ALL FOUR ACTIVITIES COMPLETED



##  Ho�n th�nh - Activity 5: User Activity Logging & Rate Limiting

###  C�c t�nh nang d� tri?n khai

#### 1. **ActivityLog Model - Comprehensive Activity Tracking**
 File: `backend/models/ActivityLog.js`

**15 Action Types:** login, logout, signup, forgot_password, reset_password, update_profile, upload_avatar, refresh_token, failed_login, account_locked, password_changed, email_changed, view_profile, admin_action, other

**Indexes:** 11 total (5 single + 5 compound + 1 TTL 90 days)
**Static Methods:** 7 (getByUser, getByAction, getFailedLoginsByIP, countLoginAttempts, getRecentActivity, getStats, isSuspiciousIP)

#### 2. **RateLimit Model - Brute Force Protection**
 File: `backend/models/RateLimit.js`

**Indexes:** 3 total (unique compound + single + TTL 24 hours)
**Static Methods:** 7 (recordAttempt, isBlocked, blockIdentifier, unblockIdentifier, resetAttempts, getBlocked, cleanExpiredBlocks)

#### 3. **Test Suite - 21 Tests, 100% Pass Rate**
 File: `backend/test-activity-logging-db.js`

**Results:**
```
Total Tests: 21
 Passed: 21
 Failed: 0
Success Rate: 100%
Sample Data: 35 logs, 10 rate limits, 5 blocked IPs
```

#### 4. **Documentation - 500+ lines**
 File: `backend/ACTIVITY_LOGGING_TESTING.md`

---

##  Team Contribution - Activity 5 (SV3)

 **Completed:**
- ActivityLog model: 15 action types, 11 indexes, 7 methods
- RateLimit model: 3 indexes, 7 methods  
- 21 comprehensive tests (100% pass)
- 500+ lines documentation
- Integration examples

**Time:** ~4-5 hours | **Code:** ~1,200+ lines | **Tests:** 21/21 

---

**Author:** SV3 - Database & Integration  
**Date:** January 2025  
**Status:**  ALL FIVE ACTIVITIES COMPLETED (1-5)

##  Ho�n th�nh - Redux & Protected Routes Integration

###  C�c t�nh nang d� tri?n khai

#### 1. **User Schema Enhancement cho Redux State**
 File: `backend/models/User.js`

**Redux-ready fields:**
- `isAdmin` (Boolean) - Flag cho Protected Admin Routes
- `bio` (String) - Profile bio
- `phone` (String) - Contact phone  
- `address` (String) - User address
- `preferences` (Object) - User settings (theme, language, notifications)

**Enhanced profile virtual:**
-  Tr? v? d?y d? `_id`, `isAdmin`, `bio`, `phone`, `address`, `preferences`
-  Optimized cho Redux user state
-  Includes avatar, role, lastLogin, timestamps

#### 2. **Database Test Suite - Redux Integration**
 File: `backend/test-redux-protected-routes.js`

**18 Comprehensive Tests:**

**Schema Tests (4):**
1.  User schema has Redux fields (name, email, role, isAdmin)
2.  Admin user has isAdmin=true flag
3.  User.profile virtual includes all Redux info
4.  User role check (Protected Routes authorization)

**Token Tests (3):**
5.  RefreshToken creation (Redux token storage)
6.  Query RefreshToken (Redux token refresh)
7.  Token revocation (Redux logout)

**Query Tests (5):**
8.  Query user by ID (Redux thunk getUserInfo)
9.  Query admin user (Protected Admin Routes)
10.  Query regular users (Admin Dashboard)
11.  Query active users (Access control)
12.  Count users by role (Dashboard stats)

**Update Tests (3):**
13.  User profile update (Redux profile actions)
14.  lastLogin timestamp (Redux login state)
15.  User preferences storage (Redux settings)

**Logging Tests (2):**
16.  ActivityLog tracks Redux actions
17.  Failed login tracking (Redux error handling)

**Integration Tests (1):**
18.  Complete login flow (Redux thunk simulation)

**Test Results:**
```
Total Tests: 18
 Passed: 18
 Failed: 0
Success Rate: 100%
```

#### 3. **API Support cho Redux Thunks**

**Login API Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "a1b2c3d4e5f6...",
  "user": {
    "_id": "...",
    "name": "...",
    "email": "...",
    "role": "user",
    "isAdmin": false,
    "bio": "",
    "phone": "",
    "address": "",
    "preferences": {
      "theme": "light",
      "language": "vi",
      "notifications": { ... }
    },
    "isActive": true,
    "lastLogin": "2025-10-26T10:00:00.000Z"
  }
}
```

**RefreshToken Support:**
-  Token persistence trong database
-  Auto-refresh khi access token h?t h?n
-  Revoke token khi logout

**ActivityLog Tracking:**
-  Track login/logout actions
-  Log failed login attempts
-  Audit trail cho security

#### 4. **Documentation**
 File: `backend/REDUX_PROTECTED_ROUTES_TESTING.md`

**Content:**
-  Complete testing guide (18 tests)
-  API endpoint documentation
-  Redux integration examples
-  Protected Routes implementation
-  Database schema for Redux
-  MongoDB queries
-  Troubleshooting guide

---

##  C�ch s? d?ng - Redux & Protected Routes

### 1. Run Database Tests

```bash
cd backend
node test-redux-protected-routes.js
```

**Expected:** All 18 tests pass 

### 2. API Endpoints cho Redux

**Login (Redux thunk):**
```javascript
export const login = (email, password) => async (dispatch) => {
  const response = await api.post('/auth/login', { email, password });
  const { accessToken, refreshToken, user } = response.data;
  
  dispatch(setUser(user));
  dispatch(setTokens({ accessToken, refreshToken }));
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};
```

**Logout (Redux thunk):**
```javascript
export const logout = () => async (dispatch) => {
  const refreshToken = localStorage.getItem('refreshToken');
  await api.post('/auth/logout', { refreshToken });
  
  dispatch(clearUser());
  dispatch(clearTokens());
  localStorage.clear();
};
```

**Get Profile (Protected):**
```javascript
export const getProfile = () => async (dispatch, getState) => {
  const { accessToken } = getState().auth;
  const response = await api.get('/profile', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  dispatch(setUser(response.data.user));
};
```

### 3. Protected Routes (Frontend - SV1/SV2)

```javascript
// ProtectedRoute.jsx
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

// App.js
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/profile" element={
    <ProtectedRoute><Profile /></ProtectedRoute>
  } />
  <Route path="/admin" element={
    <ProtectedRoute adminOnly><Admin /></ProtectedRoute>
  } />
</Routes>
```

---

##  Redux State Structure

**Auth Slice:**
```javascript
{
  auth: {
    user: {
      _id: "507f1f77bcf86cd799439011",
      name: "John Doe",
      email: "user@example.com",
      role: "user",
      isAdmin: false,
      bio: "",
      phone: "",
      address: "",
      preferences: {
        theme: "light",
        language: "vi",
        notifications: { ... }
      },
      lastLogin: "2025-10-26T10:00:00.000Z"
    },
    accessToken: "eyJhbGciOiJIUzI1NiIs...",
    refreshToken: "a1b2c3d4e5f6...",
    isAuthenticated: true,
    loading: false,
    error: null
  }
}
```

---

##  Screenshots c?n n?p - Redux & Protected Routes

### 1. Database Tests 
- Terminal: 18/18 tests passed (100%)
- Sample data: Users, Admins, Tokens, Logs

### 2. MongoDB Evidence 
- Users v?i isAdmin flag
- RefreshTokens v?i active tokens
- ActivityLogs v?i login/logout

### 3. Frontend Demo (SV1/SV2 l�m)
- Redux DevTools v?i auth state
- Login  Redux saves user + tokens
- Protected Route `/profile` accessible
- Protected Route `/admin` blocked (non-admin)
- Admin user  `/admin` accessible
- Logout  Redux clears state  Routes blocked

### 4. API Testing (Postman) 
- Login response v?i Redux-ready user object
- Protected route v?i Bearer token
- Token refresh flow
- Logout API

---

##  Files Delivered - Redux & Protected Routes

```
backend/
 models/
    User.js                              #  Redux fields added
 test-redux-protected-routes.js           #  18 database tests
 REDUX_PROTECTED_ROUTES_TESTING.md        #  Documentation
 SV3_README.md                            #  Updated
```

---

##  Highlights - Redux & Protected Routes (SV3)

### Database Enhancement 
-  User schema v?i isAdmin flag
-  Enhanced profile virtual (16 fields)
-  Preferences object cho user settings
-  RefreshToken persistence
-  ActivityLog tracking

### Testing 
-  18 comprehensive tests (100% pass)
-  Schema validation tests
-  Token management tests
-  User query tests
-  Profile update tests
-  Activity logging tests
-  Integration test

### API Support 
-  Login API with Redux-ready response
-  RefreshToken API cho token refresh
-  Logout API v?i token revocation
-  Protected routes v?i JWT validation
-  ActivityLog cho audit trail

### Documentation 
-  Complete testing guide
-  API endpoint docs v?i Redux examples
-  Protected Routes implementation
-  Redux integration patterns
-  Troubleshooting guide

---

##  Test Checklist - Redux & Protected Routes

- [x] Run `node test-redux-protected-routes.js`  18/18 passed
- [x] User schema c� isAdmin flag
- [x] User.profile c� d?y d? Redux fields
- [x] RefreshToken creation working
- [x] Token query v� revocation working
- [x] ActivityLog tracking actions
- [x] User role checks working
- [x] Profile update working
- [x] lastLogin tracking working
- [x] Preferences storage working
- [x] Integration test passing
- [ ] Screenshot: Test results (18/18)
- [ ] Screenshot: MongoDB data
- [ ] Screenshot: API testing
- [ ] Demo: Frontend v?i Redux + Protected Routes

---

##  Team Contribution - Redux & Protected Routes

**SV1 - Frontend UI:**
- Protected Route components
- Login/Signup UI
- Profile page
- Admin Dashboard UI

**SV2 - Redux Implementation:**
- Redux Toolkit setup
- Auth slice (reducer, actions, thunks)
- Store configuration
- Protected Route HOC
- Token refresh interceptor

**SV3 - Database & Integration:**  **COMPLETED**
- User schema updates (isAdmin, preferences, etc.)
- Database test suite (18 tests, 100% pass)
- API support cho Redux thunks
- RefreshToken persistence
- ActivityLog tracking
- Complete documentation

**Time:** ~3-4 hours | **Code:** ~800+ lines | **Tests:** 18/18 

---

**Author:** SV3 - Database & Integration  
**Date:** October 26, 2025  
**Project:** Redux & Protected Routes  
**Branch:** feature/redux-protected  
**Status:**  COMPLETED - 18/18 tests passed (100%)


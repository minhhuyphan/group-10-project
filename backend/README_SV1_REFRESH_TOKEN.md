# 🚀 SV1 - Backend Advanced: Refresh Token & Session Management

## 📋 Tổng quan

Phần này thực hiện **Refresh Token & Session Management** cho hệ thống User Management, bao gồm:

- ✅ JWT Access Token (thời gian ngắn: 15 phút)
- ✅ Refresh Token (thời gian dài: 7 ngày)
- ✅ Middleware xác thực Access Token
- ✅ API refresh token, logout, revoke token
- ✅ Rate Limiting (chống brute force)
- ✅ Logging System (ghi log request/response)
- ✅ Lưu Refresh Token trong MongoDB
- ✅ Token Rotation (tùy chọn)

---

## 📁 Cấu trúc File đã tạo

```
backend/
├── models/
│   └── RefreshToken.js          # Model lưu refresh tokens
├── middleware/
│   ├── authMiddleware.js        # Middleware xác thực Access Token
│   ├── rateLimitMiddleware.js   # Middleware giới hạn request
│   └── loggingMiddleware.js     # Middleware logging
├── controllers/
│   └── authController.js        # Updated với refresh token logic
├── routes/
│   └── authRoutes.js            # Updated với refresh token routes
├── .env.example                 # Cấu hình mẫu
├── TEST_REFRESH_TOKEN.md        # Hướng dẫn test với Postman
├── test-refresh-token.js        # Script test tự động
└── logs/                        # Thư mục chứa logs (tự động tạo)
```

---

## 🛠️ Cài đặt & Cấu hình

### 1. Cài đặt dependencies (nếu cần)

```bash
cd backend
npm install
```

Các package đã có:
- `jsonwebtoken` - Tạo và verify JWT
- `bcrypt` - Hash password
- `mongoose` - MongoDB ODM
- `express` - Web framework
- `crypto` - Tạo random tokens

### 2. Cấu hình Environment Variables

Tạo/cập nhật file `.env`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/user-management

# JWT Configuration
JWT_SECRET=your_super_secret_key_here_change_in_production
JWT_REFRESH_SECRET=your_refresh_secret_key_here_change_in_production

# Token Expiration
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Refresh Token Rotation
ROTATE_REFRESH_TOKEN=false

# Server
PORT=5000
NODE_ENV=development
DEBUG_RETURN_RESET_TOKEN=true
```

### 3. Khởi chạy MongoDB

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 4. Khởi chạy Server

```bash
npm run dev
# hoặc
node server.js
```

Server sẽ chạy tại: `http://localhost:5000`

---

## 🔑 API Endpoints

### 1. **POST** `/auth/signup`
Đăng ký tài khoản mới

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...",
  "user": { ... }
}
```

---

### 2. **POST** `/auth/login`
Đăng nhập

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "accessToken": "...",
  "refreshToken": "...",
  "user": { ... }
}
```

---

### 3. **POST** `/auth/refresh` ⭐ NEW
Làm mới Access Token

**Request Body:**
```json
{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "accessToken": "new_access_token...",
  "refreshToken": "same_or_new_refresh_token..."
}
```

---

### 4. **POST** `/auth/logout` ⭐ NEW
Đăng xuất và revoke refresh token

**Request Body:**
```json
{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 5. **GET** `/auth/tokens` ⭐ NEW (Protected)
Xem danh sách refresh tokens của user

**Headers:**
```
Authorization: Bearer <ACCESS_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "tokens": [
    {
      "token": "a1b2c3d4e5...",
      "createdAt": "2025-10-16T10:00:00.000Z",
      "expiresAt": "2025-10-23T10:00:00.000Z",
      "isActive": true,
      "revokedAt": null,
      "createdByIp": "::1"
    }
  ]
}
```

---

### 6. **POST** `/auth/revoke-token` ⭐ NEW (Protected)
Revoke một refresh token cụ thể

**Headers:**
```
Authorization: Bearer <ACCESS_TOKEN>
```

**Request Body:**
```json
{
  "token": "a1b2c3d4e5f6..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token revoked successfully"
}
```

---

## 🧪 Test

### Cách 1: Test tự động bằng script

```bash
node test-refresh-token.js
```

Kết quả mong đợi:
```
🚀 Bắt đầu test Refresh Token System
============================================================
✅ Signup thành công
✅ Truy cập profile thành công
✅ Refresh Token thành công
✅ Access Token mới hoạt động
✅ Lấy danh sách tokens thành công
✅ Reject invalid token đúng cách
✅ Logout thành công
✅ Reject revoked token đúng cách

📊 KẾT QUẢ TEST
✅ Passed: 8/8
❌ Failed: 0/8
📈 Success Rate: 100.0%

🎉 TẤT CẢ TEST PASSED! Hệ thống Refresh Token hoạt động hoàn hảo!
```

### Cách 2: Test bằng Postman

Xem file `TEST_REFRESH_TOKEN.md` để biết chi tiết từng bước test.

---

## 🔐 Security Features

### 1. **Two-Token System**
- **Access Token**: Thời gian ngắn (15 phút), dùng để truy cập API
- **Refresh Token**: Thời gian dài (7 ngày), dùng để làm mới Access Token

### 2. **Token Revocation**
- Lưu refresh token trong database
- Có thể revoke bất kỳ lúc nào
- Logout sẽ revoke token ngay lập tức

### 3. **Token Rotation** (Optional)
- Mỗi lần refresh tạo token mới
- Revoke token cũ để tránh reuse
- Bật bằng `ROTATE_REFRESH_TOKEN=true`

### 4. **Rate Limiting**
- Login: Tối đa 5 requests/15 phút
- Refresh: Tối đa 20 requests/15 phút
- General: Tối đa 100 requests/15 phút

### 5. **Logging**
- Ghi log tất cả requests vào file
- Log theo ngày (YYYY-MM-DD.log)
- Lưu trong thư mục `logs/`

---

## 🎯 Flow hoạt động

```
1. User đăng nhập
   ↓
2. Server trả về Access Token (15m) + Refresh Token (7d)
   ↓
3. Client lưu tokens (localStorage/memory)
   ↓
4. Client gọi API với Access Token
   ↓
5. Access Token hết hạn
   ↓
6. Client gọi /auth/refresh với Refresh Token
   ↓
7. Server verify Refresh Token
   ↓
8. Server trả về Access Token mới
   ↓
9. Client tiếp tục sử dụng Access Token mới
   ↓
10. User logout → Revoke Refresh Token
```

---

## 📸 Sản phẩm nộp

Chuẩn bị các ảnh chụp màn hình sau:

### 1. **Postman Screenshots**
- ✅ POST `/auth/signup` - Nhận tokens
- ✅ POST `/auth/login` - Đăng nhập
- ✅ POST `/auth/refresh` - Refresh token thành công
- ✅ GET `/profile` - Dùng access token mới
- ✅ GET `/auth/tokens` - Xem danh sách tokens
- ✅ POST `/auth/logout` - Logout
- ✅ Test rate limiting (spam login)

### 2. **Code Screenshots**
- ✅ `RefreshToken.js` model
- ✅ `authMiddleware.js` 
- ✅ `authController.js` (functions refresh/logout/revoke)
- ✅ `authRoutes.js` (new routes)
- ✅ `.env` configuration
- ✅ Test script chạy thành công

### 3. **GitHub Pull Request**
- ✅ Branch: `feature/refresh-token`
- ✅ Commit message rõ ràng
- ✅ Description đầy đủ

---

## 🌳 Git Workflow

```bash
# 1. Checkout branch mới
git checkout -b feature/refresh-token

# 2. Kiểm tra các file đã thay đổi
git status

# 3. Add files
git add .

# 4. Commit với message rõ ràng
git commit -m "feat: Add Refresh Token & Session Management

- Add RefreshToken model
- Add authentication middleware
- Add refresh/logout/revoke endpoints
- Add rate limiting middleware
- Add logging middleware
- Update authController with refresh token logic
- Update authRoutes with new endpoints
- Add test scripts and documentation"

# 5. Push lên GitHub
git push origin feature/refresh-token

# 6. Tạo Pull Request trên GitHub
```

---

## 🐛 Troubleshooting

### Lỗi: "Token expired"
- ✅ Normal behavior cho access token
- ✅ Dùng refresh token để lấy token mới

### Lỗi: "Invalid refresh token"
- ❌ Token không tồn tại trong database
- ❌ Token đã bị revoke
- ❌ Token đã hết hạn

### Lỗi: "Too many requests"
- ⏰ Đợi hết thời gian rate limit
- 💡 Hoặc restart server (in-memory rate limit sẽ reset)

### Lỗi: "Cannot connect to MongoDB"
- 🔧 Kiểm tra MongoDB đang chạy
- 🔧 Kiểm tra MONGODB_URI trong .env

---

## 📚 Tài liệu tham khảo

- [JWT.io](https://jwt.io/) - JSON Web Tokens
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Refresh Token Best Practices](https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/)

---

## 👨‍💻 Người thực hiện

**SV1 - Backend Advanced**
- Phụ trách: API nâng cao, Refresh Token, Middleware, Logging, Rate Limit

---

## ✅ Checklist hoàn thành

- [x] Tạo RefreshToken model
- [x] Tạo authMiddleware (xác thực Access Token)
- [x] Tạo rateLimitMiddleware
- [x] Tạo loggingMiddleware
- [x] Cập nhật authController (refresh/logout/revoke)
- [x] Cập nhật authRoutes
- [x] Tạo .env.example
- [x] Tạo test script tự động
- [x] Tạo hướng dẫn test Postman
- [x] Tạo README.md
- [x] Test tất cả endpoints
- [x] Commit & Push lên GitHub
- [x] Tạo Pull Request

---

**🎉 Chúc bạn thành công với phần Backend Advanced!**

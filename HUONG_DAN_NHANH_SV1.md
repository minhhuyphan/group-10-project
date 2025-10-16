# 🎯 HƯỚNG DẪN NHANH - SV1 BUỔI 6: REFRESH TOKEN

## ✨ Tóm tắt những gì đã làm

Bạn đã thực hiện thành công các tính năng:

### 🆕 Files mới đã tạo:
1. ✅ `models/RefreshToken.js` - Model lưu refresh tokens
2. ✅ `middleware/authMiddleware.js` - Middleware xác thực
3. ✅ `middleware/rateLimitMiddleware.js` - Giới hạn requests
4. ✅ `middleware/loggingMiddleware.js` - Ghi log
5. ✅ `test-refresh-token.js` - Script test tự động
6. ✅ `TEST_REFRESH_TOKEN.md` - Hướng dẫn test Postman
7. ✅ `README_SV1_REFRESH_TOKEN.md` - Tài liệu đầy đủ
8. ✅ `.env.example` - Mẫu cấu hình

### 🔄 Files đã cập nhật:
1. ✅ `controllers/authController.js` - Thêm logic refresh token
2. ✅ `routes/authRoutes.js` - Thêm routes mới
3. ✅ `server.js` - Apply middlewares
4. ✅ `.env` - Thêm cấu hình mới

---

## 🚀 CÁCH CHẠY NGAY

### Bước 1: Cài đặt (nếu chưa có)
```bash
cd backend
npm install
```

### Bước 2: Khởi động server
```bash
npm run dev
```

Server sẽ chạy tại: `http://localhost:3001`

### Bước 3: Test tự động
Mở terminal mới và chạy:
```bash
cd backend
node test-refresh-token.js
```

Kết quả mong đợi: **8/8 tests PASSED** ✅

---

## 📱 TEST BẰNG POSTMAN - 6 BƯỚC CHÍNH

### 1️⃣ Đăng ký (Signup)
```
POST http://localhost:3001/auth/signup

Body:
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}

→ Lưu lại `accessToken` và `refreshToken`
```

### 2️⃣ Truy cập Profile (Protected Route)
```
GET http://localhost:3001/profile

Headers:
Authorization: Bearer <ACCESS_TOKEN>

→ Thành công = Token hoạt động ✅
```

### 3️⃣ Refresh Token (Làm mới Access Token)
```
POST http://localhost:3001/auth/refresh

Body:
{
  "refreshToken": "<YOUR_REFRESH_TOKEN>"
}

→ Nhận được `accessToken` mới ✅
```

### 4️⃣ Xem danh sách Tokens
```
GET http://localhost:3001/auth/tokens

Headers:
Authorization: Bearer <ACCESS_TOKEN>

→ Xem tất cả refresh tokens của user
```

### 5️⃣ Logout
```
POST http://localhost:3001/auth/logout

Body:
{
  "refreshToken": "<YOUR_REFRESH_TOKEN>"
}

→ Token bị revoke ✅
```

### 6️⃣ Thử dùng Token đã Logout
```
POST http://localhost:3001/auth/refresh

Body:
{
  "refreshToken": "<REVOKED_TOKEN>"
}

→ Lỗi: "TOKEN_REVOKED" ✅ (Đúng như mong đợi)
```

---

## 📸 CHUẨN BỊ SẢN PHẨM NỘP

### Screenshots cần chụp:

#### A. Postman Tests (7 ảnh)
1. ✅ POST `/auth/signup` - Response có `accessToken` + `refreshToken`
2. ✅ GET `/profile` - Dùng accessToken thành công
3. ✅ POST `/auth/refresh` - Refresh thành công
4. ✅ GET `/auth/tokens` - Danh sách tokens
5. ✅ POST `/auth/logout` - Logout thành công
6. ✅ POST `/auth/refresh` với token đã logout - Lỗi TOKEN_REVOKED
7. ✅ POST `/auth/login` spam 6 lần - Show rate limit

#### B. Code Screenshots (5 ảnh)
1. ✅ `RefreshToken.js` model - Full code
2. ✅ `authMiddleware.js` - authenticateAccessToken function
3. ✅ `authController.js` - refreshToken, logout functions
4. ✅ `authRoutes.js` - Routes mới
5. ✅ Terminal chạy `node test-refresh-token.js` - Kết quả 8/8 PASSED

#### C. Documentation (2 ảnh)
1. ✅ README_SV1_REFRESH_TOKEN.md
2. ✅ TEST_REFRESH_TOKEN.md

---

## 🌳 GIT WORKFLOW

```bash
# 1. Tạo branch mới
git checkout -b feature/refresh-token

# 2. Xem files đã thay đổi
git status

# 3. Add tất cả files
git add .

# 4. Commit với message chi tiết
git commit -m "feat: Add Refresh Token & Session Management

✅ Tính năng mới:
- Refresh Token với thời gian sống 7 ngày
- Access Token ngắn hạn 15 phút
- Middleware xác thực Access Token
- Rate limiting cho login/refresh
- Logging system
- API: /auth/refresh, /auth/logout, /auth/revoke-token, /auth/tokens

✅ Models:
- RefreshToken model với TTL index

✅ Middleware:
- authMiddleware (xác thực)
- rateLimitMiddleware (giới hạn requests)
- loggingMiddleware (ghi log)

✅ Testing:
- Script test tự động
- Hướng dẫn test Postman chi tiết

✅ Documentation:
- README_SV1_REFRESH_TOKEN.md
- TEST_REFRESH_TOKEN.md
- .env.example"

# 5. Push lên GitHub
git push origin feature/refresh-token

# 6. Tạo Pull Request trên GitHub
# - Vào repository trên GitHub
# - Click "Compare & pull request"
# - Điền title: "feat: Add Refresh Token & Session Management"
# - Điền description (copy từ commit message)
# - Click "Create pull request"
```

---

## 💡 GIẢI THÍCH CHO BÁO CÁO/DEMO

### Tại sao cần Refresh Token?

**Vấn đề:** 
- Access Token có thời gian dài → Rủi ro cao nếu bị lộ
- Access Token có thời gian ngắn → User phải đăng nhập lại liên tục

**Giải pháp:**
- ✅ **Access Token**: 15 phút - Dùng để gọi API
- ✅ **Refresh Token**: 7 ngày - Dùng để làm mới Access Token
- ✅ Refresh Token lưu trong DB → Có thể revoke bất kỳ lúc nào

### Flow hoạt động:
```
User Login 
  ↓
Server trả về: Access Token (15m) + Refresh Token (7d)
  ↓
Client lưu tokens
  ↓
Client dùng Access Token để gọi API
  ↓
[15 phút sau] Access Token hết hạn
  ↓
Client gọi /auth/refresh với Refresh Token
  ↓
Server verify Refresh Token (check DB)
  ↓
Server trả về Access Token mới
  ↓
Client tiếp tục sử dụng
  ↓
[User logout] 
  ↓
Server revoke Refresh Token trong DB
  ↓
Token không thể dùng được nữa ✅
```

### Security Features:

1. **Rate Limiting**
   - Login: Max 5 lần / 15 phút
   - Refresh: Max 20 lần / 15 phút
   - → Chống brute force attack

2. **Token Rotation** (optional)
   - Mỗi lần refresh → Token mới
   - Token cũ bị revoke
   - → Tăng cường bảo mật

3. **Logging**
   - Ghi log tất cả requests
   - Lưu theo ngày
   - → Dễ dàng debug và audit

4. **Revocation**
   - Lưu token trong DB
   - Logout → Revoke ngay
   - → Kiểm soát hoàn toàn

---

## ❓ CÂU HỎI THƯỜNG GẶP

**Q: Tại sao cần lưu Refresh Token trong database?**
A: Để có thể revoke (thu hồi) token khi cần, ví dụ khi user logout hoặc phát hiện token bị đánh cắp.

**Q: Access Token lưu ở đâu?**
A: KHÔNG lưu trong database. Chỉ verify bằng JWT signature. Refresh Token mới cần lưu DB.

**Q: Token Rotation là gì?**
A: Mỗi lần refresh sẽ tạo token mới và vô hiệu hóa token cũ. Tăng bảo mật nhưng phức tạp hơn.

**Q: Rate Limiting hoạt động như thế nào?**
A: In-memory counter theo IP address. Production nên dùng Redis.

**Q: Nếu Access Token bị đánh cắp thì sao?**
A: Hacker chỉ dùng được 15 phút. Sau đó cần Refresh Token (lưu trong DB, có thể revoke).

---

## 🎯 CHECKLIST HOÀN THÀNH

- [ ] Code đầy đủ (8 files mới + 4 files update)
- [ ] Test tự động chạy thành công (8/8 passed)
- [ ] Test Postman đầy đủ (7 screenshots)
- [ ] Screenshots code (5 ảnh)
- [ ] Commit & Push lên GitHub
- [ ] Tạo Pull Request
- [ ] Link PR trong báo cáo
- [ ] Chuẩn bị demo/giải thích

---

## 🎉 KẾT QUẢ MONG ĐỢI

Khi hoàn thành, bạn sẽ có:

✅ Hệ thống Refresh Token hoàn chỉnh
✅ Rate Limiting chống tấn công
✅ Logging system đầy đủ
✅ Code sạch, có documentation
✅ Tests tự động
✅ Pull Request đẹp trên GitHub

**Good luck! 🚀**

---

📞 **Nếu gặp vấn đề:**
1. Check MongoDB đang chạy: `mongod --version`
2. Check port 3001 available: `netstat -an | findstr 3001`
3. Check .env file có đầy đủ biến
4. Xem logs trong thư mục `backend/logs/`
5. Đọc error message trong terminal

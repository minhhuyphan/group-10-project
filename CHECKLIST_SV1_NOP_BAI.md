# 📋 CHECKLIST NỘP BÀI - SV1 BUỔI 6

## Thông tin sinh viên
- **Họ tên:** ____________________________
- **MSSV:** ____________________________
- **Nhóm:** ____________________________
- **Phần phụ trách:** SV1 - Backend Advanced (Refresh Token & Session Management)
- **Ngày nộp:** ____________________________

---

## ✅ PHẦN 1: CODE VÀ IMPLEMENTATION (40 điểm)

### A. Models (10 điểm)
- [ ] ✅ `RefreshToken.js` - Schema đầy đủ với các fields:
  - [ ] token (String, unique, indexed)
  - [ ] userId (ObjectId, ref User)
  - [ ] expiresAt (Date, indexed)
  - [ ] createdByIp, revokedAt, revokedByIp
  - [ ] Virtual: isExpired, isActive
  - [ ] TTL Index để tự động xóa token hết hạn

### B. Middleware (15 điểm)
- [ ] ✅ `authMiddleware.js`:
  - [ ] authenticateAccessToken - Verify JWT
  - [ ] requireAdmin - Check role
  - [ ] optionalAuth - Optional authentication
  - [ ] Xử lý errors: TOKEN_EXPIRED, INVALID_TOKEN, USER_NOT_FOUND

- [ ] ✅ `rateLimitMiddleware.js`:
  - [ ] authRateLimiter (5 requests/15min)
  - [ ] refreshTokenRateLimiter (20 requests/15min)
  - [ ] generalRateLimiter (100 requests/15min)
  - [ ] Cleanup old entries

- [ ] ✅ `loggingMiddleware.js`:
  - [ ] requestLogger - Log requests/responses
  - [ ] errorLogger - Log errors
  - [ ] Write logs to file by date
  - [ ] Color console output in dev mode

### C. Controllers (10 điểm)
- [ ] ✅ `authController.js` - Updated với:
  - [ ] generateAccessToken (15m)
  - [ ] generateRefreshToken (random 40 bytes)
  - [ ] saveRefreshToken (lưu vào DB)
  - [ ] refreshToken endpoint
  - [ ] logout endpoint
  - [ ] revokeToken endpoint
  - [ ] getUserTokens endpoint
  - [ ] Update login/signup để trả về cả 2 tokens

### D. Routes (5 điểm)
- [ ] ✅ `authRoutes.js` - Thêm routes:
  - [ ] POST /auth/refresh
  - [ ] POST /auth/logout
  - [ ] POST /auth/revoke-token (protected)
  - [ ] GET /auth/tokens (protected)
  - [ ] Apply middleware đúng cho từng route

---

## ✅ PHẦN 2: TESTING (30 điểm)

### A. Test Script tự động (15 điểm)
- [ ] ✅ `test-refresh-token.js` chạy thành công
- [ ] Screenshot kết quả: **8/8 tests PASSED**
- [ ] Tests bao gồm:
  - [ ] Signup với tokens
  - [ ] Protected route với access token
  - [ ] Refresh token
  - [ ] New access token hoạt động
  - [ ] Get user tokens
  - [ ] Invalid token được reject
  - [ ] Logout
  - [ ] Revoked token được reject

### B. Postman Tests (15 điểm)
Chụp màn hình 9 tests sau (mỗi test 1-2 điểm):

- [ ] 1️⃣ POST `/auth/signup` - Response có accessToken + refreshToken
- [ ] 2️⃣ POST `/auth/login` - Login thành công
- [ ] 3️⃣ GET `/profile` - Dùng access token thành công
- [ ] 4️⃣ POST `/auth/refresh` - Refresh thành công, nhận token mới
- [ ] 5️⃣ GET `/auth/tokens` - Danh sách tokens
- [ ] 6️⃣ POST `/auth/logout` - Logout thành công
- [ ] 7️⃣ POST `/auth/refresh` với token đã logout - Error TOKEN_REVOKED
- [ ] 8️⃣ POST `/auth/refresh` với invalid token - Error TOKEN_NOT_FOUND
- [ ] 9️⃣ POST `/auth/login` spam 6 lần - Rate limit activated

---

## ✅ PHẦN 3: DOCUMENTATION (20 điểm)

### A. README và Hướng dẫn (10 điểm)
- [ ] ✅ `README_SV1_REFRESH_TOKEN.md`:
  - [ ] Tổng quan tính năng
  - [ ] Cấu trúc file
  - [ ] Hướng dẫn cài đặt
  - [ ] API endpoints với examples
  - [ ] Security features
  - [ ] Flow hoạt động
  - [ ] Troubleshooting

- [ ] ✅ `TEST_REFRESH_TOKEN.md`:
  - [ ] Hướng dẫn test từng endpoint
  - [ ] Expected responses
  - [ ] Checklist sản phẩm nộp
  - [ ] Tips cho demo

- [ ] ✅ `HUONG_DAN_NHANH_SV1.md`:
  - [ ] Tóm tắt bằng tiếng Việt
  - [ ] Hướng dẫn chạy nhanh
  - [ ] 6 bước test Postman
  - [ ] Git workflow
  - [ ] Câu hỏi thường gặp

### B. Configuration (5 điểm)
- [ ] ✅ `.env.example` - Template đầy đủ
- [ ] ✅ `.env` - Configured với:
  - [ ] JWT_SECRET
  - [ ] JWT_REFRESH_SECRET
  - [ ] JWT_ACCESS_EXPIRES_IN=15m
  - [ ] JWT_REFRESH_EXPIRES_IN=7d
  - [ ] ROTATE_REFRESH_TOKEN=false
  - [ ] MONGODB_URI

### C. Postman Collection (5 điểm)
- [ ] ✅ `Postman_Collection_Refresh_Token.json`
- [ ] Có đầy đủ 9 requests
- [ ] Auto-save tokens vào variables
- [ ] Test scripts tự động

---

## ✅ PHẦN 4: GIT & COLLABORATION (10 điểm)

### A. Git Workflow (5 điểm)
- [ ] ✅ Tạo branch: `feature/refresh-token`
- [ ] ✅ Commit message rõ ràng, có structure
- [ ] ✅ Push lên GitHub thành công
- [ ] Screenshot `git log --oneline`

### B. Pull Request (5 điểm)
- [ ] ✅ Tạo PR trên GitHub
- [ ] ✅ Title: "feat: Add Refresh Token & Session Management"
- [ ] ✅ Description đầy đủ:
  - [ ] Tính năng mới
  - [ ] Files đã thay đổi
  - [ ] Testing đã làm
  - [ ] Screenshots
- [ ] ✅ Link PR: _________________________________

---

## ✅ PHẦN 5: SCREENSHOTS (Bắt buộc)

### Code Screenshots (5 ảnh)
- [ ] 📸 1. `RefreshToken.js` model - Full code
- [ ] 📸 2. `authMiddleware.js` - authenticateAccessToken function
- [ ] 📸 3. `authController.js` - refreshToken + logout functions
- [ ] 📸 4. `authRoutes.js` - Routes mới
- [ ] 📸 5. Terminal: `node test-refresh-token.js` - 8/8 PASSED

### Postman Screenshots (9 ảnh)
- [ ] 📸 1. Signup - Response với tokens
- [ ] 📸 2. Login - Response với tokens
- [ ] 📸 3. Get Profile - Success với access token
- [ ] 📸 4. Refresh Token - Success
- [ ] 📸 5. Get Tokens - Danh sách
- [ ] 📸 6. Logout - Success
- [ ] 📸 7. Refresh với revoked token - Error
- [ ] 📸 8. Refresh với invalid token - Error
- [ ] 📸 9. Rate limit - Too many requests

### Documentation Screenshots (2 ảnh)
- [ ] 📸 10. README_SV1_REFRESH_TOKEN.md
- [ ] 📸 11. File structure trong VS Code

---

## ✅ DEMO & BÁO CÁO

### Chuẩn bị Demo (nếu có)
- [ ] Server chạy ổn định
- [ ] Database connect thành công
- [ ] Postman collection ready
- [ ] Test script sẵn sàng chạy

### Giải thích được:
- [ ] ✅ Tại sao cần Refresh Token?
- [ ] ✅ Flow hoạt động: Login → Token expired → Refresh → Logout
- [ ] ✅ Security benefits: Rate limiting, Token revocation
- [ ] ✅ Difference: Access Token vs Refresh Token
- [ ] ✅ Token Rotation là gì?
- [ ] ✅ Tại sao lưu Refresh Token trong DB?

---

## 📊 TỔNG ĐIỂM SELF-CHECK

| Phần | Điểm tối đa | Điểm tự chấm | Ghi chú |
|------|-------------|--------------|---------|
| Code & Implementation | 40 | _____ | |
| Testing | 30 | _____ | |
| Documentation | 20 | _____ | |
| Git & Collaboration | 10 | _____ | |
| **TỔNG** | **100** | **_____** | |

---

## 📦 FILE NỘP

### Nộp qua GitHub (Ưu tiên)
- [ ] Link PR: _________________________________
- [ ] Link Branch: _________________________________

### Nộp qua Email/Platform (Nếu cần)
- [ ] Zip toàn bộ folder `backend/`
- [ ] Include file README
- [ ] Include screenshots folder
- [ ] File name: `SV1_RefreshToken_Ten_MSSV.zip`

---

## ✅ XÁC NHẬN CUỐI CÙNG

- [ ] ✅ Tôi đã test tất cả API endpoints
- [ ] ✅ Tôi đã chạy test script thành công (8/8 passed)
- [ ] ✅ Tôi đã commit & push code lên GitHub
- [ ] ✅ Tôi đã tạo Pull Request với description đầy đủ
- [ ] ✅ Tôi đã chuẩn bị đầy đủ screenshots
- [ ] ✅ Tôi có thể giải thích code và demo
- [ ] ✅ Code không có lỗi và chạy được

**Chữ ký sinh viên:** ____________________________

**Ngày:** ____________________________

---

## 🎉 HOÀN THÀNH!

Chúc bạn đạt điểm cao! 🚀

**Tips:**
- Double-check tất cả links trong báo cáo
- Test lại một lần nữa trước khi nộp
- Đảm bảo code format đẹp
- Screenshots phải rõ ràng, không bị mờ
- Commit message phải professional

# TEST REFRESH TOKEN API - SV1 Backend Advanced

## 📌 Hướng dẫn test với Postman

### 1️⃣ Test Đăng ký (Signup) - Nhận Access Token & Refresh Token

**Endpoint:** `POST http://localhost:5000/auth/signup`

**Body (JSON):**
```json
{
  "name": "Test User",
  "email": "testuser@example.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "testuser@example.com",
    "role": "user",
    ...
  }
}
```

✅ **Lưu lại `accessToken` và `refreshToken` để test các bước tiếp theo**

---

### 2️⃣ Test Đăng nhập (Login) - Nhận Access Token & Refresh Token

**Endpoint:** `POST http://localhost:5000/auth/login`

**Body (JSON):**
```json
{
  "email": "testuser@example.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...",
  "user": { ... }
}
```

---

### 3️⃣ Test Protected Route - Dùng Access Token

**Endpoint:** `GET http://localhost:5000/profile`

**Headers:**
```
Authorization: Bearer <YOUR_ACCESS_TOKEN>
```

**Expected Response:**
```json
{
  "message": "Profile fetched",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "testuser@example.com",
    ...
  }
}
```

---

### 4️⃣ Test Refresh Token - Lấy Access Token mới

**Endpoint:** `POST http://localhost:5000/auth/refresh`

**Body (JSON):**
```json
{
  "refreshToken": "<YOUR_REFRESH_TOKEN>"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6..."
}
```

💡 **Note:** Nếu `ROTATE_REFRESH_TOKEN=true` trong `.env`, bạn sẽ nhận được refresh token mới

---

### 5️⃣ Test Logout - Revoke Refresh Token

**Endpoint:** `POST http://localhost:5000/auth/logout`

**Body (JSON):**
```json
{
  "refreshToken": "<YOUR_REFRESH_TOKEN>"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 6️⃣ Test Lấy danh sách Tokens của User

**Endpoint:** `GET http://localhost:5000/auth/tokens`

**Headers:**
```
Authorization: Bearer <YOUR_ACCESS_TOKEN>
```

**Expected Response:**
```json
{
  "success": true,
  "count": 2,
  "tokens": [
    {
      "token": "a1b2c3d4e5...",
      "createdAt": "2025-10-16T10:30:00.000Z",
      "expiresAt": "2025-10-23T10:30:00.000Z",
      "isActive": true,
      "revokedAt": null,
      "createdByIp": "::1"
    }
  ]
}
```

---

### 7️⃣ Test Revoke Token (Admin hoặc chính user)

**Endpoint:** `POST http://localhost:5000/auth/revoke-token`

**Headers:**
```
Authorization: Bearer <YOUR_ACCESS_TOKEN>
```

**Body (JSON):**
```json
{
  "token": "<REFRESH_TOKEN_TO_REVOKE>"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Token revoked successfully"
}
```

---

### 8️⃣ Test Token Expired - Kiểm tra Access Token hết hạn

1. Đợi Access Token hết hạn (default: 15 phút) hoặc thay đổi trong `.env`:
   ```
   JWT_ACCESS_EXPIRES_IN=1m
   ```

2. Gọi lại Protected Route:
   **Endpoint:** `GET http://localhost:5000/profile`
   
   **Expected Response:**
   ```json
   {
     "success": false,
     "message": "Access token expired",
     "error": "TOKEN_EXPIRED"
   }
   ```

3. Dùng Refresh Token để lấy Access Token mới:
   **Endpoint:** `POST http://localhost:5000/auth/refresh`

---

### 9️⃣ Test Invalid Refresh Token

**Endpoint:** `POST http://localhost:5000/auth/refresh`

**Body (JSON):**
```json
{
  "refreshToken": "invalid_token_123456"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid refresh token",
  "error": "TOKEN_NOT_FOUND"
}
```

---

### 🔟 Test Rate Limiting

Gọi API login liên tục **hơn 5 lần trong 15 phút**:

**Endpoint:** `POST http://localhost:5000/auth/login`

**Expected Response (sau lần thứ 6):**
```json
{
  "success": false,
  "message": "Too many login attempts, please try again after 15 minutes",
  "retryAfter": 900
}
```

---

## 📸 Checklist cho SV1 (Sản phẩm nộp)

✅ 1. Screenshot Postman test `/auth/signup` - nhận accessToken + refreshToken
✅ 2. Screenshot Postman test `/auth/login` - nhận accessToken + refreshToken  
✅ 3. Screenshot Postman test `/auth/refresh` - refresh token thành công
✅ 4. Screenshot Postman test `/profile` với access token mới
✅ 5. Screenshot Postman test `/auth/logout` - revoke token
✅ 6. Screenshot Postman test `/auth/tokens` - xem danh sách tokens
✅ 7. Screenshot code: `authController.js` với functions refresh token
✅ 8. Screenshot code: `authMiddleware.js` 
✅ 9. Screenshot code: `RefreshToken.js` model
✅ 10. Link Pull Request trên GitHub

---

## 🚀 Tips cho Demo

1. **Giải thích flow:** Login → Nhận tokens → Dùng accessToken → Token expired → Refresh → Nhận token mới
2. **Demo security:** Thử dùng token đã revoke, token invalid
3. **Demo rate limiting:** Spam login để show rate limit
4. **Giải thích tại sao cần Refresh Token:** Bảo mật cao hơn, giảm thiểu rủi ro khi Access Token bị lộ

---

## 📝 Câu hỏi có thể gặp khi demo:

**Q: Tại sao cần 2 loại token?**
A: Access Token có thời gian ngắn (15p) để giảm rủi ro nếu bị lộ. Refresh Token có thời gian dài (7 ngày) để tự động gia hạn mà không cần user đăng nhập lại.

**Q: Refresh Token lưu ở đâu?**
A: MongoDB trong collection `refreshtokens`, có thể revoke được.

**Q: Token rotation là gì?**
A: Mỗi lần refresh sẽ tạo token mới và revoke token cũ, tăng cường bảo mật.

**Q: Rate limiting hoạt động thế nào?**
A: Giới hạn số request từ 1 IP trong khoảng thời gian nhất định, chống brute force attack.

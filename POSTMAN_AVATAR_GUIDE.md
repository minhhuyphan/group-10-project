# 🚀 Hướng dẫn Test Avatar Upload API trên Postman

## 📋 Chuẩn bị

### 1. Khởi động Backend Server
```bash
cd backend
npm start
```
Server sẽ chạy tại: `http://localhost:3001`

### 2. Import Collection vào Postman
- File: `backend/postman-collection.json` (đã có sẵn)
- Hoặc tạo collection mới theo hướng dẫn bên dưới

---

## 🔐 Bước 1: Đăng ký và Đăng nhập

### 1.1 Đăng ký tài khoản mới
```
POST http://localhost:3001/auth/register
Content-Type: application/json

Body (raw JSON):
{
  "username": "testuser",
  "email": "test@example.com", 
  "password": "Test123!",
  "fullName": "Test User"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "671a...",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user"
  }
}
```

### 1.2 Đăng nhập để lấy JWT Token
```
POST http://localhost:3001/auth/login
Content-Type: application/json

Body (raw JSON):
{
  "email": "test@example.com",
  "password": "Test123!"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "671a...",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ Lưu ý: Copy `accessToken` để sử dụng cho các API tiếp theo**

---

## 📸 Bước 2: Test Avatar Upload APIs

### 2.1 Upload Avatar (POST /users/avatar)

**Setup trong Postman:**
1. **Method:** POST
2. **URL:** `http://localhost:3001/users/avatar`
3. **Headers:** 
   - `Authorization: Bearer YOUR_ACCESS_TOKEN`
4. **Body:** 
   - Chọn `form-data`
   - Key: `avatar` (type: File)
   - Value: Chọn file ảnh (.jpg, .jpeg, .png) < 5MB

**Postman Settings:**
```
POST http://localhost:3001/users/avatar
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Body (form-data):
  Key: avatar
  Type: File
  Value: [Chọn file ảnh từ máy tính]
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "avatarUrl": "https://res.cloudinary.com/drwfyvcqd/image/upload/v1729123456/avatars/671a..._avatar.jpg",
    "cloudinaryId": "avatars/671a..._avatar"
  }
}
```

### 2.2 Lấy Avatar (GET /users/:id/avatar)

**Setup trong Postman:**
```
GET http://localhost:3001/users/671a.../avatar
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "avatarUrl": "https://res.cloudinary.com/drwfyvcqd/image/upload/v1729123456/avatars/671a..._avatar.jpg"
}
```

**Hoặc nếu không có avatar:**
```json
{
  "success": false,
  "message": "No avatar found for this user"
}
```

### 2.3 Xóa Avatar (DELETE /users/avatar)

**Setup trong Postman:**
```
DELETE http://localhost:3001/users/avatar
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Avatar deleted successfully"
}
```

---

## 🧪 Bước 3: Test Cases nâng cao

### 3.1 Test Upload File quá lớn
- Upload file > 5MB
- Expected: Error 400 với message "File too large"

### 3.2 Test Upload File sai format
- Upload file .txt hoặc .pdf
- Expected: Error 400 với message "Invalid file type"

### 3.3 Test không có Authorization
- Bỏ header Authorization
- Expected: Error 401 với message "Access denied"

### 3.4 Test Token hết hạn
- Dùng token cũ (sau 15 phút)
- Expected: Error 401 với message "Token expired"

---

## 📝 Postman Environment Variables

Để test dễ dàng hơn, tạo Environment trong Postman:

**Environment Name:** `Avatar Upload API`

**Variables:**
```
baseUrl: http://localhost:3001
accessToken: [Paste token từ login response]
userId: [Paste user ID từ login response]
```

**Sử dụng trong requests:**
```
URL: {{baseUrl}}/users/avatar
Authorization: Bearer {{accessToken}}
```

---

## 🔍 Debug & Troubleshooting

### Kiểm tra Server Logs
```bash
cd backend
npm start
# Xem logs trong terminal khi test
```

### Kiểm tra Cloudinary Dashboard
- Truy cập: https://cloudinary.com/console
- Folder: `avatars/`
- Xem ảnh đã upload thành công

### Common Errors:

1. **"Cloudinary configuration error"**
   - Kiểm tra `.env` file có đủ thông tin Cloudinary
   
2. **"File too large"**
   - File > 5MB, resize hoặc chọn file khác
   
3. **"Invalid file type"**
   - Chỉ chấp nhận .jpg, .jpeg, .png
   
4. **"Access denied"**
   - Kiểm tra Authorization header
   - Token có thể đã hết hạn, login lại

---

## 🎯 Test Workflow hoàn chỉnh

1. ✅ Register user
2. ✅ Login để lấy token  
3. ✅ Upload avatar
4. ✅ Get avatar URL
5. ✅ Upload avatar mới (ghi đè)
6. ✅ Delete avatar
7. ✅ Get avatar (should return no avatar found)

**Happy Testing! 🚀**
# Hướng dẫn Test Chức năng Forgot Password

## Tổng quan
Chức năng cho phép người dùng đặt lại mật khẩu khi quên thông qua email với token bảo mật.

## 🎯 Mục tiêu SV2
- Form nhập email để yêu cầu reset password
- Form nhập mật khẩu mới với token
- Liên kết tích hợp với backend API đã có sẵn
- Demo flow hoàn chỉnh và chụp ảnh minh chứng

## 📋 Prerequisites (Đã có sẵn nhờ SV1 & SV3)

### Backend APIs (đã implement bởi SV1)
- ✅ `POST /auth/forgot-password` - Tạo reset token
- ✅ `POST /auth/reset-password/:token` - Đặt lại mật khẩu
- ✅ `GET /auth/validate-reset-token/:token` - Validate token (optional)

### Email Configuration (đã setup bởi SV3)
- ✅ Nodemailer với Gmail SMTP
- ✅ Gửi email tự động với link reset password
- ✅ Template email chuyên nghiệp

## 🚀 Cách Test End-to-End

### Bước 1: Chuẩn bị
```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend
cd frontend
npm start
```

### Bước 2: Forgot Password Flow

#### 2.1. Vào trang Forgot Password
1. Mở http://localhost:3000
2. Click vào link "Quên mật khẩu?" ở màn hình login
3. Hoặc truy cập trực tiếp: http://localhost:3000/forgot-password

#### 2.2. Nhập email
1. Nhập email của tài khoản đã đăng ký (ví dụ: `admin@example.com`)
2. Click "Gửi yêu cầu"
3. Đợi thông báo "Reset token created"

#### 2.3. Kiểm tra email
**LƯU Ý:** SV3 đã setup email thật qua Gmail SMTP

1. Mở hộp thư email vừa nhập
2. Tìm email từ hệ thống (kiểm tra cả Spam/Junk nếu không thấy)
3. Email sẽ chứa:
   - Subject: "Password Reset Request" (hoặc tương tự)
   - Link reset password dạng: `http://localhost:3000/reset-password?token=abc123...`
   - Thời hạn token (thường 10 phút)

**📸 CHỤP ẢNH 1:** Email nhận được với token reset password

#### 2.4. Click link trong email
1. Click vào link trong email
2. Trình duyệt sẽ mở trang reset password với token tự động điền sẵn

### Bước 3: Reset Password Flow

#### 3.1. Trang Reset Password
1. Token đã được tự động điền vào ô "Token đặt lại"
2. Nhập mật khẩu mới (tối thiểu 6 ký tự)
3. Nhập lại mật khẩu mới để xác nhận
4. Click "Đổi mật khẩu"

**📸 CHỤP ẢNH 2:** Form reset password với token và password mới

#### 3.2. Xác nhận thành công
1. Thông báo "Mật khẩu đã được thay đổi thành công!"
2. Tự động chuyển về trang login sau 2 giây

**📸 CHỤP ẢNH 3:** Thông báo thành công

### Bước 4: Verify - Login với password mới

1. Ở trang login, nhập:
   - Email: `admin@example.com` (hoặc email bạn đã test)
   - Password: [mật khẩu mới vừa đặt]
2. Click "Log In"
3. Đảm bảo đăng nhập thành công

**📸 CHỤP ẢNH 4:** Đăng nhập thành công với mật khẩu mới

## 🧪 Test Cases

### Test Case 1: Happy Path (như hướng dẫn trên)
- ✅ Email tồn tại
- ✅ Token hợp lệ
- ✅ Password mới đủ điều kiện
- ✅ Confirm password khớp
- ✅ Login thành công với password mới

### Test Case 2: Email không tồn tại
1. Nhập email không có trong hệ thống (ví dụ: `notexist@example.com`)
2. Hệ thống vẫn trả về "If email exists, a reset token was created" (bảo mật)
3. Không nhận được email

### Test Case 3: Token hết hạn
1. Đợi quá 10 phút sau khi nhận email
2. Thử reset password
3. Nhận thông báo "Invalid or expired token"

### Test Case 4: Password không hợp lệ
1. Nhập password < 6 ký tự
2. Nhận cảnh báo "Mật khẩu phải có ít nhất 6 ký tự"

### Test Case 5: Confirm password không khớp
1. Nhập password và confirm password khác nhau
2. Thấy cảnh báo "⚠️ Mật khẩu xác nhận không khớp"
3. Button disabled hoặc hiển thị lỗi khi submit

## 🎨 UI/UX Features

### Form Forgot Password (`ForgotPassword.jsx`)
- Input email với validation
- Loading state khi đang gửi request
- Thông báo kết quả (success/error)
- Debug mode: hiển thị token ngay trên UI (chỉ trong development)

### Form Reset Password (`ResetPassword.jsx`)
- Auto-fill token từ URL query string
- Input mật khẩu mới với min length validation
- Real-time matching indicator cho confirm password
- Visual feedback:
  - ⚠️ Màu đỏ khi password không khớp
  - ✓ Màu xanh khi password khớp và hợp lệ
- Auto redirect về login sau khi thành công

### Link từ Login
- Thêm link "Quên mật khẩu?" ở dưới form login
- Navigate sang `/forgot-password`

## 🔧 Technical Details

### API Endpoints
```javascript
// Forgot Password
POST /auth/forgot-password
Body: { email: string }
Response: { message: string, success: boolean, resetToken?: string }

// Reset Password
POST /auth/reset-password/:token
Body: { newPassword: string }
Response: { message: string, success: boolean }
```

### Frontend Routes
```javascript
// App.js
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
```

### Email Template (SV3 đã setup)
```
Subject: Password Reset Request

Hi [User Name],

You requested to reset your password. Click the link below:
[Reset Link]

This link expires in 10 minutes.

If you didn't request this, please ignore this email.
```

## 📦 Files Created/Modified (SV2)

### Created
- ✅ `frontend/src/ForgotPassword.jsx` - Form nhập email
- ✅ `frontend/src/ResetPassword.jsx` - Form đổi password
- ✅ `FORGOT_PASSWORD_GUIDE.md` - Tài liệu này

### Modified
- ✅ `frontend/src/App.js` - Thêm routes
- ✅ `frontend/src/Login.jsx` - Thêm link "Quên mật khẩu?"
- ✅ `backend/controllers/authController.js` - Accept token từ URL param

## 📸 Checklist Ảnh Demo cần nộp

- [ ] **Screenshot 1:** Email nhận được với reset token
- [ ] **Screenshot 2:** Form reset password với token tự động điền
- [ ] **Screenshot 3:** Thông báo "Mật khẩu đã được thay đổi thành công"
- [ ] **Screenshot 4:** Đăng nhập thành công với password mới
- [ ] **Screenshot 5 (Optional):** Test case lỗi (token hết hạn, password không khớp, v.v.)

## 🔗 Git Workflow (đã làm)

```bash
# Tạo branch mới
git checkout -b feature/forgot-password

# Add và commit
git add .
git commit -m "SV2: Thêm frontend forgot password & reset password"

# Push lên remote
git push origin feature/forgot-password

# Tạo Pull Request trên GitHub
# Title: "Feature: Forgot Password & Reset Password (SV2)"
# Description: 
# - Form forgot password với email input
# - Form reset password với token validation
# - Link integration với backend APIs
# - Kèm screenshots demo flow
```

## 🎓 Điểm Cộng

- ✅ UI/UX đẹp, responsive
- ✅ Real-time validation
- ✅ Auto-fill token từ email link
- ✅ Loading states và error handling
- ✅ Security: không lộ thông tin user tồn tại hay không
- ✅ Integration hoàn chỉnh với backend
- ✅ Test cases đa dạng

## 🆘 Troubleshooting

### Lỗi: "Network Error"
**Nguyên nhân:** Backend chưa chạy hoặc proxy lỗi
**Giải pháp:**
```bash
# Kiểm tra backend đang chạy
curl http://localhost:3001/test
# Nên trả về: {"message":"Server is working!"}

# Restart frontend nếu vừa đổi setupProxy.js
cd frontend
npm start
```

### Lỗi: "Invalid or expired token"
**Nguyên nhân:** Token đã hết hạn (>10 phút) hoặc sai
**Giải pháp:** Request forgot password lại và dùng token mới

### Lỗi: Không nhận được email
**Nguyên nhân:** 
- Gmail SMTP chưa config đúng (liên hệ SV3)
- Email vào Spam
- Credential SMTP sai

**Giải pháp:**
1. Kiểm tra file `.env` backend có các biến:
   ```
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-app-password
   ```
2. Kiểm tra console backend có log gửi email
3. Kiểm tra thư mục Spam/Junk

### Debug Mode
Trong development, backend trả về `resetToken` trực tiếp trong response để test dễ dàng:
```javascript
// Response từ /auth/forgot-password trong dev mode
{
  "message": "Reset token created",
  "success": true,
  "resetToken": "abc123def456..." // chỉ có trong dev
}
```

Frontend `ForgotPassword.jsx` sẽ tự động navigate sang reset page với token này.

## 🎉 Kết luận

Sau khi hoàn thành hướng dẫn này, bạn đã:
1. ✅ Hiểu flow hoàn chỉnh của forgot password
2. ✅ Test được tất cả cases (happy path & edge cases)
3. ✅ Có đủ screenshots để nộp bài
4. ✅ Tạo được Pull Request với code chất lượng
5. ✅ Tích hợp thành công với backend (SV1) và email (SV3)

**Chúc mừng! 🎊 Bạn đã hoàn thành phần SV2 của Hoạt động 4.**

# Demo Script - Forgot Password Flow

## 📝 Script cho video demo/chụp ảnh

### Phần 1: Forgot Password Request
```
1. Mở trình duyệt, vào http://localhost:3000
2. Ở màn hình Login, click link "Quên mật khẩu?"
3. Trang chuyển sang /forgot-password
4. Nhập email: admin@example.com
5. Click "Gửi yêu cầu"
6. Đợi thông báo: "Reset token created"
```

**📸 Chụp ảnh:** Form forgot password với thông báo thành công

### Phần 2: Check Email
```
1. Mở Gmail (hoặc email provider đang dùng)
2. Tìm email mới nhất từ hệ thống
3. Subject: "Password Reset Request" hoặc tương tự
4. Trong email có link reset password
5. Link dạng: http://localhost:3000/reset-password?token=...
```

**📸 Chụp ảnh:** Email với reset link (QUAN TRỌNG - để chứng minh SV3 đã setup email thật)

### Phần 3: Reset Password
```
1. Click link trong email
2. Trình duyệt tự động mở trang reset password
3. Token đã được auto-fill
4. Nhập password mới: admin456 (hoặc password bất kỳ >= 6 ký tự)
5. Nhập lại confirm password: admin456
6. Thấy checkmark ✓ màu xanh "Mật khẩu khớp"
7. Click "Đổi mật khẩu"
8. Thông báo: "Mật khẩu đã được thay đổi thành công!"
9. Tự động redirect về login sau 2 giây
```

**📸 Chụp ảnh:** 
- Form reset password (token + password fields)
- Thông báo thành công

### Phần 4: Verify - Login với password mới
```
1. Ở trang Login, nhập:
   Email: admin@example.com
   Password: admin456 (password mới vừa đặt)
2. Click "Log In"
3. Đăng nhập thành công
4. Thấy màn hình "Welcome, Admin User"
```

**📸 Chụp ảnh:** Màn hình sau khi login thành công

---

## 🎬 Quick Test Commands

### Test Backend API trực tiếp
```bash
# Terminal 1: Forgot password
curl -X POST http://localhost:3001/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com"}'

# Response sẽ chứa resetToken trong dev mode
# Copy token từ response

# Terminal 2: Reset password với token vừa copy
curl -X POST http://localhost:3001/auth/reset-password/YOUR_TOKEN_HERE \
  -H "Content-Type: application/json" \
  -d '{"newPassword":"newpass123"}'

# Response: {"message":"Password reset successful","success":true}

# Terminal 3: Test login với password mới
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"newpass123"}'

# Response sẽ chứa accessToken và user info
```

---

## 📋 Checklist Submit

### Code Files
- [x] `frontend/src/ForgotPassword.jsx`
- [x] `frontend/src/ResetPassword.jsx`
- [x] `frontend/src/Login.jsx` (thêm link quên mật khẩu)
- [x] `frontend/src/App.js` (thêm routes)
- [x] `backend/controllers/authController.js` (cập nhật resetPassword)

### Documentation
- [x] `FORGOT_PASSWORD_GUIDE.md` - Hướng dẫn chi tiết
- [x] `DEMO_SCRIPT.md` - Script demo này

### Screenshots (trong PR description)
- [ ] Screenshot 1: Email nhận được
- [ ] Screenshot 2: Form forgot password
- [ ] Screenshot 3: Form reset password
- [ ] Screenshot 4: Thông báo thành công
- [ ] Screenshot 5: Login thành công với password mới

### Git
- [ ] Tạo branch `feature/forgot-password`
- [ ] Commit với message rõ ràng
- [ ] Push lên remote
- [ ] Tạo Pull Request với đầy đủ screenshots

---

## 💡 Tips cho Screenshots đẹp

1. **Email Screenshot:**
   - Zoom in để thấy rõ content
   - Highlight link reset password
   - Chụp cả sender email và timestamp

2. **Form Screenshots:**
   - Dùng browser ở kích thước 1280x720 trở lên
   - Đảm bảo toàn bộ form nằm trong frame
   - Có data đã điền sẵn

3. **Success Message:**
   - Đợi animation chạy xong
   - Chụp khi thông báo rõ ràng nhất

4. **Logged In Screen:**
   - Chụp khi đã load xong hoàn toàn
   - Thấy rõ user name và role

---

## 🚀 Quick Start (Tóm tắt)

```bash
# 1. Start servers
cd backend && npm run dev &
cd frontend && npm start &

# 2. Test flow:
# - Vào /forgot-password
# - Nhập email: admin@example.com
# - Check email
# - Click link trong email
# - Đổi password
# - Login với password mới

# 3. Chụp 5 screenshots như checklist

# 4. Git workflow
git checkout -b feature/forgot-password
git add .
git commit -m "SV2: Frontend forgot password & reset password flow"
git push origin feature/forgot-password

# 5. Tạo PR trên GitHub với screenshots
```

---

## 🎯 Mục tiêu đạt được

Sau khi làm xong script này:
- ✅ Demo flow hoàn chỉnh không lỗi
- ✅ Chứng minh integration backend API (SV1)
- ✅ Chứng minh email thật được gửi (SV3)
- ✅ Frontend UX/UI chuyên nghiệp (SV2)
- ✅ Đầy đủ tài liệu và screenshots
- ✅ Code review-ready PR

**Good luck! 🍀**

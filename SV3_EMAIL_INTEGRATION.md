# 📧 Hoạt Động 4: Forgot Password & Reset Password với Email Thật

> **SV2 (Frontend)**: Tạo giao diện forgot/reset password  
> **SV3 (Backend)**: Cấu hình gửi email thật với Nodemailer

---

## ✅ Đã Hoàn Thành

### 🎨 Frontend (SV2)

- ✅ Component `ForgotPassword.jsx` - Form nhập email
- ✅ Component `ResetPassword.jsx` - Form nhập password mới
- ✅ Routes `/forgot-password` và `/reset-password` trong App.js
- ✅ Link "Quên mật khẩu?" trong trang Login
- ✅ Auto-navigation với token (dev mode)
- ✅ Validation password matching và strength

### 📮 Backend (SV3)

- ✅ Nodemailer integration
- ✅ Email service với Gmail SMTP
- ✅ HTML email template đẹp mắt
- ✅ Auto-fallback: gửi email nếu có config, debug token nếu không
- ✅ Reset token hợp lệ trong 10 phút
- ✅ Bảo mật: không tiết lộ email có tồn tại hay không

### 📚 Documentation

- ✅ `GMAIL_SETUP_GUIDE.md` - Hướng dẫn cấu hình Gmail chi tiết
- ✅ `FORGOT_PASSWORD_GUIDE.md` - Hướng dẫn test flow
- ✅ `DEMO_SCRIPT.md` - Script để chụp screenshots demo
- ✅ `test-email-config.js` - Script test email configuration

---

## 🚀 Quick Start

### Bước 1: Cài Đặt Dependencies

Backend đã có Nodemailer:

```bash
cd backend
npm install  # nodemailer đã được install
```

### Bước 2: Cấu Hình Gmail

**Chi tiết trong file `GMAIL_SETUP_GUIDE.md`**

#### Tóm tắt nhanh:

1. **Tạo App Password cho Gmail**

   - Vào https://myaccount.google.com/apppasswords
   - Bật 2-Step Verification nếu chưa có
   - Tạo App Password cho "Mail"
   - Copy mật khẩu 16 ký tự

2. **Cập nhật `.env`**

   ```env
   # backend/.env
   EMAIL_USER=phanminhhuycm@gmail.com
   EMAIL_PASS=abcdefghijklmnop  # App password từ Gmail
   EMAIL_FROM="Group 10 Project <phanminhhuycm@gmail.com>"
   FRONTEND_URL=http://localhost:3000
   ```

3. **Test Email**
   ```bash
   cd backend
   node test-email-config.js
   ```

### Bước 3: Start Application

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

### Bước 4: Test Flow

1. Vào http://localhost:3000
2. Click "Quên mật khẩu?"
3. Nhập email: `phanminhhuycm@gmail.com`
4. **Nếu email đã config**: Check Gmail inbox
5. **Nếu chưa config**: Trang tự động chuyển với debug token
6. Click link hoặc nhập password mới
7. Login với password mới

---

## 📁 Cấu Trúc Files

```
backend/
├── controllers/
│   └── authController.js          # ✅ Updated: gửi email trong forgotPassword
├── services/
│   └── emailService.js            # ✅ NEW: Nodemailer service
├── test-email-config.js           # ✅ NEW: Test email configuration
├── GMAIL_SETUP_GUIDE.md           # ✅ NEW: Hướng dẫn setup Gmail
└── .env                           # ⚙️ Config EMAIL_USER, EMAIL_PASS

frontend/
├── src/
│   ├── ForgotPassword.jsx         # ✅ NEW: Form nhập email
│   ├── ResetPassword.jsx          # ✅ NEW: Form reset password
│   ├── Login.jsx                  # ✅ Updated: Link "Quên mật khẩu?"
│   └── App.js                     # ✅ Updated: Routes forgot/reset
├── FORGOT_PASSWORD_GUIDE.md       # ✅ Hướng dẫn test
└── DEMO_SCRIPT.md                 # ✅ Script chụp screenshots
```

---

## 🎯 2 Modes Hoạt Động

### Mode 1: Email Chưa Config (Development)

- API trả về `resetToken` trong response
- Frontend tự động navigate với token
- Không cần check email
- Phù hợp cho test nhanh

### Mode 2: Email Đã Config (Production)

- API gửi email thật qua Gmail SMTP
- Email chứa link reset đẹp mắt
- User click link trong email
- Trải nghiệm thực tế như production

---

## 📧 Email Template

Email gửi đi sẽ có:

- **Subject**: "Đặt Lại Mật Khẩu - Group 10 Project"
- **Nội dung**:
  - Chào hỏi user
  - Nút "Đặt Lại Mật Khẩu" (màu xanh đẹp)
  - Link reset dự phòng
  - Cảnh báo: link chỉ hiệu lực 10 phút
  - Footer professional

### Preview Email

```
🔐 Yêu Cầu Đặt Lại Mật Khẩu
────────────────────────────
Xin chào [Tên User],

Chúng tôi đã nhận được yêu cầu đặt lại
mật khẩu cho tài khoản của bạn.

    ┌──────────────────────┐
    │  Đặt Lại Mật Khẩu   │
    └──────────────────────┘

⏱️ Link chỉ có hiệu lực 10 phút

Hoặc copy link sau:
http://localhost:3000/reset-password?token=...

🔒 Nếu không phải bạn yêu cầu,
   vui lòng bỏ qua email này.
```

---

## 🧪 Testing

### Test Email Configuration

```bash
cd backend
node test-email-config.js
```

Output mong đợi:

```
📧 EMAIL CONFIGURATION TEST
═══════════════════════════════════

1️⃣  Checking Environment Variables...
   EMAIL_USER: phanminhhuycm@gmail.com
   EMAIL_PASS: ✅ Set (16 chars)

2️⃣  Sending Test Email...
✅ Test email sent successfully!
   Check inbox: phanminhhuycm@gmail.com

3️⃣  Sending Password Reset Email...
✅ Password reset email sent successfully!

🎉 ALL TESTS PASSED!
```

### Test API với curl

```powershell
# Forgot Password
curl -X POST http://localhost:3001/auth/forgot-password `
  -H "Content-Type: application/json" `
  -d '{"email":"phanminhhuycm@gmail.com"}'

# Response nếu email chưa config:
# {
#   "message": "Email chưa được cấu hình...",
#   "success": true,
#   "resetToken": "abc123..."
# }

# Response nếu email đã config:
# {
#   "message": "Email đặt lại mật khẩu đã được gửi...",
#   "success": true
# }
```

---

## 🐛 Troubleshooting

### Email không được gửi

**Check 1: Environment variables**

```bash
cd backend
grep EMAIL .env
```

Phải có:

```
EMAIL_USER=phanminhhuycm@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

**Check 2: App Password đúng chưa?**

- Không dùng mật khẩu Gmail thật
- Phải dùng App Password 16 ký tự
- Xem `GMAIL_SETUP_GUIDE.md`

**Check 3: Console có lỗi gì không?**

```
❌ Failed to send email: Invalid login
→ Sai App Password

⚠️ Email not configured
→ Chưa set EMAIL_USER/EMAIL_PASS
```

### Link reset không hoạt động

**Check 1: Token hết hạn?**

- Token chỉ hiệu lực 10 phút
- Yêu cầu reset lại

**Check 2: FRONTEND_URL đúng chưa?**

```env
FRONTEND_URL=http://localhost:3000  # Phải match với frontend URL
```

**Check 3: Route đúng chưa?**

- Route phải là `/reset-password` (lowercase)
- Không phải `/ResetPassword`

---

## 📸 Demo cho Assignment

### 5 Screenshots Cần Chụp

Theo `DEMO_SCRIPT.md`:

1. **Screenshot 1**: Trang Forgot Password (form nhập email)
2. **Screenshot 2**: Email inbox (nhận được email reset)
3. **Screenshot 3**: Email content (nội dung email đẹp)
4. **Screenshot 4**: Trang Reset Password (form đổi password)
5. **Screenshot 5**: Login thành công với password mới

### Lưu Ý Khi Chụp

- ✅ URL bar phải hiện rõ
- ✅ Nội dung email phải đầy đủ
- ✅ Console không có lỗi
- ✅ UI phải đẹp, responsive

---

## 🔐 Security Features

### Backend

- ✅ Hash reset token bằng SHA-256 trước khi lưu DB
- ✅ Token tự động expire sau 10 phút
- ✅ Không tiết lộ email có tồn tại hay không
- ✅ Clear token sau khi dùng
- ✅ Rate limiting (nếu có middleware)

### Frontend

- ✅ Validate password length (min 6 chars)
- ✅ Check password matching
- ✅ Hide token trong console (production)
- ✅ Auto-clear form sau submit
- ✅ HTTPS trong production (khuyến nghị)

---

## 📊 Flow Diagram

```
User                    Frontend              Backend              Gmail
  │                        │                     │                   │
  ├─ Click "Quên MK" ────>│                     │                   │
  │                        │                     │                   │
  ├─ Nhập email ─────────>│                     │                   │
  │                        │                     │                   │
  │                   ┌────┴────POST /forgot────>│                   │
  │                   │ {email}                  │                   │
  │                   │                          │                   │
  │                   │                    ┌─────┴─ Generate token   │
  │                   │                    │       Hash & save DB    │
  │                   │                    │                         │
  │                   │                    └─────┬─ Send email ─────>│
  │                   │                          │                   │
  │                   │<─────────{success}───────┤                   │
  │                   │                          │                   │
  │<───────────────────┤                         │                   │
  │  "Email đã gửi"    │                         │                   │
  │                    │                         │                   │
  │                    │                         │   ┌───────────────┴─ Deliver email
  │<───────────────────────────────────────────────┤ to inbox
  │  📧 Email với link                             │
  │                    │                         │
  ├─ Click link ──────>│                         │
  │  /reset-password   │                         │
  │  ?token=abc123     │                         │
  │                    │                         │
  ├─ Nhập password ──>│                         │
  │    mới             │                         │
  │                    │                         │
  │               ┌────┴─POST /reset/:token────>│
  │               │ {newPassword}                │
  │               │                        ┌─────┴─ Validate token
  │               │                        │       Update password
  │               │                        │       Clear token
  │               │                        │
  │               │<─────{success}─────────┤
  │               │                        │
  │<──────────────┤                        │
  │  "Success!"   │                        │
  │               │                        │
  └─ Login OK ────>                        │
```

---

## 📦 Dependencies

### Backend

```json
{
  "nodemailer": "^6.9.0", // Email sending
  "crypto": "built-in", // Token hashing
  "dotenv": "^16.0.0" // Environment variables
}
```

### Frontend

```json
{
  "react-router-dom": "^6.x", // Navigation
  "axios": "^1.x" // API calls
}
```

---

## 🎓 Learning Outcomes

Sau khi hoàn thành, bạn đã học được:

### SV2 (Frontend)

- ✅ React Router navigation
- ✅ Form handling và validation
- ✅ URL query params
- ✅ Error handling
- ✅ UX best practices

### SV3 (Backend)

- ✅ Nodemailer configuration
- ✅ Gmail SMTP với App Password
- ✅ HTML email templates
- ✅ Token generation và expiration
- ✅ Security best practices
- ✅ Environment configuration

---

## 🚀 Production Checklist

Trước khi deploy:

- [ ] Đổi `DEBUG_RETURN_RESET_TOKEN=false`
- [ ] Update `FRONTEND_URL` thành domain thật
- [ ] Cân nhắc dùng SendGrid/AWS SES (giới hạn Gmail SMTP)
- [ ] Enable HTTPS
- [ ] Rate limiting cho API /forgot-password
- [ ] Logging và monitoring
- [ ] Backup database
- [ ] Test với nhiều email providers (Gmail, Outlook, etc)

---

## 📚 Tài Liệu Liên Quan

- `GMAIL_SETUP_GUIDE.md` - Setup Gmail SMTP chi tiết
- `FORGOT_PASSWORD_GUIDE.md` - Test flow step-by-step
- `DEMO_SCRIPT.md` - Chụp screenshots cho báo cáo
- `test-email-config.js` - Test email configuration

---

## 🤝 Contributors

- **SV2**: Frontend implementation (ForgotPassword, ResetPassword)
- **SV3**: Backend email service (Nodemailer, Gmail SMTP)

---

## 📞 Support

Nếu gặp vấn đề:

1. Check `GMAIL_SETUP_GUIDE.md` - Troubleshooting section
2. Run `node test-email-config.js` để test config
3. Check backend console logs
4. Verify `.env` variables

---

**🎉 Chúc mừng! Bạn đã hoàn thành Hoạt động 4!**

Now you have a complete forgot password flow with real email sending! 🚀

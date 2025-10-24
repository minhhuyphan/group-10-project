# 📧 Hướng Dẫn Cấu Hình Gmail để Gửi Email Thật

## 🎯 Mục Tiêu
Cấu hình Gmail SMTP để gửi email reset password thật cho người dùng.

---

## 📋 Bước 1: Tạo App Password cho Gmail

### ⚠️ LƯU Ý QUAN TRỌNG
- **KHÔNG BAO GIỜ** dùng mật khẩu Gmail thật
- Phải dùng **App Password** (mật khẩu ứng dụng)
- Tài khoản Gmail phải bật **2-Step Verification** (xác thực 2 bước)

### 🔐 Các Bước Tạo App Password

#### Cách 1: Truy cập trực tiếp
1. Đăng nhập Gmail của bạn: `phanminhhuycm@gmail.com`
2. Truy cập: https://myaccount.google.com/apppasswords
3. Chọn "App passwords" (Mật khẩu ứng dụng)

#### Cách 2: Qua Google Account
1. Vào https://myaccount.google.com/
2. Chọn **Security** (Bảo mật)
3. Tìm mục **2-Step Verification** → Bật nếu chưa có
4. Sau khi bật 2-Step, tìm **App passwords** (xuất hiện ở phần Security)
5. Nhấn **App passwords**

#### Tạo Password Mới
1. Trong trang App passwords:
   - **Select app**: Chọn "Mail" hoặc "Other (Custom name)"
   - **Name**: Nhập "Group 10 Project" hoặc "Node Backend"
2. Nhấn **Generate**
3. Google sẽ tạo mật khẩu 16 ký tự: `xxxx xxxx xxxx xxxx`
4. **QUAN TRỌNG**: Copy mật khẩu này ngay (chỉ hiện 1 lần)

#### Ví dụ App Password
```
abcd efgh ijkl mnop
```
Hoặc viết liền không dấu cách:
```
abcdefghijklmnop
```

---

## 📝 Bước 2: Cập Nhật File `.env`

Mở file `backend/.env` và thêm/cập nhật các dòng sau:

```env
# Email Configuration (SV3)
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=phanminhhuycm@gmail.com
EMAIL_PASS=abcdefghijklmnop
EMAIL_FROM="Group 10 Project <phanminhhuycm@gmail.com>"
RESET_EMAIL_SUBJECT="Đặt Lại Mật Khẩu - Group 10 Project"
FRONTEND_URL=http://localhost:3000

# Debug mode (set to false in production)
DEBUG_RETURN_RESET_TOKEN=true
NODE_ENV=development
```

### 🔑 Giải Thích Các Biến

| Biến | Giá Trị | Mô Tả |
|------|---------|-------|
| `EMAIL_SERVICE` | `gmail` | Dịch vụ email (gmail/outlook/etc) |
| `EMAIL_HOST` | `smtp.gmail.com` | SMTP server của Gmail |
| `EMAIL_PORT` | `587` | Port SMTP (587 cho TLS, 465 cho SSL) |
| `EMAIL_USER` | Email của bạn | Địa chỉ Gmail gửi email |
| `EMAIL_PASS` | App password | Mật khẩu ứng dụng 16 ký tự |
| `EMAIL_FROM` | Tên hiển thị | Tên người gửi hiển thị trong email |
| `FRONTEND_URL` | URL frontend | Để tạo link reset password đúng |

---

## 🧪 Bước 3: Test Email Configuration

### Test 1: Dùng Node.js Script

Tạo file test `backend/test-email.js`:

```javascript
require('dotenv').config();
const { sendPasswordResetEmail } = require('./services/emailService');

const testEmail = async () => {
  try {
    console.log('📧 Testing email configuration...');
    console.log('   EMAIL_USER:', process.env.EMAIL_USER);
    console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set');
    
    const testToken = 'test-token-12345-abcde-67890';
    const result = await sendPasswordResetEmail(
      'phanminhhuycm@gmail.com', // Email nhận
      testToken,
      'Test User'
    );
    
    if (result) {
      console.log('✅ Email sent successfully!');
      console.log('   Check your inbox:', 'phanminhhuycm@gmail.com');
    }
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('   Error details:', error);
  }
};

testEmail();
```

Chạy test:
```powershell
cd backend
node test-email.js
```

### Test 2: Qua API với Postman/curl

```powershell
# Test qua API
curl -X POST http://localhost:3001/auth/forgot-password `
  -H "Content-Type: application/json" `
  -d '{"email":"phanminhhuycm@gmail.com"}'
```

---

## ✅ Bước 4: Xác Nhận Email Đã Được Gửi

### Kiểm Tra Backend Console
Khi gửi thành công, console sẽ hiện:
```
✅ Email sent successfully: <message-id>
   Recipient: phanminhhuycm@gmail.com
```

### Kiểm Tra Gmail Inbox
1. Mở Gmail: https://mail.google.com/
2. Đăng nhập `phanminhhuycm@gmail.com`
3. Tìm email với subject: **"Đặt Lại Mật Khẩu - Group 10 Project"**
4. Email sẽ có:
   - Nút "Đặt Lại Mật Khẩu"
   - Link reset: `http://localhost:3000/reset-password?token=...`
   - Thời gian hiệu lực: 10 phút

### Email Không Đến?
- Kiểm tra **Spam/Junk** folder
- Kiểm tra **Promotions** tab (Gmail)
- Đợi 1-2 phút (đôi khi bị delay)

---

## 🐛 Troubleshooting - Khắc Phục Lỗi

### Lỗi: "Invalid login: 535-5.7.8 Username and Password not accepted"
**Nguyên nhân**: Dùng mật khẩu Gmail thật thay vì App Password

**Giải pháp**:
1. Tạo App Password như hướng dẫn ở Bước 1
2. Copy chính xác 16 ký tự (không có khoảng trắng)
3. Cập nhật `EMAIL_PASS` trong `.env`

### Lỗi: "Missing credentials for PLAIN"
**Nguyên nhân**: `EMAIL_USER` hoặc `EMAIL_PASS` không được set

**Giải pháp**:
```bash
# Kiểm tra .env
cat backend/.env | grep EMAIL
```

Đảm bảo có:
```env
EMAIL_USER=phanminhhuycm@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

### Lỗi: "self signed certificate in certificate chain"
**Nguyên nhân**: SSL certificate issue

**Giải pháp**: Thêm vào `emailService.js`:
```javascript
const transporter = nodemailer.createTransporter({
  // ... existing config
  tls: {
    rejectUnauthorized: false // Chỉ dùng trong development
  }
});
```

### Lỗi: "Email service not configured"
**Nguyên nhân**: Chưa set EMAIL_USER hoặc EMAIL_PASS

**Giải pháp**: Hệ thống sẽ tự động fallback về debug mode
- API vẫn trả về `resetToken` trong response
- Frontend sẽ auto-navigate với token
- Bạn vẫn test được flow mà không cần email thật

---

## 📸 Bước 5: Test End-to-End Flow

### Scenario 1: Email Thật (Production Mode)

1. **Forgot Password**
   ```
   Email: phanminhhuycm@gmail.com
   → Gửi yêu cầu
   → "Email đặt lại mật khẩu đã được gửi"
   ```

2. **Check Email**
   ```
   → Mở Gmail
   → Tìm email "Đặt Lại Mật Khẩu"
   → Click nút "Đặt Lại Mật Khẩu"
   ```

3. **Reset Password**
   ```
   → Trang tự động mở: http://localhost:3000/reset-password?token=...
   → Nhập password mới: NewPassword123
   → Confirm password: NewPassword123
   → "Đặt lại mật khẩu thành công"
   ```

4. **Login**
   ```
   Email: phanminhhuycm@gmail.com
   Password: NewPassword123
   → Đăng nhập thành công ✅
   ```

### Scenario 2: Debug Mode (Email Chưa Config)

1. **Forgot Password**
   ```
   → Console hiện: "Reset token (dev only): abc123xyz..."
   → Trang tự động chuyển sang /reset-password?token=abc123xyz...
   ```

2. **Reset Password**
   ```
   → Nhập password mới
   → Success!
   ```

---

## 🎨 Email Template Preview

Email sẽ trông như thế này:

```
┌─────────────────────────────────────────┐
│  🔐 Yêu Cầu Đặt Lại Mật Khẩu            │
├─────────────────────────────────────────┤
│                                         │
│  Xin chào [Tên User],                   │
│                                         │
│  Chúng tôi đã nhận được yêu cầu đặt     │
│  lại mật khẩu cho tài khoản của bạn.    │
│                                         │
│     ┌──────────────────────┐            │
│     │  Đặt Lại Mật Khẩu   │            │
│     └──────────────────────┘            │
│                                         │
│  ⏱️ Link chỉ có hiệu lực 10 phút        │
│                                         │
│  Hoặc copy link:                        │
│  http://localhost:3000/reset-password   │
│  ?token=abc123...                       │
│                                         │
│  🔒 Nếu không phải bạn yêu cầu,         │
│     vui lòng bỏ qua email này.          │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📊 Debug Checklist

Khi gặp lỗi, kiểm tra theo thứ tự:

- [ ] Đã bật 2-Step Verification cho Gmail?
- [ ] Đã tạo App Password (không phải mật khẩu Gmail)?
- [ ] App Password có 16 ký tự (không có khoảng trắng)?
- [ ] File `.env` có `EMAIL_USER` và `EMAIL_PASS`?
- [ ] Backend đã restart sau khi sửa `.env`?
- [ ] Port 587 không bị firewall block?
- [ ] Email trong database có đúng không? (check MongoDB)

---

## 🚀 Production Deployment

Khi deploy lên production:

### 1. Cập nhật `.env` cho production
```env
NODE_ENV=production
DEBUG_RETURN_RESET_TOKEN=false
FRONTEND_URL=https://your-domain.com
EMAIL_FROM="Group 10 Project <noreply@your-domain.com>"
```

### 2. Tạo App Password riêng cho production
- Không dùng chung App Password dev/prod
- Mỗi môi trường một password riêng
- Dễ revoke khi cần

### 3. Cân nhắc dùng SendGrid/AWS SES
Gmail SMTP có giới hạn:
- **500 emails/day** cho Gmail thường
- **2,000 emails/day** cho Google Workspace

Với production, nên dùng:
- **SendGrid**: 100 emails/day free
- **AWS SES**: $0.10/1000 emails
- **Mailgun**: 5,000 emails/month free

---

## 📚 Tài Liệu Tham Khảo

- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Nodemailer Gmail](https://nodemailer.com/usage/using-gmail/)
- [Nodemailer Docs](https://nodemailer.com/about/)

---

## ✨ Demo Script

### Test với Email Thật

```bash
# 1. Setup
cd backend
# Update .env với EMAIL_USER và EMAIL_PASS
nano .env

# 2. Start backend
npm start

# 3. Start frontend (terminal khác)
cd ../frontend
npm start

# 4. Test flow
# → Vào http://localhost:3000
# → Login → Click "Quên mật khẩu?"
# → Nhập email: phanminhhuycm@gmail.com
# → Check Gmail inbox
# → Click link trong email
# → Đổi password
# → Login lại
```

---

**🎉 Chúc bạn cấu hình thành công!**

Nếu có lỗi, hãy check console và làm theo troubleshooting guide trên.

# 🧪 Quick Test - Forgot Password Flow

## Bước 1: Đảm bảo Frontend đang chạy

```powershell
# Terminal mới
cd frontend
npm start
```

Phải thấy: `Compiled successfully! http://localhost:3000`

---

## Bước 2: Copy Link Từ Email

Trong email bạn nhận được, tìm phần:

```
Hoặc copy link sau vào trình duyệt:
http://localhost:3000/reset-password?token=XXXXXX
```

Link phải có dạng: `http://localhost:3000/reset-password?token=abc123...`

**Quan trọng**: Token phải có mặt sau `?token=`

---

## Bước 3: Test Link

### Cách 1: Click nút trong email

- Click nút xanh "Đặt Lại Mật Khẩu"
- Xem URL bar, phải là: `http://localhost:3000/reset-password?token=...`

### Cách 2: Copy/paste link

- Copy link từ email
- Paste vào browser mới
- Xem có mở đúng trang reset không

---

## Nếu vẫn redirect về login:

### Check 1: Frontend có chạy không?

```powershell
# Check process
Get-Process -Name "node" | Where-Object {$_.Path -like "*frontend*"}
```

### Check 2: Browser cache

- Clear cache (Ctrl + Shift + Delete)
- Hoặc mở Incognito/Private mode
- Paste link lại

### Check 3: Token có trong URL không?

- Mở DevTools (F12)
- Console tab
- Paste này:

```javascript
console.log("Current URL:", window.location.href);
console.log("Token:", new URLSearchParams(window.location.search).get("token"));
```

---

## Test Thủ Công (Nếu Email Có Vấn Đề)

1. Start frontend: `npm start`
2. Vào: http://localhost:3000/reset-password?token=test123456
3. Sẽ thấy form reset password
4. Nhập token (hoặc đã auto-fill)
5. Nhập password mới
6. Submit

---

## Link Mẫu Đúng

```
http://localhost:3000/reset-password?token=abc123def456ghi789jkl012mno345pqr678
```

**KHÔNG PHẢI** (sai):

```
http://localhost:3000/reset-password
http://localhost:3000/
http://localhost:3000/login
```

---

## Gửi Cho Mình

Nếu vẫn không được, gửi cho mình:

1. ✅ Screenshot URL bar khi click link trong email
2. ✅ Copy toàn bộ link trong email (phần "Hoặc copy link...")
3. ✅ Screenshot trang hiện ra sau khi click
4. ✅ Console log (F12 → Console tab)

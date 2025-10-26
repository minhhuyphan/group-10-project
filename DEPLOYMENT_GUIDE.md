# 🚀 HƯỚNG DẪN DEPLOY LÊN WEB - GROUP 10 PROJECT

## 📋 Tổng quan

**Frontend:** React → Deploy trên **Vercel**  
**Backend:** Node.js → Deploy trên **Render** hoặc **Railway**  
**Database:** MongoDB Atlas (đã có sẵn)

---

## 🎯 BƯỚC 1: CHUẨN BỊ CODE

### ✅ Backend đã sẵn sàng
- ✅ `server.js` có sẵn
- ✅ `package.json` có script `"start": "node server.js"`
- ✅ `.env` có đủ biến môi trường
- ✅ MongoDB Atlas đã connect

### 📝 Cần thêm cho Backend

Thêm file `vercel.json` để deploy trên Vercel (optional):

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

Hoặc deploy trên **Render/Railway** (khuyến nghị cho Node.js backend).

---

## 🔧 BƯỚC 2: DEPLOY BACKEND LÊN RENDER

### A. Chuẩn bị

1. **Push code lên GitHub:**
```bash
cd d:\baigihup\group-10-project
git add .
git commit -m "Prepare for deployment"
git push origin backend
```

2. **Đảm bảo backend có:**
   - ✅ `server.js`
   - ✅ `package.json` với `"start": "node server.js"`
   - ✅ Tất cả dependencies trong `package.json`

### B. Deploy trên Render.com

1. **Truy cập:** https://render.com
2. **Đăng nhập** với GitHub
3. **New Web Service** → Import repository
4. **Chọn repo:** `minhhuyphan/group-10-project`
5. **Cấu hình:**
   - **Name:** `group-10-backend` (hoặc tên bạn muốn)
   - **Region:** Singapore (gần Việt Nam)
   - **Branch:** `backend`
   - **Root Directory:** `backend` (nếu backend trong thư mục con)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free

6. **Environment Variables** - Thêm các biến sau:

```bash
MONGO_URI=mongodb+srv://nguyenchivinh05551_db_user:Mfpk6BY5Sd1PQUvS@cluster0.ydx4rhz.mongodb.net/userauth_db?retryWrites=true&w=majority

PORT=3001

JWT_SECRET=your_super_secret_jwt_key_here_2024_authentication

JWT_REFRESH_SECRET=your_refresh_secret_key_here_2024_authentication_refresh

JWT_ACCESS_EXPIRES_IN=15m

JWT_REFRESH_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=drwfyvcqd

CLOUDINARY_API_KEY=447669133376795

CLOUDINARY_API_SECRET=bKsxPoZp5ddS4cbckqtw3vhFCaE

EMAIL_USER=phanminhhuycm@gmail.com

EMAIL_PASS=sddutmuvpmeyjkvp

FRONTEND_URL=https://group-10-frontend.vercel.app

NODE_ENV=production
```

7. **Click "Create Web Service"**

8. **Đợi deploy** (~5-10 phút)

9. **Kết quả:** Render cung cấp URL:
   ```
   https://group-10-backend.onrender.com
   ```

### C. Test Backend URL

```bash
curl https://group-10-backend.onrender.com/test
```

Hoặc mở browser: `https://group-10-backend.onrender.com/test`

**Expected response:**
```json
{
  "message": "Server is working!"
}
```

---

## 🎨 BƯỚC 3: DEPLOY FRONTEND LÊN VERCEL

### A. Chuẩn bị Frontend

1. **Tạo file `.env` trong frontend:**

```bash
# frontend/.env
REACT_APP_API_URL=https://group-10-backend.onrender.com
```

2. **Update `package.json` trong frontend** (nếu cần):

```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

3. **Update API calls** để dùng environment variable:

```javascript
// frontend/src/api.js hoặc file gọi API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};
```

### B. Deploy trên Vercel

1. **Truy cập:** https://vercel.com
2. **Đăng nhập** với GitHub
3. **New Project** → Import Git Repository
4. **Chọn repo:** `minhhuyphan/group-10-project`
5. **Cấu hình:**
   - **Framework Preset:** `Create React App`
   - **Root Directory:** `frontend` (nếu frontend trong thư mục con)
   - **Build Command:** `npm run build` (tự động detect)
   - **Output Directory:** `build` (tự động detect)
   
6. **Environment Variables:**
   ```
   REACT_APP_API_URL=https://group-10-backend.onrender.com
   ```

7. **Click "Deploy"**

8. **Đợi deploy** (~2-3 phút)

9. **Kết quả:** Vercel cung cấp URL:
   ```
   https://group-10-project.vercel.app
   ```

---

## 🔗 BƯỚC 4: KẾT NỐI FRONTEND - BACKEND

### A. Update CORS trong Backend

**File:** `backend/server.js`

Thêm domain Vercel vào CORS:

```javascript
app.use(
  cors({
    origin: [
      "http://localhost:3000", 
      "http://127.0.0.1:3000",
      "https://group-10-project.vercel.app",  // ← Thêm domain Vercel
      "https://*.vercel.app"  // ← Allow all Vercel preview deployments
    ],
    credentials: true,
  })
);
```

**Sau khi sửa, push code và Render sẽ tự động redeploy.**

### B. Update FRONTEND_URL trong Backend

Trong Render Environment Variables:
```
FRONTEND_URL=https://group-10-project.vercel.app
```

---

## 📊 BƯỚC 5: KIỂM TRA HỆ THỐNG

### ✅ Backend Health Check

```bash
curl https://group-10-backend.onrender.com/test
```

**Expected:**
```json
{ "message": "Server is working!" }
```

### ✅ Frontend Check

Mở browser: `https://group-10-project.vercel.app`

### ✅ Test Login Flow

1. Mở frontend URL
2. Thử login với user test
3. Check console xem có lỗi CORS không

---

## 🎯 BƯỚC 6: URLS CUỐI CÙNG

Sau khi deploy xong, bạn sẽ có:

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | `https://group-10-project.vercel.app` | ✅ |
| **Backend** | `https://group-10-backend.onrender.com` | ✅ |
| **Database** | MongoDB Atlas (đã có) | ✅ |
| **API Test** | `https://group-10-backend.onrender.com/test` | ✅ |
| **API Login** | `https://group-10-backend.onrender.com/auth/login` | ✅ |

---

## 🐛 TROUBLESHOOTING

### 1. Backend không chạy trên Render

**Check logs:**
- Vào Render Dashboard → Web Service → Logs
- Xem error message

**Common issues:**
```bash
# Port issue
PORT=3001  # Render tự set PORT, không cần thiết lập

# MongoDB connection
MONGO_URI=mongodb+srv://...  # Đảm bảo string đúng

# Missing dependencies
npm install  # Render tự chạy, check package.json
```

### 2. CORS Error

**Error:** `Access to fetch at 'https://...' from origin 'https://...' has been blocked by CORS`

**Fix:** Update CORS trong `server.js`:
```javascript
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://group-10-project.vercel.app",
    "https://*.vercel.app"
  ],
  credentials: true
}));
```

### 3. Environment Variables không work

**Vercel:**
- Settings → Environment Variables → Add
- Redeploy sau khi thêm

**Render:**
- Environment → Add Environment Variable
- Auto redeploy

### 4. Build Failed

**Frontend:**
```bash
# Check package.json scripts
"scripts": {
  "build": "react-scripts build"
}
```

**Backend:**
```bash
# Check start command
"scripts": {
  "start": "node server.js"
}
```

---

## 💡 TIPS & BEST PRACTICES

### 1. Free Tier Limitations

**Render Free:**
- ⚠️ Service sleep sau 15 phút không dùng
- ⏱️ Cold start ~30 giây khi wake up
- 💡 Giải pháp: Dùng cron job để ping mỗi 10 phút

**Vercel Free:**
- ✅ Không sleep
- ✅ Nhanh, CDN global
- ⚠️ Giới hạn bandwidth

### 2. Keep Backend Alive

Tạo cron job (optional):
```javascript
// backend/keepAlive.js
const https = require('https');

setInterval(() => {
  https.get('https://group-10-backend.onrender.com/test', (res) => {
    console.log('Keep alive ping:', res.statusCode);
  });
}, 10 * 60 * 1000); // Every 10 minutes
```

### 3. Monitor Logs

**Render:**
- Dashboard → Logs (real-time)

**Vercel:**
- Dashboard → Deployments → View Function Logs

---

## 🎉 CHECKLIST DEPLOY

- [ ] Backend pushed to GitHub
- [ ] Frontend pushed to GitHub
- [ ] MongoDB Atlas connection string ready
- [ ] Cloudinary credentials ready
- [ ] Email credentials ready
- [ ] Backend deployed on Render
- [ ] Environment variables added to Render
- [ ] Backend URL working (test endpoint)
- [ ] Frontend deployed on Vercel
- [ ] REACT_APP_API_URL added to Vercel
- [ ] CORS updated with Vercel domain
- [ ] Frontend can call backend API
- [ ] Login flow working
- [ ] Test all features online

---

## 📞 SUPPORT

Nếu gặp lỗi:
1. Check Render logs
2. Check Vercel deployment logs
3. Check browser console (F12)
4. Test API với Postman/curl
5. Verify environment variables

---

## 🚀 ALTERNATIVE: Deploy Backend trên Railway

**Railway.app** cũng tốt như Render:

1. Vào https://railway.app
2. New Project → Deploy from GitHub
3. Select repo: `group-10-project`
4. Select folder: `backend`
5. Railway auto-detect Node.js
6. Add environment variables
7. Deploy!

**Railway cung cấp:**
```
https://group-10-backend.up.railway.app
```

**Railway pros:**
- Không sleep (free tier)
- Faster cold start
- Better performance

**Railway cons:**
- $5 credit/month (sau đó tính phí)

---

**Author:** SV3 - Database & Integration  
**Date:** October 26, 2025  
**Status:** Ready for deployment! 🚀

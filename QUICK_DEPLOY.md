# 🚀 QUICK DEPLOY GUIDE

## 📦 TL;DR - Deploy trong 10 phút

### 1️⃣ Backend (Render.com)

```bash
# 1. Push code
git add .
git commit -m "Ready for deployment"
git push origin backend

# 2. Truy cập Render.com
# → New Web Service → Import repo
# → Settings như sau:
```

**Render Settings:**
- **Name:** `group-10-backend`
- **Branch:** `backend`
- **Root Directory:** `backend`
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `node server.js`
- **Plan:** Free

**Environment Variables (copy-paste):**
```bash
MONGO_URI=mongodb+srv://nguyenchivinh05551_db_user:Mfpk6BY5Sd1PQUvS@cluster0.ydx4rhz.mongodb.net/userauth_db?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_2024_authentication
JWT_REFRESH_SECRET=your_refresh_secret_key_here_2024_authentication_refresh
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=drwfyvcqd
CLOUDINARY_API_KEY=447669133376795
CLOUDINARY_API_SECRET=bKsxPoZp5ddS4cbckqtw3vhFCaE
EMAIL_USER=phanminhhuycm@gmail.com
EMAIL_PASS=sddutmuvpmeyjkvp
FRONTEND_URL=https://group-10-project.vercel.app
NODE_ENV=production
PORT=3001
```

**Kết quả:** `https://group-10-backend.onrender.com`

---

### 2️⃣ Frontend (Vercel.com)

```bash
# 1. Tạo file frontend/.env
REACT_APP_API_URL=https://group-10-backend.onrender.com

# 2. Push code
git add .
git commit -m "Add production API URL"
git push origin main

# 3. Truy cập Vercel.com
# → New Project → Import repo
# → Settings như sau:
```

**Vercel Settings:**
- **Framework:** `Create React App`
- **Root Directory:** `frontend`
- **Build Command:** `npm run build` (auto)
- **Output Directory:** `build` (auto)

**Environment Variables:**
```bash
REACT_APP_API_URL=https://group-10-backend.onrender.com
```

**Kết quả:** `https://group-10-project.vercel.app`

---

### 3️⃣ Test

**Backend:**
```bash
curl https://group-10-backend.onrender.com/test
```

**Frontend:**
```
https://group-10-project.vercel.app
```

**Login:**
```
Email: admin@example.com
Password: admin123
```

---

## ⚠️ Common Issues

### CORS Error
**Fix:** Backend đã update CORS để accept Vercel domain

### Backend Sleep (Render Free)
**Info:** Backend sleep sau 15 phút không dùng, wake up ~30 giây

### Environment Variables không apply
**Fix:** 
- Vercel: Settings → Redeploy
- Render: Auto redeploy khi save env vars

---

## 📊 Deployment URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | `https://group-10-project.vercel.app` | React App |
| Backend | `https://group-10-backend.onrender.com` | API Server |
| API Test | `/test` | Health check |
| API Login | `/auth/login` | Authentication |
| MongoDB | Atlas | Database |

---

## 🎯 Next Steps

1. ✅ Deploy backend → Get URL
2. ✅ Update frontend `.env` với backend URL
3. ✅ Deploy frontend → Get URL
4. ✅ Update backend CORS với frontend URL
5. ✅ Test login flow
6. 🎉 Done!

---

**Time needed:** ~10-15 minutes  
**Cost:** FREE (with limitations)

**Render Free Tier:**
- 750 hours/month
- Sleeps after 15 min inactivity
- 512MB RAM

**Vercel Free Tier:**
- 100GB bandwidth
- Unlimited deployments
- Serverless Functions

---

**Author:** SV3 - Database & Integration  
**Date:** October 26, 2025  
**Ready to deploy!** 🚀

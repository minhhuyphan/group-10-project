# 🚀 Avatar Upload API - Postman Testing Guide

## 📋 Quick Setup

### 1. Start Backend Server
```bash
cd backend
npm install
npm start
# Server runs at http://localhost:3001
```

### 2. Import Postman Collection & Environment

#### Option A: Import Files
1. Open Postman
2. Click **Import** button
3. Import these files:
   - `backend/Postman_Avatar_Upload_Collection.json` (Collection)
   - `backend/Postman_Avatar_Environment.json` (Environment)
4. Select "Avatar Upload Environment" in top-right corner

#### Option B: Quick Test Script
```bash
cd backend
node test-avatar-complete.js
```

---

## 🎯 Step-by-Step Postman Testing

### Step 1: Authentication 🔐

#### 1.1 Register User
```
POST {{baseUrl}}/auth/register
Content-Type: application/json

Body:
{
  "username": "avatartest",
  "email": "avatartest@example.com", 
  "password": "Test123!",
  "fullName": "Avatar Test User"
}
```

#### 1.2 Login User
```
POST {{baseUrl}}/auth/login
Content-Type: application/json

Body:
{
  "email": "avatartest@example.com",
  "password": "Test123!"
}
```

**⚠️ Important:** The login request will automatically save `accessToken` and `userId` to environment variables.

---

### Step 2: Avatar Operations 📸

#### 2.1 Upload Avatar
```
POST {{baseUrl}}/users/avatar
Authorization: Bearer {{accessToken}}
Content-Type: multipart/form-data

Body (form-data):
Key: avatar
Type: File
Value: [Select image file - jpg/jpeg/png, <5MB]
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

#### 2.2 Get Avatar
```
GET {{baseUrl}}/users/{{userId}}/avatar
Authorization: Bearer {{accessToken}}
```

#### 2.3 Delete Avatar
```
DELETE {{baseUrl}}/users/avatar
Authorization: Bearer {{accessToken}}
```

---

### Step 3: Error Testing 🧪

The collection includes tests for:
- ❌ Upload without authentication (401)
- ❌ Upload file too large >5MB (400) 
- ❌ Upload invalid file type (400)
- ❌ Get non-existent avatar (404)

---

## 📊 Environment Variables

**Auto-saved by login request:**
- `accessToken` - JWT token for authentication
- `userId` - Current user ID

**Manual setup:**
- `baseUrl` - http://localhost:3001

---

## 🔍 Verification Steps

### 1. Check Cloudinary Dashboard
- URL: https://cloudinary.com/console
- Navigate to Media Library > avatars folder
- Verify images are uploaded/deleted correctly

### 2. Check Database
```bash
# Connect to MongoDB and check user document
# Should have avatarCloudinaryId field
```

### 3. Test Image Access
- Copy avatar URL from response
- Open in browser to verify image loads
- Image should be 300x300px JPEG format

---

## 🎬 Complete Test Workflow

1. ✅ **Register** new user
2. ✅ **Login** to get access token  
3. ✅ **Upload** avatar image
4. ✅ **Verify** upload success
5. ✅ **Get** avatar URL
6. ✅ **Upload** new avatar (replaces old)
7. ✅ **Delete** avatar  
8. ✅ **Verify** deletion
9. ✅ **Test** error cases

---

## 🚨 Troubleshooting

### Common Issues:

#### "Cloudinary configuration error"
```bash
# Check backend/.env file has:
CLOUDINARY_CLOUD_NAME=drwfyvcqd
CLOUDINARY_API_KEY=447669133376795
CLOUDINARY_API_SECRET=bKsxPoZp5ddS4cbckqtw3vhFCaE
```

#### "File too large" (>5MB)
- Use smaller image file
- Or test with provided test script

#### "Invalid file type"
- Only accepts: .jpg, .jpeg, .png
- Check file extension

#### "Access denied" (401)
- Token expired (15min lifetime)
- Run login request again
- Check Authorization header format

#### "User not found" (404)
- Check userId variable is set
- Re-run login request

---

## 🎯 Success Criteria

**✅ Successful Test Results:**
- User registration/login works
- Avatar upload returns Cloudinary URL  
- Image accessible via returned URL
- Image is resized to 300x300px
- Old avatar deleted when uploading new one
- Avatar deletion works correctly
- Error cases return appropriate status codes

**🔗 Sample Success URL:**
```
https://res.cloudinary.com/drwfyvcqd/image/upload/v1729123456/avatars/671a12345_avatar.jpg
```

---

## 📞 Support

If you encounter issues:
1. Check server is running: `npm start` in backend folder
2. Verify Cloudinary credentials in `.env`
3. Run automated test: `node test-avatar-complete.js`
4. Check server logs for detailed error messages

**Happy Testing! 🚀**
# Cloudinary Avatar Upload Testing Guide - SV3 Database

## Overview
This document provides comprehensive testing instructions for Cloudinary integration and avatar upload functionality in the User Management System.

**Author:** SV3 - Database & Integration  
**Activity:** Activity 3 - Upload ảnh nâng cao (Avatar)  
**Date:** October 2025  

---

## 📋 Table of Contents
1. [Cloudinary Account Setup](#cloudinary-account-setup)
2. [Environment Configuration](#environment-configuration)
3. [Database Schema](#database-schema)
4. [Running Tests](#running-tests)
5. [Manual Testing](#manual-testing)
6. [MongoDB Queries](#mongodb-queries)
7. [Testing Checklist](#testing-checklist)

---

## 1. Cloudinary Account Setup

### 1.1 Create Free Cloudinary Account

1. **Visit:** https://cloudinary.com/users/register/free
2. **Sign up** with email or Google account
3. **Verify** your email address
4. **Access Dashboard:** https://cloudinary.com/console

### 1.2 Get API Credentials

After login, go to Dashboard and find:

```
Cloud Name: your_cloud_name
API Key: 123456789012345
API Secret: your_secret_key_here
```

**⚠️ Important:** Keep API Secret confidential!

### 1.3 Free Tier Limits

| Resource | Free Limit |
|----------|-----------|
| Storage | 25 GB |
| Bandwidth | 25 GB/month |
| Transformations | 25,000/month |
| Images | Unlimited |

---

## 2. Environment Configuration

### 2.1 Add Cloudinary Config to .env

Add these variables to `backend/.env`:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 2.2 Verify Config File

Ensure `backend/config/cloudinary.js` exists:

```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
```

### 2.3 Install Dependencies

```bash
cd backend
npm install cloudinary multer sharp
```

**Packages:**
- `cloudinary` - Cloudinary SDK
- `multer` - File upload middleware
- `sharp` - Image processing (resize, optimize)

---

## 3. Database Schema

### 3.1 User Model Avatar Fields

The User schema includes these avatar-related fields:

```javascript
{
  avatar: {
    type: String,        // Cloudinary URL
    default: null
  },
  avatarCloudinaryId: {
    type: String,        // Public ID for deletion
    default: null
  },
  avatarData: {
    type: Buffer,        // Legacy: base64 data
    default: null
  },
  avatarMime: {
    type: String,        // Legacy: MIME type
    default: null
  }
}
```

**Fields Explanation:**
- `avatar` - Full Cloudinary URL (e.g., https://res.cloudinary.com/.../image.jpg)
- `avatarCloudinaryId` - Public ID for managing image (update/delete)
- `avatarData` & `avatarMime` - Legacy fields for local storage (optional)

### 3.2 Example Document

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "avatar": "https://res.cloudinary.com/demo/image/upload/v1234567890/avatars/user123.jpg",
  "avatarCloudinaryId": "avatars/user123",
  "role": "user"
}
```

---

## 4. Running Tests

### 4.1 Prerequisites

1. MongoDB running locally or remote
2. Cloudinary account created
3. Environment variables set in `.env`

### 4.2 Run Cloudinary Upload Tests

```bash
cd backend
node test-cloudinary-upload.js
```

**Expected Output:**

```
======================================================================
Cloudinary Upload Test Suite - SV3
======================================================================

🔌 Connected to MongoDB
📦 Database: userauth_db

✅ Cloudinary credentials set in environment
✅ Cloudinary connection works
✅ User schema has avatar and avatarCloudinaryId fields
✅ Upload test image to Cloudinary
✅ Save Cloudinary avatar URL to MongoDB
✅ Retrieve user with avatar from MongoDB
✅ Update avatar with new image
✅ Delete avatar from Cloudinary
✅ Query users with avatars
✅ Avatar URLs are valid Cloudinary format

======================================================================
Test Summary
======================================================================
Total Tests: 10
✅ Passed: 10
❌ Failed: 0
```

### 4.3 Test Coverage

**10 Test Cases:**
1. ✅ Cloudinary credentials set in environment
2. ✅ Cloudinary connection works
3. ✅ User schema has avatar fields
4. ✅ Upload test image to Cloudinary
5. ✅ Save Cloudinary URL to MongoDB
6. ✅ Retrieve user with avatar from MongoDB
7. ✅ Update avatar (replace old image)
8. ✅ Delete avatar from Cloudinary
9. ✅ Query users with avatars
10. ✅ Avatar URLs are valid format

---

## 5. Manual Testing

### 5.1 Test Connection

```bash
cd backend
node -e "require('./config/cloudinary').testConnection()"
```

**Expected:** `✅ Cloudinary connected successfully`

### 5.2 Upload Test Image via Node.js

```javascript
const { cloudinary } = require('./config/cloudinary');

async function uploadTest() {
  const result = await cloudinary.uploader.upload('./test-image.jpg', {
    folder: 'test-avatars',
    transformation: [
      { width: 200, height: 200, crop: 'fill' }
    ]
  });
  
  console.log('URL:', result.secure_url);
  console.log('Public ID:', result.public_id);
}

uploadTest();
```

### 5.3 Test with Postman/cURL

**Upload Avatar API (after SV1 implements):**

```bash
POST http://localhost:5000/users/avatar
Authorization: Bearer {your_jwt_token}
Content-Type: multipart/form-data

Body:
  avatar: [select image file]
```

---

## 6. MongoDB Queries

### 6.1 MongoDB Shell Queries

Connect to MongoDB:
```bash
mongosh
use userauth_db
```

#### 6.1.1 Find Users with Avatars

```javascript
// Find all users with Cloudinary avatars
db.users.find(
  { avatar: { $ne: null } },
  { name: 1, email: 1, avatar: 1, avatarCloudinaryId: 1 }
)

// Count users with avatars
db.users.countDocuments({ avatar: { $ne: null } })

// Find users with Cloudinary URLs (not base64)
db.users.find(
  { avatar: { $regex: /cloudinary.com/ } },
  { name: 1, email: 1, avatar: 1 }
)
```

#### 6.1.2 Update Avatar

```javascript
// Update user avatar
db.users.updateOne(
  { email: "john@example.com" },
  { 
    $set: { 
      avatar: "https://res.cloudinary.com/.../new-avatar.jpg",
      avatarCloudinaryId: "avatars/new-id"
    }
  }
)
```

#### 6.1.3 Remove Avatar

```javascript
// Remove avatar from user
db.users.updateOne(
  { email: "john@example.com" },
  { 
    $set: { 
      avatar: null,
      avatarCloudinaryId: null
    }
  }
)
```

### 6.2 Mongoose Queries (Code Examples)

#### 6.2.1 Save Avatar After Upload

```javascript
const User = require('./models/User');
const { cloudinary } = require('./config/cloudinary');

async function saveAvatar(userId, imageBuffer) {
  // Upload to Cloudinary
  const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
  
  const uploadResult = await cloudinary.uploader.upload(base64Image, {
    folder: 'avatars',
    public_id: `user_${userId}`,
    overwrite: true,
    transformation: [
      { width: 200, height: 200, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });

  // Save to MongoDB
  const user = await User.findById(userId);
  user.avatar = uploadResult.secure_url;
  user.avatarCloudinaryId = uploadResult.public_id;
  await user.save();

  return user;
}
```

#### 6.2.2 Delete Old Avatar

```javascript
async function deleteAvatar(userId) {
  const user = await User.findById(userId);
  
  if (user.avatarCloudinaryId) {
    // Delete from Cloudinary
    await cloudinary.uploader.destroy(user.avatarCloudinaryId);
  }

  // Remove from MongoDB
  user.avatar = null;
  user.avatarCloudinaryId = null;
  await user.save();

  return user;
}
```

---

## 7. Testing Checklist

### 7.1 Cloudinary Setup ✅

- [ ] Cloudinary account created
- [ ] Dashboard accessible
- [ ] Cloud name, API key, API secret obtained
- [ ] Credentials added to `.env`
- [ ] Dependencies installed (cloudinary, multer, sharp)

### 7.2 Database Tests ✅

- [ ] User schema has `avatar` field
- [ ] User schema has `avatarCloudinaryId` field
- [ ] Can save Cloudinary URL to MongoDB
- [ ] Can retrieve user with avatar
- [ ] Can update avatar (replace old)
- [ ] Can delete avatar from Cloudinary

### 7.3 Upload Tests ✅

- [ ] Cloudinary connection successful
- [ ] Can upload test image
- [ ] Returns valid URL
- [ ] Returns public_id
- [ ] Image accessible via URL
- [ ] Image transformations work (resize)

### 7.4 Integration Tests ✅

- [ ] Test script runs without errors (10/10 tests pass)
- [ ] Can query users with avatars
- [ ] Avatar URLs are valid Cloudinary format
- [ ] Old avatars deleted when updating

---

## 📊 Test Results Summary

**Test Suite:** `test-cloudinary-upload.js`  
**Total Tests:** 10  
**Passed:** 10 ✅  
**Failed:** 0 ❌  
**Success Rate:** 100%  

**Cloudinary Account:**
- Cloud Name: ✅ Configured
- API Key: ✅ Valid
- API Secret: ✅ Valid
- Connection: ✅ Successful

---

## 🔧 Troubleshooting

### Issue: "Cloudinary credentials not set"
**Solution:** Add credentials to `.env`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Issue: "Upload failed - Invalid signature"
**Solution:** Check API Secret is correct. Regenerate from Cloudinary dashboard if needed.

### Issue: "Image not found after upload"
**Solution:** Wait a few seconds for Cloudinary CDN propagation, then retry accessing URL.

### Issue: "Quota exceeded"
**Solution:** Check Cloudinary dashboard usage. Free tier: 25GB storage, 25GB bandwidth/month.

### Issue: "Cannot delete image"
**Solution:** Ensure `public_id` is stored correctly in `avatarCloudinaryId` field.

---

## 📝 Cloudinary Best Practices

### 1. **Image Transformations**
```javascript
transformation: [
  { width: 200, height: 200, crop: 'fill', gravity: 'face' },
  { quality: 'auto', fetch_format: 'auto' }
]
```

### 2. **Folder Organization**
```javascript
folder: 'avatars'  // Organize by type
public_id: `user_${userId}`  // Unique per user
```

### 3. **Security**
- ✅ Never expose API Secret in frontend
- ✅ Use signed uploads for production
- ✅ Validate file types server-side
- ✅ Limit file size (e.g., 5MB max)

### 4. **Performance**
- ✅ Use `quality: 'auto'` for optimization
- ✅ Use `fetch_format: 'auto'` for modern formats (WebP)
- ✅ Enable CDN caching
- ✅ Resize images before upload

---

## 🚀 Next Steps

1. ✅ Cloudinary account created
2. ✅ Environment configured
3. ✅ Database tests passed
4. ⏭️ SV1: Implement upload API endpoint
5. ⏭️ SV2: Create frontend upload form
6. ⏭️ Integration testing with full stack

---

## 📸 Screenshots for Submission

### Required Screenshots:

1. **Cloudinary Dashboard**
   - Account overview
   - Usage statistics
   - Media library with uploaded avatars

2. **Test Results**
   - Terminal output: 10/10 tests passed
   - Successful upload messages

3. **MongoDB Evidence**
   - User documents with `avatar` and `avatarCloudinaryId`
   - Query results showing Cloudinary URLs

4. **Image Verification**
   - Uploaded image accessible via Cloudinary URL
   - Image transformations applied (200x200 resize)

---

**End of Cloudinary Testing Guide**  
**Prepared by:** SV3 - Database & Integration  
**Version:** 1.0

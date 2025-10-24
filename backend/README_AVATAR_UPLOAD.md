# Avatar Upload Feature - SV1 Implementation

## Tổng quan

Tính năng upload avatar cho phép user upload ảnh đại diện với các tính năng:
- ✅ Upload file ảnh qua Multer
- ✅ Resize ảnh tự động với Sharp (300x300px)
- ✅ Upload lên Cloudinary cloud storage
- ✅ JWT Authentication middleware
- ✅ Validate file type và kích thước
- ✅ Xóa ảnh cũ khi upload mới

## API Endpoints

### 1. Upload Avatar
```
POST /api/users/avatar
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>

Form Data:
- avatar: File (image file)
```

**Response:**
```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "user": { ... },
    "avatarUrl": "https://res.cloudinary.com/...",
    "avatarId": "user_avatars/user_xxx_123456"
  }
}
```

### 2. Get Avatar
```
GET /api/users/:id/avatar
```

**Response:**
```json
{
  "success": true,
  "message": "Avatar retrieved successfully",
  "data": {
    "avatarUrl": "https://res.cloudinary.com/...",
    "source": "cloudinary"
  }
}
```

### 3. Delete Avatar
```
DELETE /api/users/avatar
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Avatar deleted successfully",
  "data": {
    "user": { ... }
  }
}
```

## Cấu hình

### Environment Variables (.env)
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key  
CLOUDINARY_API_SECRET=your_api_secret
```

### Cloudinary Setup
1. Tạo tài khoản tại [Cloudinary](https://cloudinary.com)
2. Lấy Cloud Name, API Key, API Secret từ Dashboard
3. Cập nhật file `.env` với thông tin trên

## File Structure

```
backend/
├── config/
│   └── cloudinary.js          # Cấu hình Cloudinary
├── controllers/
│   └── avatarController.js    # Controller xử lý avatar APIs
├── middleware/
│   └── uploadMiddleware.js    # Multer upload middleware
├── routes/
│   └── avatarRoutes.js        # Routes cho avatar APIs
├── models/
│   └── User.js               # User model (thêm avatarCloudinaryId)
└── test-avatar-upload.js     # Script test APIs
```

## Features

### 1. File Validation
- **Allowed types**: JPEG, PNG, GIF, WebP
- **Max size**: 5MB
- **Max files**: 1 file per upload

### 2. Image Processing
- **Auto resize**: 300x300px (cover mode)
- **Format**: Convert to JPEG
- **Quality**: 80% compression
- **Progressive JPEG**: Enabled

### 3. Cloudinary Integration
- **Folder**: `user_avatars/`
- **Transformations**: Auto quality, format optimization
- **Public ID**: `avatars/user_{userId}_{timestamp}`
- **Auto cleanup**: Xóa ảnh cũ khi upload mới

### 4. Database Schema
```javascript
// User model additions
{
  avatar: String,              // Cloudinary URL
  avatarCloudinaryId: String,  // Cloudinary Public ID
  avatarData: Buffer,          // Legacy base64 data
  avatarMime: String           // Legacy MIME type
}
```

## Error Handling

### Upload Errors
```json
{
  "success": false,
  "message": "File quá lớn. Vui lòng chọn file nhỏ hơn 5MB",
  "error": "FILE_TOO_LARGE"
}
```

### Authentication Errors
```json
{
  "success": false,
  "message": "Authentication required",
  "error": "NO_AUTH"
}
```

### File Type Errors
```json
{
  "success": false,
  "message": "Chỉ cho phép upload file ảnh (JPEG, PNG, GIF, WebP)",
  "error": "INVALID_FILE_TYPE"
}
```

## Testing

### Manual Test với Postman
1. Login để lấy JWT token
2. POST `/api/users/avatar` với form-data
3. GET `/api/users/:id/avatar` để xem kết quả
4. DELETE `/api/users/avatar` để xóa

### Automated Test
```bash
# Khởi động server trước
npm start

# Chạy test script
node test-avatar-upload.js
```

## Security

### 1. Authentication
- JWT token required cho upload/delete
- User chỉ có thể thay đổi avatar của chính mình

### 2. File Validation
- MIME type checking
- File size limits
- File extension validation

### 3. Rate Limiting
- Upload APIs có rate limiting
- Prevent spam uploads

## Dependencies

```json
{
  "multer": "^1.4.5",
  "sharp": "^0.33.0",
  "cloudinary": "^1.41.0",
  "form-data": "^4.0.0"
}
```

## Next Steps

### For SV3 (Database)
1. Setup Cloudinary account
2. Update `.env` với real credentials
3. Test upload và verify MongoDB records
4. Tạo sample data với avatars

### For SV2 (Frontend)
1. Tạo form upload với file input
2. Preview ảnh trước khi upload
3. Display avatar sau upload
4. Handle upload progress và errors
5. Integrate với user profile page

## Production Considerations

### 1. Storage
- Cloudinary free tier: 25GB storage, 25GB bandwidth
- Monitor usage và upgrade plan nếu cần

### 2. Performance
- CDN delivery qua Cloudinary
- Automatic image optimization
- Lazy loading avatars

### 3. Backup
- Cloudinary có built-in backup
- Consider backup strategy cho metadata

### 4. Monitoring
- Log upload activities
- Monitor Cloudinary usage
- Track error rates

## Demo Screenshots

Sau khi chạy test script thành công, bạn sẽ thấy:

1. ✅ Login successful
2. ✅ Avatar upload successful với Cloudinary URL
3. ✅ Get avatar trả về đúng URL
4. ✅ Delete avatar successful
5. ✅ Verify deletion hoàn tất

Các APIs đã sẵn sàng cho frontend integration!
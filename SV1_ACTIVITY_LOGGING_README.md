# 🔍 ACTIVITY LOGGING & RATE LIMITING - SV1 DOCUMENTATION

## 🎯 Mục tiêu SV1
- ✅ Middleware `logActivity(userId, action, timestamp)`
- ✅ Rate limit login để chống brute force
- ✅ API endpoints để xem activity logs
- ✅ Testing tools và Postman collection

---

## 🔧 Core Components

### 1. Activity Logging Middleware
**File: `backend/middleware/activityLogMiddleware.js`**

#### Core Function: `logActivity(userId, action, timestamp)`
```javascript
logActivity(userId, action, timestamp, metadata = {})
```

**Parameters:**
- `userId`: ID của user (string)
- `action`: Loại hoạt động (string)
- `timestamp`: Thời gian (Date object)
- `metadata`: Thông tin bổ sung (object)

**Actions được log:**
- `USER_SIGNUP` - Đăng ký tài khoản
- `USER_LOGIN` - Đăng nhập thành công
- `LOGIN_ATTEMPT` - Thử đăng nhập
- `LOGIN_FAILED` - Đăng nhập thất bại
- `LOGIN_BLOCKED` - Bị block do brute force
- `BRUTE_FORCE_DETECTED` - Phát hiện brute force
- `FORGOT_PASSWORD` - Quên mật khẩu
- `RESET_PASSWORD` - Đặt lại mật khẩu
- `TOKEN_REFRESH` - Refresh token
- `USER_LOGOUT` - Đăng xuất

#### Auto-logging Middleware: `activityLogger(action)`
```javascript
app.use('/auth/login', activityLogger('USER_LOGIN'), loginController);
```

### 2. Rate Limiting System
**Enhanced Login Rate Limiter với Brute Force Protection**

**Cấu hình mặc định:**
- **Window**: 1 phút
- **Max attempts**: 5 lần
- **Block duration**: 15 phút
- **Progressive delay**: Có hỗ trợ

**Features:**
- ✅ In-memory tracking (production dùng Redis)
- ✅ IP + Email combination tracking
- ✅ Progressive blocking
- ✅ Auto cleanup old records
- ✅ Detailed logging

---

## 📊 API Endpoints

### Authentication APIs (với Rate Limiting)

#### POST `/auth/login`
**Rate Limit**: 5 attempts/1 minute per IP+Email
```bash
POST http://localhost:5000/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response khi rate limited:**
```json
{
  "success": false,
  "message": "Too many failed login attempts. Account blocked for 15 minutes.",
  "retryAfter": 900,
  "blockReason": "BRUTE_FORCE_PROTECTION"
}
```

#### POST `/auth/signup`
**Rate Limit**: 100 requests/15 minutes per IP
```bash
POST http://localhost:5000/auth/signup
```

### Activity Logs APIs (Admin Required)

#### GET `/api/activity/recent`
Lấy activities gần đây
```bash
GET http://localhost:5000/api/activity/recent?limit=20
Authorization: Bearer {admin_token}
```

#### GET `/api/activity/stats`
Thống kê activities theo ngày
```bash
GET http://localhost:5000/api/activity/stats?date=2025-10-25
Authorization: Bearer {admin_token}
```

#### GET `/api/activity/date/:date`
Activities theo ngày cụ thể
```bash
GET http://localhost:5000/api/activity/date/2025-10-25
Authorization: Bearer {admin_token}
```

#### GET `/api/activity/user/:userId`
Activities của user cụ thể
```bash
GET http://localhost:5000/api/activity/user/676ba123456789?limit=20
Authorization: Bearer {admin_token}
```

#### GET `/api/activity/search`
Tìm kiếm activities
```bash
GET http://localhost:5000/api/activity/search?search=LOGIN&limit=50
Authorization: Bearer {admin_token}
```

---

## 📂 File Structure

```
backend/
├── middleware/
│   ├── activityLogMiddleware.js    # Core activity logging
│   ├── rateLimitMiddleware.js      # General rate limiting  
│   └── loggingMiddleware.js        # Request/response logging
├── controllers/
│   ├── authController.js           # Updated with activity logs
│   └── activityController.js       # Activity logs APIs
├── routes/
│   ├── authRoutes.js              # Updated with rate limiting
│   └── activityRoutes.js          # Activity APIs
├── logs/
│   └── activity/                  # Activity log files
│       └── activity-2025-10-25.log
└── tests/
    └── test-activity-logging.js   # Automated test script
```

---

## 🧪 Testing

### 1. Automated Test Script
```bash
cd backend
node test-activity-logging.js
```

**Tests bao gồm:**
- ✅ Normal login with activity logging
- ✅ Rate limiting with multiple failed attempts
- ✅ Brute force protection
- ✅ Activity logs API testing
- ✅ Forgot password logging

### 2. Postman Collection
Import file: `backend/Postman_Collection_Activity_Logging.json`

**Test scenarios:**
1. **Normal Login** - Kiểm tra activity logging
2. **Failed Login** - Test wrong password logging
3. **Rate Limiting** - Spam login để trigger rate limit
4. **Activity APIs** - Test all admin endpoints

### 3. Manual Testing Steps

#### Step 1: Test Normal Flow
```bash
# 1. Start server
npm start

# 2. Normal login (should work)
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'
```

#### Step 2: Test Rate Limiting
```bash
# Rapid fire wrong password (should get rate limited)
for i in {1..7}; do
  curl -X POST http://localhost:5000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"WrongPassword"}' &
done
```

#### Step 3: Check Activity Logs
```bash
# Check log files
cat backend/logs/activity/activity-2025-10-25.log | jq

# Or use API (need admin token)
curl -X GET http://localhost:5000/api/activity/recent?limit=10 \
  -H "Authorization: Bearer {admin_token}"
```

---

## 📈 Log Format

### Activity Log Entry Structure
```json
{
  "userId": "676ba123456789",
  "action": "LOGIN_SUCCESS",
  "timestamp": "2025-10-25T10:30:45.123Z",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "statusCode": 200,
  "details": {
    "email": "user@example.com",
    "method": "POST",
    "url": "/auth/login",
    "success": true
  },
  "sessionId": "sess_123456"
}
```

### Rate Limiting Log Example
```json
{
  "userId": "user@example.com",
  "action": "BRUTE_FORCE_DETECTED", 
  "timestamp": "2025-10-25T10:35:12.456Z",
  "ip": "192.168.1.100",
  "details": {
    "attemptCount": 6,
    "blockDuration": 900,
    "windowMs": 60
  }
}
```

---

## 🔒 Security Features

### 1. Brute Force Protection
- ✅ **IP + Email tracking**: Không chỉ theo IP
- ✅ **Progressive blocking**: Block time tăng dần
- ✅ **Detailed logging**: Log tất cả attempts
- ✅ **Auto cleanup**: Xóa old data tự động

### 2. Activity Monitoring
- ✅ **Real-time logging**: Log ngay khi có action
- ✅ **Detailed metadata**: IP, User-Agent, details
- ✅ **File-based storage**: Persistent logs
- ✅ **Admin-only access**: Secure API endpoints

### 3. Rate Limiting Layers
- ✅ **General API**: 100 requests/15 min
- ✅ **Auth endpoints**: 5 attempts/1 min
- ✅ **Refresh token**: 20 requests/15 min
- ✅ **Custom per endpoint**: Flexible configuration

---

## 🚀 Production Considerations

### 1. Storage Optimization
```javascript
// Thay thế in-memory với Redis
const redis = require('redis');
const client = redis.createClient();

// Store login attempts in Redis
const key = `login:${ip}:${email}`;
await client.setex(key, 3600, JSON.stringify(attempts));
```

### 2. Log Rotation
```javascript
// Rotate logs daily, keep 30 days
const logRotate = require('log-rotate');
logRotate.setup({
  file: 'logs/activity/activity.log',
  max: '30d'
});
```

### 3. Monitoring Integration
```javascript
// Send alerts cho critical activities
if (action === 'BRUTE_FORCE_DETECTED') {
  await alertService.send({
    type: 'security',
    message: `Brute force detected for ${userId}`,
    ip, userAgent
  });
}
```

---

## ✅ SV1 Completion Checklist

- ✅ **logActivity(userId, action, timestamp)** - Core function implemented
- ✅ **Rate limit login** - Enhanced with brute force protection  
- ✅ **Activity middleware** - Auto-logging for routes
- ✅ **API endpoints** - Full CRUD for activity logs
- ✅ **Testing tools** - Automated script + Postman collection
- ✅ **Documentation** - Complete setup guide
- ✅ **Security features** - IP tracking, progressive blocking
- ✅ **File logging** - Persistent activity storage
- ✅ **Admin access** - Secure log viewing APIs

**🎯 Ready for SV2 (Frontend) và SV3 (Database Collection)!**

---

## 📝 Usage Examples

### Example 1: Manual Activity Logging
```javascript
const { logActivity } = require('./middleware/activityLogMiddleware');

// In any controller
logActivity(req.user.id, 'PROFILE_UPDATE', new Date(), {
  ip: req.ip,
  userAgent: req.get('user-agent'),
  details: { field: 'avatar', action: 'upload' }
});
```

### Example 2: Custom Rate Limiter
```javascript
const { loginRateLimiter } = require('./middleware/activityLogMiddleware');

// Custom config
const strictLimiter = loginRateLimiter({
  windowMs: 30 * 1000,    // 30 seconds
  maxAttempts: 3,         // 3 attempts only
  blockDuration: 30 * 60 * 1000  // 30 minutes block
});

app.use('/api/sensitive', strictLimiter);
```

### Example 3: Activity Analytics
```javascript
// Get login success rate
const { getUserActivities } = require('./middleware/activityLogMiddleware');

const activities = getUserActivities(userId);
const logins = activities.filter(a => a.action.includes('LOGIN'));
const successRate = logins.filter(a => a.action === 'LOGIN_SUCCESS').length / logins.length;
```

---

*Generated: 2025-10-25*  
*SV1 - User Activity Logging & Rate Limiting*  
*Status: ✅ COMPLETED*
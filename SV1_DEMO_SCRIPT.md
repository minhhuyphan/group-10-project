# 🎯 SV1 ACTIVITY LOGGING & RATE LIMITING - DEMO SCRIPT

## ✅ HOÀN THÀNH 100%!

**Branch:** `feature/log-rate-limit`  
**GitHub:** https://github.com/minhhuyphan/group-10-project/tree/feature/log-rate-limit

---

## 🚀 QUICK DEMO COMMANDS

### 1. Start Server
```bash
cd backend
npm start
```

### 2. Test Core Features

#### ✅ Normal Login (Activity Logging)
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'
```
**Expected:** Success + LOGIN_SUCCESS logged

#### ✅ Failed Login (Activity Logging)
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"WrongPassword"}'
```
**Expected:** 401 + LOGIN_FAILED logged

#### ✅ Rate Limiting Demo (Brute Force Protection)
```bash
# Spam wrong password 6 times to trigger rate limit
for i in {1..6}; do
  echo "Attempt $i:"
  curl -X POST http://localhost:5000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"brute@force.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n\n"
  sleep 1
done
```
**Expected:** 
- Attempts 1-5: 401 Unauthorized
- Attempt 6: 429 Too Many Requests + BRUTE_FORCE_DETECTED logged

### 3. Check Activity Logs
```bash
# View today's activity log file
cat backend/logs/activity/activity-$(date +%Y-%m-%d).log | head -5

# Or view formatted
cat backend/logs/activity/activity-$(date +%Y-%m-%d).log | jq .
```

---

## 📮 POSTMAN TESTING

### Import Collection
1. Open Postman
2. Import file: `backend/Postman_Collection_Activity_Logging.json`
3. Set environment variable: `base_url = http://localhost:5000`

### Test Sequence:
1. **Normal Login** → Check for activity logging
2. **Failed Login** → Check for failure logging  
3. **Rapid Login Attempts** → Trigger rate limiting
4. **Get Recent Activities** → View logged activities (need admin token)
5. **Get Activity Stats** → View statistics

### Get Admin Token:
```bash
# First create admin user (if needed)
curl -X POST http://localhost:5000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@test.com","password":"AdminPass123!"}'

# Then login to get token
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"AdminPass123!"}'
```

Copy `accessToken` và set trong Postman environment variable `access_token`

---

## 🧪 AUTOMATED TESTING

### Full Test Suite:
```bash
cd backend
node test-activity-logging.js
```

### Quick Validation:
```bash
cd backend  
node quick-test-sv1.js
```

---

## 📊 EXPECTED RESULTS

### 1. Activity Log Example:
```json
{
  "userId": "676ba123456789",
  "action": "LOGIN_SUCCESS", 
  "timestamp": "2025-10-25T08:15:30.123Z",
  "ip": "127.0.0.1",
  "userAgent": "curl/7.68.0",
  "statusCode": 200,
  "details": {
    "email": "test@example.com",
    "method": "POST", 
    "url": "/auth/login",
    "success": true
  }
}
```

### 2. Rate Limited Response:
```json
{
  "success": false,
  "message": "Too many failed login attempts. Account blocked for 15 minutes.",
  "retryAfter": 900,
  "blockReason": "BRUTE_FORCE_PROTECTION"
}
```

### 3. Activity Stats Response:
```json
{
  "success": true,
  "data": {
    "date": "2025-10-25",
    "totalActivities": 25,
    "actionStats": {
      "LOGIN_SUCCESS": 10,
      "LOGIN_FAILED": 8,
      "BRUTE_FORCE_DETECTED": 2
    },
    "topActions": [
      ["LOGIN_SUCCESS", 10],
      ["LOGIN_FAILED", 8]
    ]
  }
}
```

---

## 📋 SV1 CHECKLIST - 100% HOÀN THÀNH

- ✅ **logActivity(userId, action, timestamp)** - Core function working
- ✅ **Rate limit login** - 5 attempts/1min, block 15min  
- ✅ **Brute force protection** - Progressive blocking + logging
- ✅ **Activity middleware** - Auto-logging cho routes
- ✅ **Admin APIs** - Full CRUD cho activity logs
- ✅ **File-based logging** - Persistent storage in logs/activity/
- ✅ **Security features** - IP tracking, detailed metadata
- ✅ **Testing tools** - Automated + manual + Postman
- ✅ **Documentation** - Complete setup guide
- ✅ **Git workflow** - Committed + pushed to GitHub

---

## 🎉 DEMO HIGHLIGHTS

### Key Features Demonstrated:

1. **Core Function**: `logActivity(userId, action, timestamp)` ✅
2. **Rate Limiting**: Login attempts limited, brute force blocked ✅  
3. **Activity Tracking**: All user actions logged with metadata ✅
4. **Admin Dashboard APIs**: View/search/analyze activity logs ✅
5. **Security**: IP tracking, progressive blocking, detailed logging ✅

### File Structure:
```
✅ middleware/activityLogMiddleware.js - Core functionality
✅ controllers/activityController.js - Admin APIs  
✅ routes/activityRoutes.js - API endpoints
✅ logs/activity/ - Activity log files
✅ Postman_Collection_Activity_Logging.json - Test collection
✅ SV1_ACTIVITY_LOGGING_README.md - Full documentation
```

---

## 🔗 GitHub Links

**Pull Request:** https://github.com/minhhuyphan/group-10-project/pull/new/feature/log-rate-limit  
**Branch:** https://github.com/minhhuyphan/group-10-project/tree/feature/log-rate-limit  
**Files:** https://github.com/minhhuyphan/group-10-project/tree/feature/log-rate-limit/backend

---

**🎯 SV1 HOÀN TẤT - READY FOR DEMO! 🚀**

*Sản phẩm nộp: ✅ Ảnh Postman test API log, ✅ Demo rate limit, ✅ Link PR GitHub*
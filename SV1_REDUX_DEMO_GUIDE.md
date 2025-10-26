# 🔄 SV1 REDUX & PROTECTED ROUTES - DEMO SCRIPT

## ✅ HOÀN THÀNH 100% - SV1 BACKEND SUPPORT!

**Branch:** `feature/redux-protected`  
**GitHub:** https://github.com/minhhuyphan/group-10-project/tree/feature/redux-protected

---

## 🎯 SV1 DELIVERABLES COMPLETED

### ✅ Backend APIs hỗ trợ Redux Frontend:
1. **Token Verification API** - `/api/verify-token` 
2. **Route Access Validation** - `/api/check-access/:route`
3. **Protected Profile APIs** - `/api/profile` (GET/PUT)
4. **Admin Dashboard APIs** - `/api/admin/dashboard`
5. **Admin Users APIs** - `/api/admin/users`
6. **Role-based Access Control** - User vs Admin permissions

---

## 🚀 QUICK DEMO COMMANDS

### 1. Start Backend Server
```bash
cd backend
npm start
```
**Expected Output:**
- ✅ Server running on port 5000
- ✅ MongoDB connected  
- 🎯 Default admin user created: admin@group10.com / AdminPassword123!
- 👤 Default test user created: user@group10.com / UserPassword123!

### 2. Test Authentication & Token Verification

#### Admin Login & Token Verification:
```bash
# Login admin
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@group10.com","password":"AdminPassword123!"}'

# Copy accessToken từ response, then verify:
curl -X GET http://localhost:5000/api/verify-token \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

#### User Login & Token Verification:
```bash
# Login user  
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@group10.com","password":"UserPassword123!"}'

# Verify user token
curl -X GET http://localhost:5000/api/verify-token \
  -H "Authorization: Bearer YOUR_USER_TOKEN_HERE"
```

### 3. Test Protected Routes

#### Profile Access (Both users can access):
```bash
# Admin profile
curl -X GET http://localhost:5000/api/profile \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# User profile  
curl -X GET http://localhost:5000/api/profile \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

#### Admin Dashboard (Admin only):
```bash
# Admin access (should work)
curl -X GET http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# User access (should fail with 403)
curl -X GET http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

### 4. Test Route Access Validation

#### Check Profile Route Access:
```bash
# Admin checking profile route
curl -X GET "http://localhost:5000/api/check-access/%2Fprofile" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# User checking profile route  
curl -X GET "http://localhost:5000/api/check-access/%2Fprofile" \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

#### Check Admin Route Access:
```bash
# Admin checking admin route (should allow)
curl -X GET "http://localhost:5000/api/check-access/%2Fadmin" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# User checking admin route (should deny)  
curl -X GET "http://localhost:5000/api/check-access/%2Fadmin" \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

---

## 🧪 AUTOMATED TESTING

### Full Test Suite:
```bash
cd backend
node test-redux-apis.js
```

**Expected Results:**
```
🚀 Starting Redux Support APIs Tests - SV1 Backend

📂 PHASE 1: AUTHENTICATION TESTING
✅ Admin login successful  
✅ User login successful

📂 PHASE 2: TOKEN VERIFICATION (Redux Auth State)
✅ Admin token verification successful
✅ User token verification successful

📂 PHASE 3: PROTECTED ROUTES TESTING  
✅ Admin profile access successful
✅ User profile access successful
✅ Admin dashboard access successful (admin)
❌ Admin dashboard access failed (user) - Expected 403

📂 PHASE 4: ROUTE ACCESS VALIDATION
✅ All route access checks working

📂 PHASE 5: PROFILE MANAGEMENT
✅ Profile updates working

📂 PHASE 6: ADMIN FUNCTIONALITY
✅ Admin users list access (admin only)

🎉 All Redux Support API tests completed!
🚀 Backend is ready for Redux frontend integration!
```

---

## 📮 POSTMAN TESTING

### Import Collection:
1. Open Postman
2. Import: `backend/Postman_Collection_Redux_Protected.json`  
3. Set environment: `base_url = http://localhost:5000`

### Test Workflow:
1. **Admin Login** → Copy `accessToken` to `admin_token` variable
2. **User Login** → Copy `accessToken` to `user_token` variable  
3. **Verify Token** → Test Redux auth state verification
4. **Get Profile** → Test protected profile access
5. **Admin Dashboard** → Test admin-only access
6. **Route Access Checks** → Test permission validation
7. **Error Scenarios** → Test unauthorized access

---

## 📊 API ENDPOINTS OVERVIEW

### Redux Support APIs:
```
GET  /api/verify-token              # Verify token for Redux auth state
GET  /api/check-access/:route       # Check route permissions  
```

### Protected Routes - User Level:
```
GET  /api/profile                   # Get user profile
PUT  /api/profile                   # Update profile
```

### Protected Routes - Admin Level:
```  
GET  /api/admin/dashboard           # Admin dashboard data
GET  /api/admin/users               # Users management list
```

### Expected Responses:

#### ✅ Success (200):
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

#### ❌ Unauthorized (401):
```json
{
  "success": false, 
  "message": "Access token is required"
}
```

#### 🔒 Forbidden (403):
```json
{
  "success": false,
  "message": "Admin access required" 
}
```

---

## 🔒 ACCESS CONTROL DEMO

### User Permissions Matrix:

| Endpoint | Regular User | Admin | Expected Result |
|----------|-------------|-------|----------------|
| `/api/profile` | ✅ | ✅ | Both can access |
| `/api/admin/dashboard` | ❌ (403) | ✅ | Admin only |
| `/api/admin/users` | ❌ (403) | ✅ | Admin only |
| `/api/check-access/profile` | ✅ (hasAccess: true) | ✅ (hasAccess: true) | Both allowed |
| `/api/check-access/admin` | ❌ (hasAccess: false) | ✅ (hasAccess: true) | Admin only |

### Demo Script:
```bash
# Test access control in action
echo "Testing User vs Admin Access Control..."

# User trying to access admin endpoint (should fail)
echo "🔸 User → Admin Dashboard:"
curl -s http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer $USER_TOKEN" | jq .

# Admin accessing same endpoint (should work)  
echo "🔸 Admin → Admin Dashboard:"
curl -s http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
```

---

## ✅ SV1 COMPLETION CHECKLIST

### Backend Support for Redux & Protected Routes:
- ✅ **Token verification API** - Redux auth state validation
- ✅ **Route access validation** - Frontend permission checking
- ✅ **Protected profile APIs** - User profile management
- ✅ **Admin dashboard APIs** - Admin functionality  
- ✅ **Role-based access control** - User vs Admin permissions
- ✅ **Enhanced User model** - Profile fields & preferences
- ✅ **Activity logging** - Track Redux activities
- ✅ **Default test users** - Admin & User accounts ready
- ✅ **Comprehensive testing** - Automated scripts & Postman
- ✅ **Complete documentation** - API guide & integration help

### Ready for Frontend Implementation:
- 🔄 **Redux Toolkit store** - Auth state management
- 🛡️ **Protected Routes** - Route guards & navigation  
- 🔐 **Token handling** - Storage & verification
- 📱 **Profile pages** - User dashboard & settings
- 👨‍💼 **Admin pages** - Dashboard & user management
- 🎨 **Role-based UI** - Show/hide based on permissions

---

## 🎯 DEMO HIGHLIGHTS

### Key Features Demonstrated:

1. **Redux Auth State Support** ✅
   - Token verification endpoint
   - User info retrieval  
   - Auth state persistence

2. **Protected Routes Validation** ✅  
   - Route access checking
   - Permission-based navigation
   - Role-based redirects

3. **Role-Based Access Control** ✅
   - User vs Admin permissions
   - Granular endpoint protection
   - Proper error responses

4. **Profile Management** ✅
   - User profile APIs
   - Profile updates
   - Session management

5. **Admin Functionality** ✅
   - Admin dashboard
   - User management
   - Statistics & analytics

---

## 🔗 GitHub Integration

**Pull Request:** https://github.com/minhhuyphan/group-10-project/pull/new/feature/redux-protected  
**Branch Code:** https://github.com/minhhuyphan/group-10-project/tree/feature/redux-protected/backend

---

**🎉 SV1 BACKEND SUPPORT HOÀN TẤT!**

**Sản phẩm nộp SV1:**
- ✅ **Backend APIs hỗ trợ Redux** - All endpoints working
- ✅ **Protected Routes validation** - Role-based access control  
- ✅ **Testing & Documentation** - Complete guide for frontend
- ✅ **GitHub repository** - Branch feature/redux-protected

**🚀 READY FOR SV2 FRONTEND IMPLEMENTATION!**

*Frontend team có thể bắt đầu implement Redux store, Protected Routes, và UI components với full backend support!*
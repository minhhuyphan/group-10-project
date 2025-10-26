# Redux & Protected Routes - Database Testing Documentation

## 📦 SV3 - Database & Integration

**Mục tiêu:** Backend hỗ trợ API và kiểm thử dữ liệu cho Redux state management và Protected Routes

---

## 🎯 Tổng quan

Bài tập này tập trung vào:
1. **Redux Toolkit Integration** - Quản lý state nâng cao với Redux
2. **Protected Routes** - Chặn truy cập trang nếu chưa đăng nhập
3. **Database Support** - Backend hỗ trợ API cho Redux thunks
4. **Data Verification** - Kiểm thử token và user info được lưu đúng

### Phân công nhiệm vụ:
- **SV1**: Frontend Redux setup, Protected Routes UI
- **SV2**: Redux Toolkit, store auth, Redux thunk gọi API
- **SV3**: **Backend API support, Database testing** ✅ (Nhiệm vụ của bạn)

---

## ✅ Nhiệm vụ SV3 đã hoàn thành

### 1. Backend API Support ✅

#### **User Schema Updates**
📁 File: `backend/models/User.js`

**Fields added for Redux state:**
```javascript
{
  isAdmin: Boolean,           // Flag cho admin routes
  bio: String,                // Profile info
  phone: String,              // Contact info
  address: String,            // Address info
  preferences: {              // User settings
    theme: String,            // 'light', 'dark', 'auto'
    language: String,         // 'vi', 'en'
    notifications: {
      email: Boolean,
      push: Boolean,
      sms: Boolean
    }
  }
}
```

**Enhanced profile virtual:**
```javascript
userSchema.virtual('profile').get(function() {
  return {
    _id: this._id,           // ✅ Thêm _id
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isAdmin: this.isAdmin,   // ✅ Thêm isAdmin flag
    avatar: this.avatar,
    bio: this.bio,           // ✅ Thêm bio
    phone: this.phone,       // ✅ Thêm phone
    address: this.address,   // ✅ Thêm address
    preferences: this.preferences, // ✅ Thêm preferences
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});
```

**Benefits cho Redux:**
- `profile` virtual trả về đầy đủ info cho Redux state
- `isAdmin` flag dễ dàng check authorization
- `preferences` lưu user settings (theme, language)
- `bio`, `phone`, `address` cho profile page

---

#### **Activity Logging cho Redux Actions**
📁 File: `backend/models/ActivityLog.js`

**Tracking Redux actions:**
```javascript
// Log login action
await ActivityLog.create({
  userId: user._id,
  action: 'login',
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
  status: 'success',
  details: { source: 'redux-login' }
});

// Log failed login
await ActivityLog.create({
  userId: null,
  action: 'failed_login',
  ipAddress: req.ip,
  status: 'failed',
  errorMessage: 'Invalid credentials'
});
```

**Benefits:**
- Track Redux login/logout actions
- Monitor failed login attempts
- Audit trail for security
- Data for Admin Dashboard stats

---

#### **RefreshToken Support cho Redux Persistence**
📁 File: `backend/models/RefreshToken.js`

**Token storage cho Redux:**
```javascript
// Tạo refresh token khi login
const refreshToken = await RefreshToken.create({
  token: crypto.randomBytes(40).toString('hex'),
  userId: user._id,
  expiresAt: new Date(Date.now() + 7*24*60*60*1000), // 7 days
  createdByIp: req.ip
});

// Redux có thể lưu token và refresh khi cần
```

**Benefits:**
- Redux có thể persist token trong localStorage
- Auto-refresh khi access token hết hạn
- Track active sessions
- Revoke tokens khi logout

---

### 2. Database Testing ✅

#### **Test Suite**
📁 File: `backend/test-redux-protected-routes.js`

**18 comprehensive tests:**

**User & Admin Schema Tests (4):**
1. ✅ User schema has fields for Redux state (name, email, role, isAdmin)
2. ✅ Admin user has isAdmin=true flag
3. ✅ User.profile virtual includes all necessary info for Redux
4. ✅ User role check (for Protected Routes authorization)

**Token Management Tests (3):**
5. ✅ RefreshToken created correctly for Redux token storage
6. ✅ Query RefreshToken by token (for Redux token refresh)
7. ✅ Token revocation (for Redux logout action)

**User Query Tests (5):**
8. ✅ Query user by ID (for Redux thunk getUserInfo)
9. ✅ Query admin user (for Protected Admin Routes)
10. ✅ Query regular users (for User List in Admin Dashboard)
11. ✅ Query active users (for Protected Routes access control)
12. ✅ Count users by role (for Admin Dashboard statistics)

**User Update Tests (3):**
13. ✅ User profile update (for Redux profile actions)
14. ✅ lastLogin timestamp update (for Redux login state)
15. ✅ User preferences storage (for Redux user settings)

**Activity Logging Tests (2):**
16. ✅ ActivityLog tracks user actions (for Redux state sync)
17. ✅ Failed login tracking (for Redux error handling)

**Integration Tests (1):**
18. ✅ Integration: Complete login flow (Redux thunk simulation)

**Test Results:**
```
Total Tests: 18
✅ Passed: 18
❌ Failed: 0
Success Rate: 100%
```

---

## 🚀 Cách sử dụng

### 1. Run Database Tests

```bash
cd backend
node test-redux-protected-routes.js
```

**Expected Output:**
```
🧪 Redux & Protected Routes Database Test Suite
📦 SV3 - Database & Integration Testing

🔌 Connected to MongoDB

=== USER & ADMIN SCHEMA TESTS ===
✅ User schema has fields for Redux state
✅ Admin user has isAdmin=true flag
✅ User.profile virtual includes all necessary info
✅ User role check

=== TOKEN MANAGEMENT TESTS ===
✅ RefreshToken created correctly
✅ Query RefreshToken by token
✅ Token revocation

... (18 tests total)

📊 TEST SUMMARY
Total Tests: 18
✅ Passed: 18
Success Rate: 100%

🎉 All tests passed!
```

---

### 2. Verify Database Data

#### **Check Users**
```javascript
// MongoDB shell hoặc Compass
db.users.find({ isAdmin: true })  // Admin users
db.users.find({ isAdmin: false }) // Regular users
db.users.findOne({ email: 'redux.test@example.com' }) // Test user
```

#### **Check Refresh Tokens**
```javascript
// Active tokens
db.refreshtokens.find({ 
  revokedAt: null, 
  expiresAt: { $gt: new Date() } 
})

// Revoked tokens
db.refreshtokens.find({ revokedAt: { $ne: null } })
```

#### **Check Activity Logs**
```javascript
// Login activities
db.activitylogs.find({ action: 'login' })

// Failed logins
db.activitylogs.find({ action: 'failed_login' })

// User-specific logs
db.activitylogs.find({ userId: ObjectId('...') })
```

---

## 📊 Database Schema cho Redux

### User Schema

| Field | Type | Purpose | Redux Usage |
|-------|------|---------|-------------|
| `_id` | ObjectId | User ID | Redux user.id |
| `name` | String | User name | Redux user.name |
| `email` | String | Email | Redux user.email |
| `role` | String | User role | Redux user.role |
| `isAdmin` | Boolean | Admin flag | Protected Routes check |
| `bio` | String | User bio | Profile page |
| `phone` | String | Phone | Profile page |
| `address` | String | Address | Profile page |
| `avatar` | String | Avatar URL | Redux user.avatar |
| `preferences` | Object | User settings | Redux settings |
| `lastLogin` | Date | Last login time | Redux login state |
| `isActive` | Boolean | Account status | Login check |
| `createdAt` | Date | Created time | Profile info |
| `updatedAt` | Date | Updated time | Profile info |

### RefreshToken Schema

| Field | Type | Purpose | Redux Usage |
|-------|------|---------|-------------|
| `token` | String | Refresh token | Redux persist token |
| `userId` | ObjectId | User reference | Token owner |
| `expiresAt` | Date | Expiry time | Token validation |
| `createdByIp` | String | IP address | Security tracking |
| `revokedAt` | Date | Revoked time | Logout tracking |
| `isActive` | Virtual | Active status | Token validation |

### ActivityLog Schema

| Field | Type | Purpose | Redux Usage |
|-------|------|---------|-------------|
| `userId` | ObjectId | User reference | Log owner |
| `action` | String | Action type | Redux action type |
| `ipAddress` | String | IP address | Security tracking |
| `status` | String | Success/failed | Error handling |
| `errorMessage` | String | Error details | Redux error state |
| `timestamp` | Date | Action time | Timeline |

---

## 🔧 API Endpoints hỗ trợ Redux

### **Authentication APIs**

#### 1. Login API
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "a1b2c3d4e5f6...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user",
    "isAdmin": false,
    "avatar": null,
    "bio": "",
    "phone": "",
    "address": "",
    "preferences": {
      "theme": "light",
      "language": "vi",
      "notifications": {
        "email": true,
        "push": true,
        "sms": false
      }
    },
    "isActive": true,
    "lastLogin": "2025-10-26T10:00:00.000Z",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-10-26T10:00:00.000Z"
  }
}
```

**Redux usage:**
```javascript
// Redux thunk
export const login = (email, password) => async (dispatch) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;
    
    // Save to Redux store
    dispatch(setUser(user));
    dispatch(setTokens({ accessToken, refreshToken }));
    
    // Persist to localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    return response.data;
  } catch (error) {
    dispatch(setError(error.response.data.message));
    throw error;
  }
};
```

---

#### 2. Refresh Token API
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "g7h8i9j0k1l2..."
}
```

**Redux usage:**
```javascript
// Axios interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Get refresh token from Redux or localStorage
      const refreshToken = localStorage.getItem('refreshToken');
      
      try {
        const response = await api.post('/auth/refresh', { refreshToken });
        const { accessToken } = response.data;
        
        // Update token in Redux and localStorage
        dispatch(setAccessToken(accessToken));
        localStorage.setItem('accessToken', accessToken);
        
        // Retry original request
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (err) {
        // Refresh failed, logout
        dispatch(logout());
        return Promise.reject(err);
      }
    }
    
    return Promise.reject(error);
  }
);
```

---

#### 3. Logout API
```http
POST /auth/logout
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

**Redux usage:**
```javascript
export const logout = () => async (dispatch) => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  try {
    await api.post('/auth/logout', { refreshToken });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear Redux state
    dispatch(clearUser());
    dispatch(clearTokens());
    
    // Clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    // Redirect to login
    window.location.href = '/login';
  }
};
```

---

### **Protected Route APIs**

#### 4. Get User Profile (Protected)
```http
GET /profile
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "user",
    "isAdmin": false,
    "bio": "Software Developer",
    "phone": "0123456789",
    "address": "123 Main St",
    "preferences": { ... }
  }
}
```

**Redux usage:**
```javascript
export const getUserProfile = () => async (dispatch, getState) => {
  const { accessToken } = getState().auth;
  
  try {
    const response = await api.get('/profile', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    dispatch(setUser(response.data.user));
    return response.data;
  } catch (error) {
    if (error.response.status === 401) {
      // Token expired, will be handled by interceptor
    }
    throw error;
  }
};
```

---

#### 5. Update User Profile (Protected)
```http
PATCH /profile
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "name": "John Updated",
  "bio": "Senior Developer",
  "phone": "0987654321",
  "preferences": {
    "theme": "dark"
  }
}
```

**Redux usage:**
```javascript
export const updateProfile = (updates) => async (dispatch, getState) => {
  const { accessToken } = getState().auth;
  
  try {
    const response = await api.patch('/profile', updates, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    dispatch(updateUser(response.data.user));
    return response.data;
  } catch (error) {
    dispatch(setError(error.response.data.message));
    throw error;
  }
};
```

---

#### 6. Get All Users (Admin Only)
```http
GET /admin/users
Authorization: Bearer <accessToken>
```

**Redux usage:**
```javascript
export const getAllUsers = () => async (dispatch, getState) => {
  const { user, accessToken } = getState().auth;
  
  // Check if user is admin
  if (!user.isAdmin) {
    throw new Error('Unauthorized: Admin only');
  }
  
  try {
    const response = await api.get('/admin/users', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    dispatch(setUsers(response.data.users));
    return response.data;
  } catch (error) {
    throw error;
  }
};
```

---

## 🔒 Protected Routes Implementation

### Frontend Protected Route Component

```javascript
// ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  
  // Check if user is logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if route requires admin
  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

export default ProtectedRoute;
```

### Route Configuration

```javascript
// App.js
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      
      {/* Protected routes */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      
      {/* Admin-only routes */}
      <Route path="/admin" element={
        <ProtectedRoute adminOnly>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/admin/users" element={
        <ProtectedRoute adminOnly>
          <UserManagement />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
```

---

## 📸 Screenshots cần nộp

### 1. Database Test Results ✅
- Terminal output: 18/18 tests passed (100%)
- Sample data summary (Users, Admins, Tokens, Logs)

### 2. MongoDB Data Evidence ✅
- Users collection với isAdmin flag
- RefreshTokens collection với active tokens
- ActivityLogs collection với login/logout logs

### 3. API Testing (Postman) ✅
- Login request/response với Redux-ready user object
- Protected route với Authorization header
- Admin route với admin user
- Token refresh flow

### 4. Redux DevTools (Frontend) - SV2 sẽ làm
- Redux store với auth state
- User info trong store
- Token trong store
- Protected route navigation

---

## 📁 Files Delivered - SV3

```
backend/
├── models/
│   └── User.js                           # ✅ Updated với Redux fields
├── test-redux-protected-routes.js        # ✅ 18 database tests
├── REDUX_PROTECTED_ROUTES_TESTING.md     # ✅ Documentation (file này)
└── SV3_README.md                         # ✅ Updated với Redux activity
```

---

## ✨ Highlights - SV3 Contributions

### Database Schema Enhancement ✅
- ✅ Thêm `isAdmin` flag cho Protected Routes
- ✅ Thêm `bio`, `phone`, `address` cho profile
- ✅ Thêm `preferences` object cho user settings
- ✅ Enhanced `profile` virtual với đầy đủ fields

### Testing & Verification ✅
- ✅ 18 comprehensive tests (100% pass rate)
- ✅ User & Admin schema tests
- ✅ Token management tests
- ✅ Activity logging tests
- ✅ Integration test (complete login flow)

### API Support ✅
- ✅ Login API trả về Redux-ready user object
- ✅ RefreshToken support cho Redux persistence
- ✅ ActivityLog tracking cho Redux actions
- ✅ User queries cho Protected Routes

### Documentation ✅
- ✅ Complete testing guide
- ✅ API endpoint documentation
- ✅ Redux integration examples
- ✅ Protected Routes implementation guide

---

## 🎯 Test Checklist

- [x] Run `node test-redux-protected-routes.js` → All 18 tests pass
- [x] User schema has `isAdmin` flag
- [x] User.profile virtual includes all Redux fields
- [x] RefreshToken creation and query working
- [x] ActivityLog tracking login/logout
- [x] Token revocation on logout
- [x] User role checks for Protected Routes
- [x] User profile update working
- [x] lastLogin timestamp tracking
- [x] User preferences storage
- [x] Complete login flow integration test
- [ ] Screenshot: Test results (18/18 passed)
- [ ] Screenshot: MongoDB users with isAdmin
- [ ] Screenshot: RefreshTokens collection
- [ ] Screenshot: ActivityLogs collection
- [ ] Screenshot: Postman login response

---

## 👥 Team Contribution

**SV1 - Frontend Developer:**
- Protected Routes UI components
- Login/Signup forms
- Profile page
- Admin Dashboard UI

**SV2 - Redux Developer:**
- Redux Toolkit setup
- Auth slice (reducer, actions, thunks)
- Store configuration
- Redux DevTools setup
- Protected Route HOC
- Token refresh interceptor

**SV3 - Database & Integration:** ✅ **Completed**
- User schema updates for Redux
- Database test suite (18 tests, 100% pass)
- API endpoint verification
- RefreshToken support
- ActivityLog tracking
- Documentation

---

## 🚀 Next Steps

### For SV1 & SV2:
1. Install Redux Toolkit: `npm install @reduxjs/toolkit react-redux`
2. Create Redux store với auth slice
3. Implement Protected Routes component
4. Connect Login/Signup to Redux thunks
5. Test complete flow: Login → Redux state → Protected Route access

### For Demo:
1. ✅ Backend ready với database tests passing
2. Login → Redux saves user + tokens
3. Navigate to `/profile` → Protected Route allows access
4. Navigate to `/admin` without admin → Blocked
5. Login as admin → `/admin` accessible
6. Logout → Redux clears state → Protected Routes block

---

## 📞 Troubleshooting

**Issue:** Tests fail with "User.profile missing _id"  
**Fix:** ✅ Fixed - Updated User schema virtual to include `_id`

**Issue:** Tests fail with "isAdmin() is not a function"  
**Fix:** ✅ Fixed - Use `isAdmin` flag instead of method

**Issue:** RefreshToken not found  
**Fix:** Check MONGO_URI in `.env` file

**Issue:** ActivityLog not created  
**Fix:** Make sure ActivityLog model is imported and synced

---

**Author:** SV3 - Database & Integration  
**Date:** October 26, 2025  
**Project:** Redux & Protected Routes  
**Status:** ✅ COMPLETED - 18/18 tests passed (100%)

**Git Branch:** `feature/redux-protected`  
**Commit Message:** "SV3: Backend API support và database testing cho Redux Protected Routes - 18/18 tests passed"

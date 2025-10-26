# 🔄 REDUX & PROTECTED ROUTES - SV1 BACKEND SUPPORT

## 🎯 Mục tiêu SV1 Backend
- ✅ API endpoints hỗ trợ Redux frontend
- ✅ Token verification cho Redux auth state
- ✅ Protected routes validation
- ✅ Role-based access control
- ✅ Profile management APIs
- ✅ Admin dashboard data APIs

---

## 🏗️ Backend Architecture

### 1. Redux Support Controller
**File: `backend/controllers/reduxController.js`**

#### Core APIs for Redux Integration:

##### 🔐 Token Verification
```javascript
GET /api/verify-token
Authorization: Bearer {access_token}
```
**Purpose**: Verify token và lấy user info cho Redux auth state

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "user": {
    "id": "676ba123456789",
    "name": "User Name",
    "email": "user@example.com",
    "role": "user",
    "isAdmin": false,
    "avatar": null
  },
  "tokenInfo": {
    "issuedAt": "2025-10-25T10:00:00Z",
    "expiresAt": "2025-10-25T10:15:00Z"
  }
}
```

##### 🛡️ Route Access Validation
```javascript
GET /api/check-access/{route}
Authorization: Bearer {access_token}
```
**Purpose**: Kiểm tra quyền truy cập route trước khi navigate

**Example:**
```bash
GET /api/check-access/%2Fprofile
GET /api/check-access/%2Fadmin%2Fdashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "route": "/admin",
    "hasAccess": true,
    "user": {
      "id": "676ba123456789",
      "role": "admin",
      "isAdmin": true
    },
    "requiredRole": "admin"
  }
}
```

### 2. Protected Routes APIs

#### 👤 Profile Management (User Level)

##### Get Profile
```javascript
GET /api/profile
Authorization: Bearer {access_token}
```

##### Update Profile
```javascript
PUT /api/profile
Authorization: Bearer {access_token}

{
  "name": "Updated Name",
  "bio": "User bio",
  "phone": "0123456789",
  "address": "User address"
}
```

#### 👨‍💼 Admin APIs (Admin Level Only)

##### Admin Dashboard
```javascript
GET /api/admin/dashboard
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 50,
      "activeUsers": 45,
      "newUsersThisWeek": 8,
      "activeSessionsToday": 12
    },
    "recentUsers": [...],
    "statistics": {
      "userGrowthRate": "16.00",
      "activeRate": "90.00"
    }
  }
}
```

##### Users Management
```javascript
GET /api/admin/users?page=1&limit=10&search=&status=all
Authorization: Bearer {admin_token}
```

---

## 🔒 Access Control Matrix

| Route | User | Admin | Description |
|-------|------|--------|-------------|
| `/profile` | ✅ | ✅ | User profile management |
| `/admin` | ❌ | ✅ | Admin area access |
| `/admin/dashboard` | ❌ | ✅ | Admin dashboard |
| `/admin/users` | ❌ | ✅ | Users management |

### Role Validation Logic:
```javascript
// User level access
if (user.role === 'user' && !adminRequired) {
  return true;
}

// Admin level access
if ((user.role === 'admin' || user.isAdmin) && adminRequired) {
  return true;
}

return false;
```

---

## 📝 User Model Updates

### Enhanced User Schema
```javascript
{
  // Basic fields
  name: String,
  email: String,
  password: String,
  
  // Role & permissions
  role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
  isAdmin: { type: Boolean, default: false },
  
  // Profile fields for Redux
  bio: { type: String, maxlength: 500, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, maxlength: 200, default: '' },
  
  // User preferences
  preferences: {
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
    language: { type: String, default: 'vi' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  }
}
```

---

## 🧪 Testing

### 1. Automated Test Script
```bash
cd backend
node test-redux-apis.js
```

**Test coverage:**
- ✅ Admin & User login
- ✅ Token verification
- ✅ Protected routes access
- ✅ Role-based validation
- ✅ Profile management
- ✅ Admin functionality
- ✅ Error scenarios

### 2. Postman Collection
Import: `backend/Postman_Collection_Redux_Protected.json`

**Test sequence:**
1. **Login** admin và user accounts
2. **Verify tokens** cho Redux auth state
3. **Test protected routes** với different roles
4. **Validate access control** cho admin endpoints
5. **Error scenarios** invalid tokens/unauthorized access

### 3. Default Test Users
Server tự động tạo test users:

```javascript
// Admin user
{
  email: 'admin@group10.com',
  password: 'AdminPassword123!',
  role: 'admin',
  isAdmin: true
}

// Regular user  
{
  email: 'user@group10.com',
  password: 'UserPassword123!',
  role: 'user', 
  isAdmin: false
}
```

---

## 🚀 Frontend Integration Guide

### Redux Store Structure
```javascript
// Redux auth slice example
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
    error: null
  },
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
    },
    verifyTokenSuccess: (state, action) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    }
  }
});
```

### Protected Route Component
```javascript
// Frontend component example
const ProtectedRoute = ({ children, requiredRole = 'user' }) => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  
  // Check authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Check role permissions
  if (requiredRole === 'admin' && !user.isAdmin) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};
```

### Redux Thunks
```javascript
// Verify token thunk
export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (token) => {
    const response = await api.get('/api/verify-token', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
);

// Check route access thunk
export const checkRouteAccess = createAsyncThunk(
  'auth/checkRouteAccess', 
  async (route) => {
    const response = await api.get(`/api/check-access${route}`);
    return response.data;
  }
);
```

---

## 📊 Activity Logging Integration

### Logged Activities for Redux:
- `TOKEN_VERIFY` - Token verification requests
- `PROFILE_VIEW` - Profile page access
- `PROFILE_UPDATE` - Profile modifications
- `ADMIN_DASHBOARD_VIEW` - Admin dashboard access
- `ADMIN_VIEW_USERS` - Users list access
- `ROUTE_ACCESS_CHECK` - Route permission checks
- `ADMIN_ACCESS_DENIED` - Unauthorized admin access

### Log Example:
```json
{
  "userId": "676ba123456789",
  "action": "ROUTE_ACCESS_CHECK",
  "timestamp": "2025-10-25T10:30:45.123Z",
  "ip": "192.168.1.100",
  "details": {
    "route": "/admin/dashboard",
    "hasAccess": true,
    "userRole": "admin"
  }
}
```

---

## 🔧 API Endpoints Summary

### Authentication & Verification
```
POST   /auth/login                    # Login get tokens
GET    /api/verify-token              # Verify token (Redux auth)
GET    /api/check-access/:route       # Check route permissions
```

### Protected Routes - User Level
```
GET    /api/profile                   # Get user profile
PUT    /api/profile                   # Update profile
```

### Protected Routes - Admin Level  
```
GET    /api/admin/dashboard           # Admin dashboard data
GET    /api/admin/users               # Users management
```

### Error Responses
```javascript
// Unauthorized (401)
{
  "success": false,
  "message": "Access token is required"
}

// Forbidden (403)  
{
  "success": false,
  "message": "Admin access required"
}

// Not Found (404)
{
  "success": false,
  "message": "User not found"
}
```

---

## ✅ SV1 Backend Support Checklist

- ✅ **Token verification API** - Cho Redux auth state
- ✅ **Route access validation** - Kiểm tra permissions
- ✅ **Role-based access control** - Admin vs User
- ✅ **Protected routes APIs** - Profile & Admin endpoints  
- ✅ **Enhanced User model** - Profile fields & preferences
- ✅ **Activity logging** - Track Redux activities
- ✅ **Default test users** - Admin & User accounts
- ✅ **Comprehensive testing** - Scripts & Postman
- ✅ **Error handling** - Proper HTTP status codes
- ✅ **Documentation** - Complete API guide

---

## 🎯 Frontend Implementation Ready

**Backend provides:**
- ✅ Authentication APIs cho Redux store
- ✅ Protected routes validation
- ✅ Role-based access control
- ✅ Profile management endpoints
- ✅ Admin dashboard data
- ✅ Error handling & logging

**Frontend can now implement:**
- 🔄 Redux Toolkit store setup
- 🛡️ Protected Route components  
- 🔐 Auth state management
- 📱 Profile & Admin pages
- 🎨 Role-based UI rendering

---

*Generated: 2025-10-25*  
*SV1 - Backend Support for Redux & Protected Routes*  
*Status: ✅ READY FOR FRONTEND INTEGRATION*
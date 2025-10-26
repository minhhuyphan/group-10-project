# 🚀 Quick Start Guide - Redux & Protected Routes (SV3)

## ✅ Tóm tắt nhanh

**Phần của SV3 đã hoàn thành 100%:**
- ✅ User schema với Redux fields
- ✅ Database test suite (18/18 tests passed)
- ✅ API support cho Redux
- ✅ Documentation đầy đủ

---

## 📋 Checklist SV3

- [x] User schema có `isAdmin` flag
- [x] User schema có `preferences` object
- [x] Enhanced `profile` virtual với 16 fields
- [x] RefreshToken persistence working
- [x] ActivityLog tracking working
- [x] 18 database tests passing (100%)
- [x] Documentation completed
- [x] Committed to Git
- [x] Pushed to GitHub

---

## 🧪 Run Tests

```bash
cd backend
node test-redux-protected-routes.js
```

**Expected:**
```
✅ Passed: 18
❌ Failed: 0
Success Rate: 100%
```

---

## 📊 Database Schema

### User Fields cho Redux
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  role: String,
  isAdmin: Boolean,      // ✅ Protected Routes
  bio: String,           // ✅ Profile
  phone: String,         // ✅ Profile
  address: String,       // ✅ Profile
  preferences: {         // ✅ Settings
    theme: String,
    language: String,
    notifications: Object
  },
  avatar: String,
  lastLogin: Date,
  isActive: Boolean
}
```

---

## 🔧 API Endpoints

### 1. Login
```http
POST /auth/login
Body: { email, password }
```

**Response:**
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "_id": "...",
    "name": "...",
    "email": "...",
    "role": "user",
    "isAdmin": false,
    "preferences": {...}
  }
}
```

### 2. Refresh Token
```http
POST /auth/refresh
Body: { refreshToken }
```

### 3. Logout
```http
POST /auth/logout
Body: { refreshToken }
```

### 4. Get Profile (Protected)
```http
GET /profile
Headers: { Authorization: Bearer <token> }
```

---

## 💻 Redux Examples

### Login Thunk
```javascript
export const login = (email, password) => async (dispatch) => {
  const res = await api.post('/auth/login', { email, password });
  dispatch(setUser(res.data.user));
  dispatch(setTokens(res.data));
  localStorage.setItem('accessToken', res.data.accessToken);
};
```

### Protected Route
```javascript
const ProtectedRoute = ({ children, adminOnly }) => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (adminOnly && !user.isAdmin) return <Navigate to="/unauthorized" />;
  
  return children;
};
```

---

## 📸 Screenshots Needed

### SV3 (Database) ✅
- [x] Test results (18/18)
- [x] MongoDB users với isAdmin
- [x] RefreshTokens collection
- [x] ActivityLogs collection

### SV1/SV2 (Frontend)
- [ ] Redux DevTools với auth state
- [ ] Login → Redux saves state
- [ ] Protected Route /profile accessible
- [ ] Protected Route /admin blocked
- [ ] Logout → State cleared

---

## 📁 Files Delivered

```
backend/
├── models/
│   └── User.js                           ✅ Redux fields
├── test-redux-protected-routes.js        ✅ 18 tests
├── REDUX_PROTECTED_ROUTES_TESTING.md     ✅ Documentation
├── SV3_REDUX_SUMMARY.md                  ✅ Summary
└── SV3_README.md                         ✅ Updated
```

---

## 🎯 For SV1 & SV2

### Install Dependencies
```bash
cd frontend
npm install @reduxjs/toolkit react-redux
```

### Create Redux Store
```javascript
// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer
  }
});
```

### Create Auth Slice
```javascript
// src/store/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setTokens: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    }
  }
});

export const { setUser, setTokens, clearAuth } = authSlice.actions;
export default authSlice.reducer;
```

### Wrap App with Provider
```javascript
// src/index.js
import { Provider } from 'react-redux';
import { store } from './store/store';

root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
```

---

## ✨ Key Points

1. **User schema** ready với `isAdmin` và `preferences`
2. **18 tests** passing (100%)
3. **API responses** optimized cho Redux
4. **Documentation** complete với examples
5. **Git** committed và pushed

---

## 📞 Support

**SV3 nhiệm vụ hoàn thành!**

Nếu SV1/SV2 cần:
- API endpoint documentation → `REDUX_PROTECTED_ROUTES_TESTING.md`
- Redux examples → Same file
- Database queries → Same file
- Troubleshooting → Same file

---

## 🎉 Status

✅ **SV3 COMPLETED**  
📅 **Date:** October 26, 2025  
🔗 **Branch:** feature/redux-protected  
✅ **Tests:** 18/18 passed (100%)  
✅ **Pushed:** Yes  

**Ready for SV1 & SV2 frontend integration!** 🚀

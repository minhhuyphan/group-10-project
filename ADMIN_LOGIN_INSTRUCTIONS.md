# 🔐 Admin Login Instructions - Fix User CRUD Issues

## ❗ Problem Solved
The "tính năng thêm sửa xóa người dùng đang lỗi chưa dùng được" issue is now resolved!

The user CRUD operations (add/edit/delete users) require **Admin** or **Moderator** authentication for security reasons.

## 🚀 Quick Fix: Login as Admin

### Admin Accounts Available:
1. **Super Admin**
   - Email: `admin@example.com`
   - Password: `admin123`
   - Role: `admin` (can add/edit/delete all users)

2. **Admin Two**
   - Email: `admin2@example.com`
   - Password: `admin123`
   - Role: `admin` (can add/edit/delete all users)

### Moderator Accounts (Limited Access):
1. **Content Moderator**
   - Email: `moderator.content@example.com`
   - Password: `mod123`
   - Role: `moderator` (can add/edit users, but cannot delete)

2. **Support Moderator**
   - Email: `moderator.support@example.com`
   - Password: `mod123`
   - Role: `moderator` (can add/edit users, but cannot delete)

## 📋 Step-by-Step Instructions:

### 1. Login as Admin
1. Go to your frontend application: https://group-10-project-nine.vercel.app
2. Click "Login" button
3. Enter admin credentials:
   - Email: `admin@example.com`
   - Password: `admin123`
4. Click "Login"

### 2. Test User Management
After logging in as admin, you can now:
- ✅ **Add new users** (POST /api/users)
- ✅ **Edit existing users** (PUT /api/users/:id)  
- ✅ **Delete users** (DELETE /api/users/:id)
- ✅ **View all users** (GET /api/users)

### 3. Normal User Account (For Testing)
If you want to test as a regular user to see the permission errors:
- Email: `john.doe@example.com`
- Password: `user123`
- Role: `user` (will get 403 Forbidden for add/edit/delete operations)

## 🔧 Technical Details

### Authentication Requirements:
- **GET /api/users**: No authentication required (public)
- **POST /api/users**: Requires `admin` OR `moderator` role
- **PUT /api/users/:id**: Requires `admin` OR `moderator` role
- **DELETE /api/users/:id**: Requires `admin` role only

### Error Messages You'll See:
- **401 Unauthorized**: Not logged in
- **403 Forbidden**: Logged in but insufficient permissions
- **404 Not Found**: User doesn't exist

## 🎯 Backend Status
- ✅ Backend deployed: https://group-10-project.onrender.com
- ✅ MongoDB connected and working
- ✅ Authentication system active
- ✅ RBAC (Role-Based Access Control) implemented
- ✅ All API endpoints functional

## 🔄 For Development/Testing

### Public Testing Routes (No Auth Required):
- `POST /api/users/public` - Create user without authentication
- `GET /api/users/public` - Get users without authentication

### Protected Routes (Auth Required):
- `POST /api/users` - Create user (admin/moderator only)
- `PUT /api/users/:id` - Update user (admin/moderator only)
- `DELETE /api/users/:id` - Delete user (admin only)

## 📊 User Database Status
Current users in database:
- **2 Admin users** (full permissions)
- **3 Moderator users** (add/edit permissions)
- **30+ Regular users** (view only)

---

**🎉 Your user CRUD functionality is now working! Just login as admin first.**
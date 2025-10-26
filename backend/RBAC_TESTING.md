# RBAC Testing Guide - SV3 Database

## Overview
This document provides comprehensive testing instructions for the Role-Based Access Control (RBAC) implementation in the User Management System.

**Author:** SV3 - Database & Integration  
**Activity:** Activity 2 - Advanced RBAC  
**Date:** January 2025  

---

## 📋 Table of Contents
1. [Schema Changes](#schema-changes)
2. [Sample Users](#sample-users)
3. [Environment Setup](#environment-setup)
4. [Running Tests](#running-tests)
5. [Database Queries](#database-queries)
6. [Testing Checklist](#testing-checklist)

---

## 1. Schema Changes

### 1.1 User Model Updates

The User schema has been enhanced with the following RBAC fields:

```javascript
{
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],  // Added 'moderator'
    default: 'user'
  },
  permissions: {
    type: [String],  // NEW: Array of permission strings
    default: []
  },
  department: {
    type: String,    // NEW: Department for moderators
    required: false
  }
}
```

### 1.2 Indexes Added

**Purpose:** Optimize role-based queries

```javascript
// Compound index for role and active status queries
{ role: 1, isActive: 1 }

// Index for department queries
{ department: 1 }
```

### 1.3 Helper Methods

**Instance Methods:**
- `isAdmin()` - Check if user is admin
- `isModerator()` - Check if user is moderator  
- `isUser()` - Check if user is regular user
- `hasPermission(permission)` - Check if user has specific permission
- `canManageDepartment(dept)` - Check if moderator can manage department

**Static Methods:**
- `getUsersByRole(role)` - Get all users with specific role
- `countByRole()` - Count users grouped by role

---

## 2. Sample Users

### 2.1 Admin Users (2 total)

| Email | Password | Permissions |
|-------|----------|-------------|
| admin@example.com | admin123 | All permissions |
| admin2@example.com | admin123 | All permissions |

**Admin Capabilities:**
- Full system access
- All permissions automatically granted
- Can manage all departments

### 2.2 Moderator Users (3 total)

| Email | Password | Department | Permissions |
|-------|----------|------------|-------------|
| moderator.content@example.com | mod123 | Content | manage_content, edit_posts |
| moderator.support@example.com | mod123 | Support | manage_tickets, view_reports |
| moderator.community@example.com | mod123 | Community | manage_users, ban_users |

**Moderator Capabilities:**
- Department-specific access
- Limited permissions based on department
- Can manage only their assigned department

### 2.3 Regular Users (5 sample users)

| Email | Password | Permissions |
|-------|----------|-------------|
| john.doe@example.com | user123 | read, write |
| jane.smith@example.com | user123 | read |
| bob.johnson@example.com | user123 | read, write, comment |
| alice.williams@example.com | user123 | read |
| charlie.brown@example.com | user123 | - |

**User Capabilities:**
- Limited to assigned permissions
- No administrative access
- Cannot manage departments

---

## 3. Environment Setup

### 3.1 Prerequisites

```bash
# Ensure MongoDB is running
mongosh

# Verify Node.js and npm
node --version  # Should be v14+
npm --version

# Install dependencies (if not already installed)
cd backend
npm install
```

### 3.2 Environment Variables

Ensure `.env` file contains:

```env
MONGO_URI=mongodb://localhost:27017/userauth_db
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

---

## 4. Running Tests

### 4.1 Seed Database

**First time setup or to reset data:**

```bash
cd backend
node seed-rbac-users.js
```

**Expected Output:**
```
✅ Created 9 users
⏭️ Skipped 1 user (already exists)
❌ Errors: 0

Current Distribution:
  2 admin users
  3 moderator users
  17 user users
```

### 4.2 Run RBAC Tests

**Execute comprehensive test suite:**

```bash
node test-rbac.js
```

**Expected Result:** All 16 tests should pass

**Test Coverage:**
1. ✅ Schema supports all three roles
2. ✅ Role-based indexes exist
3. ✅ Query admin users
4. ✅ Query moderator users
5. ✅ Query regular users
6. ✅ Admin helper method works
7. ✅ Moderator helper method works
8. ✅ User helper method works
9. ✅ Permission system works
10. ✅ Department management works
11. ✅ Count users by role
12. ✅ Query active users by role
13. ✅ Query moderators by department
14. ✅ Permissions array works correctly
15. ✅ Profile virtual includes role information
16. ✅ Role-based query performance

---

## 5. Database Queries

### 5.1 MongoDB Shell Queries

Connect to MongoDB shell:
```bash
mongosh
use userauth_db
```

#### 5.1.1 Role Distribution

```javascript
// Count users by role
db.users.aggregate([
  { $group: { _id: "$role", count: { $sum: 1 } } }
])
```

#### 5.1.2 Query by Role

```javascript
// Get all admin users
db.users.find({ role: "admin" }, { name: 1, email: 1, role: 1 })

// Get all moderators with departments
db.users.find(
  { role: "moderator" },
  { name: 1, email: 1, department: 1 }
)

// Get regular users with permissions
db.users.find(
  { role: "user", permissions: { $ne: [] } },
  { name: 1, email: 1, permissions: 1 }
)
```

#### 5.1.3 Department Queries

```javascript
// Get all departments
db.users.distinct("department", { role: "moderator" })

// Get moderators by department
db.users.find(
  { role: "moderator", department: "Content" },
  { name: 1, email: 1, permissions: 1 }
)
```

#### 5.1.4 Permission Queries

```javascript
// Users with specific permission
db.users.find(
  { permissions: "manage_content" },
  { name: 1, email: 1, role: 1, permissions: 1 }
)

// Users with multiple permissions
db.users.find(
  { permissions: { $all: ["read", "write"] } },
  { name: 1, email: 1, permissions: 1 }
)
```

#### 5.1.5 Index Verification

```javascript
// Check indexes
db.users.getIndexes()

// Expected indexes:
// - _id (default)
// - email (unique)
// - role_1
// - role_1_isActive_1 (compound)
// - department_1
```

### 5.2 Mongoose Queries (Code Examples)

#### 5.2.1 Using Helper Methods

```javascript
const User = require('./models/User');

// Check if user is admin
const user = await User.findOne({ email: 'admin@example.com' });
if (user.isAdmin()) {
  console.log('User is admin');
}

// Check permissions
if (user.hasPermission('manage_content')) {
  console.log('User can manage content');
}

// Check department management
const moderator = await User.findOne({ role: 'moderator' });
if (moderator.canManageDepartment('Content')) {
  console.log('Can manage Content department');
}
```

#### 5.2.2 Using Static Methods

```javascript
// Get all users by role
const admins = await User.getUsersByRole('admin');
const moderators = await User.getUsersByRole('moderator');

// Count users by role
const roleCounts = await User.countByRole();
console.log(roleCounts);
// Output: [
//   { _id: 'admin', count: 2 },
//   { _id: 'moderator', count: 3 },
//   { _id: 'user', count: 17 }
// ]
```

---

## 6. Testing Checklist

### 6.1 Database Tests ✅

- [x] User schema has 3 roles (user, admin, moderator)
- [x] Permissions array field exists and works
- [x] Department field exists for moderators
- [x] Role index created successfully
- [x] Compound role-isActive index created
- [x] Department index created
- [x] Sample data seeded (2 admin, 3 moderator, 5+ user)

### 6.2 Helper Method Tests ✅

- [x] `isAdmin()` returns true for admins only
- [x] `isModerator()` returns true for moderators only
- [x] `isUser()` returns true for regular users only
- [x] `hasPermission()` works for all roles
- [x] Admin has all permissions automatically
- [x] `canManageDepartment()` works for moderators

### 6.3 Static Method Tests ✅

- [x] `getUsersByRole()` returns correct users
- [x] `countByRole()` returns accurate counts

### 6.4 Query Performance Tests ✅

- [x] Role-based queries use indexes
- [x] Department queries use indexes
- [x] Query response time < 100ms

### 6.5 Profile Integration ✅

- [x] Profile virtual includes role field
- [x] Profile includes permissions
- [x] Profile includes department (for moderators)

---

## 📊 Test Results Summary

**Test Suite:** `test-rbac.js`  
**Total Tests:** 16  
**Passed:** 16 ✅  
**Failed:** 0 ❌  
**Success Rate:** 100%  

**Database State:**
- Total Users: 22
- Admin Users: 2
- Moderator Users: 3
- Regular Users: 17
- Active Users: 22

**Departments:**
- Content (1 moderator)
- Support (1 moderator)
- Community (1 moderator)

---

## 🔧 Troubleshooting

### Issue: "No users found"
**Solution:** Run seed script first:
```bash
node seed-rbac-users.js
```

### Issue: "Index not found"
**Solution:** Indexes are created automatically when User model is first accessed. If missing, run:
```javascript
await User.syncIndexes();
```

### Issue: "Permission check fails"
**Solution:** Verify user has permissions array:
```javascript
const user = await User.findById(userId);
console.log(user.permissions); // Should be array
```

### Issue: "Department query returns nothing"
**Solution:** Only moderators have departments:
```javascript
db.users.find({ role: "moderator", department: { $ne: null } })
```

---

## 📝 Notes

1. **Admin Permissions:** Admins automatically have ALL permissions. The `hasPermission()` method always returns `true` for admins.

2. **Department Management:** Only moderators have department assignments. Regular users and admins have `null` department.

3. **Default Role:** New users are assigned `'user'` role by default.

4. **Password Security:** All sample passwords are hashed with bcrypt. Never store plain text passwords.

5. **Index Performance:** Role-based queries should complete in < 50ms with proper indexes.

---

## 🚀 Next Steps

1. ✅ Run seed script to populate database
2. ✅ Run test suite to verify implementation
3. ⏭️ Integrate with backend API endpoints
4. ⏭️ Add frontend role-based UI components
5. ⏭️ Implement permission middleware for routes

---

**End of RBAC Testing Guide**  
**Prepared by:** SV3 - Database & Integration  
**Version:** 1.0

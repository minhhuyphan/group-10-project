# RBAC (Role-Based Access Control) Implementation

## Tổng quan

Hệ thống RBAC được triển khai với 3 role chính:
- **User**: Người dùng cơ bản
- **Moderator**: Người điều hành 
- **Admin**: Quản trị viên

## Phân quyền theo Role

### User
- ✅ Xem thông tin cá nhân
- ✅ Chỉnh sửa thông tin cá nhân
- ✅ Upload avatar
- ❌ Không thể xem thông tin người dùng khác
- ❌ Không thể thực hiện các thao tác quản lý

### Moderator  
- ✅ Tất cả quyền của User
- ✅ Xem danh sách users (trừ admin)
- ✅ Xem thống kê users
- ✅ Thay đổi trạng thái active/inactive của users (trừ admin)
- ❌ Không thể thay đổi role
- ❌ Không thể quản lý admin

### Admin
- ✅ Tất cả quyền của User và Moderator
- ✅ Xem tất cả users bao gồm admin
- ✅ Thay đổi role của users
- ✅ Thay đổi trạng thái của tất cả users
- ✅ Xóa users
- ✅ Toàn quyền quản lý hệ thống

## API Endpoints

### Authentication
```
POST /api/login - Đăng nhập
POST /api/signup - Đăng ký
```

### RBAC APIs

#### 1. Lấy thông tin role hiện tại
```
GET /api/rbac/me
Headers: Authorization: Bearer <token>
```

#### 2. Lấy danh sách users (phân quyền theo role)
```
GET /api/rbac/users  
Headers: Authorization: Bearer <token>
```

#### 3. Lấy thống kê users (Admin/Moderator)
```
GET /api/rbac/stats
Headers: Authorization: Bearer <token>
```

#### 4. Cập nhật role user (Admin only)
```
PUT /api/rbac/users/:id/role
Headers: Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "user|moderator|admin"
}
```

#### 5. Cập nhật trạng thái user (Admin/Moderator)
```
PUT /api/rbac/users/:id/status
Headers: Authorization: Bearer <token>  
Content-Type: application/json

{
  "isActive": true|false
}
```

## Middleware

### checkRole(roles)
Middleware linh hoạt để kiểm tra quyền truy cập:

```javascript
// Cho phép một role cụ thể
router.get('/admin-only', checkRole('admin'), handler);

// Cho phép nhiều roles
router.get('/staff-only', checkRole(['moderator', 'admin']), handler);
```

### authenticateAccessToken
Middleware xác thực JWT token và thêm thông tin user vào `req.user`.

## Cách sử dụng

### 1. Chuẩn bị dữ liệu test
```bash
cd backend
node seed-rbac-data.js
```

### 2. Khởi động server
```bash
npm start
# hoặc
node server.js
```

### 3. Test APIs
```bash
node test-rbac-apis.js
```

## Tài khoản test

Sau khi chạy seed script, bạn sẽ có các tài khoản test:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | admin123 |
| Moderator | moderator@test.com | mod123 |
| User | user1@test.com | user123 |
| User | user2@test.com | user123 |
| Inactive User | inactive@test.com | inactive123 |

## Cấu trúc Database

### User Schema Updates
```javascript
role: {
  type: String,
  enum: ["user", "moderator", "admin"],
  default: "user",
}
```

## Security Features

1. **Token-based Authentication**: Sử dụng JWT
2. **Role-based Authorization**: Phân quyền theo role
3. **Self-protection**: User không thể thay đổi role/status của chính mình
4. **Hierarchical Access**: Moderator không thể quản lý Admin
5. **Input Validation**: Validate tất cả input từ client

## Testing Scenarios

### Scenario 1: User Role
1. Login as user1@test.com
2. GET /api/rbac/me → Thấy role = "user"
3. GET /api/rbac/users → Chỉ thấy thông tin của chính mình
4. GET /api/rbac/stats → 403 Forbidden

### Scenario 2: Moderator Role  
1. Login as moderator@test.com
2. GET /api/rbac/users → Thấy tất cả users trừ admin
3. PUT /api/rbac/users/:id/status → Có thể thay đổi trạng thái user
4. PUT /api/rbac/users/:id/role → 403 Forbidden

### Scenario 3: Admin Role
1. Login as admin@test.com  
2. GET /api/rbac/users → Thấy tất cả users
3. PUT /api/rbac/users/:id/role → Có thể thay đổi role
4. PUT /api/rbac/users/:id/status → Có thể thay đổi trạng thái

## Error Handling

```javascript
// Unauthorized (không có token)
{
  "success": false,
  "message": "Authentication required", 
  "error": "NO_AUTH"
}

// Insufficient permissions
{
  "success": false,
  "message": "Access denied. Required roles: admin",
  "error": "INSUFFICIENT_PERMISSIONS",
  "userRole": "user",
  "requiredRoles": ["admin"]
}
```

## Next Steps

1. **Frontend Integration**: Tích hợp với React frontend
2. **Advanced Permissions**: Thêm permissions chi tiết hơn
3. **Audit Logging**: Log các thao tác quan trọng
4. **Role Management UI**: Giao diện quản lý role
5. **Dynamic Roles**: Cho phép tạo role động
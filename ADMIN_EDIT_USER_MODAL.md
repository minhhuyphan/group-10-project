# Hướng dẫn: Chức năng Sửa User với Modal Popup

## Tổng quan thay đổi

Đã tách biệt chức năng **Thêm user** và **Sửa user** trong trang Admin:
- **Form Thêm user**: Luôn hiển thị cố định ở đầu trang Admin
- **Form Sửa user**: Hiển thị trong modal popup khi bấm nút "Sửa"

## Các file đã thay đổi

### 1. ✨ File mới
- `frontend/src/components/EditUserModal.jsx` - Component modal để sửa user

### 2. 📝 File đã chỉnh sửa
- `frontend/src/AdminUsers.jsx` - Tích hợp modal, tách logic add/edit
- `frontend/src/AddUser.jsx` - Đơn giản hóa chỉ cho thêm user mới
- `frontend/src/UserList.jsx` - Xóa logic highlight user đang edit
- `frontend/src/App.css` - Thêm styles cho modal
- `frontend/src/components/BackButton.jsx` - Nút quay lại cho tất cả các trang

## Cách hoạt động

### Trang Admin (`/admin/users`)

```
┌─────────────────────────────────────┐
│ 👨‍💼 Admin - Quản lý người dùng       │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ➕ Thêm người dùng mới       │   │
│ │                             │   │
│ │ [Form luôn hiển thị]        │   │
│ └─────────────────────────────┘   │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ Danh sách người dùng        │   │
│ │                             │   │
│ │ User 1  [✏️ Sửa] [🗑️ Xóa]   │   │
│ │ User 2  [✏️ Sửa] [🗑️ Xóa]   │   │
│ └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Khi bấm nút "Sửa"

```
        Modal Popup xuất hiện
┌─────────────────────────────────┐
│ ✏️ Sửa thông tin người dùng   ✕│
├─────────────────────────────────┤
│                                 │
│ Tên *: [John Doe________]      │
│                                 │
│ Email *: [john@example.com___] │
│                                 │
│ Tuổi: [25____]                 │
│                                 │
├─────────────────────────────────┤
│          [Hủy]  [💾 Lưu thay đổi]│
└─────────────────────────────────┘
```

## Tính năng

### EditUserModal Component

✅ **Modal popup** với backdrop tối
✅ **Validate real-time** khi nhập liệu
✅ **Hiển thị lỗi** rõ ràng cho từng field
✅ **Click bên ngoài** để đóng modal
✅ **Nút X** để đóng
✅ **Animation** mượt mà khi mở/đóng
✅ **Responsive** trên mobile

### Validation Rules

- **Tên**: 
  - Không được trống
  - Tối thiểu 2 ký tự
  - Tối đa 50 ký tự

- **Email**: 
  - Không được trống
  - Định dạng email hợp lệ (user@example.com)
  - Tối đa 100 ký tự

- **Tuổi** (optional):
  - Phải là số
  - Từ 1 đến 150

## Workflow người dùng

1. **Vào trang Admin**: `/admin/users`
2. **Thêm user mới**: Dùng form ở đầu trang
3. **Sửa user**: 
   - Bấm nút "✏️ Sửa" trên user card
   - Modal popup hiện ra với dữ liệu user
   - Chỉnh sửa thông tin
   - Bấm "💾 Lưu thay đổi" hoặc "Hủy"
   - Modal đóng lại, danh sách tự động refresh
4. **Xóa user**: Bấm nút "🗑️ Xóa" (có confirm)

## API Endpoints sử dụng

```javascript
// Thêm user mới
POST /api/users
Body: { name, email, age }

// Sửa user
PUT /api/users/:id
Body: { name, email, age }

// Xóa user
DELETE /api/users/:id

// Lấy danh sách users
GET /api/users
```

## Permissions

- Cần quyền **Admin** hoặc **Moderator** để:
  - Thêm user mới
  - Sửa user
  - Xóa user
- User thường chỉ xem được danh sách (read-only)

## CSS Classes

```css
/* Modal */
.modal-backdrop      /* Nền tối phủ toàn màn hình */
.modal-content       /* Hộp modal */
.modal-header        /* Tiêu đề và nút đóng */
.modal-body          /* Nội dung form */
.modal-footer        /* Nút Hủy và Lưu */
.modal-close         /* Nút X */

/* Buttons */
.btn-cancel          /* Nút Hủy */
.btn-save            /* Nút Lưu thay đổi */
.edit-btn            /* Nút Sửa trong user card */
.delete-btn          /* Nút Xóa trong user card */

/* Form */
.edit-user-form      /* Form trong modal */
.form-group          /* Nhóm input + label */
.field-error         /* Thông báo lỗi field */
.error-message       /* Thông báo lỗi chung */
```

## Test Cases

### Test 1: Mở modal
- Bấm nút "Sửa" → Modal hiện ra với dữ liệu user đúng

### Test 2: Validation
- Xóa tên → Hiện lỗi "Tên không được để trống"
- Nhập email sai → Hiện lỗi "Email không hợp lệ"
- Nhập tuổi 200 → Hiện lỗi "Tuổi không được vượt quá 150"

### Test 3: Lưu thành công
- Sửa thông tin → Bấm Lưu → Modal đóng → Danh sách refresh → Thấy thông tin mới

### Test 4: Đóng modal
- Bấm X → Modal đóng
- Bấm Hủy → Modal đóng
- Click bên ngoài → Modal đóng

### Test 5: Mobile responsive
- Trên điện thoại → Modal chiếm 95% chiều rộng
- Nút Hủy/Lưu xếp dọc
- Scroll được trong modal

## Code Example

### Sử dụng trong AdminUsers

```jsx
import EditUserModal from './components/EditUserModal';

const AdminUsers = () => {
  const [editingUser, setEditingUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEdit = (user) => {
    setEditingUser(user); // Mở modal với user này
  };

  const handleUserUpdated = () => {
    setRefreshTrigger(prev => prev + 1); // Refresh list
    setEditingUser(null); // Đóng modal
  };

  return (
    <>
      <AddUser onUserAdded={...} />
      <UserList onEdit={handleEdit} />
      
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </>
  );
};
```

## Keyboard shortcuts

- **ESC**: Đóng modal (có thể thêm sau)
- **Enter**: Submit form khi đang focus vào input

## Accessibility

- Modal có focus trap (giữ focus trong modal)
- Nút X có title="Đóng"
- Labels liên kết với inputs qua htmlFor
- Error messages có aria-live (có thể thêm)

## Next Steps (Optional)

Có thể cải thiện thêm:
- ⌨️ Đóng modal bằng phím ESC
- ♿ Thêm ARIA labels
- 📸 Upload avatar trong modal edit
- 🔄 Loading skeleton khi fetch user details
- ✅ Success toast notification
- 📱 Swipe down to close trên mobile

## Troubleshooting

### Modal không hiện
- Kiểm tra `editingUser` có giá trị không
- Kiểm tra z-index của modal (1000)
- Xem console có lỗi không

### Không lưu được
- Kiểm tra API endpoint `/api/users/:id`
- Xem Network tab trong DevTools
- Kiểm tra token authentication

### Validation không hoạt động
- Kiểm tra function `validateField`
- Xem state `fieldErrors`
- Console.log để debug

## Kết luận

✅ Form Thêm user và Sửa user đã tách biệt hoàn toàn
✅ Modal popup UX tốt hơn
✅ Validation real-time
✅ Responsive trên mọi thiết bị
✅ Code dễ maintain và mở rộng

---
**Ngày cập nhật**: 27/10/2025
**Phiên bản**: 1.0

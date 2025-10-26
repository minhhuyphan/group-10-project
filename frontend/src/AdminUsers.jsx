import React, { useState } from 'react';
import UserList from './UserList';
import AddUser from './AddUser';
import EditUserModal from './components/EditUserModal';

// Admin page with full CRUD controls and edit flow
const AdminUsers = () => {
  const [editingUser, setEditingUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEdit = (user) => {
    console.log('🔍 HANDLEEDIT CALLED! User:', user);
    console.log('🔍 User ID:', user?._id || user?.id);
    console.log('🔍 User Name:', user?.name);
    setEditingUser(user);
    console.log('✅ State updated, editingUser should be:', user);
  };

  const handleCloseModal = () => {
    setEditingUser(null);
  };

  const handleUserAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUserUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
    setEditingUser(null);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px', color: '#0f172a' }}>👨‍💼 Admin - Quản lý người dùng</h1>
      
      {/* Form thêm user mới - luôn hiển thị */}
      <div style={{ marginBottom: '40px' }}>
        <AddUser 
          onUserAdded={handleUserAdded}
        />
      </div>
      
      {/* Danh sách users */}
      <div style={{ marginTop: '40px' }}>
        <UserList 
          key={refreshTrigger}
          editingUser={editingUser}
          onEdit={handleEdit}
          showActions={true}
        />
      </div>

      {/* Modal sửa user - chỉ hiện khi có user được chọn */}
      {console.log('🎯 AdminUsers render - editingUser:', editingUser)}
      {editingUser && (
        <>
          {console.log('✅ RENDERING MODAL with user:', editingUser)}
          <EditUserModal
            user={editingUser}
            onClose={handleCloseModal}
            onUserUpdated={handleUserUpdated}
          />
        </>
      )}
      {!editingUser && console.log('❌ No editingUser, modal will not render')}
    </div>
  );
};

export default AdminUsers;

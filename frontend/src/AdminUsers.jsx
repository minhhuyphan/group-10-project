import React, { useState } from 'react';
import UserList from './UserList';
import AddUser from './AddUser';
import EditUserModal from './components/EditUserModal';

const AdminUsers = () => {
  const [editingUser, setEditingUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEdit = (user) => {
    setEditingUser(user);
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
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={handleCloseModal}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
};

export default AdminUsers;

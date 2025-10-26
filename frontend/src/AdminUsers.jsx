import React, { useState } from 'react';
import UserList from './UserList';
import AddUser from './AddUser';

// Admin page with full CRUD controls and edit flow
const AdminUsers = () => {
  const [editingUser, setEditingUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEdit = (user) => setEditingUser(user);
  const handleCancelEdit = () => setEditingUser(null);
  const handleUserAddedOrUpdated = () => {
    // Force UserList to remount and refetch
    setRefreshTrigger((n) => n + 1);
  };

  return (
    <div>
      <h2>Admin - Quản lý người dùng</h2>

      {/* Add or Edit form */}
      <AddUser
        onUserAdded={handleUserAddedOrUpdated}
        editingUser={editingUser}
        onCancelEdit={handleCancelEdit}
      />

      {/* Users grid with actions */}
      <UserList
        key={refreshTrigger}
        onEdit={handleEdit}
        editingUser={editingUser}
        onCancelEdit={handleCancelEdit}
        showActions={true}
      />
    </div>
  );
};

export default AdminUsers;

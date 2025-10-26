import React, { useState } from 'react';
import UserList from './UserList';
import AddUser from './AddUser';

const AdminUsers = () => {
  const [editingUser, setEditingUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEdit = (user) => {
    setEditingUser(user);
    // Scroll to top to show the edit form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleUserAdded = () => {
    setEditingUser(null);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Admin - Quản lý người dùng</h2>
      
      <AddUser 
        editingUser={editingUser}
        onCancelEdit={handleCancelEdit}
        onUserAdded={handleUserAdded}
      />
      
      <UserList 
        key={refreshTrigger}
        editingUser={editingUser}
        onEdit={handleEdit}
        onCancelEdit={handleCancelEdit}
        showActions={true}
      />
    </div>
  );
};

export default AdminUsers;

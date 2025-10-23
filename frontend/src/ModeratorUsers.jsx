import React from 'react';
import UserList from './UserList';

// Moderator view: can see and edit, but AddUser is hidden from App level
const ModeratorUsers = () => {
  return (
    <div>
      <h2>Moderator - Duyệt người dùng</h2>
      <UserList />
    </div>
  );
};

export default ModeratorUsers;

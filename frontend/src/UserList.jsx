import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserList = ({ editingUser, onEdit, onCancelEdit }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch users from backend API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/users');
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách người dùng');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Refresh users list
  const handleRefresh = () => {
    fetchUsers();
  };

  // Handle delete user
  const handleDelete = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:3001/users/${userId}`);
      setUsers(users.filter(user => (user._id || user.id) !== userId));
      console.log('User deleted successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Không thể xóa người dùng. Vui lòng thử lại.');
    }
  };

  // Handle edit user
  const handleEdit = (user) => {
    if (onEdit) {
      onEdit(user);
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="user-list">
      <div className="user-list-header">
        <h2>Danh sách người dùng</h2>
        <button onClick={handleRefresh} className="refresh-btn">
          Làm mới
        </button>
      </div>
      
      {users.length === 0 ? (
        <p className="no-users">Chưa có người dùng nào.</p>
      ) : (
        <div className="users-grid">
          {users.map((user, index) => (
            <div key={user._id || user.id || index} className="user-card">
              <h3>{user.name}</h3>
              <p>Email: {user.email}</p>
              {user.age && <p>Tuổi: {user.age}</p>}
              <div className="user-actions">
                <button 
                  onClick={() => handleEdit(user)} 
                  className="edit-btn"
                >
                  Sửa
                </button>
                <button 
                  onClick={() => handleDelete(user._id || user.id)} 
                  className="delete-btn"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserList;
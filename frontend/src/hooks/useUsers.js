import { useState, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

// Custom hook for managing users state
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/users`);
      setUsers(response.data);
      console.log(`✅ Loaded ${response.data.length} users successfully`);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể tải danh sách người dùng';
      setError(errorMessage);
      console.error('Error fetching users:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new user
  const addUser = useCallback(async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/users`, userData);
      setUsers(prevUsers => [...prevUsers, response.data]);
      console.log('✅ User added successfully:', response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể thêm người dùng';
      console.error('Error adding user:', err);
      throw new Error(errorMessage);
    }
  }, []);

  // Update user
  const updateUser = useCallback(async (userId, userData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/users/${userId}`, userData);
      setUsers(prevUsers => 
        prevUsers.map(user => 
          (user._id || user.id) === userId ? response.data : user
        )
      );
      console.log('✅ User updated successfully:', response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể cập nhật người dùng';
      console.error('Error updating user:', err);
      throw new Error(errorMessage);
    }
  }, []);

  // Delete user
  const deleteUser = useCallback(async (userId) => {
    try {
      await axios.delete(`${API_BASE_URL}/users/${userId}`);
      setUsers(prevUsers => 
        prevUsers.filter(user => (user._id || user.id) !== userId)
      );
      console.log('✅ User deleted successfully');
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Không thể xóa người dùng';
      console.error('Error deleting user:', err);
      throw new Error(errorMessage);
    }
  }, []);

  // Refresh users list
  const refreshUsers = useCallback(() => {
    return fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    addUser,
    updateUser,
    deleteUser,
    refreshUsers,
    setError
  };
};

// Validation utilities
export const validateUserData = (userData) => {
  const errors = {};
  
  // Name validation
  if (!userData.name || !userData.name.trim()) {
    errors.name = 'Tên không được để trống';
  } else if (userData.name.trim().length < 2) {
    errors.name = 'Tên phải có ít nhất 2 ký tự';
  } else if (userData.name.trim().length > 50) {
    errors.name = 'Tên không được vượt quá 50 ký tự';
  }
  
  // Email validation
  if (!userData.email || !userData.email.trim()) {
    errors.email = 'Email không được để trống';
  } else if (!/\S+@\S+\.\S+/.test(userData.email.trim())) {
    errors.email = 'Email không hợp lệ';
  } else if (userData.email.trim().length > 100) {
    errors.email = 'Email không được vượt quá 100 ký tự';
  }
  
  // Age validation
  if (userData.age && userData.age.toString().trim()) {
    const age = parseInt(userData.age);
    if (isNaN(age)) {
      errors.age = 'Tuổi phải là một số';
    } else if (age < 1) {
      errors.age = 'Tuổi phải lớn hơn 0';
    } else if (age > 150) {
      errors.age = 'Tuổi không được vượt quá 150';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Notification utility
export const showNotification = (message, type = 'success') => {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
  `;
  
  // Add CSS animation
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
};
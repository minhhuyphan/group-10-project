import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddUser = ({ onUserAdded, editingUser, onCancelEdit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Fill form when editing
  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name || '',
        email: editingUser.email || '',
        age: editingUser.age || ''
      });
      setIsEditing(true);
      setError(null);
      setSuccess(false);
    } else {
      setFormData({ name: '', email: '', age: '' });
      setIsEditing(false);
    }
  }, [editingUser]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Tên và email là bắt buộc');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Prepare user data
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        ...(formData.age && { age: parseInt(formData.age) })
      };

      let response;
      
      if (isEditing && editingUser) {
        // Update existing user
        response = await axios.put(`http://localhost:3001/users/${editingUser._id || editingUser.id}`, userData);
        setSuccess(true);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(false);
          handleCancel();
        }, 2000);
      } else {
        // Create new user
        response = await axios.post('http://localhost:3001/users', userData);
        
        // Reset form
        setFormData({ name: '', email: '', age: '' });
        setSuccess(true);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      }
      
      // Call parent callback to refresh user list
      if (onUserAdded) {
        onUserAdded(response.data);
      }
      
    } catch (err) {
      const errorMessage = isEditing ? 'Không thể cập nhật người dùng. Vui lòng thử lại.' : 'Không thể thêm người dùng. Vui lòng thử lại.';
      setError(errorMessage);
      console.error('Error saving user:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel editing
  const handleCancel = () => {
    setFormData({ name: '', email: '', age: '' });
    setIsEditing(false);
    setError(null);
    setSuccess(false);
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  return (
    <div className="add-user">
      <h2>{isEditing ? 'Sửa thông tin người dùng' : 'Thêm người dùng mới'}</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">
        {isEditing ? 'Cập nhật người dùng thành công!' : 'Thêm người dùng thành công!'}
      </div>}
      
      <form onSubmit={handleSubmit} className="add-user-form">
        <div className="form-group">
          <label htmlFor="name">Tên *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nhập tên"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Nhập email"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="age">Tuổi</label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="Nhập tuổi"
            min="1"
            max="150"
          />
        </div>

        <div className="form-buttons">
          <button 
            type="submit" 
            disabled={loading}
            className="submit-btn"
          >
            {loading ? (isEditing ? 'Đang cập nhật...' : 'Đang thêm...') : (isEditing ? 'Cập nhật người dùng' : 'Thêm người dùng')}
          </button>
          
          {isEditing && (
            <button 
              type="button" 
              onClick={handleCancel}
              className="cancel-btn"
            >
              Hủy
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddUser;
import React, { useState } from 'react';
import axios from 'axios';

const AddUser = ({ onUserAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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
      const newUser = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        ...(formData.age && { age: parseInt(formData.age) })
      };

      // Post to backend API
      const response = await axios.post('http://localhost:3001/users', newUser);
      
      // Reset form
      setFormData({ name: '', email: '', age: '' });
      setSuccess(true);
      
      // Call parent callback to refresh user list
      if (onUserAdded) {
        onUserAdded(response.data);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err) {
      setError('Không thể thêm người dùng. Vui lòng thử lại.');
      console.error('Error adding user:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-user">
      <h2>Thêm người dùng mới</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Thêm người dùng thành công!</div>}
      
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

        <button 
          type="submit" 
          disabled={loading}
          className="submit-btn"
        >
          {loading ? 'Đang thêm...' : 'Thêm người dùng'}
        </button>
      </form>
    </div>
  );
};

export default AddUser;
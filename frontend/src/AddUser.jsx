import React, { useState, useEffect } from "react";
import api from "./api";
import { usePermissions } from "./components/UserRoleIndicator";

const AddUser = ({ onUserAdded, editingUser, onCancelEdit }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    email: "",
    age: "",
  });
  const { hasPermission, canManageUsers } = usePermissions();

  // Fill form when editing
  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name || "",
        email: editingUser.email || "",
        age: editingUser.age || "",
      });
      setIsEditing(true);
      setError(null);
      setSuccess(false);
    } else {
      setFormData({ name: "", email: "", age: "" });
      setIsEditing(false);
    }
  }, [editingUser]);

  // Real-time field validation
  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "name":
        if (!value.trim()) {
          error = "Tên không được để trống";
        } else if (value.trim().length < 2) {
          error = "Tên phải có ít nhất 2 ký tự";
        } else if (value.trim().length > 50) {
          error = "Tên không được vượt quá 50 ký tự";
        }
        break;

      case "email":
        if (!value.trim()) {
          error = "Email không được để trống";
        } else if (!/\S+@\S+\.\S+/.test(value.trim())) {
          error = "Email không hợp lệ";
        } else if (value.trim().length > 100) {
          error = "Email không được vượt quá 100 ký tự";
        }
        break;

      case "age":
        if (value && value.trim()) {
          const age = parseInt(value);
          if (isNaN(age)) {
            error = "Tuổi phải là một số";
          } else if (age < 1) {
            error = "Tuổi phải lớn hơn 0";
          } else if (age > 150) {
            error = "Tuổi không được vượt quá 150";
          }
        }
        break;
    }

    return error;
  };

  // Handle input changes with real-time validation
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update form data
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Real-time validation
    const fieldError = validateField(name, value);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));

    // Clear general error when user starts typing
    if (error) {
      setError(null);
    }
  };

  // Enhanced validation function
  const validateForm = () => {
    const errors = [];

    // Name validation
    if (!formData.name.trim()) {
      errors.push("Tên không được để trống");
    } else if (formData.name.trim().length < 2) {
      errors.push("Tên phải có ít nhất 2 ký tự");
    } else if (formData.name.trim().length > 50) {
      errors.push("Tên không được vượt quá 50 ký tự");
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.push("Email không được để trống");
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      errors.push("Email không hợp lệ (ví dụ: user@example.com)");
    } else if (formData.email.trim().length > 100) {
      errors.push("Email không được vượt quá 100 ký tự");
    }

    // Age validation
    if (formData.age && formData.age.trim()) {
      const age = parseInt(formData.age);
      if (isNaN(age)) {
        errors.push("Tuổi phải là một số");
      } else if (age < 1) {
        errors.push("Tuổi phải lớn hơn 0");
      } else if (age > 150) {
        errors.push("Tuổi không được vượt quá 150");
      }
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Enhanced validation
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(". "));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare user data
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        ...(formData.age && { age: parseInt(formData.age) }),
      };

      let response;

      if (isEditing && editingUser) {
        // Update existing user
        response = await api.put(
          `/api/users/${editingUser._id || editingUser.id}`,
          userData
        );
        setSuccess(true);

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(false);
          handleCancel();
        }, 2000);
      } else {
        // Create new user
        response = await api.post("/api/users", userData);

        // Reset form
        setFormData({ name: "", email: "", age: "" });
        setSuccess(true);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      }

      // Call parent callback to refresh user list
      if (onUserAdded) {
        onUserAdded(response.data);
      }
    } catch (err) {
      const errorMessage = isEditing
        ? "Không thể cập nhật người dùng. Vui lòng thử lại."
        : "Không thể thêm người dùng. Vui lòng thử lại.";
      setError(errorMessage);
      console.error("Error saving user:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel editing
  const handleCancel = () => {
    setFormData({ name: "", email: "", age: "" });
    setIsEditing(false);
    setError(null);
    setSuccess(false);
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  // Check permissions
  if (!canManageUsers()) {
    return (
      <div className="add-user permission-denied">
        <h2>🔒 Không có quyền truy cập</h2>
        <div className="permission-message">
          <p>Bạn cần đăng nhập với tài khoản <strong>Admin</strong> hoặc <strong>Moderator</strong> để thêm/sửa người dùng.</p>
          <div className="admin-credentials">
            <h4>Tài khoản Admin để test:</h4>
            <ul>
              <li>Email: <code>admin@example.com</code></li>
              <li>Password: <code>admin123</code></li>
            </ul>
          </div>
        </div>
        <style jsx>{`
          .permission-denied {
            text-align: center;
            padding: 40px 20px;
            background: #fff5f5;
            border: 1px solid #feb2b2;
            border-radius: 8px;
            margin: 20px 0;
          }
          .permission-message {
            color: #744d4d;
            margin: 20px 0;
          }
          .admin-credentials {
            background: #f7fafc;
            padding: 20px;
            border-radius: 6px;
            margin-top: 20px;
            text-align: left;
            display: inline-block;
          }
          .admin-credentials code {
            background: #e2e8f0;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="add-user">
      <h2>{isEditing ? "Sửa thông tin người dùng" : "Thêm người dùng mới"}</h2>

      {error && <div className="error-message">{error}</div>}
      {success && (
        <div className="success-message">
          {isEditing
            ? "Cập nhật người dùng thành công!"
            : "Thêm người dùng thành công!"}
        </div>
      )}

      <form onSubmit={handleSubmit} className="add-user-form">
        <div className="form-group">
          <label htmlFor="name">Tên *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nhập tên (2-50 ký tự)"
            className={fieldErrors.name ? "error" : ""}
            disabled={loading}
            required
          />
          {fieldErrors.name && (
            <span className="field-error">{fieldErrors.name}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Nhập email (user@example.com)"
            className={fieldErrors.email ? "error" : ""}
            disabled={loading}
            required
          />
          {fieldErrors.email && (
            <span className="field-error">{fieldErrors.email}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="age">Tuổi</label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="Nhập tuổi (1-150)"
            className={fieldErrors.age ? "error" : ""}
            disabled={loading}
            min="1"
            max="150"
          />
          {fieldErrors.age && (
            <span className="field-error">{fieldErrors.age}</span>
          )}
        </div>

        <div className="form-buttons">
          <button
            type="submit"
            disabled={
              loading ||
              Object.values(fieldErrors).some((error) => error !== "")
            }
            className="submit-btn"
          >
            {loading
              ? isEditing
                ? "Đang cập nhật..."
                : "Đang thêm..."
              : isEditing
              ? "Cập nhật người dùng"
              : "Thêm người dùng"}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
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

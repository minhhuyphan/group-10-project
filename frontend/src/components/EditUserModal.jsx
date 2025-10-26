import React, { useState, useEffect } from "react";
import api from "../api";
import { usePermissions } from "./UserRoleIndicator";

const EditUserModal = ({ user, onClose, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    email: "",
    age: "",
  });
  const { canManageUsers } = usePermissions();

  // Fill form when user changes
  useEffect(() => {
    console.log('📝 EditUserModal mounted/updated with user:', user);
    console.log('🔐 canManageUsers():', canManageUsers());
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        age: user.age || "",
      });
      setError(null);
    }
  }, [user]);

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

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    const fieldError = validateField(name, value);
    setFieldErrors((prev) => ({
      ...prev,
      [name]: fieldError,
    }));

    if (error) {
      setError(null);
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = [];

    if (!formData.name.trim()) {
      errors.push("Tên không được để trống");
    } else if (formData.name.trim().length < 2) {
      errors.push("Tên phải có ít nhất 2 ký tự");
    } else if (formData.name.trim().length > 50) {
      errors.push("Tên không được vượt quá 50 ký tự");
    }

    if (!formData.email.trim()) {
      errors.push("Email không được để trống");
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      errors.push("Email không hợp lệ");
    } else if (formData.email.trim().length > 100) {
      errors.push("Email không được vượt quá 100 ký tự");
    }

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

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(". "));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        ...(formData.age && { age: parseInt(formData.age) }),
      };

      const response = await api.put(
        `/api/users/${user._id || user.id}`,
        userData
      );

      if (onUserUpdated) {
        onUserUpdated(response.data);
      }

      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      const errorMessage = "Không thể cập nhật người dùng. Vui lòng thử lại.";
      setError(errorMessage);
      console.error("Error updating user:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };

  if (!user || !canManageUsers()) {
    console.log('❌ EditUserModal returning null - user:', user, 'canManageUsers:', canManageUsers());
    return null;
  }

  console.log('✅ EditUserModal rendering modal with user:', user);

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>✏️ Sửa thông tin người dùng</h2>
          <button className="modal-close" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="edit-user-form">
            <div className="form-group">
              <label htmlFor="edit-name">Tên *</label>
              <input
                type="text"
                id="edit-name"
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
              <label htmlFor="edit-email">Email *</label>
              <input
                type="email"
                id="edit-email"
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
              <label htmlFor="edit-age">Tuổi</label>
              <input
                type="number"
                id="edit-age"
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

            <div className="modal-footer">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn-cancel"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={
                  loading ||
                  Object.values(fieldErrors).some((error) => error !== "")
                }
                className="btn-save"
              >
                {loading ? "Đang lưu..." : "💾 Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;

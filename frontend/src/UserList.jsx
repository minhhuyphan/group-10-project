import React, { useState, useEffect } from "react";
import api from "./api";
import { useSelector } from "react-redux";

const UserList = ({ editingUser, onEdit, onCancelEdit, showActions = true }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null); // Track which user is being deleted
  const currentUser = useSelector((state) => state.auth.user);

  // Enhanced fetch users with better error handling
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/users");
      setUsers(response.data);
      console.log(`✅ Loaded ${response.data.length} users successfully`);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Không thể tải danh sách người dùng";
      setError(errorMessage);
      console.error("Error fetching users:", err);
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

  // Enhanced delete user with loading state
  const handleDelete = async (userId) => {
    const user = users.find((u) => (u._id || u.id) === userId);
    const userName = user ? user.name : "người dùng này";

    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${userName}?`)) {
      return;
    }

    try {
      setDeleteLoading(userId);
      await api.delete(`/users/${userId}`);

      // Optimistic update
      setUsers((prevUsers) =>
        prevUsers.filter((user) => (user._id || user.id) !== userId)
      );
      console.log("✅ User deleted successfully:", userName);

      // Show success message briefly
      const tempSuccess = document.createElement("div");
      tempSuccess.textContent = `Đã xóa ${userName} thành công`;
      tempSuccess.style.cssText =
        "position:fixed;top:20px;right:20px;background:#4CAF50;color:white;padding:10px;border-radius:4px;z-index:1000";
      document.body.appendChild(tempSuccess);
      setTimeout(() => document.body.removeChild(tempSuccess), 3000);
    } catch (err) {
      console.error("Error deleting user:", err);
      const errorMessage =
        err.response?.data?.message ||
        "Không thể xóa người dùng. Vui lòng thử lại.";
      alert(errorMessage);
    } finally {
      setDeleteLoading(null);
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
              {showActions && (
                <div className="user-actions">
                  <button
                    onClick={() => handleEdit(user)}
                    className="edit-btn"
                    disabled={deleteLoading === (user._id || user.id)}
                  >
                    {editingUser &&
                    (editingUser._id || editingUser.id) === (user._id || user.id)
                      ? "Đang sửa..."
                      : "Sửa"}
                  </button>
                  {(
                    currentUser?.role === 'admin' ||
                    (currentUser && (currentUser._id || currentUser.id) === (user._id || user.id))
                  ) && (
                    <button
                      onClick={() => handleDelete(user._id || user.id)}
                      className="delete-btn"
                      disabled={deleteLoading === (user._id || user.id)}
                    >
                      {deleteLoading === (user._id || user.id) ? "Đang xóa..." : "Xóa"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserList;

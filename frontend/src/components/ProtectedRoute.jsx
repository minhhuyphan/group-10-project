import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * ProtectedRoute - Component bảo vệ các route yêu cầu đăng nhập
 * 
 * Kiểm tra Redux state để xác định user đã login chưa.
 * Nếu chưa login, redirect về /login và lưu location để quay lại sau khi login.
 */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, user, initializing } = useSelector((state) => state.auth);
  const location = useLocation();

  // Đang load user info từ server
  if (initializing) {
    return (
      <div className="center-vert" style={{ minHeight: '60vh' }}>
        <div className="card">
          <p>Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  // Chưa đăng nhập → redirect về login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Yêu cầu admin nhưng user không phải admin
  if (requireAdmin && user?.role !== 'admin') {
    return (
      <div className="center-vert" style={{ minHeight: '60vh' }}>
        <div className="card">
          <h2>⛔ Access Denied</h2>
          <p>Bạn không có quyền truy cập trang này.</p>
          <p className="muted">Chỉ admin mới được phép.</p>
        </div>
      </div>
    );
  }

  // Đã đăng nhập và có quyền → render children
  return children;
};

export default ProtectedRoute;

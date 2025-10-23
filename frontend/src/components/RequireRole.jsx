import React, { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { hasAnyRole } from '../roles';

const RequireRole = ({ roles = [], children }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <div className="card" style={{ margin: '24px auto', maxWidth: 640 }}>
        <h3>Yêu cầu đăng nhập</h3>
        <p>Bạn cần đăng nhập để truy cập nội dung này.</p>
        <a className="btn btn-primary" href="/login">Đăng nhập</a>
      </div>
    );
  }

  if (!hasAnyRole(user, roles)) {
    return (
      <div className="card" style={{ margin: '24px auto', maxWidth: 640 }}>
        <h3>403 - Không có quyền truy cập</h3>
        <p>Tài khoản của bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireRole;

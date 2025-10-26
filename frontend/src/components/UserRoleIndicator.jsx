import React from 'react';
import { useSelector } from 'react-redux';

// Role-based UI component to show user permissions and status
const UserRoleIndicator = () => {
  const user = useSelector((state) => state.auth.user);

  if (!user) {
    return (
      <div className="user-role-indicator guest">
        <div className="role-badge guest">
          <span className="role-icon">👤</span>
          <span className="role-text">Guest</span>
        </div>
        <div className="permissions-hint">
          <small>⚠️ Login as admin to manage users</small>
        </div>
      </div>
    );
  }

  const getRoleConfig = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return {
          icon: '👑',
          color: '#e74c3c',
          bgColor: '#fdf2f2',
          permissions: ['➕ Add Users', '✏️ Edit Users', '🗑️ Delete Users', '📊 View Stats']
        };
      case 'moderator':
        return {
          icon: '🛡️',
          color: '#f39c12',
          bgColor: '#fff8f0',
          permissions: ['➕ Add Users', '✏️ Edit Users', '👀 View Users']
        };
      default:
        return {
          icon: '👤',
          color: '#3498db',
          bgColor: '#f0f8ff',
          permissions: ['👀 View Profile', '📷 Upload Avatar']
        };
    }
  };

  const roleConfig = getRoleConfig(user.role);

  return (
    <div className="user-role-indicator" style={{ backgroundColor: roleConfig.bgColor }}>
      <div className="user-info">
        <div className="role-badge" style={{ color: roleConfig.color }}>
          <span className="role-icon">{roleConfig.icon}</span>
          <span className="role-text">{user.role?.toUpperCase() || 'USER'}</span>
        </div>
        <div className="user-details">
          <div className="user-name">{user.name}</div>
          <div className="user-email">{user.email}</div>
        </div>
      </div>
      
      <div className="permissions-list">
        <div className="permissions-title">Quyền hạn:</div>
        <div className="permissions-items">
          {roleConfig.permissions.map((permission, index) => (
            <span key={index} className="permission-item">
              {permission}
            </span>
          ))}
        </div>
      </div>

      {user.role !== 'admin' && (
        <div className="upgrade-hint">
          <small style={{ color: '#666' }}>
            💡 Để quản lý users: đăng nhập với <strong>admin@example.com</strong>
          </small>
        </div>
      )}

      <style jsx>{`
        .user-role-indicator {
          border: 1px solid #e1e8ed;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .role-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: bold;
          font-size: 14px;
          padding: 4px 8px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid currentColor;
        }

        .role-icon {
          font-size: 16px;
        }

        .user-details {
          flex: 1;
        }

        .user-name {
          font-weight: 600;
          color: #1a1a1a;
          font-size: 16px;
        }

        .user-email {
          color: #666;
          font-size: 14px;
        }

        .permissions-list {
          margin-top: 12px;
        }

        .permissions-title {
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .permissions-items {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .permission-item {
          background: rgba(255, 255, 255, 0.9);
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          color: #555;
          border: 1px solid #ddd;
        }

        .upgrade-hint {
          margin-top: 12px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 6px;
          text-align: center;
        }

        .guest .role-badge {
          color: #666;
          background: #f5f5f5;
        }

        .permissions-hint {
          text-align: center;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
};

// Permission check hook
export const usePermissions = () => {
  const user = useSelector((state) => state.auth.user);
  
  const hasPermission = (permission) => {
    if (!user) return false;
    
    const role = user.role?.toLowerCase();
    
    switch (permission) {
      case 'add_user':
        return role === 'admin' || role === 'moderator';
      case 'edit_user':
        return role === 'admin' || role === 'moderator';
      case 'delete_user':
        return role === 'admin';
      case 'view_users':
        return true; // All users can view
      case 'manage_roles':
        return role === 'admin';
      default:
        return false;
    }
  };

  const canManageUsers = () => {
    return hasPermission('add_user') || hasPermission('edit_user') || hasPermission('delete_user');
  };

  return {
    hasPermission,
    canManageUsers,
    isAdmin: user?.role?.toLowerCase() === 'admin',
    isModerator: user?.role?.toLowerCase() === 'moderator',
    isAuthenticated: !!user
  };
};

export default UserRoleIndicator;
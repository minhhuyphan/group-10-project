const express = require('express');
const router = express.Router();
const {
  verifyToken,
  getProfile,
  updateProfile,
  getAdminDashboard,
  getAllUsers,
  checkRouteAccess
} = require('../controllers/reduxController');

// Import middleware
const { authenticateAccessToken } = require('../middleware/authMiddleware');
const { generalRateLimiter } = require('../middleware/rateLimitMiddleware');
const { activityLogger } = require('../middleware/activityLogMiddleware');

// ===== Redux Support Routes =====

// Verify token và get user info (for Redux auth state)
router.get('/verify-token', 
  authenticateAccessToken,
  generalRateLimiter,
  activityLogger('TOKEN_VERIFY'),
  verifyToken
);

// Check route access permissions  
router.get('/check-access/:route(*)',
  authenticateAccessToken,
  generalRateLimiter,
  activityLogger('ROUTE_ACCESS_CHECK'),
  checkRouteAccess
);

// ===== Protected Routes Support =====

// Profile routes (Protected - User level)
router.get('/profile',
  authenticateAccessToken,
  generalRateLimiter,
  activityLogger('PROFILE_VIEW'),
  getProfile
);

router.put('/profile',
  authenticateAccessToken,
  generalRateLimiter,
  activityLogger('PROFILE_UPDATE'),
  updateProfile
);

// Admin routes (Protected - Admin level)
router.get('/admin/dashboard',
  authenticateAccessToken,
  generalRateLimiter,
  activityLogger('ADMIN_DASHBOARD_VIEW'),
  getAdminDashboard
);

router.get('/admin/users',
  authenticateAccessToken,
  generalRateLimiter,
  activityLogger('ADMIN_VIEW_USERS'),
  getAllUsers
);

module.exports = router;
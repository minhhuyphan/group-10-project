const express = require('express');
const router = express.Router();
const {
  getUserActivities,
  getActivitiesByDate,
  getActivityStats,
  getRecentActivities,
  searchActivities
} = require('../controllers/activityController');

// Import middleware
const { authenticateAccessToken } = require('../middleware/authMiddleware');
const { generalRateLimiter } = require('../middleware/rateLimitMiddleware');
const { activityLogger } = require('../middleware/activityLogMiddleware');

// Middleware: Chỉ admin hoặc user có quyền xem logs
const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.isAdmin)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Admin access required'
  });
};

// ===== Activity Log Routes (Protected) =====

// Get activities for specific user
router.get('/user/:userId', 
  authenticateAccessToken, 
  generalRateLimiter,
  activityLogger('VIEW_USER_ACTIVITIES'),
  getUserActivities
);

// Get activities by date
router.get('/date/:date', 
  authenticateAccessToken, 
  requireAdmin,
  generalRateLimiter,
  activityLogger('VIEW_ACTIVITIES_BY_DATE'),
  getActivitiesByDate
);

// Get activity statistics
router.get('/stats', 
  authenticateAccessToken, 
  requireAdmin,
  generalRateLimiter,
  activityLogger('VIEW_ACTIVITY_STATS'),
  getActivityStats
);

// Get recent activities
router.get('/recent', 
  authenticateAccessToken, 
  requireAdmin,
  generalRateLimiter,
  activityLogger('VIEW_RECENT_ACTIVITIES'),
  getRecentActivities
);

// Search activities
router.get('/search', 
  authenticateAccessToken, 
  requireAdmin,
  generalRateLimiter,
  activityLogger('SEARCH_ACTIVITIES'),
  searchActivities
);

module.exports = router;
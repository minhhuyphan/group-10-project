const express = require('express');
const router = express.Router();
const userController = require('../controllers/usercontroller');
const authController = require('../controllers/authController');
const { authenticateAccessToken, checkRole, requireAdmin } = require('../middleware/authMiddleware');

// Original routes (existing functionality)
router.get('/users', userController.getUsers);
router.post('/users', authenticateAccessToken, checkRole(['admin', 'moderator']), userController.createUser);
router.put('/users/:id', authenticateAccessToken, checkRole(['admin', 'moderator']), userController.updateUser);   // PUT
router.delete('/users/:id', authenticateAccessToken, checkRole(['admin']), userController.deleteUser); // DELETE

// Authentication routes are handled by authRoutes.js - removed duplicates

// ============ RBAC ROUTES ============

// Get current user's role and permissions (any authenticated user)
router.get('/rbac/me', authenticateAccessToken, userController.getCurrentUserRole);

// Get users with RBAC filtering (different views based on role)
router.get('/rbac/users', 
  authenticateAccessToken, 
  checkRole(['user', 'moderator', 'admin']), 
  userController.getUsersWithRBAC
);

// Get user statistics (Admin and Moderator only)
router.get('/rbac/stats', 
  authenticateAccessToken, 
  checkRole(['moderator', 'admin']), 
  userController.getUserStats
);

// Update user role (Admin only)
router.put('/rbac/users/:id/role', 
  authenticateAccessToken, 
  checkRole('admin'), 
  userController.updateUserRole
);

// Update user status (Admin and Moderator)
router.put('/rbac/users/:id/status', 
  authenticateAccessToken, 
  checkRole(['moderator', 'admin']), 
  userController.updateUserStatus
);

module.exports = router;

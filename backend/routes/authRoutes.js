const express = require('express');
const router = express.Router();
const { 
  signup, 
  login,
  forgotPassword,
  resetPassword,
  validateResetToken,
  uploadAvatar,
  refreshToken,
  logout,
  revokeToken,
  getUserTokens
} = require('../controllers/authController');

// Import middleware
const { authenticateAccessToken } = require('../middleware/authMiddleware');

// ===== Public routes =====
router.post('/signup', signup);
router.post('/login', login);

// ===== Password Reset routes =====
router.post('/forgot-password', forgotPassword);
router.get('/validate-reset-token/:token', validateResetToken);
router.post('/reset-password/:token', resetPassword);

// ===== Refresh Token routes =====
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// ===== Protected routes =====
router.post('/upload-avatar', authenticateAccessToken, uploadAvatar);
router.post('/revoke-token', authenticateAccessToken, revokeToken);
router.get('/tokens', authenticateAccessToken, getUserTokens);

module.exports = router;

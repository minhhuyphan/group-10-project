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
const { loginRateLimiter, activityLogger } = require('../middleware/activityLogMiddleware');
const { generalRateLimiter, refreshTokenRateLimiter } = require('../middleware/rateLimitMiddleware');

// ===== Public routes =====
router.post('/signup', generalRateLimiter, activityLogger('USER_SIGNUP'), signup);
router.post('/login', loginRateLimiter(), activityLogger('USER_LOGIN'), login);

// ===== Password Reset routes =====
router.post('/forgot-password', generalRateLimiter, activityLogger('FORGOT_PASSWORD'), forgotPassword);
router.get('/validate-reset-token/:token', generalRateLimiter, validateResetToken);
router.post('/reset-password/:token', generalRateLimiter, activityLogger('RESET_PASSWORD'), resetPassword);

// ===== Refresh Token routes =====
router.post('/refresh', refreshTokenRateLimiter, activityLogger('TOKEN_REFRESH'), refreshToken);
router.post('/logout', activityLogger('USER_LOGOUT'), logout);

// ===== Protected routes =====
router.post('/upload-avatar', authenticateAccessToken, uploadAvatar);
router.post('/revoke-token', authenticateAccessToken, revokeToken);
router.get('/tokens', authenticateAccessToken, getUserTokens);

module.exports = router;

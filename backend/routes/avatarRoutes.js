// backend/routes/avatarRoutes.js
const express = require('express');
const router = express.Router();

// Import controllers và middleware
const { uploadAvatar, getAvatar, deleteAvatar } = require('../controllers/avatarController');
const { authenticateAccessToken } = require('../middleware/authMiddleware');
const { upload, handleUploadError, validateFileUpload } = require('../middleware/uploadMiddleware');

/**
 * POST /api/users/avatar
 * Upload avatar cho user hiện tại
 * Requires: Authentication, File upload
 */
router.post('/avatar', 
  authenticateAccessToken,  // Xác thực JWT
  upload.single('avatar'),  // Upload single file với field name 'avatar'
  handleUploadError,        // Xử lý lỗi upload
  validateFileUpload,       // Validate file đã upload
  uploadAvatar             // Controller xử lý upload
);

/**
 * GET /api/users/:id/avatar
 * Lấy avatar URL của user
 * Public route (không cần authentication)
 */
router.get('/:id/avatar', getAvatar);

/**
 * DELETE /api/users/avatar
 * Xóa avatar của user hiện tại
 * Requires: Authentication
 */
router.delete('/avatar',
  authenticateAccessToken,  // Xác thực JWT
  deleteAvatar             // Controller xử lý xóa
);

module.exports = router;
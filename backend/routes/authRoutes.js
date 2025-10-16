const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);

const { refresh, logout } = require('../controllers/authController');
router.post('/refresh', refresh);
router.post('/logout', logout);

// Forgot / reset
const { forgotPassword, resetPassword } = require('../controllers/authController');
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
const { uploadAvatar } = require('../controllers/authController');
router.post('/upload-avatar', uploadAvatar);

module.exports = router;

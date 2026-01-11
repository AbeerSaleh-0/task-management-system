const express = require('express');
const router = express.Router();
const { login, logout, verifyToken } = require('../controllers/authController');
const { validateLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// POST /api/auth/login - تسجيل الدخول
router.post('/login', validateLogin, login);

// POST /api/auth/logout - تسجيل الخروج
router.post('/logout', logout);

// GET /api/auth/verify - التحقق من صحة الـ token
router.get('/verify', authenticateToken, verifyToken);

module.exports = router;
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// كل المسارات تحتاج تسجيل دخول
router.use(authenticateToken);

module.exports = router;
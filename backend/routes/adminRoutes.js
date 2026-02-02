const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserPassword,
  updateUserName,
  updateUserPhone,
  deleteUser
} = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');
const { validateRegister } = require('../middleware/validation');

// كل المسارات تحتاج تسجيل دخول + صلاحية Admin
router.use(authenticateToken, adminOnly);

// POST /api/admin/users - إنشاء مستخدم جديد
router.post('/users', validateRegister, createUser);

// GET /api/admin/users - جلب جميع المستخدمين
router.get('/users', getAllUsers);

// GET /api/admin/users/:id - جلب مستخدم معين
router.get('/users/:id', getUserById);

// PATCH /api/admin/users/:id/role - تحديث دور المستخدم
router.patch('/users/:id/role', updateUserRole);

// PATCH /api/admin/users/:id/password - تحديث كلمة مرور المستخدم
router.patch('/users/:id/password', updateUserPassword);

router.patch('/users/:id/name', updateUserName);

router.patch('/users/:id/phone', updateUserPhone);

// DELETE /api/admin/users/:id - حذف مستخدم
router.delete('/users/:id', deleteUser);

// PATCH /api/admin/users/:id/name - تحديث اسم المستخدم
router.patch('/users/:id/name', updateUserName);

module.exports = router;
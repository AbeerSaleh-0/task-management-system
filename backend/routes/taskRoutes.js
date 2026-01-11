const express = require('express');
const router = express.Router();
const {
  createTask,
  getAllTasks,
  getTaskById,
  getTasksByUserId,
  getMyTasks,
  updateTaskStatus,
  updateTask,
  deleteTask,
  getTasksByStatus,
  addSubtask,
  updateSubtaskStatus,
  deleteSubtask,
  updateUserNotes
} = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/auth');
const { adminOrManager } = require('../middleware/roleCheck');
const { validateTask, validateSubtask } = require('../middleware/validation');

// كل المسارات تحتاج تسجيل دخول
router.use(authenticateToken);

// === مسارات المهام الأساسية ===

// POST /api/tasks - إنشاء مهمة جديدة (Admin/Manager فقط)
router.post('/', adminOrManager, validateTask, createTask);

// GET /api/tasks - جلب جميع المهام (Admin/Manager فقط)
router.get('/', adminOrManager, getAllTasks);

// GET /api/tasks/my - جلب مهام المستخدم الحالي
router.get('/my', getMyTasks);

// GET /api/tasks/status/:status - جلب المهام حسب الحالة (Admin/Manager فقط)
router.get('/status/:status', adminOrManager, getTasksByStatus);

// GET /api/tasks/user/:userId - جلب مهام مستخدم معين (Admin/Manager فقط)
router.get('/user/:userId', adminOrManager, getTasksByUserId);

// GET /api/tasks/:id - جلب مهمة معينة مع المهام الفرعية
router.get('/:id', getTaskById);

// PATCH /api/tasks/:id/status - تحديث حالة المهمة
router.patch('/:id/status', updateTaskStatus);

// PUT /api/tasks/:id - تحديث المهمة كاملة (Admin/Manager فقط)
router.put('/:id', adminOrManager, updateTask);

// DELETE /api/tasks/:id - حذف مهمة (Admin/Manager فقط)
router.delete('/:id', adminOrManager, deleteTask);

// === مسارات المهام الفرعية ===

// POST /api/tasks/:id/subtasks - إضافة مهمة فرعية
router.post('/:id/subtasks', validateSubtask, addSubtask);

// PATCH /api/tasks/:taskId/subtasks/:subtaskId/status - تحديث حالة مهمة فرعية
router.patch('/:taskId/subtasks/:subtaskId/status', updateSubtaskStatus);

// DELETE /api/tasks/:taskId/subtasks/:subtaskId - حذف مهمة فرعية
router.delete('/:taskId/subtasks/:subtaskId', deleteSubtask);

// PATCH /api/tasks/:id/notes - تحديث ملاحظات اليوزر
router.patch('/:id/notes', updateUserNotes);

module.exports = router;
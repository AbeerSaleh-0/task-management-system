const Task = require('../models/task');
const Subtask = require('../models/subtask');
const User = require('../models/user');
const { sendTaskNotification } = require('./assets/js/whatsapp_api');

// إنشاء مهمة جديدة
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, user_id, due_date, manager_notes } = req.body;

    // التحقق من وجود المستخدم
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // إنشاء المهمة
    const result = await Task.create(
      title,
      description || null,
      status || 'pending',
      priority || 'medium',
      user_id,
      due_date || null,
      manager_notes || null
    );

        if (user.phone) {
      const taskData = {
        title,
        description: description || 'لا توجد تفاصيل',
        due_date: due_date || 'غير محدد',
        priority: priority || 'متوسطة'
      };

      // إرسال الإشعار بدون انتظار (async - لا نوقف العملية)
      sendTaskNotification(user.phone, taskData)
        .then(result => {
          if (result.success) {
            console.log(`✅ تم إرسال إشعار واتساب للمستخدم: ${user.username}`);
          } else {
            console.log(`⚠️ فشل إرسال الواتساب: ${result.error}`);
          }
        })
        .catch(err => {
          console.error('❌ خطأ في إرسال إشعار الواتساب:', err);
        });
    } else {
      console.log(`ℹ️ المستخدم ${user.username} ليس لديه رقم جوال`);
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      taskId: result.insertId
    });

  } catch (error) {
    next(error);
  }
};

// جلب جميع المهام
const getAllTasks = async (req, res, next) => {
  try {
    const tasks = await Task.findAll();

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });

  } catch (error) {
    next(error);
  }
};

// جلب مهمة معينة مع المهام الفرعية
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // جلب المهام الفرعية
    const subtasks = await Subtask.findByTaskId(id);

    res.status(200).json({
      success: true,
      task: {
        ...task,
        subtasks
      }
    });

  } catch (error) {
    next(error);
  }
};

// جلب مهام مستخدم معين
const getTasksByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const tasks = await Task.findByUserId(userId);

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });

  } catch (error) {
    next(error);
  }
};

// جلب مهام المستخدم الحالي
const getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Task.findByUserId(req.user.id);

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });

  } catch (error) {
    next(error);
  }
};

// تحديث حالة المهمة
const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // التحقق من صحة الحالة
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, in_progress, or completed'
      });
    }

    // التحقق من وجود المهمة
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // تحديث الحالة
    await Task.updateStatus(id, status);

    res.status(200).json({
      success: true,
      message: 'Task status updated successfully'
    });

  } catch (error) {
    next(error);
  }
};

// تحديث المهمة كاملة
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, due_date, user_id, manager_notes } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await Task.update(
      id,
      title || task.title,
      description !== undefined ? description : task.description,
      status || task.status,
      priority || task.priority,
      due_date !== undefined ? due_date : task.due_date,
      user_id !== undefined ? user_id : task.user_id,
      manager_notes !== undefined ? manager_notes : task.manager_notes
    );

    res.status(200).json({
      success: true,
      message: 'Task updated successfully'
    });

  } catch (error) {
    next(error);
  }
};
/*
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, due_date } = req.body;

    // التحقق من وجود المهمة
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // تحديث المهمة
    await Task.update(
      id,
      title || task.title,
      description !== undefined ? description : task.description,
      status || task.status,
      priority || task.priority,
      due_date !== undefined ? due_date : task.due_date
    );

    res.status(200).json({
      success: true,
      message: 'Task updated successfully'
    });

  } catch (error) {
    next(error);
  }
};
*/
// حذف مهمة
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    // التحقق من وجود المهمة
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // حذف المهمة 
    await Task.delete(id);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// جلب المهام حسب الحالة
const getTasksByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;

    const tasks = await Task.findByStatus(status);

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });

  } catch (error) {
    next(error);
  }
};

// إضافة مهمة فرعية لمهمة
const addSubtask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    // التحقق من وجود المهمة الأساسية
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // إنشاء المهمة الفرعية
    const result = await Subtask.create(title, id);

    res.status(201).json({
      success: true,
      message: 'Subtask added successfully',
      subtaskId: result.insertId
    });

  } catch (error) {
    next(error);
  }
};

// تحديث حالة مهمة فرعية
const updateSubtaskStatus = async (req, res, next) => {
  try {
    const { taskId, subtaskId } = req.params;
    const { status } = req.body;

    // التحقق من صحة الحالة
    const validStatuses = ['pending', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending or completed'
      });
    }

    // التحقق من وجود المهمة الفرعية
    const subtask = await Subtask.findById(subtaskId);
    if (!subtask || subtask.task_id != taskId) {
      return res.status(404).json({
        success: false,
        message: 'Subtask not found'
      });
    }

    // تحديث الحالة
    await Subtask.updateStatus(subtaskId, status);

    res.status(200).json({
      success: true,
      message: 'Subtask status updated successfully'
    });

  } catch (error) {
    next(error);
  }
};

// حذف مهمة فرعية
const deleteSubtask = async (req, res, next) => {
  try {
    const { taskId, subtaskId } = req.params;

    // التحقق من وجود المهمة الفرعية
    const subtask = await Subtask.findById(subtaskId);
    if (!subtask || subtask.task_id != taskId) {
      return res.status(404).json({
        success: false,
        message: 'Subtask not found'
      });
    }

    // حذف المهمة الفرعية
    await Subtask.delete(subtaskId);

    res.status(200).json({
      success: true,
      message: 'Subtask deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// تحديث ملاحظات اليوزر على مهمة
const updateUserNotes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { user_notes } = req.body;

    // التحقق من وجود المهمة
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // التحقق أن اليوزر يحدث ملاحظاته على مهمته فقط
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      if (task.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only update notes on your own tasks'
        });
      }
    }

    // تحديث الملاحظات
    await Task.updateUserNotes(id, user_notes);

    res.status(200).json({
      success: true,
      message: 'User notes updated successfully'
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
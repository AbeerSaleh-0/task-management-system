const db = require('../config/db');

// إنشاء جدول Subtasks
const createSubtasksTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS subtasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      status ENUM('pending', 'completed') DEFAULT 'pending',
      task_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `;
  
  try {
    await db.execute(query);
    console.log('✅ جدول Subtasks جاهز');
  } catch (error) {
    console.error('❌ خطأ في إنشاء جدول Subtasks:', error.message);
  }
};

// استدعاء إنشاء الجدول
createSubtasksTable();

// دوال للتعامل مع جدول Subtasks
const Subtask = {
  // إنشاء مهمة فرعية جديدة
  create: async (title, task_id) => {
    const query = 'INSERT INTO subtasks (title, task_id) VALUES (?, ?)';
    const [result] = await db.execute(query, [title, task_id]);
    return result;
  },

  // جلب مهمة فرعية بالـ id
  findById: async (id) => {
    const query = 'SELECT * FROM subtasks WHERE id = ?';
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  },

  // جلب جميع المهام الفرعية لمهمة معينة
  findByTaskId: async (task_id) => {
    const query = 'SELECT * FROM subtasks WHERE task_id = ? ORDER BY created_at ASC';
    const [rows] = await db.execute(query, [task_id]);
    return rows;
  },

  // تحديث حالة المهمة الفرعية
  updateStatus: async (id, status) => {
    const query = 'UPDATE subtasks SET status = ? WHERE id = ?';
    const [result] = await db.execute(query, [status, id]);
    return result;
  },

  // تحديث عنوان المهمة الفرعية
  updateTitle: async (id, title) => {
    const query = 'UPDATE subtasks SET title = ? WHERE id = ?';
    const [result] = await db.execute(query, [title, id]);
    return result;
  },

  // حذف مهمة فرعية
  delete: async (id) => {
    const query = 'DELETE FROM subtasks WHERE id = ?';
    const [result] = await db.execute(query, [id]);
    return result;
  },

  // حذف جميع المهام الفرعية لمهمة معينة
  deleteByTaskId: async (task_id) => {
    const query = 'DELETE FROM subtasks WHERE task_id = ?';
    const [result] = await db.execute(query, [task_id]);
    return result;
  },

  // عد المهام الفرعية المكتملة لمهمة معينة
  countCompleted: async (task_id) => {
    const query = 'SELECT COUNT(*) as count FROM subtasks WHERE task_id = ? AND status = "completed"';
    const [rows] = await db.execute(query, [task_id]);
    return rows[0].count;
  },

  // عد إجمالي المهام الفرعية لمهمة معينة
  countTotal: async (task_id) => {
    const query = 'SELECT COUNT(*) as count FROM subtasks WHERE task_id = ?';
    const [rows] = await db.execute(query, [task_id]);
    return rows[0].count;
  }
};

module.exports = Subtask;
const db = require('../config/db');

// إنشاء جدول Tasks
const createTasksTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
      priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
      user_id INT NOT NULL,
      due_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  
  try {
    await db.execute(query);
    console.log('✅ جدول Tasks جاهز');
  } catch (error) {
    console.error('❌ خطأ في إنشاء جدول Tasks:', error.message);
  }
};

// استدعاء إنشاء الجدول
createTasksTable();

// دوال للتعامل مع جدول Tasks
const Task = {
  // إنشاء مهمة جديدة
  create: async (title, description, status, priority, user_id, due_date, manager_notes) => {
  const query = 'INSERT INTO tasks (title, description, status, priority, user_id, due_date, manager_notes) VALUES (?, ?, ?, ?, ?, ?, ?)';
  const [result] = await db.execute(query, [title, description, status, priority, user_id, due_date, manager_notes]);
  return result;
},
/*
  // جلب مهمة بالـ id
  findById: async (id) => {
    const query = 'SELECT * FROM tasks WHERE id = ?';
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  },

  // جلب جميع المهام
  findAll: async () => {
    const query = `
      SELECT tasks.*, users.username 
      FROM tasks 
      JOIN users ON tasks.user_id = users.id
      ORDER BY tasks.created_at DESC
    `;
    const [rows] = await db.execute(query);
    return rows;
  },
  */
/*
  // جلب مهام مستخدم معين
  findByUserId: async (user_id) => {
    const query = 'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC';
    const [rows] = await db.execute(query, [user_id]);
    return rows;
  },
  */
 // جلب مهمة بالـ id
findById: async (id) => {
  const query = 'SELECT * FROM tasks WHERE id = ?';
  const [rows] = await db.execute(query, [id]);
  
  if (rows.length > 0) {
    const task = rows[0];
    // جلب المهام الفرعية
    const [subtasks] = await db.execute(
      'SELECT * FROM subtasks WHERE task_id = ? ORDER BY created_at ASC',
      [task.id]
    );
    task.subtasks = subtasks;
    return task;
  }
  
  return null;
},
 // جلب جميع المهام
findAll: async () => {
  const query = `
    SELECT tasks.*, 
           users.username,
           users.name as user_name
    FROM tasks 
    JOIN users ON tasks.user_id = users.id
    ORDER BY tasks.created_at DESC
  `;
  const [rows] = await db.execute(query);
  
  // جلب المهام الفرعية
  for (let task of rows) {
    const [subtasks] = await db.execute(
      'SELECT * FROM subtasks WHERE task_id = ? ORDER BY created_at ASC',
      [task.id]
    );
    task.subtasks = subtasks;
  }
  
  return rows;
},
 // جلب مهام مستخدم معين
findByUserId: async (user_id) => {
  const query = 'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC';
  const [rows] = await db.execute(query, [user_id]);
  
  // جلب المهام الفرعية لكل مهمة
  for (let task of rows) {
    const [subtasks] = await db.execute(
      'SELECT * FROM subtasks WHERE task_id = ? ORDER BY created_at ASC',
      [task.id]
    );
    task.subtasks = subtasks;
  }
  
  return rows;
},
  // تحديث حالة المهمة
  updateStatus: async (id, status) => {
    const query = 'UPDATE tasks SET status = ? WHERE id = ?';
    const [result] = await db.execute(query, [status, id]);
    return result;
  },

  // تحديث المهمة كاملة
  update: async (id, title, description, status, priority, due_date) => {
    const query = 'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, due_date = ? WHERE id = ?';
    const [result] = await db.execute(query, [title, description, status, priority, due_date, id]);
    return result;
  },

  // حذف مهمة
  delete: async (id) => {
    const query = 'DELETE FROM tasks WHERE id = ?';
    const [result] = await db.execute(query, [id]);
    return result;
  },

  // جلب المهام حسب الحالة
  findByStatus: async (status) => {
    const query = 'SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC';
    const [rows] = await db.execute(query, [status]);
    return rows;
  },

  // تحديث ملاحظات اليوزر
  updateUserNotes: async (id, user_notes) => {
    const query = 'UPDATE tasks SET user_notes = ? WHERE id = ?';
    const [result] = await db.execute(query, [user_notes, id]);
    return result;
  },
};



module.exports = Task;
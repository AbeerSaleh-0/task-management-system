const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool(process.env.MYSQL_PUBLIC_URL);

// اختبار الاتصال
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح!');
    connection.release();

    // إنشاء الجداول بالترتيب الصحيح
    await createUsersTable();     // جدول Users أولاً
    await createTasksTable();     // جدول Tasks بعده
    await createSubtasksTable();  // جدول Subtasks أخيراً

    console.log('🎉 جميع الجداول جاهزة!');
  } catch (err) {
    console.error('❌ فشل الاتصال أو إنشاء الجداول:', err.message);
  }
})();

// تعريف الدوال بعد الاتصال
const createUsersTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20) DEFAULT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'user', 'manager') DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  try {
    await pool.execute(query);
    console.log('✅ جدول Users جاهز');
  } catch (error) {
    console.error('❌ خطأ في إنشاء جدول Users:', error.message);
  }
};

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
    await pool.execute(query);
    console.log('✅ جدول Tasks جاهز');
  } catch (error) {
    console.error('❌ خطأ في إنشاء جدول Tasks:', error.message);
  }
};

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
    await pool.execute(query);
    console.log('✅ جدول Subtasks جاهز');
  } catch (error) {
    console.error('❌ خطأ في إنشاء جدول Subtasks:', error.message);
  }
};

module.exports = pool;

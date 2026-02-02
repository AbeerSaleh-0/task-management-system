const db = require('../config/db');

// إنشاء جدول Users 
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
    await db.execute(query);
    console.log('✅ جدول Users جاهز');
  } catch (error) {
    console.error('❌ خطأ في إنشاء جدول Users:', error.message);
  }
};

// استدعاء إنشاء الجدول
createUsersTable();

// دوال للتعامل مع جدول Users
const User = {
  // إنشاء مستخدم جديد
    create: async (username, password, role = 'user', name = null, phone = null) => {
    const query = 'INSERT INTO users (username, name, phone, password, role) VALUES (?, ?, ?, ?, ?)';
    const [result] = await db.execute(query, [username, name, phone, password, role]);
    return result;
  },
  // البحث عن مستخدم بالـ username
  findByUsername: async (username) => {
    const query = 'SELECT * FROM users WHERE username = ?';
    const [rows] = await db.execute(query, [username]);
    return rows[0];
  },

  // البحث عن مستخدم بالـ id
  findById: async (id) => {
    const query = 'SELECT * FROM users WHERE id = ?';
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  },

  // جلب جميع المستخدمين
  findAll: async () => {
    const query = 'SELECT id, username, name, role, phone, created_at FROM users';
    const [rows] = await db.execute(query);
    return rows;
  },

  // تحديث الاسم
  updateName: async (id, name) => {
    const query = 'UPDATE users SET name = ? WHERE id = ?';
    const [result] = await db.execute(query, [name, id]);
    return result;
},

  // تحديث دور المستخدم
  updateRole: async (id, role) => {
    const query = 'UPDATE users SET role = ? WHERE id = ?';
    const [result] = await db.execute(query, [role, id]);
    return result;
  },
  // تحديث كلمة المرور الخاصة بالمستخدم
  updatePassword: async (id, hashedPassword) => {
    const query = 'UPDATE users SET password = ? WHERE id = ?';
    const [result] = await db.execute(query, [hashedPassword, id]);
    return result;
  },
    updatePhone: async (id, phone) => {
    const query = 'UPDATE users SET phone = ? WHERE id = ?';
    const [result] = await db.execute(query, [phone, id]);
    return result;
  },
  
  // حذف مستخدم
  delete: async (id) => {
    const query = 'DELETE FROM users WHERE id = ?';
    const [result] = await db.execute(query, [id]);
    return result;
  }
};

module.exports = User;
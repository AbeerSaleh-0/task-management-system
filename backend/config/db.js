const mysql = require('mysql2/promise');

// إنشاء connection pool للاتصال بقاعدة البيانات
const pool = mysql.createPool({
  host: 'localhost',        // عنوان السيرفر
  user: 'root',              // اسم المستخدم (default في XAMPP)
  password: '',              // كلمة المرور (فاضية في XAMPP)
  database: 'task_management', // اسم قاعدة البيانات
  waitForConnections: true,
  connectionLimit: 10,       // عدد الاتصالات المتزامنة
  queueLimit: 0
});

// اختبار الاتصال
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح!');
    connection.release();
  } catch (err) {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', err.message);
  }
})();

module.exports = pool;
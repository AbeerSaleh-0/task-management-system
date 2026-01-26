require('dotenv').config();
require('./config/db');
const express = require('express');
const cors = require('cors');
const app = express();
/*app.use(cors({
  origin: [
    'https://api.taskrsg.cloud', // URL
    'https://www.taskrsg.cloud',
    'http://localhost:3000', // للتطوير المحلي
    'http://127.0.0.1:5500'  // Live Server
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));*/

app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  console.log(`📨 ${req.method} ${req.url} from ${origin || 'unknown'}`);

  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  //res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');

  if (req.method === 'OPTIONS') {
    console.log('✅ Preflight handled');
    return res.status(204).end();
  }

  next();
});

// استيراد قاعدة البيانات والـ Models (لإنشاء الجداول)

require('./models/user');
require('./models/task');
require('./models/subtask');

// استيراد الـ Middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

// استيراد الـ Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');

// ===== Middleware للتطبيق =====

// تحويل الـ JSON في الـ requests
app.use(express.json());

// تحويل الـ URL-encoded data
app.use(express.urlencoded({ extended: true }));

// ===== Routes =====

// مسار الرئيسي للاختبار
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Task Management API is running!',
    version: '1.0.0'
  });
});

// ربط المسارات
app.use('/api/auth', authRoutes);      // مسارات تسجيل الدخول
app.use('/api/admin', adminRoutes);    // مسارات الأدمن
app.use('/api/tasks', taskRoutes);     // مسارات المهام
app.use('/api/users', userRoutes);     // مسارات المستخدمين (فاضي حالياً)

// ===== Error Handling =====

// معالج الـ routes الغير موجودة (404)
app.use(notFound);

// معالج الأخطاء العام
app.use(errorHandler);

// ===== Server =====

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ========================================
  🚀 Server is running on port ${PORT}
  📡 API URL: http://localhost:${PORT}
  📚 Database: Connected
  ========================================
  `);
});

module.exports = app;
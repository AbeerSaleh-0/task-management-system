// index.js
/*
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Express is working");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});


const express = require("express");
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json()); // لتحليل JSON
app.use(express.urlencoded({ extended: true })); // لتحليل form data

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/admin", adminRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Error handling middleware
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
*/
const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());

// استيراد قاعدة البيانات والـ Models (لإنشاء الجداول)
require('./config/db');
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
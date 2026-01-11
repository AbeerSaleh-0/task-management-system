const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { generateToken } = require('../middleware/auth');

// تسجيل الدخول
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // البحث عن المستخدم
    const user = await User.findByUsername(username);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // إنشاء token
    const token = generateToken(user);

    // إرجاع البيانات (بدون كلمة المرور)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    next(error);
  }
};

// تسجيل الخروج (optional - بس للتوضيح)
const logout = (req, res) => {
  // في JWT ما نحتاج نسوي شي في الباك-إند
  // الفرونت-إند يحذف الـ token من localStorage
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
};

// التحقق من الـ token (للتأكد إن المستخدم مسجل دخول)
const verifyToken = (req, res) => {
  // إذا وصلنا هنا يعني الـ token صحيح (عبر auth middleware)
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    user: req.user
  });
};

module.exports = {
  login,
  logout,
  verifyToken
};
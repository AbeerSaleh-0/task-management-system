const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { generateToken } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

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

// تسجيل الخروج 
const logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
};

// التحقق من الـ token 
const verifyToken = (req, res) => {
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
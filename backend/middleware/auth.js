/*const jwt = require('jsonwebtoken');

// مفتاح سري للـ JWT (لازم تحطه في ملف .env بعدين)
const JWT_SECRET = 'your_super_secret_key_change_this_in_production';

// Middleware للتحقق من الـ Token
const authenticateToken = (req, res, next) => {
  // جلب الـ token من الـ header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  // إذا ما في token
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }

  // التحقق من صحة الـ token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token.' 
      });
    }

    // حفظ بيانات المستخدم في الـ request
    req.user = user;
    next();
  });
};

// دالة لإنشاء token جديد
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role
  };

  // إنشاء token ينتهي بعد 24 ساعة
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

module.exports = {
  authenticateToken,
  generateToken,
  JWT_SECRET
};*/
const jwt = require('jsonwebtoken');

// جلب المفتاح السري من ملف .env
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware للتحقق من الـ Token
const authenticateToken = (req, res, next) => {
  // جلب الـ token من الـ header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"
  
  // إذا ما في token
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.' 
    });
  }
  
  // التحقق من صحة الـ token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token.' 
      });
    }
    
    // حفظ بيانات المستخدم في الـ request
    req.user = user;
    next();
  });
};

// دالة لإنشاء token جديد
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role
  };
  
  // إنشاء token ينتهي بعد 24 ساعة
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

module.exports = {
  authenticateToken,
  generateToken,
  JWT_SECRET
};
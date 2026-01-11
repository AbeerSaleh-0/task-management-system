// Middleware للتحقق من صلاحيات الدور
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    // التأكد من وجود بيانات المستخدم 
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // التحقق من دور المستخدم
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    // المستخدم عنده الصلاحية، كمل
    next();
  };
};

// Middleware خاص للـ Admin فقط
const adminOnly = checkRole('admin');

// Middleware للـ Admin أو Manager
const adminOrManager = checkRole('admin', 'manager');

module.exports = {
  checkRole,
  adminOnly,
  adminOrManager
};
// دالة مساعدة للتحقق من وجود الحقول المطلوبة
const validateRequired = (fields) => {
  return (req, res, next) => {
    const missingFields = [];

    fields.forEach(field => {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields
      });
    }

    next();
  };
};

// التحقق من بيانات التسجيل
const validateRegister = (req, res, next) => {
  const { username, password } = req.body;

  // التحقق من وجود الحقول
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }

  // التحقق من طول اسم المستخدم
  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({
      success: false,
      message: 'Username must be between 3 and 50 characters'
    });
  }

  // التحقق من قوة كلمة المرور
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters'
    });
  }

  next();
};

// التحقق من بيانات تسجيل الدخول
const validateLogin = (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }

  next();
};

// التحقق من بيانات إنشاء مهمة
const validateTask = (req, res, next) => {
  const { title, user_id } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Task title is required'
    });
  }

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    });
  }

  next();
};

// التحقق من بيانات إنشاء مهمة فرعية
const validateSubtask = (req, res, next) => {
  const { title, task_id } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Subtask title is required'
    });
  }

  if (!task_id) {
    return res.status(400).json({
      success: false,
      message: 'Task ID is required'
    });
  }

  next();
};

module.exports = {
  validateRequired,
  validateRegister,
  validateLogin,
  validateTask,
  validateSubtask
};
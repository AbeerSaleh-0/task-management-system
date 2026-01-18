const bcrypt = require('bcryptjs');
const User = require('../models/user');

// إنشاء مستخدم جديد 
const createUser = async (req, res, next) => {
  try {
    //const { username, name, password, role} = req.body; 
    const { username, password, role, name, phone } = req.body;
    // التحقق من عدم وجود المستخدم
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists'
      });
    }

    if (phone && !/^(05|5)\d{8}$/.test(phone)) {
      return res.status(400).json({ 
        success: false, 
        message: 'رقم الجوال غير صحيح' 
      });
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // إنشاء المستخدم
    const result = await User.create(username, hashedPassword, role || 'user', name || null, phone || null );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      userId: result.insertId
    });

  } catch (error) {
    next(error);
  }
};

// جلب جميع المستخدمين 
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll();

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });

  } catch (error) {
    next(error);
  }
};

// جلب مستخدم معين 
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // إزالة كلمة المرور من الرد
    delete user.password;

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    next(error);
  }
};

// تحديث دور المستخدم 
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // التحقق من صحة الدور
    const validRoles = ['admin', 'user', 'manager'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be: admin, user, or manager'
      });
    }

    // التحقق من وجود المستخدم
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // تحديث الدور
    await User.updateRole(id, role);

    res.status(200).json({
      success: true,
      message: 'User role updated successfully'
    });

  } catch (error) {
    next(error);
  }
};

// حذف مستخدم 
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // التحقق من وجود المستخدم
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // منع الأدمن من حذف نفسه
    if (req.user.id === parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // حذف المستخدم
    await User.delete(id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// تحديث اسم المستخدم 
const updateUserName = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // التحقق من وجود المستخدم
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // تحديث الاسم
    await User.updateName(id, name.trim());

    res.status(200).json({
      success: true,
      message: 'User name updated successfully'
    });

  } catch (error) {
    next(error);
  }
};

// تحديث كلمة مرور مستخدم 
const updateUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // التحقق من وجود كلمة المرور الجديدة
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }

    // التحقق من طول كلمة المرور
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // التحقق من وجود المستخدم
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // تشفير كلمة المرور الجديدة
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // تحديث كلمة المرور
    await User.updatePassword(id, hashedPassword);

    res.status(200).json({
      success: true,
      message: 'User password updated successfully'
    });

  } catch (error) {
    next(error);
  }
};

const updateUserPhone = async (req, res) => {
  try {
    const { id } = req.params;
    const { phone } = req.body;

    // التحقق من صحة رقم الجوال (اختياري)
    if (phone && !/^(05|5)\d{8}$/.test(phone)) {
      return res.status(400).json({ 
        success: false, 
        message: 'رقم الجوال غير صحيح. يجب أن يبدأ بـ 05 ويتكون من 10 أرقام' 
      });
    }

    await User.updatePhone(id, phone);
    res.json({ 
      success: true, 
      message: 'تم تحديث رقم الجوال بنجاح' 
    });
  } catch (error) {
    console.error('خطأ في تحديث رقم الجوال:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUserRole,
  updateUserPassword,
  updateUserName,
  updateUserPhone,
  deleteUser
};
// معالج الأخطاء العام
const errorHandler = (err, req, res, next) => {
  // طباعة الخطأ في الـ console للتطوير
  console.error('❌ Error:', err.message);
  console.error(err.stack);

  // تحديد نوع الخطأ والـ status code
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // أخطاء قاعدة البيانات
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Duplicate entry. This record already exists.';
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Invalid reference. Related record does not exist.';
  }

  // أخطاء JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired.';
  }

  // إرسال الرد
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// معالج للـ routes الغير موجودة (404)
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
};

module.exports = {
  errorHandler,
  notFound
};
// التحقق إذا المستخدم مسجل دخول مسبقاً
document.addEventListener('DOMContentLoaded', () => {
  if (typeof authAPI !== 'undefined' && authAPI.isLoggedIn()) {
    const user = authAPI.getCurrentUser();
    redirectUser(user);
  }
});

// دالة توجيه المستخدم حسب دوره
function redirectUser(user) {
  if (user.role === 'admin') {
    window.location.href = 'admin.html';
  } else if (user.role === 'manager') {
    window.location.href = 'manager.html';
  } else {
    window.location.href = 'dashboard.html';
  }
}

// معالج تسجيل الدخول
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('errorMessage');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  // إخفاء رسالة الخطأ
  errorDiv.style.display = 'none';

  // تعطيل الزر أثناء المعالجة
  submitBtn.disabled = true;
  submitBtn.textContent = 'جاري تسجيل الدخول...';

  try {
    // استدعاء API تسجيل الدخول
    const response = await authAPI.login(username, password);

    if (response.success) {
      // نجح تسجيل الدخول
      console.log('تم تسجيل الدخول بنجاح:', response.user);
      
      // توجيه المستخدم حسب دوره
      redirectUser(response.user);
    } else {
      throw new Error(response.message || 'فشل تسجيل الدخول');
    }

  } catch (error) {
    // عرض رسالة الخطأ
    console.error('خطأ في تسجيل الدخول:', error);
    errorDiv.textContent = error.message || 'اسم المستخدم أو كلمة المرور غير صحيحة';
    errorDiv.style.display = 'block';

    // إعادة تفعيل الزر
    submitBtn.disabled = false;
    submitBtn.textContent = 'تسجيل الدخول';
  }
});
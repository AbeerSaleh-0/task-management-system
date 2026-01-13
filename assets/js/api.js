// عنوان الـ API
const API_URL = 'https://task-management-system-production-f191.up.railway.app/api';

// ======== دوال مساعدة ========

// جلب الـ token من localStorage
function getToken() {
  return localStorage.getItem('token');
}

// حفظ الـ token في localStorage
function saveToken(token) {
  localStorage.setItem('token', token);
}

// حذف الـ token من localStorage
function removeToken() {
  localStorage.removeItem('token');
}

// حفظ بيانات المستخدم
function saveUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

// جلب بيانات المستخدم
function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

function getUserName() {
  const user = getUser();
  if (!user) return null;
  return user.name || user.username;
}

// حذف بيانات المستخدم
function removeUser() {
  localStorage.removeItem('user');
}

// دالة عامة للـ API calls
async function apiCall(endpoint, method = 'GET', body = null, requiresAuth = true) {
  const headers = {
    'Content-Type': 'application/json'
  };

  // إضافة الـ token إذا كان مطلوب
  if (requiresAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const config = {
    method,
    headers
  };

  // إضافة الـ body إذا موجود
  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;

  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ======== Auth APIs ========

const authAPI = {
  // تسجيل دخول
  login: async (username, password) => {
    try {
      const data = await apiCall('/auth/login', 'POST', { username, password }, false);
      
      if (data.success) {
        saveToken(data.token);
        saveUser(data.user);
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  },

  // تسجيل خروج
  logout: () => {
    removeToken();
    removeUser();
    window.location.href = '/index.html';
  },

  // التحقق من الـ token
  verify: async () => {
    try {
      return await apiCall('/auth/verify', 'GET');
    } catch (error) {
      authAPI.logout();
      throw error;
    }
  },

  // التحقق إذا المستخدم مسجل دخول
  isLoggedIn: () => {
    return getToken() !== null;
  },

  // جلب المستخدم الحالي
  getCurrentUser: () => {
    return getUser();
  },

  getUserName: () => {
  return getUserName();
}
};

// ======== Admin APIs ========

const adminAPI = {
  // إنشاء مستخدم جديد
  createUser: async (username, password, role = 'user') => {
    return await apiCall('/admin/users', 'POST', { username, password, role });
  },

  // جلب جميع المستخدمين
  getAllUsers: async () => {
    return await apiCall('/admin/users', 'GET');
  },

  // جلب مستخدم معين
  getUserById: async (id) => {
    return await apiCall(`/admin/users/${id}`, 'GET');
  },

  // تحديث دور المستخدم
  updateUserRole: async (id, role) => {
    return await apiCall(`/admin/users/${id}/role`, 'PATCH', { role });
  },

  // تحديث كلمة مرور المستخدم
  updateUserPassword: async (id, newPassword) => {
    return await apiCall(`/admin/users/${id}/password`, 'PATCH', { newPassword });
  },

  // تحديث اسم المستخدم
  updateUserName: async (id, name) => {
    return await apiCall(`/admin/users/${id}/name`, 'PATCH', { name });
  },

  // حذف مستخدم
  deleteUser: async (id) => {
    return await apiCall(`/admin/users/${id}`, 'DELETE');
  }
};

// ======== Task APIs ========

const taskAPI = {
  // إنشاء مهمة جديدة
  create: async (taskData) => {
    return await apiCall('/tasks', 'POST', taskData);
  },

  // جلب جميع المهام
  getAll: async () => {
    return await apiCall('/tasks', 'GET');
  },

  // جلب مهمة معينة
  getById: async (id) => {
    return await apiCall(`/tasks/${id}`, 'GET');
  },

  // جلب مهامي
  getMyTasks: async () => {
    return await apiCall('/tasks/my', 'GET');
  },

  // جلب مهام حسب الحالة
  getByStatus: async (status) => {
    return await apiCall(`/tasks/status/${status}`, 'GET');
  },

  // جلب مهام مستخدم معين
  getByUserId: async (userId) => {
    return await apiCall(`/tasks/user/${userId}`, 'GET');
  },

  // تحديث حالة المهمة
  updateStatus: async (id, status) => {
    return await apiCall(`/tasks/${id}/status`, 'PATCH', { status });
  },

  // تحديث مهمة كاملة
  update: async (id, taskData) => {
    return await apiCall(`/tasks/${id}`, 'PUT', taskData);
  },

  // حذف مهمة
  delete: async (id) => {
    return await apiCall(`/tasks/${id}`, 'DELETE');
  },

  // إضافة مهمة فرعية
  addSubtask: async (taskId, title) => {
    return await apiCall(`/tasks/${taskId}/subtasks`, 'POST', { title, task_id: taskId });
  },

  // تحديث حالة مهمة فرعية
  updateSubtaskStatus: async (taskId, subtaskId, status) => {
    return await apiCall(`/tasks/${taskId}/subtasks/${subtaskId}/status`, 'PATCH', { status });
  },

  // حذف مهمة فرعية
  deleteSubtask: async (taskId, subtaskId) => {
    return await apiCall(`/tasks/${taskId}/subtasks/${subtaskId}`, 'DELETE');
  },

  updateUserNotes: async (id, user_notes) => {
    return await apiCall(`/tasks/${id}/notes`, 'PATCH', { user_notes });
  }
};
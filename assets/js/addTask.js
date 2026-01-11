// التحقق من تسجيل الدخول
document.addEventListener('DOMContentLoaded', async () => {
  if (!authAPI.isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  const user = authAPI.getCurrentUser();
  
  // التحقق من الصلاحيات (Admin أو Manager فقط)
  if (user.role !== 'admin' && user.role !== 'manager') {
    alert('ليس لديك صلاحية لإضافة مهام');
    window.location.href = 'dashboard.html';
    return;
  }

  // تحميل قائمة المستخدمين
  await loadUsers();

  // تعيين الحد الأدنى للتاريخ (اليوم)
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('taskDeadline').setAttribute('min', today);

  // إضافة مهمة فرعية واحدة افتراضياً
  addSubtask();
});

// متغيرات عامة
let subtasks = [];
let subtaskCounter = 0;
let allUsers = [];

// تحميل قائمة المستخدمين
async function loadUsers() {
  try {
    const response = await adminAPI.getAllUsers();
    allUsers = response.users || [];

    const select = document.getElementById('taskUser');
    select.innerHTML = '<option value="">اختر المستخدم</option>';

    allUsers.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      // ✅ عرض الاسم إذا موجود، وإلا اسم المستخدم
      option.textContent = user.name || user.username;
      select.appendChild(option);
    });

  } catch (error) {
    console.error('خطأ في تحميل المستخدمين:', error);
    alert('حدث خطأ في تحميل قائمة المستخدمين');
  }
}

// إضافة مهمة فرعية
function addSubtask() {
  subtasks.push({
    id: subtaskCounter++,
    name: '',
    completed: false
  });
  renderSubtasks();
}

// حذف مهمة فرعية
function removeSubtask(id) {
  subtasks = subtasks.filter(st => st.id !== id);
  renderSubtasks();
}

// تحديث اسم المهمة الفرعية
function updateSubtaskName(id, name) {
  const subtask = subtasks.find(st => st.id === id);
  if (subtask) {
    subtask.name = name;
  }
}

// تبديل حالة المهمة الفرعية
function toggleSubtaskComplete(id) {
  const subtask = subtasks.find(st => st.id === id);
  if (subtask) {
    subtask.completed = !subtask.completed;
  }
}

// رسم المهام الفرعية
function renderSubtasks() {
  const container = document.getElementById('subtasksList');
  
  if (subtasks.length === 0) {
    container.innerHTML = '<p class="help-text" style="text-align: center; padding: 2rem; color: #9ca3af;">لا توجد مهام فرعية. اضغط على الزر أدناه لإضافة مهمة فرعية</p>';
    return;
  }

  container.innerHTML = subtasks.map(subtask => `
    <div class="subtask-item">
      <div class="checkbox-group">
        <input 
          type="checkbox" 
          class="checkbox" 
          ${subtask.completed ? 'checked' : ''}
          onchange="toggleSubtaskComplete(${subtask.id})"
        >
      </div>
      <input 
        type="text" 
        class="subtask-input" 
        placeholder="اسم المهمة الفرعية"
        value="${subtask.name}"
        oninput="updateSubtaskName(${subtask.id}, this.value)"
      >
      <button type="button" class="icon-btn" onclick="removeSubtask(${subtask.id})">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #dc2626;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
        </svg>
      </button>
    </div>
  `).join('');
}

// تحويل الحالة من الواجهة إلى API
function convertStatusToAPI(status) {
  const statusMap = {
    'not-started': 'pending',
    'in-progress': 'in_progress',
    'done': 'completed',
    'overdue': 'pending' // أو يمكن معالجتها بطريقة أخرى
  };
  return statusMap[status] || 'pending';
}

// معالجة إرسال النموذج
document.getElementById('taskForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const title = document.getElementById('taskName').value.trim();
  const user_id = document.getElementById('taskUser').value;
  const status = convertStatusToAPI(document.getElementById('taskStatus').value);
  const priority = document.getElementById('taskPriority').value;
  const due_date = document.getElementById('taskDeadline').value;
  const description = document.getElementById('taskNotes').value.trim() || null;

  // التحقق من البيانات
  if (!title) {
    alert('يرجى إدخال اسم المهمة');
    return;
  }

  if (!user_id) {
    alert('يرجى اختيار المستخدم');
    return;
  }

  if (!due_date) {
    alert('يرجى تحديد الموعد النهائي');
    return;
  }

  // تعطيل زر الإرسال
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'جاري الحفظ...';

  try {
    // إنشاء المهمة
    const taskData = {
      title,
      description: description || null,
      status,
      priority,
      user_id: parseInt(user_id),
      due_date,
      manager_notes: document.getElementById('managerNotes')?.value.trim() || null
    };

    const response = await taskAPI.create(taskData);

    if (response.success) {
      const taskId = response.taskId;

      // إضافة المهام الفرعية (إن وجدت)
      const validSubtasks = subtasks.filter(st => st.name.trim() !== '');
      
      if (validSubtasks.length > 0) {
        for (const subtask of validSubtasks) {
          try {
            await taskAPI.addSubtask(taskId, subtask.name.trim());
          } catch (error) {
            console.error('خطأ في إضافة مهمة فرعية:', error);
          }
        }
      }

      alert('تم حفظ المهمة بنجاح!');
      window.location.href = 'admin.html';
    }

  } catch (error) {
    console.error('خطأ في حفظ المهمة:', error);
    alert('حدث خطأ في حفظ المهمة: ' + (error.message || 'خطأ غير معروف'));

    // إعادة تفعيل الزر
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
});
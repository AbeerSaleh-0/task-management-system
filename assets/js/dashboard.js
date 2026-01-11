// التحقق من تسجيل الدخول
document.addEventListener('DOMContentLoaded', async () => {
  if (!authAPI.isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  const user = authAPI.getCurrentUser();
  console.log(user);
  // عرض اسم المستخدم
  document.querySelector('.top-bar-left h1').textContent = `مرحباً، ${user.name || user.username}`;
  // تحميل المهام
  await loadMyTasks();
});

// متغيرات عامة
let myTasks = [];

// تحميل مهام المستخدم
async function loadMyTasks() {
  try {
    const response = await taskAPI.getMyTasks();
    myTasks = response.tasks || [];

    // تحديث نظرة عامة
    updateOverview();

    // رسم المهام
    renderTasks();

  } catch (error) {
    console.error('خطأ في تحميل المهام:', error);
    alert('حدث خطأ في تحميل المهام');
  }
}

// تحديث الإحصائيات
function updateOverview() {
  const today = new Date().toISOString().split('T')[0];

  // المهام اليوم
  const todayTasks = myTasks.filter(t => t.due_date === today).length;

  // المهام المتأخرة (الموعد النهائي قبل اليوم وليست مكتملة)
  const overdueTasks = myTasks.filter(t => {
    return t.due_date < today && t.status !== 'completed';
  }).length;

  // نسبة الإنجاز
  const completedTasks = myTasks.filter(t => t.status === 'completed').length;
  const completionRate = myTasks.length > 0
    ? Math.round((completedTasks / myTasks.length) * 100)
    : 0;

  document.getElementById('todayCount').textContent = todayTasks;
  document.getElementById('overdueCount').textContent = overdueTasks;
  document.getElementById('completionRate').textContent = completionRate + '%';
}

// رسم المهام
function renderTasks() {
  const tasksList = document.getElementById('tasksList');

  if (myTasks.length === 0) {
    tasksList.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 3rem;">لا توجد مهام مخصصة لك</p>';
    return;
  }

  tasksList.innerHTML = myTasks.map(task => {
    const completedSubtasks = task.subtasks ? task.subtasks.filter(st => st.status === 'completed').length : 0;
    const totalSubtasks = task.subtasks ? task.subtasks.length : 0;

    return `
      <div class="task-item">
        <div class="task-content">
          <div class="task-details" style="width: 100%;">
            <div class="task-header">
              <h3 class="task-title ${task.status === 'completed' ? 'completed' : ''}">${task.title}</h3>
              ${getStatusBadge(task.status)}
            </div>
            <div class="task-meta">
              <span>
                <svg class="icon" style="display: inline-block; vertical-align: middle; margin-left: 0.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                ${formatDate(task.due_date)}
              </span>
              ${getPriorityBadge(task.priority)}
            </div>
            
              ${task.description ? `
                <div class="task-notes">
                  <strong>الوصف:</strong> ${task.description}
                </div>
              ` : ''}

            ${task.manager_notes ? `
              <div class="task-notes" style="background: #fef3c7; border-right: 3px solid #f59e0b;">
                <strong>ملاحظات المدير:</strong> ${task.manager_notes}
              </div>
            ` : ''}

            ${task.user_notes ? `
              <div class="task-notes" style="background: #e0f2fe; border-right: 3px solid #0284c7;">
                <strong>ملاحظاتي:</strong> ${task.user_notes}
              </div>
            ` : ''}
            
            <button class="subtasks-toggle" onclick="toggleNotesForm(${task.id})" style="background: #2563eb; color: white; margin-top: 10px;">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              ${task.user_notes ? 'تعديل ملاحظاتي' : 'إضافة ملاحظات'}
            </button>
             
            <div class="subtasks" id="notes-form-${task.id}" style="padding: 15px;">
              <textarea 
                id="notes-input-${task.id}" 
                placeholder="أضف ملاحظاتك هنا..."
                style="width: 100%; min-height: 100px; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-family: inherit; resize: vertical;"
              >${task.user_notes || ''}</textarea>
              <button 
                onclick="saveNotes(${task.id})"
                style="background: #16a34a; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-top: 10px; font-weight: 600;"
              >حفظ الملاحظات</button>
            </div>

            ${totalSubtasks > 0 ? `
              <button class="subtasks-toggle" onclick="toggleSubtasks(${task.id})" style="margin-top: 10px;">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
                المهام الفرعية (${completedSubtasks}/${totalSubtasks})
              </button>
              <div class="subtasks" id="subtasks-${task.id}">
                ${task.subtasks.map(subtask => `
                  <div class="subtask-item">
                    <input 
                      type="checkbox" 
                      class="subtask-checkbox" 
                      ${subtask.status === 'completed' ? 'checked' : ''}
                      onchange="toggleSubtaskStatus(${task.id}, ${subtask.id}, this.checked)"
                    >
                    <span class="subtask-name ${subtask.status === 'completed' ? 'completed' : ''}">${subtask.title}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// تبديل عرض المهام الفرعية
function toggleSubtasks(taskId) {
  const subtasksEl = document.getElementById(`subtasks-${taskId}`);
  if (subtasksEl) {
    subtasksEl.classList.toggle('show');
  }
}

// تغيير حالة المهمة الفرعية
async function toggleSubtaskStatus(taskId, subtaskId, isCompleted) {
  try {
    const newStatus = isCompleted ? 'completed' : 'pending';
    await taskAPI.updateSubtaskStatus(taskId, subtaskId, newStatus);
    
    // تحديث البيانات المحلية
    const task = myTasks.find(t => t.id === taskId);
    if (task && task.subtasks) {
      const subtask = task.subtasks.find(st => st.id === subtaskId);
      if (subtask) {
        subtask.status = newStatus;
      }
      
      // ✨ تحقق إذا كل المهام الفرعية مكتملة
      const allCompleted = task.subtasks.every(st => st.status === 'completed');
      const hasSubtasks = task.subtasks.length > 0;
      
      if (allCompleted && hasSubtasks && task.status !== 'completed') {
        // أكمل المهمة الأساسية تلقائياً
        await taskAPI.updateStatus(taskId, 'completed');
        task.status = 'completed';
      } else if (!allCompleted && task.status === 'completed') {
        // غيّر المهمة لـ in_progress
        await taskAPI.updateStatus(taskId, 'in_progress');
        task.status = 'in_progress';
      }
    }
    
    // إعادة رسم المهام
    updateOverview();
    renderTasks();
    
  } catch (error) {
    console.error('خطأ في تحديث المهمة الفرعية:', error);
    alert('حدث خطأ في تحديث المهمة الفرعية');
    
    // إعادة تحميل المهام
    await loadMyTasks();
  }
}

// تسجيل الخروج
function logout() {
  if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
    authAPI.logout();
  }
}

// Toggle Sidebar
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('hidden');
}

// دوال مساعدة
function getStatusBadge(status) {
  const badges = {
    'pending': '<span class="status-badge status-not-started">لم تبدأ</span>',
    'in_progress': '<span class="status-badge status-in-progress">قيد التنفيذ</span>',
    'completed': '<span class="status-badge status-done">منجزة</span>'
  };
  return badges[status] || `<span class="status-badge">${status}</span>`;
}

function getPriorityBadge(priority) {
  const badges = {
    'low': '<span style="background: #e0e7ff; color: #4338ca; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem;">منخفضة</span>',
    'medium': '<span style="background: #fef3c7; color: #92400e; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem;">متوسطة</span>',
    'high': '<span style="background: #fee2e2; color: #991b1b; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem;">عالية</span>'
  };
  return badges[priority] || '';
}

function formatDate(dateString) {
  if (!dateString) return 'غير محدد';
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA');
}

// إظهار/إخفاء نموذج الملاحظات
function toggleNotesForm(taskId) {
  const notesForm = document.getElementById(`notes-form-${taskId}`);
  if (notesForm) {
    notesForm.classList.toggle('show');
  }
}

// حفظ ملاحظات اليوزر
async function saveNotes(taskId) {
  const notesInput = document.getElementById(`notes-input-${taskId}`);
  const userNotes = notesInput.value.trim();

  try {
    await taskAPI.updateUserNotes(taskId, userNotes);

    // تحديث البيانات المحلية
    const task = myTasks.find(t => t.id === taskId);
    if (task) {
      task.user_notes = userNotes;
    }

    alert('تم حفظ الملاحظات بنجاح!');
    toggleNotesForm(taskId);
    renderTasks();

  } catch (error) {
    console.error('خطأ في حفظ الملاحظات:', error);
    alert('حدث خطأ في حفظ الملاحظات');
  }
}
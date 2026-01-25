
// التحقق من تسجيل الدخول والصلاحيات
document.addEventListener('DOMContentLoaded', async () => {
  // التحقق من تسجيل الدخول
  if (!authAPI.isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  const user = authAPI.getCurrentUser();

  // التحقق من صلاحيات الأدمن
  if (user.role !== 'admin') {
    alert('ليس لديك صلاحية للوصول لهذه الصفحة');
    window.location.href = 'dashboard.html';
    return;
  }

  // تحميل البيانات
  await loadDashboardData();
});

// متغيرات عامة
let allTasks = [];
let allUsers = [];
// متغيرات الفلترة والترقيم
let filteredTasks = [];
let currentPage = 1;
const tasksPerPage = 10;

// تحميل بيانات Dashboard
async function loadDashboardData() {
  try {
    // جلب جميع المهام
    const tasksResponse = await taskAPI.getAll();
    allTasks = tasksResponse.tasks || [];

    // جلب جميع المستخدمين
    const usersResponse = await adminAPI.getAllUsers();
    allUsers = usersResponse.users || [];

    // تحديث الإحصائيات
    updateOverview();

    // تحديث جدول المهام اليوم
    renderTodayTasks();

    // تحميل جدول المستخدمين
    loadUsersTable();

    // تحميل جدول المهام
    renderTasks();

  } catch (error) {
    console.error('خطأ في تحميل البيانات:', error);
    alert('حدث خطأ في تحميل البيانات');
  }
}

// تحديث إحصائيات النظرة العامة
function updateOverview() {
  const total = allTasks.length;
  const completed = allTasks.filter(t => t.status === 'completed').length;
  const inProgress = allTasks.filter(t => t.status === 'in_progress').length;
  // حساب المهام المتأخرة

  const overdueTasks = allTasks.filter(t => {
    if (t.status === 'completed') return false;

    const dueDate = moment(t.due_date);
    const today = moment().startOf('day');

    return dueDate.isBefore(today);
  }).length;

  document.getElementById('totalTasks').textContent = total;
  document.getElementById('completedTasks').textContent = completed;
  document.getElementById('inProgressTasks').textContent = inProgress;
  document.getElementById('overdueTasks').textContent = overdueTasks;
}

function getUserNameById(userId) {
  const user = allUsers.find(u => u.id === userId);
  return user ? user.name : 'غير معروف';
}

// رسم المهام التي تنتهي اليوم
function renderTodayTasks() {
  const today = moment().format('YYYY-MM-DD');
  const todayTasks = allTasks.filter(task =>
    task.due_date &&
    moment(task.due_date).format('YYYY-MM-DD') === today
  );

  const countElement = document.getElementById('todayTasksCount');
  const container = document.getElementById('todayTasksContainer');

  countElement.textContent = `${todayTasks.length} ${todayTasks.length === 1 ? 'مهمة' : 'مهام'}`;

  if (todayTasks.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #9ca3af; padding: 2rem; border-top: 1px solid #e5e7eb;">لا توجد مهام تنتهي اليوم 🎉</p>';
  } else {
    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>اسم المهمة</th>
            <th>الموظف</th>
            <th>الحالة</th>
            <th>الموعد النهائي</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          ${todayTasks.map(task => {
      const name = getUserNameById(task.user_id);
      return `
            <tr style="background: ${task.status === 'completed' ? '#f0fdf4' : '#fef3c7'};">
              <td>
                <h4>${task.title}</h4>
                ${task.description ? `<p style="color: #6b7280; font-size: 0.875rem;">${task.description}</p>` : ''}
              </td>
              <td>${name || task.username || 'غير معروف'}</td>
              <td>${getStatusBadge(task.status)}</td>
              <td>${formatDate(task.due_date)}</td>
              <td>
                <div class="action-buttons">
                  <button class="icon-btn edit" onclick="viewTask(${task.id})" title="عرض">
                    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                  </button>
                  <button class="icon-btn delete" onclick="deleteTask(${task.id})" title="حذف">
                    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          `}).join('')}
        </tbody>
      </table>
    `;
  }
}

// تحميل جدول المستخدمين
async function loadUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  tbody.innerHTML = '';

  for (const user of allUsers) {
    if (user.role === 'admin') continue;

    const row = document.createElement('tr');
    row.style.cursor = 'pointer';
    row.onclick = () => openUserDetailsModal(user);

    // ✅ استخدم الاسم إذا موجود
    const displayName = user.name || user.username;
    const avatar = displayName.charAt(0).toUpperCase();

    row.innerHTML = `
      <td>
        <div class="user-info">
          <div class="user-avatar">${avatar}</div>
          <div class="user-details">
            <h4>${displayName}</h4>
            <p>${getRoleText(user.role)}</p>
          </div>
        </div>
      </td>
      <td id="user-tasks-${user.id}">جاري التحميل...</td>
    `;
 
    tbody.appendChild(row);

    // جلب عدد المهام غير المكتملة فقط
    try {
      const response = await taskAPI.getByUserId(user.id);
      const tasks = response.tasks || [];
      const incompleteTasks = tasks.filter(t => t.status !== 'completed');
      document.getElementById(`user-tasks-${user.id}`).textContent = `${incompleteTasks.length} مهام`;
    } catch (error) {
      document.getElementById(`user-tasks-${user.id}`).textContent = '0 مهام';
    }
  }
}
// رسم جدول المهام
function renderTasks() {
  const tbody = document.getElementById('tasksTableBody');
  const selectedUser = document.getElementById('userFilter')?.value;
  filteredTasks = [...allTasks];
  renderTasksTable();

  tbody.innerHTML = '';

  if (filteredTasks.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #6b7280;">لا توجد مهام</td></tr>';
    return;
  }

  filteredTasks.forEach(task => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <h4>${task.title}</h4>
        ${task.description ? `<p style="color: #6b7280; font-size: 0.875rem;">${task.description}</p>` : ''}
      </td>
      <td>${getUserNameById(task.user_id) || task.username || 'غير معروف'}</td>
      <td>${getStatusBadge(task.status)}</td>
      <td>${formatDate(task.due_date)}</td>
      <td>
        <div class="action-buttons">
          <button class="icon-btn edit" onclick="viewTask(${task.id})" title="عرض">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
          </button>
          <button class="icon-btn delete" onclick="deleteTask(${task.id})" title="حذف">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });

  const countText = selectedUser ?
    `عرض مهام الموظف (${filteredTasks.length})` :
    `عرض جميع المهام (${filteredTasks.length})`;

  if (document.getElementById('filteredTasksCount')) {
    document.getElementById('filteredTasksCount').textContent = countText;
  }
}
// فتح modal تفاصيل المستخدم
async function openUserDetailsModal(user) {
  const displayName = user.name || user.username;

  document.getElementById('userModalTitle').textContent = `تفاصيل: ${user.name}`;
  document.getElementById('userModalName').textContent = user.name;
  document.getElementById('userModalTitle').textContent = `تفاصيل: ${user.name}`;
  document.getElementById('userModalName').textContent = user.name;
  document.getElementById('userModalRole').textContent = getRoleText(user.role);
  document.getElementById('userModalAvatar').textContent = user.name.charAt(0).toUpperCase();

  try {
    const response = await taskAPI.getByUserId(user.id);
    let tasks = response.tasks || [];

    // ✅ عرض المهام غير المكتملة فقط
    tasks = tasks.filter(t => t.status !== 'completed');

    document.getElementById('userTasksCount').textContent = `${tasks.length} مهام`;

    const tasksList = document.getElementById('userTasksList');
    tasksList.innerHTML = '';

    if (tasks.length === 0) {
      tasksList.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 1rem;">لا توجد مهام غير مكتملة</p>';
    } else {
      tasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'user-task-card';
        taskCard.id = `task-card-${task.id}`;

        const completedSubtasks = task.subtasks ? task.subtasks.filter(st => st.status === 'completed').length : 0;
        const totalSubtasks = task.subtasks ? task.subtasks.length : 0;

        taskCard.innerHTML = `
          <div class="user-task-header">
            <div style="display: flex; align-items: start; gap: 0.75rem; flex: 1;">
              <input 
                type="checkbox" 
                class="task-checkbox" 
                ${task.status === 'completed' ? 'checked' : ''}
                onchange="toggleTaskStatusInModal(${task.id}, this.checked)"
                style="margin-top: 0.25rem; cursor: pointer; width: 1.125rem; height: 1.125rem;"
              >
              <div style="flex: 1;">
                <div class="user-task-title ${task.status === 'completed' ? 'completed-task' : ''}" id="task-title-${task.id}">${task.title}</div>
              </div>
            </div>
            ${getStatusBadge(task.status)}
          </div>
          
          <div class="user-task-meta" style="margin-right: 2.25rem;">
            <span style="display: flex; align-items: center; gap: 0.25rem;">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 1rem; height: 1rem;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              ${formatDate(task.due_date)}
            </span>
          </div>

          ${task.description ? `<p style="font-size: 0.8125rem; color: #6b7280; margin-bottom: 0.5rem; margin-right: 2.25rem;">${task.description}</p>` : ''}

          ${task.manager_notes ? `
            <div style="background: #fef3c7; padding: 0.75rem; border-radius: 0.375rem; margin: 0.5rem 0 0.5rem 2.25rem; border-right: 3px solid #f59e0b;">
              <strong style="color: #78350f; font-size: 0.75rem;">💼 ملاحظات المدير:</strong>
              <p style="color: #92400e; font-size: 0.8125rem; margin-top: 0.25rem;">${task.manager_notes}</p>
            </div>
          ` : ''}

          ${task.user_notes ? `
            <div style="background: #e0f2fe; padding: 0.75rem; border-radius: 0.375rem; margin: 0.5rem 0 0.5rem 2.25rem; border-right: 3px solid #0284c7;">
              <strong style="color: #075985; font-size: 0.75rem;">💬 ملاحظات الموظف:</strong>
              <p style="color: #0369a1; font-size: 0.8125rem; margin-top: 0.25rem;">${task.user_notes}</p>
            </div>
          ` : ''}

          ${totalSubtasks > 0 ? `
            <div class="user-subtasks" style="margin-right: 2.25rem; margin-top: 0.75rem;">
              <div class="user-subtasks-title" id="subtasks-count-${task.id}">المهام الفرعية (${completedSubtasks}/${totalSubtasks})</div>
              <div id="subtasks-list-${task.id}">
                ${task.subtasks.map(subtask => `
                  <div class="user-subtask-item ${subtask.status === 'completed' ? 'completed' : ''}" id="subtask-${task.id}-${subtask.id}">
                    <input 
                      type="checkbox" 
                      class="subtask-checkbox" 
                      ${subtask.status === 'completed' ? 'checked' : ''}
                      onchange="toggleSubtaskInModal(${task.id}, ${subtask.id}, this.checked)"
                      style="cursor: pointer;"
                    >
                    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 1rem; height: 1rem; flex-shrink: 0;">
                      ${subtask.status === 'completed'
            ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
            : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
          }
                    </svg>
                    <span>${subtask.title}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        `;

        tasksList.appendChild(taskCard);
      });
    }

    document.getElementById('userDetailsModal').style.display = 'flex';

  } catch (error) {
    console.error('خطأ في جلب مهام الموظف:', error);
    alert('حدث خطأ في تحميل مهام الموظف');
  }
}
// إغلاق modal
function closeUserDetailsModal() {
  document.getElementById('userDetailsModal').style.display = 'none';
}

// تبديل حالة المهمة في modal المستخدم
async function toggleTaskStatusInModal(taskId, isCompleted) {
  const checkbox = document.querySelector(`#task-card-${taskId} .task-checkbox`);

  try {
    const newStatus = isCompleted ? 'completed' : 'in_progress';
    const response = await taskAPI.updateStatus(taskId, newStatus);

    if (response.success && isCompleted) {
      // ✅ إخفاء المهمة عند إكمالها
      const taskCard = document.getElementById(`task-card-${taskId}`);
      if (taskCard) {
        taskCard.style.transition = 'opacity 0.3s';
        taskCard.style.opacity = '0';
        setTimeout(() => {
          taskCard.remove();
          // تحديث العداد
          const tasksList = document.getElementById('userTasksList');
          const remainingTasks = tasksList.querySelectorAll('.user-task-card').length;
          document.getElementById('userTasksCount').textContent = `${remainingTasks} مهام`;

          if (remainingTasks === 0) {
            tasksList.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 1rem;">لا توجد مهام غير مكتملة</p>';
          }
        }, 300);
      }
    } else if (response.success) {
      // تحديث العنصر
      const titleElement = document.getElementById(`task-title-${taskId}`);
      const cardElement = document.getElementById(`task-card-${taskId}`);

      if (titleElement) {
        titleElement.classList.remove('completed-task');
      }

      const statusBadge = cardElement?.querySelector('.status-badge, [class*="badge"]');
      if (statusBadge) {
        statusBadge.outerHTML = getStatusBadge(newStatus);
      }
    }

    await loadDashboardData();

  } catch (error) {
    console.error('خطأ في تحديث حالة المهمة:', error);
    alert('حدث خطأ في تحديث حالة المهمة');

    if (checkbox) {
      checkbox.checked = !isCompleted;
    }
  }
}
// تبديل حالة المهمة الفرعية في modal
async function toggleSubtaskInModal(taskId, subtaskId, isCompleted) {
  const checkbox = document.querySelector(`#subtask-${taskId}-${subtaskId} .subtask-checkbox`);

  try {
    const newStatus = isCompleted ? 'completed' : 'pending';
    await taskAPI.updateSubtaskStatus(taskId, subtaskId, newStatus);

    // تحديث العنصر مباشرة
    const subtaskElement = document.getElementById(`subtask-${taskId}-${subtaskId}`);
    const countElement = document.getElementById(`subtasks-count-${taskId}`);

    if (subtaskElement) {
      if (isCompleted) {
        subtaskElement.classList.add('completed');
      } else {
        subtaskElement.classList.remove('completed');
      }

      // تحديث أيقونة SVG
      const svg = subtaskElement.querySelector('svg path');
      if (svg) {
        if (isCompleted) {
          svg.setAttribute('d', 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z');
        } else {
          svg.setAttribute('d', 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z');
        }
      }
    }

    // جلب البيانات المحدثة للمهمة
    const response = await taskAPI.getById(taskId);
    const task = response.task;

    // تحديث العداد
    if (countElement) {
      const completedCount = task.subtasks.filter(st => st.status === 'completed').length;
      const totalSubtasks = task.subtasks.length;
      countElement.textContent = `المهام الفرعية (${completedCount}/${totalSubtasks})`;

      // ✨ الجزء الجديد: تحديث حالة المهمة الأساسية تلقائياً
      const allCompleted = completedCount === totalSubtasks && totalSubtasks > 0;
      const taskCheckbox = document.querySelector(`#task-card-${taskId} .task-checkbox`);
      const titleElement = document.getElementById(`task-title-${taskId}`);
      const cardElement = document.getElementById(`task-card-${taskId}`);

      if (allCompleted && task.status !== 'completed') {
        // جميع المهام الفرعية مكتملة - أكمل المهمة الأساسية
        await taskAPI.updateStatus(taskId, 'completed');

        if (taskCheckbox) taskCheckbox.checked = true;
        if (titleElement) titleElement.classList.add('completed-task');

        // تحديث الـ badge
        const statusBadge = cardElement?.querySelector('.status-badge, [class*="badge"]');
        if (statusBadge) {
          statusBadge.outerHTML = getStatusBadge('completed');
        }

      } else if (!allCompleted && task.status === 'completed') {
        // ليست كل المهام الفرعية مكتملة - غيّر المهمة لـ in_progress
        await taskAPI.updateStatus(taskId, 'in_progress');

        if (taskCheckbox) taskCheckbox.checked = false;
        if (titleElement) titleElement.classList.remove('completed-task');

        // تحديث الـ badge
        const statusBadge = cardElement?.querySelector('.status-badge, [class*="badge"]');
        if (statusBadge) {
          statusBadge.outerHTML = getStatusBadge('in_progress');
        }
      }

      // إعادة تحميل الإحصائيات
      await loadDashboardData();
    }

  } catch (error) {
    console.error('خطأ في تحديث المهمة الفرعية:', error);
    alert('حدث خطأ في تحديث المهمة الفرعية');

    // إعادة حالة الـ checkbox
    if (checkbox) {
      checkbox.checked = !isCompleted;
    }
  }
}

// عرض تفاصيل مهمة في modal
async function viewTask(taskId) {
  try {
    const response = await taskAPI.getById(taskId);
    const task = response.task;

    const content = document.getElementById('taskDetailsContent');
    content.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <h4 style="font-size: 1.25rem; font-weight: 600; color: #1f2937; margin-bottom: 1rem;">${task.title}</h4>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div>
            <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.25rem;">الموظف</p>
            <p style="font-weight: 500;">${getUserNameById(task.user_id) || task.username || 'غير معروف'}</p>
          </div>
          <div>
            <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.25rem;">الحالة</p>
            ${getStatusBadge(task.status)}
          </div>
          <div>
            <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.25rem;">الأولوية</p>
            <p style="font-weight: 500;">${getPriorityText(task.priority)}</p>
          </div>
          <div>
            <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.25rem;">الموعد النهائي</p>
            <p style="font-weight: 500;">${formatDate(task.due_date)}</p>
          </div>
        </div>

        ${task.description ? `
          <div style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
            <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.5rem; font-weight: 600;">الوصف:</p>
            <p style="color: #374151;">${task.description}</p>
          </div>
        ` : ''}

        ${task.manager_notes ? `
          <div style="background: #fef3c7; padding: 1rem; border-radius: 0.5rem; border-right: 3px solid #f59e0b; margin-bottom: 1rem;">
            <p style="color: #78350f; font-size: 0.875rem; margin-bottom: 0.5rem; font-weight: 600;">💼 ملاحظات المدير:</p>
            <p style="color: #92400e;">${task.manager_notes}</p>
          </div>
        ` : ''}

        ${task.user_notes ? `
          <div style="background: #e0f2fe; padding: 1rem; border-radius: 0.5rem; border-right: 3px solid #0284c7; margin-bottom: 1rem;">
            <p style="color: #075985; font-size: 0.875rem; margin-bottom: 0.5rem; font-weight: 600;">💬 ملاحظات الموظف:</p>
            <p style="color: #0369a1;">${task.user_notes}</p>
          </div>
        ` : ''}

        ${task.subtasks && task.subtasks.length > 0 ? `
          <div style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem;">
            <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.75rem; font-weight: 600;">📑 المهام الفرعية:</p>
            ${task.subtasks.map(st => `
              <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: white; border-radius: 0.375rem; margin-bottom: 0.5rem;">
                <span style="font-size: 1.25rem;">${st.status === 'completed' ? '✅' : '⭕'}</span>
                <span style="color: #374151; ${st.status === 'completed' ? 'text-decoration: line-through; color: #9ca3af;' : ''}">${st.title}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    document.getElementById('taskDetailsModal').style.display = 'flex';

  } catch (error) {
    console.error('خطأ في جلب تفاصيل المهمة:', error);
    alert('حدث خطأ في تحميل تفاصيل المهمة');
  }
}

// إغلاق modal التفاصيل
function closeTaskDetailsModal() {
  document.getElementById('taskDetailsModal').style.display = 'none';
}
// حذف مهمة
async function deleteTask(taskId) {
  if (!confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
    return;
  }

  try {
    await taskAPI.delete(taskId);
    alert('تم حذف المهمة بنجاح');
    await loadDashboardData();

  } catch (error) {
    console.error('خطأ في حذف المهمة:', error);
    alert('حدث خطأ في حذف المهمة');
  }
}

// دوال مساعدة
function getRoleText(role) {
  const roles = {
    'admin': 'مدير النظام',
    'manager': 'مدير',
    'user': 'موظف'
  };
  return roles[role] || role;
}

function getStatusText(status) {
  const statuses = {
    'pending': 'قيد الانتظار',
    'in_progress': 'قيد التنفيذ',
    'completed': 'مكتملة'
  };
  return statuses[status] || status;
}

function getPriorityText(priority) {
  const priorities = {
    'low': 'منخفضة',
    'medium': 'متوسطة',
    'high': 'عالية'
  };
  return priorities[priority] || priority;
}

function getStatusBadge(status) {
  const badges = {
    'pending': '<span class="status-badge status-not-started">قيد الانتظار</span>',
    'in_progress': '<span class="status-badge status-in-progress">قيد التنفيذ</span>',
    'completed': '<span class="status-badge status-done">مكتملة</span>'
  };
  return badges[status] || `<span class="status-badge">${status}</span>`;
}

function formatDate(dateString) {
  if (!dateString) return 'غير محدد';
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA');
}

// التنقل بين الأقسام
function showSection(section) {
  document.getElementById('overviewSection').style.display = 'none';
  document.getElementById('usersSection').style.display = 'none';
  document.getElementById('tasksSection').style.display = 'none';

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.remove('active');
  });

  if (section === 'overview') {
    document.getElementById('overviewSection').style.display = 'block';
  } else if (section === 'users') {
    document.getElementById('usersSection').style.display = 'block';
  } else if (section === 'tasks') {
    document.getElementById('tasksSection').style.display = 'block';
  }

  if (event && event.target) {
    event.target.closest('.nav-item').classList.add('active');
  }
}


// Toggle Sidebar
function toggleSidebar(event) {
  event.stopPropagation();
  const sidebar = document.getElementById('sidebar');
  const body = document.body;
  
  sidebar.classList.toggle('show');
  sidebar.classList.toggle('hidden');
  body.classList.toggle('sidebar-open');
}

function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const body = document.body;
  
  sidebar.classList.remove('show');
  sidebar.classList.add('hidden');
  body.classList.remove('sidebar-open');
}

// دالة للإغلاق تشتغل على الكمبيوتر والجوال
function handleClickOutside(event) {
  const sidebar = document.getElementById('sidebar');
  const menuBtn = document.querySelector('.menu-btn');

  // تأكد السايدبار مو مخفي
  if (sidebar.classList.contains('show')) {
    // إذا الضغط مو على السايدبار أو الزر
    if (!sidebar.contains(event.target) && !menuBtn.contains(event.target)) {
      closeSidebar();
    }
  }
}

// إضافة الأحداث للكمبيوتر والجوال
document.addEventListener('click', handleClickOutside);
document.addEventListener('touchstart', handleClickOutside);

// منع الإغلاق لما تضغط داخل السايدبار
const sidebar = document.getElementById('sidebar');
sidebar.addEventListener('click', function (event) {
  event.stopPropagation();
});
sidebar.addEventListener('touchstart', function (event) {
  event.stopPropagation();
});

// ملء select المستخدمين
function populateUserFilter() {
  const select = document.getElementById('userFilter');
  if (!select) return;

  // مسح الخيارات القديمة (عدا "جميع المستخدمين")
  select.innerHTML = '<option value="">جميع الموظفين</option>';

  // إضافة المستخدمين
  allUsers.forEach(user => {
    if (user.role === 'admin') return;
    const option = document.createElement('option');
    option.value = user.id;
    option.textContent = user.name || user.username;;
    select.appendChild(option);
  });
}

// استدعاءها بعد تحميل المستخدمين
async function loadDashboardData() {
  try {
    const tasksResponse = await taskAPI.getAll();
    allTasks = tasksResponse.tasks || [];

    const usersResponse = await adminAPI.getAllUsers();
    allUsers = usersResponse.users || [];

    updateOverview();
    renderTodayTasks();
    loadUsersTable();
    renderTasks();
    populateUserFilter();
    filterTasks();
    clearFilters();


  } catch (error) {
    console.error('خطأ في تحميل البيانات:', error);
    alert('حدث خطأ في تحميل البيانات');
  }
}

function normalizeDate(dateString) {
  if (!dateString) return null;

  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


// فلترة المهام
function filterTasks() {
  const userId = document.getElementById('userFilter')?.value;
  const dateFrom = document.getElementById('dateFrom')?.value;
  const dateTo = document.getElementById('dateTo')?.value;

  filteredTasks = allTasks.filter(task => {
    let matches = true;

    // فلتر المستخدم
    if (userId && task.user_id != userId) {
      matches = false;
    }
    if (dateFrom && task.due_date) {
      const taskDate = normalizeDate(task.due_date);
      if (taskDate < dateFrom) {
        matches = false;
      }
    }

    if (dateTo && task.due_date) {
      const taskDate = normalizeDate(task.due_date);
      if (taskDate > dateTo) {
        matches = false;
      }
    }

    return matches;
  });

  currentPage = 1;
  renderTasksTable();
}
// مسح الفلاتر
function clearFilters() {
  document.getElementById('userFilter').value = '';
  document.getElementById('dateFrom').value = '';
  document.getElementById('dateTo').value = '';
  filteredTasks = [...allTasks];
  currentPage = 1;
  renderTasksTable();
}

// رسم جدول المهام مع الترقيم
function renderTasksTable() {
  const tbody = document.getElementById('tasksTableBody');
  const tasks = filteredTasks.length > 0 ? filteredTasks : allTasks;

  // حساب الصفحات
  const totalPages = Math.ceil(tasks.length / tasksPerPage);
  const startIndex = (currentPage - 1) * tasksPerPage;
  const endIndex = startIndex + tasksPerPage;
  const tasksToShow = tasks.slice(startIndex, endIndex);

  // تحديث العداد
  document.getElementById('filteredTasksCount').textContent =
    `عرض ${tasksToShow.length} من ${tasks.length} مهمة`;

  tbody.innerHTML = '';

  if (tasksToShow.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">لا توجد مهام</td></tr>';
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  tasksToShow.forEach((task, index) => {
    const row = document.createElement('tr');
    const taskNumber = startIndex + index + 1;

    row.innerHTML = `
      <td style="font-weight: 600; color: #6b7280;">${taskNumber}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <h4 style="margin: 0;">${task.title}</h4>
          ${task.user_notes ? `
            <span title="يحتوي على ملاحظات من الموظف" style="background: #dbeafe; color: #1e40af; padding: 0.25rem 0.5rem; border-radius: 0.375rem; font-size: 0.75rem;">
              💬
            </span>
          ` : ''}
        </div>
        ${task.description ? `<p style="color: #6b7280; font-size: 0.875rem; margin: 0.25rem 0 0 0;">${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}</p>` : ''}
      </td>
      <td>${getUserNameById(task.user_id) || task.username || 'غير معروف'}</td>
      <td>${getStatusBadge(task.status)}</td>
      <td>${formatDate(task.due_date)}</td>
      <td>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn-icon btn-icon-blue" onclick="viewTaskDetails(${task.id})" title="عرض">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
          </button>
          <button class="btn-icon btn-icon-green" onclick="openEditTaskModal(${task.id})" title="تعديل">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
          <button class="btn-icon btn-icon-red" onclick="deleteTask(${task.id})" title="حذف">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(row);
  });

  // رسم الترقيم
  renderPagination(totalPages);
}

// رسم أزرار الترقيم
function renderPagination(totalPages) {
  const pagination = document.getElementById('pagination');

  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let html = '';

  // زر السابق
  html += `
    <button 
      class="btn btn-secondary" 
      onclick="changePage(${currentPage - 1})"
      ${currentPage === 1 ? 'disabled' : ''}
      style="padding: 0.5rem 1rem; ${currentPage === 1 ? 'opacity: 0.5; cursor: not-allowed;' : ''}"
    >السابق</button>
  `;

  // أرقام الصفحات
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      html += `
        <button 
          class="btn ${i === currentPage ? 'btn-primary' : 'btn-secondary'}" 
          onclick="changePage(${i})"
          style="padding: 0.5rem 1rem; min-width: 40px;"
        >${i}</button>
      `;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += '<span style="padding: 0.5rem;">...</span>';
    }
  }

  // زر التالي
  html += `
    <button 
      class="btn btn-secondary" 
      onclick="changePage(${currentPage + 1})"
      ${currentPage === totalPages ? 'disabled' : ''}
      style="padding: 0.5rem 1rem; ${currentPage === totalPages ? 'opacity: 0.5; cursor: not-allowed;' : ''}"
    >التالي</button>
  `;

  pagination.innerHTML = html;
}

// تغيير الصفحة
function changePage(page) {
  const tasks = filteredTasks.length > 0 ? filteredTasks : allTasks;
  const totalPages = Math.ceil(tasks.length / tasksPerPage);

  if (page < 1 || page > totalPages) return;

  currentPage = page;
  renderTasksTable();

  // Scroll to top
  document.getElementById('tasksSection').scrollIntoView({ behavior: 'smooth' });
}

// عرض تفاصيل المهمة (استخدم modal viewTask الموجود)
function viewTaskDetails(taskId) {
  viewTask(taskId);
}

// فتح modal التعديل
async function openEditTaskModal(taskId) {
  try {
    const response = await taskAPI.getById(taskId);
    const task = response.task;
    
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description || '';
    document.getElementById('editTaskStatus').value = task.status;
    document.getElementById('editTaskPriority').value = task.priority;
    // ✅ استخراج التاريخ مباشرة من الـ string
if (task.due_date) {
  const formattedDate = task.due_date.split('T')[0]; // 2026-01-14
  document.getElementById('editTaskDueDate').value = formattedDate;
} else {
  document.getElementById('editTaskDueDate').value = '';
}
    document.getElementById('editTaskManagerNotes').value = task.manager_notes || '';

    // ملء select المستخدمين
    const userSelect = document.getElementById('editTaskUser');
    userSelect.innerHTML = '<option value="">اختر الموظف</option>';
    allUsers.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = user.name || user.username;
      option.selected = user.id === task.user_id;
      userSelect.appendChild(option);
    });

    document.getElementById('editTaskModal').style.display = 'flex';

  } catch (error) {
    console.error('خطأ في تحميل بيانات المهمة:', error);
    alert('حدث خطأ في تحميل بيانات المهمة');
  }
}

// إغلاق modal التعديل
function closeEditTaskModal() {
  document.getElementById('editTaskModal').style.display = 'none';
}

// حفظ التعديلات
async function saveEditedTask() {
  const taskId = document.getElementById('editTaskId').value;
  const title = document.getElementById('editTaskTitle').value.trim();
  const description = document.getElementById('editTaskDescription').value.trim();
  const status = document.getElementById('editTaskStatus').value;
  const priority = document.getElementById('editTaskPriority').value;
  const due_date = document.getElementById('editTaskDueDate').value;
  const user_id = document.getElementById('editTaskUser').value;
  const manager_notes = document.getElementById('editTaskManagerNotes').value.trim();

  if (!title || !user_id) {
    alert('يرجى ملء الحقول المطلوبة');
    return;
  }

  const updateData = {
    title,
    description: description.length > 0 ? description : null,
    status,
    priority,
    user_id: parseInt(user_id),
    due_date,
    manager_notes: manager_notes.length > 0 ? manager_notes : null
  };

  console.log('📤 Data being sent:', updateData); // ✅ شوف ايش يطلع هنا

  try {
    const response = await taskAPI.update(taskId, updateData);
    console.log('📥 Response from server:', response); // ✅ وشوف الرد

    alert('تم تحديث المهمة بنجاح!');
    closeEditTaskModal();
    await loadDashboardData();

  } catch (error) {
    console.error('❌ خطأ في تحديث المهمة:', error);
    alert('حدث خطأ في تحديث المهمة');
  }
}

// تسجيل الخروج
async function logout() {
  if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
    try {
      await authAPI.logout();
      // توجيه صريح بعد تسجيل الخروج
      window.location.href = '/index.html';
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
      alert('حدث خطأ أثناء تسجيل الخروج');
    }
  }
}
// التحقق من تسجيل الدخول
document.addEventListener('DOMContentLoaded', async () => {
  if (!authAPI.isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  const user = authAPI.getCurrentUser();
  //console.log(user);
  // عرض اسم المستخدم
  document.querySelector('.top-bar-left h1').textContent = `مرحباً، ${authAPI.getUserName()}`;
  //document.querySelector('.top-bar-left h1').textContent = `مرحباً، ${user.name || user.username}`;
  // تحميل المهام
  await loadMyTasks(false);
  startAutoRefresh();
});
// إيقاف التحديث عند الخروج
window.addEventListener('beforeunload', () => {
  stopAutoRefresh();
});

// متغيرات عامة
let myTasks = [];
let autoRefreshInterval;
let lastTaskCount = 0;

// تحميل مهام المستخدم
async function loadMyTasks(isAutoRefresh = false) {
  try {
    const response = await taskAPI.getMyTasks();
    const newTasks = response.tasks || [];

    if (isAutoRefresh) {
      // فحص إذا في مهام جديدة
      if (newTasks.length > myTasks.length) {
        const existingTaskIds = myTasks.map(t => t.id);
        const newlyAddedTasks = newTasks.filter(t => !existingTaskIds.includes(t.id));
        
        myTasks = [...myTasks, ...newlyAddedTasks];
        renderNewTasks(newlyAddedTasks);
        updateOverview();
        
        if (newlyAddedTasks.length > 0) {
          showNotification(`تم إضافة ${newlyAddedTasks.length} مهمة جديدة`);
        }
      } else if (newTasks.length < myTasks.length) {
        // لو في مهام محذوفة، نحدث كل شيء
        myTasks = newTasks;
        updateOverview();
        renderTasks();
      } else {
        // ✨ فحص التحديثات على المهام الموجودة
        checkForTaskUpdates(newTasks);
      }
    } else {
      // التحميل الأول
      myTasks = newTasks;
      updateOverview();
      renderTasks();
    }
    
    lastTaskCount = myTasks.length;

  } catch (error) {
    console.error('خطأ في تحميل المهام:', error);
    if (!isAutoRefresh) {
      alert('حدث خطأ في تحميل المهام');
    }
  }
}

function checkForTaskUpdates(newTasks) {
  let hasUpdates = false;
  
  newTasks.forEach(newTask => {
    const oldTask = myTasks.find(t => t.id === newTask.id);
    
    if (oldTask) {
      // فحص تحديثات المهام الفرعية
      if (hasSubtaskChanges(oldTask, newTask)) {
        updateTaskSubtasks(newTask.id, newTask.subtasks);
        hasUpdates = true;
      }
      
      // فحص تحديثات حالة المهمة الرئيسية
      if (oldTask.status !== newTask.status) {
        updateTaskStatus(newTask.id, newTask.status);
        hasUpdates = true;
      }
      
      // فحص تحديثات ملاحظات المدير
      if (oldTask.manager_notes !== newTask.manager_notes) {
        updateManagerNotes(newTask.id, newTask.manager_notes);
        hasUpdates = true;
      }
      
      // تحديث البيانات المحلية
      Object.assign(oldTask, newTask);
    }
  });
  
  if (hasUpdates) {
    updateOverview();
    showNotification('تم تحديث بعض المهام');
  }
}

// ✨ فحص إذا في تغييرات في المهام الفرعية
function hasSubtaskChanges(oldTask, newTask) {
  const oldSubtasks = oldTask.subtasks || [];
  const newSubtasks = newTask.subtasks || [];
  
  if (oldSubtasks.length !== newSubtasks.length) return true;
  
  for (let i = 0; i < newSubtasks.length; i++) {
    const oldSub = oldSubtasks.find(s => s.id === newSubtasks[i].id);
    if (!oldSub || oldSub.status !== newSubtasks[i].status) {
      return true;
    }
  }
  
  return false;
}

// ✨ تحديث المهام الفرعية في الواجهة
function updateTaskSubtasks(taskId, newSubtasks) {
  const subtasksContainer = document.getElementById(`subtasks-${taskId}`);
  if (!subtasksContainer) return;
  
  const completedSubtasks = newSubtasks.filter(st => st.status === 'completed').length;
  const totalSubtasks = newSubtasks.length;
  
  // تحديث عداد المهام الفرعية في الزر
  const toggleButton = subtasksContainer.previousElementSibling;
  if (toggleButton && toggleButton.classList.contains('subtasks-toggle')) {
    const buttonText = toggleButton.querySelector('svg').nextSibling;
    if (buttonText) {
      buttonText.textContent = ` المهام الفرعية (${completedSubtasks}/${totalSubtasks})`;
    }
  }
  
  // تحديث قائمة المهام الفرعية
  subtasksContainer.innerHTML = newSubtasks.map(subtask => `
    <div class="subtask-item" style="padding: 8px 0;">
      <span style="display: inline-block; width: 20px; height: 20px; border-radius: 4px; background: ${subtask.status === 'completed' ? '#10b981' : '#e5e7eb'}; margin-left: 10px; position: relative; vertical-align: middle;">
        ${subtask.status === 'completed' ? '<svg style="width: 14px; height: 14px; position: absolute; top: 3px; left: 3px;" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>' : ''}
      </span>
      <span class="subtask-name ${subtask.status === 'completed' ? 'completed' : ''}">${subtask.title}</span>
    </div>
  `).join('');
  
  // إضافة تأثير بصري
  subtasksContainer.style.animation = 'pulse 0.5s ease-out';
  setTimeout(() => {
    subtasksContainer.style.animation = '';
  }, 500);
}

// ✨ تحديث حالة المهمة الرئيسية
function updateTaskStatus(taskId, newStatus) {
  const taskElement = document.getElementById(`task-${taskId}`);
  if (!taskElement) return;
  
  // تحديث الـ badge
  const statusBadge = taskElement.querySelector('.status-badge');
  if (statusBadge) {
    const badges = {
      'pending': { text: 'لم تبدأ', class: 'status-not-started' },
      'in_progress': { text: 'قيد التنفيذ', class: 'status-in-progress' },
      'completed': { text: 'منجزة', class: 'status-done' }
    };
    
    const badge = badges[newStatus];
    if (badge) {
      statusBadge.className = `status-badge ${badge.class}`;
      statusBadge.textContent = badge.text;
    }
  }
  
  // تحديث العنوان (خط في الوسط للمكتملة)
  const taskTitle = taskElement.querySelector('.task-title');
  if (taskTitle) {
    if (newStatus === 'completed') {
      taskTitle.classList.add('completed');
    } else {
      taskTitle.classList.remove('completed');
    }
  }
  
  // تأثير بصري
  taskElement.style.animation = 'pulse 0.5s ease-out';
  setTimeout(() => {
    taskElement.style.animation = '';
  }, 500);
}

// ✨ تحديث ملاحظات المدير
function updateManagerNotes(taskId, managerNotes) {
  const taskElement = document.getElementById(`task-${taskId}`);
  if (!taskElement) return;
  
  const taskDetails = taskElement.querySelector('.task-details');
  if (!taskDetails) return;
  
  // البحث عن div ملاحظات المدير الحالية
  let managerNotesDiv = taskDetails.querySelector('.task-notes[style*="fef3c7"]');
  
  if (managerNotes) {
    const notesHTML = `
      <div class="task-notes" style="background: #fef3c7; border-right: 3px solid #f59e0b;">
        <strong>ملاحظات المدير:</strong> ${managerNotes}
      </div>
    `;
    
    if (managerNotesDiv) {
      // تحديث الموجود
      managerNotesDiv.outerHTML = notesHTML;
    } else {
      // إضافة جديد بعد الوصف
      const descriptionDiv = taskDetails.querySelector('.task-notes:not([style*="fef3c7"]):not([style*="e0f2fe"])');
      if (descriptionDiv) {
        descriptionDiv.insertAdjacentHTML('afterend', notesHTML);
      } else {
        const taskMeta = taskDetails.querySelector('.task-meta');
        if (taskMeta) {
          taskMeta.insertAdjacentHTML('afterend', notesHTML);
        }
      }
    }
    
    // تأثير بصري
    managerNotesDiv = taskDetails.querySelector('.task-notes[style*="fef3c7"]');
    if (managerNotesDiv) {
      managerNotesDiv.style.animation = 'pulse 0.5s ease-out';
      setTimeout(() => {
        managerNotesDiv.style.animation = '';
      }, 500);
    }
  } else if (managerNotesDiv) {
    // إزالة ملاحظات المدير إذا تم حذفها
    managerNotesDiv.remove();
  }
}

function renderNewTasks(newTasks) {
  const tasksList = document.getElementById('tasksList');
  
  // إزالة رسالة "لا توجد مهام" إذا كانت موجودة
  const emptyMessage = tasksList.querySelector('p');
  if (emptyMessage) {
    emptyMessage.remove();
  }
  
  newTasks.forEach(task => {
    const completedSubtasks = task.subtasks ? task.subtasks.filter(st => st.status === 'completed').length : 0;
    const totalSubtasks = task.subtasks ? task.subtasks.length : 0;
    
    const taskHTML = `
      <div class="task-item new-task" id="task-${task.id}">
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
                  <div class="subtask-item" style="padding: 8px 0;">
                    <span style="display: inline-block; width: 20px; height: 20px; border-radius: 4px; background: ${subtask.status === 'completed' ? '#10b981' : '#e5e7eb'}; margin-left: 10px; position: relative; vertical-align: middle;">
                      ${subtask.status === 'completed' ? '<svg style="width: 14px; height: 14px; position: absolute; top: 3px; left: 3px;" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>' : ''}
                    </span>
                    <span class="subtask-name ${subtask.status === 'completed' ? 'completed' : ''}">${subtask.title}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
    // إضافة المهمة في بداية القائمة
    tasksList.insertAdjacentHTML('afterbegin', taskHTML);
  });
  
  // إضافة تأثير بصري للمهام الجديدة
  setTimeout(() => {
    document.querySelectorAll('.new-task').forEach(el => {
      el.classList.remove('new-task');
    });
  }, 3000);
}

// تحديث الإحصائيات
function updateOverview() {
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = myTasks.filter(t => {
    const taskDate = moment(t.due_date).startOf('day');
    return taskDate.isSame(today, 'day'); // مقارنة اليوم فقط
  }).length;
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
      <div class="task-item" id="task-${task.id}">
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
                  <div class="subtask-item" style="padding: 8px 0;">
                    <span style="display: inline-block; width: 20px; height: 20px; border-radius: 4px; background: ${subtask.status === 'completed' ? '#10b981' : '#e5e7eb'}; margin-left: 10px; position: relative; vertical-align: middle;">
                      ${subtask.status === 'completed' ? '<svg style="width: 14px; height: 14px; position: absolute; top: 3px; left: 3px;" fill="white" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>' : ''}
                    </span>
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

// بدء التحديث التلقائي
function startAutoRefresh() {
  autoRefreshInterval = setInterval(async () => {
    await loadMyTasks(true); // true = تحديث تلقائي
  }, 10000); // كل 10 ثواني
}

// إيقاف التحديث التلقائي
function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
}


// تسجيل الخروج
function logout() {
  if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
    authAPI.logout();
  }
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
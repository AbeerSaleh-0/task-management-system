let users = [];
let filteredUsers = [];

// تحميل البيانات عند فتح الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    // التحقق من تسجيل الدخول
    if (!authAPI.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    // التحقق من صلاحية Admin
    const currentUser = authAPI.getCurrentUser();
    if (currentUser.role !== 'admin') {
        alert('غير مصرح لك بالوصول لهذه الصفحة');
        window.location.href = 'dashboard.html';
        return;
    }

    await loadUsers();
});

// جلب المستخدمين من قاعدة البيانات
async function loadUsers() {
    try {
        const response = await adminAPI.getAllUsers();

        if (response.success) {
            users = response.users;
            filteredUsers = [...users];
            renderUsers();
            updateStats();
        }
    } catch (error) {
        console.error('خطأ في جلب الموظفين:', error);
        alert('حدث خطأ في تحميل البيانات');
        
        // إذا كان خطأ في التوثيق، إعادة التوجيه لصفحة تسجيل الدخول
        if (error.message.includes('token') || error.message.includes('auth')) {
            authAPI.logout();
        }
    }
}

// تحديث الإحصائيات
function updateStats() {
    const totalUsers = users.length;
    const totalAdmins = users.filter(u => u.role === 'admin').length;
    const totalRegularUsers = users.filter(u => u.role === 'user').length;

    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('totalAdmins').textContent = totalAdmins;
    document.getElementById('totalRegularUsers').textContent = totalRegularUsers;
}

// فلترة المستخدمين
function filterUsers() {
    const roleFilter = document.getElementById('roleFilter').value;
    filteredUsers = users.filter(user => {
        const matchRole = !roleFilter || user.role === roleFilter;
        return matchRole;
    });

    renderUsers();
}

// عرض المستخدمين في الجدول
function renderUsers() {
    const tbody = document.getElementById('usersTableBody');
    
    if (filteredUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #9ca3af;">لا توجد نتائج</td></tr>';
        return;
    }

    tbody.innerHTML = filteredUsers.map(user => {
        // تنسيق التاريخ
        const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'غير محدد';

        // الحرف الأول من الاسم أو اسم المستخدم
       const displayName = user.name || user.username;
        const avatar = displayName.charAt(0).toUpperCase();
        const phone = user.phone || 'غير محدد'; 

        return `
            <tr>
                <td>
                    <div class="user-info">
                        <div class="user-avatar">${avatar}</div>
                        <div class="user-details">
                            <h4>${displayName}</h4>
                            <p style="font-size: 0.75rem; color: #6b7280;">@${user.username}</p>
                        </div>
                    </div>
                </td>  
                <td><span class="role-badge role-${user.role}">${getRoleText(user.role)}</span></td>
                <td>${phone}</td>
                <td>${joinDate}</td>
                <td>
                    <div class="action-buttons">
                        <button class="icon-btn edit" onclick="editUser(${user.id})" title="تعديل">
                            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button class="icon-btn delete" onclick="deleteUser(${user.id})" title="حذف">
                            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// دالة مساعدة لترجمة الأدوار
function getRoleText(role) {
    const roles = {
        'admin': 'مشرف',
        'user': 'موظف',
        'manager': 'مدير'
    };
    return roles[role] || role;
}
// فتح نافذة إضافة مستخدم
function openAddUserModal() {
    document.getElementById('userModalTitle').textContent = 'إضافة موظف جديد';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    
    // عرض حقول كلمة المرور للإضافة
    document.getElementById('passwordFields').style.display = 'block';
    document.getElementById('changePasswordSection').style.display = 'none';
    document.getElementById('userPassword').required = true;
    document.getElementById('userPasswordConfirm').required = true;
    
    // تفعيل حقل اسم المستخدم
    document.getElementById('userUsername').disabled = false;
    
    document.getElementById('userModal').classList.add('show');
}
function closeUserModal() {
    document.getElementById('userModal').classList.remove('show');
}
// تعديل مستخدم
function editUser(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;

    document.getElementById('userModalTitle').textContent = 'تعديل الموظف';
    document.getElementById('userId').value = user.id;
    document.getElementById('userUsername').value = user.username;
    document.getElementById('userUsername').disabled = true; // تعطيل تعديل اسم المستخدم
    document.getElementById('userName').value = user.name || '';
    document.getElementById('userPhone').value = user.phone || '';
    document.getElementById('userRole').value = user.role;
    
    // إخفاء حقول الإضافة وعرض حقول التعديل
    document.getElementById('passwordFields').style.display = 'none';
    document.getElementById('changePasswordSection').style.display = 'block';
    
    // مسح حقول كلمة المرور
    document.getElementById('userNewPassword').value = '';
    document.getElementById('userNewPasswordConfirm').value = '';
    
    document.getElementById('userModal').classList.add('show');
}

// حفظ المستخدم
async function saveUser() {
    const userId = document.getElementById('userId').value;
    const username = document.getElementById('userUsername').value.trim();
    const name = document.getElementById('userName').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    const role = document.getElementById('userRole').value;

   /* if (phone && !/^(05|5)\d{8}$/.test(phone)) {
        alert('رقم الجوال غير صحيح. يجب أن يبدأ بـ 05 ويتكون من 10 أرقام');
        return;
    }*/
   if (phone && !/^(966\d{9}|20\d{10}|970\d{9})$/.test(phone)) {
    alert('رقم الجوال غير صحيح. يجب أن يبدأ بـ 966 أو 20 أو 970');
    return;
    }

    if (!username || !role) {
        alert('يرجى ملء الحقول المطلوبة (اسم المستخدم والصلاحية)');
        return;
    }

    // التحقق من صحة اسم المستخدم (بدون مسافات)
    if (username.includes(' ')) {
        alert('اسم المستخدم لا يجب أن يحتوي على مسافات');
        return;
    }

    try {
        if (!userId) {
            // ========== إضافة مستخدم جديد ==========
            const password = document.getElementById('userPassword').value;
            const passwordConfirm = document.getElementById('userPasswordConfirm').value;

            if (!password || password.length < 6) {
                alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
                return;
            }

            if (password !== passwordConfirm) {
                alert('كلمة المرور غير متطابقة');
                return;
            }

            const response = await adminAPI.createUser(username, password, role, phone);

            if (response.success) {
                // تحديث الاسم الكامل إذا تم إدخاله
                if (name) {
                    await adminAPI.updateUserName(response.userId, name);
                }
                
                alert('تم إضافة الموظف بنجاح!');
                await loadUsers();
                closeUserModal();
            }
        } else {
            // ========== تحديث مستخدم موجود ==========
            let updateSuccess = true;

            // تحديث الاسم الكامل
            if (name !== '') {
                const nameResponse = await adminAPI.updateUserName(userId, name);
                if (!nameResponse.success) updateSuccess = false;
            }
            // ✅ تحديث رقم الجوال
            if (phone !== '') {
                const phoneResponse = await adminAPI.updateUserPhone(userId, phone);
                if (!phoneResponse.success) updateSuccess = false;
            }
            // تحديث الدور
            const roleResponse = await adminAPI.updateUserRole(userId, role);
            if (!roleResponse.success) updateSuccess = false;

            // تحديث كلمة المرور إذا تم إدخالها
            const newPassword = document.getElementById('userNewPassword').value;
            const newPasswordConfirm = document.getElementById('userNewPasswordConfirm').value;

            if (newPassword || newPasswordConfirm) {
                // التحقق من تطابق كلمة المرور
                if (newPassword !== newPasswordConfirm) {
                    alert('كلمة المرور الجديدة غير متطابقة');
                    return;
                }

                // التحقق من طول كلمة المرور
                if (newPassword.length < 6) {
                    alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
                    return;
                }

                // تحديث كلمة المرور
                const passwordResponse = await adminAPI.updateUserPassword(userId, newPassword);
                if (!passwordResponse.success) {
                    updateSuccess = false;
                    alert('فشل في تحديث كلمة المرور');
                    return;
                }
            }

            if (updateSuccess) {
                alert('تم تحديث الموظف بنجاح!' + (newPassword ? ' (تم تغيير كلمة المرور)' : ''));
                await loadUsers();
                closeUserModal();
            }
        }
    } catch (error) {
        console.error('خطأ في حفظ الموظف:', error);
        alert(error.message || 'حدث خطأ في حفظ البيانات');
    }
}

// حذف مستخدم
async function deleteUser(id) {
    // التحقق من عدم حذف المستخدم الحالي لنفسه
    const currentUser = authAPI.getCurrentUser();
    if (currentUser.id === id) {
        alert('لا يمكنك حذف حسابك الخاص!');
        return;
    }

    if (!confirm('هل أنت متأكد من حذف هذا الموظف سيتم حذف جميع مهامه أيضاً.')) {
        return;
    }

    try {
        const response = await adminAPI.deleteUser(id);

        if (response.success) {
            alert('تم حذف الموظف بنجاح!');
            await loadUsers();
        }
    } catch (error) {
        console.error('خطأ في حذف الموظف:', error);
        alert(error.message || 'حدث خطأ في حذف الموظف');
    }
}

// دالة تبديل القائمة الجانبية
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
    }
}
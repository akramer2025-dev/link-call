// ========== لوحة تحكم المطور - Link Call ==========
console.log('🛠️ Admin Dashboard Loaded');

// التحقق من صلاحية الدخول
function checkAdminAccess() {
    const userRole = sessionStorage.getItem('userRole');
    const username = sessionStorage.getItem('username');
    
    // السماح بالدخول على localhost للتطوير
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // تعيين بيانات مطور افتراضية
        if (!userRole) sessionStorage.setItem('userRole', 'admin');
        if (!username) sessionStorage.setItem('username', 'akram');
        return true;
    }
    
    if (userRole !== 'admin' && username !== 'akram') {
        alert('⛔ غير مصرح لك بالدخول لهذه الصفحة');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// التحقق عند تحميل الصفحة
if (!checkAdminAccess()) {
    throw new Error('Unauthorized access');
}

// ========== المتغيرات العامة ==========
const API_BASE_URL = window.location.origin;
const baseUrl = API_BASE_URL;
// توكن المدير لنقاط API الحساسة (يطابق ADMIN_SECRET في Vercel ENV)
const adminToken = 'linkcall-super-admin-2024';

// تحميل رصيد الشركة
async function loadBalance() {
    const companyId = sessionStorage.getItem('companyId');
    if (!companyId) return;
    try {
        const r = await fetch(`${API_BASE_URL}/api/companies/balance?companyId=${companyId}`);
        const d = await r.json();
        if (d.success) {
            const el = document.getElementById('balance-amount');
            const min = document.getElementById('balance-minutes');
            const cost = document.getElementById('balance-cost');
            const rate = document.getElementById('balance-rate');
            if (el) {
                el.textContent = `$${Number(d.balance).toFixed(2)}`;
                el.style.color = d.balance < 5 ? '#dc2626' : d.balance < 15 ? '#d97706' : '#059669';
            }
            if (min)  min.textContent  = `${Number(d.totalMinutesUsed || 0).toFixed(1)} دق`;
            if (cost) cost.textContent = `$${Number(d.totalCostDeducted || 0).toFixed(3)}`;
            if (rate) rate.textContent = `$${d.costPerMinute || 0.014}`;
        }
    } catch (e) { console.error('جلب الرصيد فشل:', e); }
}

// تحميل بيانات الشركة في حقول الإعدادات
async function loadCompanyProfile() {
    const companyId = sessionStorage.getItem('companyId');
    if (!companyId) return;
    const nameEl  = document.getElementById('edit-company-name');
    const adminEl = document.getElementById('edit-admin-name');
    if (nameEl)  nameEl.value  = sessionStorage.getItem('companyName') || '';
    if (adminEl) adminEl.value = sessionStorage.getItem('fullname')    || '';
}

// حفظ بيانات الشركة
async function saveCompanyProfile() {
    const companyId   = sessionStorage.getItem('companyId');
    const companyName = document.getElementById('edit-company-name')?.value?.trim();
    const adminName   = document.getElementById('edit-admin-name')?.value?.trim();
    const msgEl       = document.getElementById('profile-save-msg');
    if (!companyId || !companyName) return;
    try {
        const r = await fetch(`${API_BASE_URL}/api/companies/${companyId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyName, adminName })
        });
        const d = await r.json();
        if (d.success) {
            sessionStorage.setItem('companyName', companyName);
            sessionStorage.setItem('fullname', adminName || companyName);
            // تحديث الاسم في الـ header
            const headerName = document.getElementById('user-fullname') || document.querySelector('.user-name');
            if (headerName) headerName.textContent = adminName || companyName;
            if (msgEl) { msgEl.textContent = '✅ تم الحفظ بنجاح'; msgEl.style.display = 'block'; setTimeout(() => msgEl.style.display = 'none', 3000); }
        } else {
            if (msgEl) { msgEl.textContent = '❌ ' + (d.error || 'فشل الحفظ'); msgEl.style.background = '#fee2e2'; msgEl.style.color = '#991b1b'; msgEl.style.display = 'block'; }
        }
    } catch (e) {
        if (msgEl) { msgEl.textContent = '❌ خطأ في الاتصال'; msgEl.style.display = 'block'; }
    }
}
let allCalls = [];
let allEmployees = [];
let allRecordings = [];
let currentPage = 1;
const itemsPerPage = 20;

// ========== تهيئة الصفحة ==========
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    setCurrentDate();
    loadDashboardData();
    loadAllCalls();
    loadEmployees();
    loadRecordings();
});

// ========== التنقل بين الأقسام ==========
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = item.dataset.section;
            
            // تحديث القائمة
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // تحديث الأقسام
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(`${targetSection}-section`).classList.add('active');
            
            // تحديث العنوان
            const titles = {
                'dashboard': 'لوحة التحكم',
                'companies': 'إدارة الشركات',
                'calls': 'جميع المكالمات',
                'employees': 'إدارة الموظفين',
                'analytics': 'التحليلات',
                'transcripts': 'تحويل الصوت إلى نص',
                'missed': 'المكالمات الفائتة',
                'settings': 'إعدادات النظام'
            };
            document.getElementById('page-title').textContent = titles[targetSection] || 'لوحة التحكم';
            
            // تحميل بيانات القسم
            if (targetSection === 'companies') {
                loadCompanies();
            } else if (targetSection === 'settings') {
                loadBalance();
                loadCompanyProfile();
            }
            
            // إغلاق القائمة الجانبية في الهاتف عند اختيار قسم
            closeMobileSidebar();
        });
    });
    
    // إغلاق الـ Modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
        });
    });
    
    // التحكم في القائمة الجانبية للهاتف
    initMobileSidebar();
}

// ========== القائمة الجانبية للهاتف ==========
function initMobileSidebar() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('show');
        });
    }
    
    if (overlay) {
        overlay.addEventListener('click', closeMobileSidebar);
    }
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
}

// ========== تحديث التاريخ ==========
function setCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString('ar-SA', options);
    document.getElementById('current-date').textContent = today;
}

// ========== تحميل بيانات لوحة التحكم ==========
async function loadDashboardData() {
    try {
        const response = await fetch(`${baseUrl}/admin/dashboard-stats`);
        if (response.ok) {
            const data = await response.json();
            updateDashboardStats(data);
        } else {
            // بيانات تجريبية
            updateDashboardStats({
                totalCalls: allCalls.length,
                answeredCalls: allCalls.filter(c => c.status === 'completed').length,
                missedCalls: allCalls.filter(c => c.status === 'no-answer' || c.status === 'missed').length,
                activeEmployees: allEmployees.filter(e => e.isOnline).length,
                totalDuration: calculateTotalDuration(allCalls),
                totalRecordings: allRecordings.length
            });
        }
        
        // تحميل المستخدمين الأونلاين
        loadOnlineUsers();
        // تحديث كل 10 ثواني
        setInterval(loadOnlineUsers, 10000);
    } catch (error) {
        console.error('خطأ في تحميل الإحصائيات:', error);
    }
}

// ========== تحميل المستخدمين الأونلاين ==========
async function loadOnlineUsers() {
    try {
        const response = await fetch(`${baseUrl}/online-users`);
        if (response.ok) {
            const data = await response.json();
            renderOnlineUsers(data);
        }
    } catch (error) {
        console.error('خطأ في تحميل المستخدمين الأونلاين:', error);
    }
}

function renderOnlineUsers(data) {
    const countEl = document.getElementById('online-count');
    const listEl = document.getElementById('online-users-list');
    const lastLoginEl = document.getElementById('last-login-info');
    
    // تحديث العدد
    if (countEl) {
        countEl.textContent = data.count || 0;
    }
    
    // عرض قائمة المستخدمين الأونلاين
    if (listEl) {
        if (data.users && data.users.length > 0) {
            listEl.innerHTML = data.users.map(user => `
                <div class="online-user-item">
                    <div class="online-avatar">👤</div>
                    <div class="online-user-info">
                        <div class="online-user-name">${user.name}</div>
                        <div class="online-user-time">دخل ${formatTimeAgo(user.loginTime)}</div>
                    </div>
                    <div class="online-duration">${user.onlineDuration} دقيقة</div>
                </div>
            `).join('');
        } else {
            listEl.innerHTML = '<div class="no-users">🔴 لا يوجد مستخدمين أونلاين حالياً</div>';
        }
    }
    
    // عرض آخر تسجيل دخول
    if (lastLoginEl) {
        if (data.lastLoggedIn) {
            const loginTime = new Date(data.lastLoggedIn.loginTime);
            lastLoginEl.innerHTML = `
                <div class="last-login-user">
                    <div class="last-login-avatar">👤</div>
                    <div class="last-login-details">
                        <div class="last-login-name">${data.lastLoggedIn.name}</div>
                        <div class="last-login-time">
                            <span>${loginTime.toLocaleDateString('ar-EG')}</span>
                            الساعة
                            <span>${loginTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            lastLoginEl.innerHTML = '<div class="no-login">لا توجد بيانات تسجيل دخول</div>';
        }
    }
    
    // تحديث عدد الموظفين النشطين في الإحصائيات
    const activeEmployeesEl = document.getElementById('active-employees');
    if (activeEmployeesEl) {
        activeEmployeesEl.textContent = data.count || 0;
    }
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
}

function updateDashboardStats(data) {
    document.getElementById('total-calls').textContent = data.totalCalls || 0;
    document.getElementById('answered-calls').textContent = data.answeredCalls || 0;
    document.getElementById('missed-calls').textContent = data.missedCalls || 0;
    document.getElementById('active-employees').textContent = data.activeEmployees || 0;
    document.getElementById('total-duration').textContent = formatDuration(data.totalDuration || 0);
    document.getElementById('total-recordings').textContent = data.totalRecordings || 0;
    
    // تحديث الرسوم البيانية
    renderWeeklyChart();
    renderDistributionChart();
}

// ========== تحميل جميع المكالمات ==========
async function loadAllCalls() {
    try {
        // أولاً، محاولة جلب من admin/all-calls
        let response = await fetch(`${baseUrl}/admin/all-calls`);
        
        if (response.ok) {
            const data = await response.json();
            allCalls = Array.isArray(data) ? data : [];
        } else {
            // محاولة جلب من recordings كبديل
            console.log('📋 جلب من /recordings بدلاً من admin/all-calls');
            response = await fetch(`${baseUrl}/recordings`);
            if (response.ok) {
                const data = await response.json();
                allCalls = data.recordings || [];
            } else {
                allCalls = [];
            }
        }
        
        console.log(`📊 تم تحميل ${allCalls.length} مكالمة`);
        renderCallsTable();
        renderRecentCalls();
        loadMissedCalls();
    } catch (error) {
        console.error('خطأ في تحميل المكالمات:', error);
        allCalls = [];
        renderCallsTable();
    }
}

// ========== عرض جدول المكالمات ==========
function renderCallsTable(page = 1) {
    const tbody = document.getElementById('calls-table-body');
    if (!tbody) return;
    
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageCalls = allCalls.slice(startIndex, endIndex);
    
    tbody.innerHTML = pageCalls.map(call => `
        <tr>
            <td>${formatDate(call.dateCreated || call.date)}</td>
            <td>${formatTime(call.dateCreated || call.date)}</td>
            <td dir="ltr">${call.to || call.phone || 'غير معروف'}</td>
            <td>${call.employeeName || getEmployeeName(call.employeeId) || 'غير معروف'}</td>
            <td>${formatDuration(call.duration)}</td>
            <td><span class="status-badge ${getStatusClass(call.status)}">${getStatusText(call.status)}</span></td>
            <td>
                ${call.recordingUrl ? `<button class="action-btn" onclick="playRecording('${call.recordingUrl}')" title="تشغيل">▶️</button>` : '—'}
            </td>
            <td>
                ${call.recordingUrl ? `<button class="action-btn" onclick="transcribeCall('${call.recordingSid || call.sid}')" title="تحويل لنص">📝</button>` : '—'}
            </td>
            <td>
                <button class="action-btn" onclick="showCallDetails('${call.sid}')" title="تفاصيل">👁️</button>
                <button class="action-btn" onclick="deleteCall('${call.sid}')" title="حذف">🗑️</button>
            </td>
        </tr>
    `).join('');
    
    renderPagination(allCalls.length, page);
}

// ========== عرض التصفح ==========
function renderPagination(totalItems, currentPage) {
    const pagination = document.getElementById('calls-pagination');
    if (!pagination) return;
    
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    let html = '';
    
    if (currentPage > 1) {
        html += `<button onclick="renderCallsTable(${currentPage - 1})">السابق</button>`;
    }
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<button class="active">${i}</button>`;
        } else if (i <= 3 || i > totalPages - 3 || Math.abs(i - currentPage) <= 1) {
            html += `<button onclick="renderCallsTable(${i})">${i}</button>`;
        } else if (html.slice(-3) !== '...') {
            html += '...';
        }
    }
    
    if (currentPage < totalPages) {
        html += `<button onclick="renderCallsTable(${currentPage + 1})">التالي</button>`;
    }
    
    pagination.innerHTML = html;
}

// ========== عرض أحدث المكالمات ==========
function renderRecentCalls() {
    const container = document.getElementById('recent-calls-list');
    if (!container) return;
    
    const recentCalls = allCalls.slice(0, 5);
    
    container.innerHTML = recentCalls.map(call => `
        <div class="recent-item">
            <div class="icon">${call.status === 'completed' ? '✅' : '📵'}</div>
            <div class="info">
                <div class="title" dir="ltr">${call.to || call.phone || 'غير معروف'}</div>
                <div class="subtitle">${call.employeeName || getEmployeeName(call.employeeId) || 'موظف'}</div>
            </div>
            <div class="time">${formatTimeAgo(call.dateCreated || call.date)}</div>
        </div>
    `).join('') || '<p style="text-align: center; color: var(--text-muted);">لا توجد مكالمات</p>';
}

// ========== تحميل الموظفين ==========
async function loadEmployees() {
    try {
        const response = await fetch(`${baseUrl}/employees`);
        if (response.ok) {
            const data = await response.json();
            allEmployees = data.employees || [];
            renderEmployeesGrid();
            renderEmployeeActivity();
            populateEmployeeFilter();
        }
    } catch (error) {
        console.error('خطأ في تحميل الموظفين:', error);
    }
}

// ========== عرض شبكة الموظفين ==========
function renderEmployeesGrid() {
    const container = document.getElementById('employees-grid');
    if (!container) return;
    
    container.innerHTML = allEmployees.map(emp => {
        const empCalls = allCalls.filter(c => c.employeeId == emp.id || c.employeeName === emp.name);
        const completedCalls = empCalls.filter(c => c.status === 'completed').length;
        const totalDuration = empCalls.reduce((sum, c) => sum + (parseInt(c.duration) || 0), 0);
        
        return `
            <div class="employee-card">
                <div class="employee-avatar">👤</div>
                <h4>${emp.name || emp.fullname || emp.username}</h4>
                <div class="department">${emp.departmentArabic || emp.department || 'غير محدد'}</div>
                <div class="employee-stats">
                    <div class="stat">
                        <div class="value">${empCalls.length}</div>
                        <div class="label">مكالمات</div>
                    </div>
                    <div class="stat">
                        <div class="value">${completedCalls}</div>
                        <div class="label">ناجحة</div>
                    </div>
                    <div class="stat">
                        <div class="value">${formatDuration(totalDuration)}</div>
                        <div class="label">المدة</div>
                    </div>
                </div>
            </div>
        `;
    }).join('') || '<p>لا يوجد موظفين</p>';
}

// ========== عرض نشاط الموظفين ==========
function renderEmployeeActivity() {
    const container = document.getElementById('employee-activity-list');
    if (!container) return;
    
    // ترتيب حسب آخر نشاط
    const sortedEmployees = [...allEmployees].sort((a, b) => {
        const aLastCall = allCalls.find(c => c.employeeId == a.id);
        const bLastCall = allCalls.find(c => c.employeeId == b.id);
        return (bLastCall?.dateCreated || 0) - (aLastCall?.dateCreated || 0);
    }).slice(0, 5);
    
    container.innerHTML = sortedEmployees.map(emp => {
        const lastCall = allCalls.find(c => c.employeeId == emp.id);
        return `
            <div class="recent-item">
                <div class="icon">👤</div>
                <div class="info">
                    <div class="title">${emp.name || emp.fullname}</div>
                    <div class="subtitle">${lastCall ? 'آخر مكالمة: ' + formatTimeAgo(lastCall.dateCreated) : 'لا يوجد نشاط'}</div>
                </div>
                <div class="time">${emp.isOnline ? '🟢' : '⚫'}</div>
            </div>
        `;
    }).join('') || '<p style="text-align: center; color: var(--text-muted);">لا يوجد موظفين</p>';
}

// ========== تحميل التسجيلات ==========
async function loadRecordings() {
    try {
        const response = await fetch(`${baseUrl}/recordings`);
        if (response.ok) {
            const data = await response.json();
            allRecordings = data.recordings || [];
            renderTranscriptList();
        }
    } catch (error) {
        console.error('خطأ في تحميل التسجيلات:', error);
    }
}

// ========== قائمة التسجيلات للتحويل ==========
function renderTranscriptList() {
    const container = document.getElementById('transcript-list');
    if (!container) return;
    
    container.innerHTML = allRecordings.map((rec, index) => `
        <div class="transcript-item" onclick="loadTranscript('${rec.recordingSid || rec.sid}', ${index})">
            <div class="phone" dir="ltr">${rec.to || rec.phone || 'غير معروف'}</div>
            <div class="meta">
                <span>${formatDate(rec.dateCreated || rec.date)}</span>
                <span>${formatDuration(rec.duration)}</span>
            </div>
        </div>
    `).join('') || '<p style="text-align: center; padding: 20px; color: var(--text-muted);">لا توجد تسجيلات</p>';
}

// ========== تحميل نص المحادثة ==========
async function loadTranscript(recordingSid, index) {
    // تحديد العنصر النشط
    document.querySelectorAll('.transcript-item').forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
    
    const recording = allRecordings[index];
    const metaEl = document.getElementById('transcript-meta');
    const contentEl = document.getElementById('transcript-content');
    
    metaEl.innerHTML = `
        <span>📞 ${recording.to || recording.phone || 'غير معروف'}</span> | 
        <span>📅 ${formatDate(recording.dateCreated)}</span> | 
        <span>⏱️ ${formatDuration(recording.duration)}</span>
    `;
    
    // التحقق من وجود نص محفوظ
    if (recording.transcript) {
        renderTranscriptContent(recording.transcript);
        return;
    }
    
    contentEl.innerHTML = `
        <div style="text-align: center; padding: 50px;">
            <p>لم يتم تحويل هذا التسجيل بعد</p>
            <button class="btn-primary" onclick="transcribeCall('${recordingSid}')" style="margin-top: 15px;">
                🎙️ تحويل إلى نص
            </button>
        </div>
    `;
}

// ========== تحويل الصوت إلى نص ==========
async function transcribeCall(recordingSid) {
    const modal = document.getElementById('transcribe-modal');
    const progressFill = document.getElementById('transcribe-progress-fill');
    const statusText = document.getElementById('transcribe-status');
    const resultDiv = document.getElementById('transcribe-result');
    
    modal.classList.add('active');
    progressFill.style.width = '0%';
    statusText.textContent = 'جاري بدء التحويل...';
    resultDiv.innerHTML = '';
    
    try {
        // محاكاة التقدم
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            if (progress <= 90) {
                progressFill.style.width = progress + '%';
                if (progress < 30) statusText.textContent = 'جاري تحميل التسجيل...';
                else if (progress < 60) statusText.textContent = 'جاري تحليل الصوت...';
                else statusText.textContent = 'جاري تحويل إلى نص...';
            }
        }, 500);
        
        const response = await fetch(`${baseUrl}/admin/transcribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recordingSid })
        });
        
        clearInterval(progressInterval);
        progressFill.style.width = '100%';
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.pending) {
                statusText.textContent = '⏳ جاري المعالجة...';
                resultDiv.innerHTML = `
                    <div style="background: var(--bg-card-hover); padding: 20px; border-radius: 10px; line-height: 1.8;">
                        <p style="color: var(--warning-color);">⏳ ${data.transcript}</p>
                        <p style="margin-top: 10px; font-size: 14px; color: var(--text-muted);">يرجى المحاولة مرة أخرى بعد دقيقة.</p>
                    </div>
                `;
            } else if (data.note) {
                statusText.textContent = 'ℹ️ ملاحظة';
                resultDiv.innerHTML = `
                    <div style="background: var(--bg-card-hover); padding: 20px; border-radius: 10px; line-height: 1.8;">
                        <p>${data.transcript}</p>
                        <p style="margin-top: 15px; font-size: 13px; color: var(--text-muted);">${data.note}</p>
                    </div>
                `;
            } else {
                statusText.textContent = '✅ تم التحويل بنجاح!';
                setTimeout(() => {
                    resultDiv.innerHTML = `
                        <h4 style="margin-bottom: 15px;">النص المحول:</h4>
                        <div style="background: var(--bg-card-hover); padding: 20px; border-radius: 10px; line-height: 1.8;">
                            ${data.transcript || 'لم يتم التعرف على نص'}
                        </div>
                    `;
                }, 500);
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'فشل التحويل');
        }
    } catch (error) {
        console.error('خطأ في التحويل:', error);
        statusText.textContent = '⚠️ خدمة التحويل';
        resultDiv.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <p style="color: var(--warning-color); margin-bottom: 15px;">
                    ⚠️ خدمة تحويل الصوت إلى نص غير متاحة حالياً
                </p>
                <p style="font-size: 14px; color: var(--text-muted); line-height: 1.8;">
                    لتفعيل هذه الميزة، يجب تفعيل إحدى الخدمات التالية:<br>
                    • Twilio Voice Intelligence<br>
                    • Google Speech-to-Text API<br>
                    • OpenAI Whisper API
                </p>
            </div>
        `;
    }
}

// ========== عرض محتوى النص ==========
function renderTranscriptContent(transcript) {
    const contentEl = document.getElementById('transcript-content');
    
    // تحويل النص إلى رسائل (إذا كان النص يحتوي على تنسيق)
    if (typeof transcript === 'string') {
        contentEl.innerHTML = `<p style="line-height: 1.8;">${transcript}</p>`;
    } else if (Array.isArray(transcript)) {
        contentEl.innerHTML = transcript.map(msg => `
            <div class="message ${msg.speaker === 'agent' ? 'agent' : 'customer'}">
                <div class="speaker">${msg.speaker === 'agent' ? '👤 الموظف' : '📞 العميل'}</div>
                <div class="text">${msg.text}</div>
            </div>
        `).join('');
    }
}

// ========== المكالمات الفائتة ==========
function loadMissedCalls() {
    const missedCalls = allCalls.filter(c => 
        c.status === 'no-answer' || 
        c.status === 'missed' || 
        c.status === 'busy' ||
        c.status === 'failed'
    );
    
    // تحديث الإحصائيات
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    document.getElementById('missed-today').textContent = 
        missedCalls.filter(c => new Date(c.dateCreated) >= today).length;
    document.getElementById('missed-week').textContent = 
        missedCalls.filter(c => new Date(c.dateCreated) >= weekAgo).length;
    document.getElementById('missed-month').textContent = 
        missedCalls.filter(c => new Date(c.dateCreated) >= monthAgo).length;
    
    // عرض الشبكة
    const container = document.getElementById('missed-grid');
    if (!container) return;
    
    container.innerHTML = missedCalls.slice(0, 20).map(call => `
        <div class="missed-card">
            <div class="phone" dir="ltr">${call.to || call.phone || 'غير معروف'}</div>
            <div class="details">
                <p>📅 ${formatDate(call.dateCreated)} - ${formatTime(call.dateCreated)}</p>
                <p>👤 ${call.employeeName || getEmployeeName(call.employeeId) || 'غير معروف'}</p>
                <p>📊 ${getStatusText(call.status)}</p>
            </div>
            <div class="actions">
                <button class="btn-callback" onclick="callBack('${call.to || call.phone}')">📞 إعادة الاتصال</button>
            </div>
        </div>
    `).join('') || '<p style="text-align: center; padding: 40px; color: var(--text-muted);">لا توجد مكالمات فائتة 🎉</p>';
}

// ========== الرسوم البيانية ==========
function renderWeeklyChart() {
    const container = document.getElementById('weekly-chart');
    if (!container) return;
    
    const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    const today = new Date().getDay();
    
    // حساب المكالمات لكل يوم
    const weeklyCalls = days.map((day, index) => {
        const dayDate = new Date();
        dayDate.setDate(dayDate.getDate() - ((today - index + 7) % 7));
        dayDate.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(dayDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        return allCalls.filter(c => {
            const callDate = new Date(c.dateCreated);
            return callDate >= dayDate && callDate < nextDay;
        }).length;
    });
    
    const maxCalls = Math.max(...weeklyCalls, 1);
    
    container.innerHTML = days.map((day, index) => `
        <div style="text-align: center;">
            <div class="bar" style="height: ${(weeklyCalls[index] / maxCalls) * 200}px;" data-value="${weeklyCalls[index]}"></div>
            <div style="margin-top: 10px; font-size: 12px; color: var(--text-secondary);">${day}</div>
        </div>
    `).join('');
}

function renderDistributionChart() {
    const container = document.getElementById('distribution-chart');
    if (!container) return;
    
    const completed = allCalls.filter(c => c.status === 'completed').length;
    const missed = allCalls.filter(c => c.status === 'no-answer' || c.status === 'missed').length;
    const busy = allCalls.filter(c => c.status === 'busy').length;
    const other = allCalls.length - completed - missed - busy;
    
    const total = allCalls.length || 1;
    
    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 15px; width: 100%;">
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="width: 15px; height: 15px; background: var(--success-color); border-radius: 3px;"></div>
                <span>مكتملة</span>
                <div style="flex: 1; height: 20px; background: var(--bg-card-hover); border-radius: 10px; overflow: hidden;">
                    <div style="width: ${(completed/total)*100}%; height: 100%; background: var(--success-color);"></div>
                </div>
                <span>${completed}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="width: 15px; height: 15px; background: var(--danger-color); border-radius: 3px;"></div>
                <span>فائتة</span>
                <div style="flex: 1; height: 20px; background: var(--bg-card-hover); border-radius: 10px; overflow: hidden;">
                    <div style="width: ${(missed/total)*100}%; height: 100%; background: var(--danger-color);"></div>
                </div>
                <span>${missed}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="width: 15px; height: 15px; background: var(--warning-color); border-radius: 3px;"></div>
                <span>مشغول</span>
                <div style="flex: 1; height: 20px; background: var(--bg-card-hover); border-radius: 10px; overflow: hidden;">
                    <div style="width: ${(busy/total)*100}%; height: 100%; background: var(--warning-color);"></div>
                </div>
                <span>${busy}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="width: 15px; height: 15px; background: var(--info-color); border-radius: 3px;"></div>
                <span>أخرى</span>
                <div style="flex: 1; height: 20px; background: var(--bg-card-hover); border-radius: 10px; overflow: hidden;">
                    <div style="width: ${(other/total)*100}%; height: 100%; background: var(--info-color);"></div>
                </div>
                <span>${other}</span>
            </div>
        </div>
    `;
}

// ========== دوال مساعدة ==========
function formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-SA');
}

function formatTime(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    seconds = parseInt(seconds);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatTimeAgo(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'الآن';
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
    return formatDate(dateStr);
}

function getStatusClass(status) {
    switch (status) {
        case 'completed': return 'completed';
        case 'no-answer':
        case 'missed':
        case 'failed': return 'missed';
        case 'busy': return 'busy';
        default: return '';
    }
}

function getStatusText(status) {
    const statusMap = {
        'completed': 'مكتملة',
        'no-answer': 'لم يرد',
        'missed': 'فائتة',
        'busy': 'مشغول',
        'failed': 'فشلت',
        'canceled': 'ملغاة',
        'ringing': 'رنين',
        'in-progress': 'جارية'
    };
    return statusMap[status] || status || 'غير معروف';
}

function getEmployeeName(employeeId) {
    if (!employeeId) return null;
    if (String(employeeId).startsWith('company-')) return '👑 مدير الشركة';
    const emp = allEmployees.find(e => e.id == employeeId);
    return emp ? (emp.name || emp.fullname) : null;
}

function calculateTotalDuration(calls) {
    return calls.reduce((sum, call) => sum + (parseInt(call.duration) || 0), 0);
}

function populateEmployeeFilter() {
    const select = document.getElementById('call-filter-employee');
    if (!select) return;
    
    select.innerHTML = '<option value="all">جميع الموظفين</option>' +
        allEmployees.map(emp => 
            `<option value="${emp.id}">${emp.name || emp.fullname}</option>`
        ).join('');
}

// ========== الإجراءات ==========

/**
 * بناء رابط البروكسي لتشغيل تسجيل Twilio مع المصادقة
 * يحوّل روابط Twilio المباشرة إلى /api/recording-proxy
 */
function getRecordingProxyUrl(twilioUrl) {
    if (!twilioUrl) return null;
    // إذا كان رابط البروكسي بالفعل، أعده كما هو
    if (twilioUrl.includes('/api/recording-proxy')) return twilioUrl;
    const companyId = sessionStorage.getItem('companyId') || '';
    return `/api/recording-proxy?url=${encodeURIComponent(twilioUrl)}&companyId=${encodeURIComponent(companyId)}`;
}

function playRecording(url) {
    const proxyUrl = getRecordingProxyUrl(url);
    window.open(proxyUrl || url, '_blank');
}

function showCallDetails(callSid) {
    const call = allCalls.find(c => c.sid === callSid);
    if (!call) return;
    
    const modal = document.getElementById('call-detail-modal');
    const body = document.getElementById('call-detail-body');
    
    body.innerHTML = `
        <div style="display: grid; gap: 15px;">
            <div><strong>رقم المكالمة:</strong> ${call.sid}</div>
            <div><strong>الرقم:</strong> <span dir="ltr">${call.to || call.phone}</span></div>
            <div><strong>الموظف:</strong> ${call.employeeName || getEmployeeName(call.employeeId) || 'غير معروف'}</div>
            <div><strong>التاريخ:</strong> ${formatDate(call.dateCreated)}</div>
            <div><strong>الوقت:</strong> ${formatTime(call.dateCreated)}</div>
            <div><strong>المدة:</strong> ${formatDuration(call.duration)}</div>
            <div><strong>الحالة:</strong> ${getStatusText(call.status)}</div>
            ${call.recordingUrl ? `
                <div>
                    <strong>التسجيل:</strong>
                    <audio controls src="${getRecordingProxyUrl(call.recordingUrl)}" style="width: 100%; margin-top: 10px;"></audio>
                </div>
            ` : ''}
        </div>
    `;
    
    modal.classList.add('active');
}

async function deleteCall(callSid) {
    if (!confirm('هل أنت متأكد من حذف هذه المكالمة؟')) return;
    
    try {
        const response = await fetch(`${baseUrl}/admin/delete-call`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callSid })
        });
        
        if (response.ok) {
            allCalls = allCalls.filter(c => c.sid !== callSid);
            renderCallsTable(currentPage);
            alert('تم حذف المكالمة بنجاح');
        }
    } catch (error) {
        console.error('خطأ في الحذف:', error);
        alert('حدث خطأ في حذف المكالمة');
    }
}

function callBack(phoneNumber) {
    if (!phoneNumber) return;
    // فتح صفحة الاتصال مع الرقم
    window.location.href = `index.html?call=${encodeURIComponent(phoneNumber)}`;
}

// ========== تصدير البيانات ==========
document.getElementById('export-calls')?.addEventListener('click', () => {
    // تحويل البيانات لـ CSV
    const headers = ['التاريخ', 'الوقت', 'الرقم', 'الموظف', 'المدة', 'الحالة'];
    const rows = allCalls.map(call => [
        formatDate(call.dateCreated),
        formatTime(call.dateCreated),
        call.to || call.phone || '',
        call.employeeName || getEmployeeName(call.employeeId) || '',
        formatDuration(call.duration),
        getStatusText(call.status)
    ]);
    
    const csvContent = [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `calls_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
});

// ========== الفلترة ==========
document.getElementById('apply-call-filter')?.addEventListener('click', () => {
    const status = document.getElementById('call-filter-status').value;
    const employee = document.getElementById('call-filter-employee').value;
    const date = document.getElementById('call-filter-date').value;
    
    let filteredCalls = [...allCalls];
    
    if (status !== 'all') {
        filteredCalls = filteredCalls.filter(c => c.status === status);
    }
    
    if (employee !== 'all') {
        filteredCalls = filteredCalls.filter(c => c.employeeId == employee);
    }
    
    if (date) {
        const filterDate = new Date(date);
        filterDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(filterDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        filteredCalls = filteredCalls.filter(c => {
            const callDate = new Date(c.dateCreated);
            return callDate >= filterDate && callDate < nextDay;
        });
    }
    
    // تحديث العرض مؤقتاً
    const originalCalls = allCalls;
    allCalls = filteredCalls;
    renderCallsTable(1);
    allCalls = originalCalls;
});

// ========== البحث العام ==========
document.getElementById('global-search')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    
    if (!query) {
        renderCallsTable(1);
        return;
    }
    
    const filtered = allCalls.filter(call => 
        (call.to || '').includes(query) ||
        (call.phone || '').includes(query) ||
        (call.employeeName || '').toLowerCase().includes(query) ||
        getEmployeeName(call.employeeId)?.toLowerCase().includes(query)
    );
    
    const originalCalls = allCalls;
    allCalls = filtered;
    renderCallsTable(1);
    allCalls = originalCalls;
});

// ========== إدارة الشركات ==========
let allCompanies = [];

// تحميل قائمة الشركات
async function loadCompanies() {
    try {
        const response = await fetch(`${baseUrl}/api/companies`);
        if (response.ok) {
            const data = await response.json();
            allCompanies = (data.companies || []).map(c => ({
                id: c.id,
                name: c.companyName || c.name || '',
                adminUsername: c.username || c.adminUsername || '',
                adminName: c.adminName || '',
                subscription: c.plan || c.subscription || 'free',
                isActive: c.status === 'active',
                employeesCount: c.employeesCount || 0,
                createdAt: c.createdAt || '',
                twilioPhone: c.twilioPhone || '',
                twilioEnvPrefix: c.twilioEnvPrefix || null,
                twilioCredentials: c.twilioCredentials || null
            }));
            renderCompanies();
            updateCompaniesStats();
        }
    } catch (error) {
        console.error('خطأ في تحميل الشركات:', error);
    }
}

// عرض الشركات
function renderCompanies() {
    const container = document.getElementById('companies-list');
    if (!container) return;
    
    if (allCompanies.length === 0) {
        container.innerHTML = `
            <div class="no-data" style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <p style="font-size: 48px; margin-bottom: 15px;">🏢</p>
                <p>لا توجد شركات مسجلة</p>
                <p style="color: var(--text-muted); font-size: 14px;">اضغط على "إضافة شركة جديدة" للبدء</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = allCompanies.map(company => `
        <div class="company-card ${company.isActive ? '' : 'inactive'}">
            <div class="company-header">
                <div class="company-icon">🏢</div>
                <div class="company-info">
                    <h4>${company.name}</h4>
                    <span class="admin-name">المدير: ${company.adminUsername}</span>
                    <span class="subscription-badge ${company.subscription}">${getSubscriptionName(company.subscription)}</span>
                </div>
                <span class="company-badge ${company.isActive ? 'active' : 'inactive'}">
                    ${company.isActive ? '🟢 نشط' : '🔴 متوقف'}
                </span>
            </div>
            <div class="company-stats">
                <div class="company-stat">
                    <span class="company-stat-value">${company.employeesCount || 0}</span>
                    <span class="company-stat-label">موظف</span>
                </div>
                <div class="company-stat">
                    <span class="company-stat-value">0</span>
                    <span class="company-stat-label">مكالمة</span>
                </div>
                <div class="company-stat">
                    <span class="company-stat-value">${formatDate(company.createdAt)}</span>
                    <span class="company-stat-label">تاريخ التسجيل</span>
                </div>
            </div>
            ${company.twilioCredentials?.accountSid ? `
            <div style="margin: 10px 0; padding: 8px 12px; background: rgba(16,185,129,0.12); border-radius: 8px; font-size: 13px; direction: ltr; color: #059669; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                <span style="width:8px;height:8px;border-radius:50%;background:#10b981;display:inline-block;flex-shrink:0;"></span>
                📞 Twilio مُعدَّل | ${company.twilioCredentials.phoneNumber || company.twilioPhone || '—'}
            </div>` : company.twilioPhone ? `
            <div style="margin: 10px 0; padding: 8px 12px; background: rgba(102,126,234,0.1); border-radius: 8px; font-size: 13px; direction: ltr; color: #667eea; font-weight: 600;">
                📞 Twilio (ENV): ${company.twilioPhone}
            </div>` : `
            <div style="margin: 10px 0; padding: 8px 12px; background: rgba(255,152,0,0.1); border-radius: 8px; font-size: 12px; color: #ff9800;">
                ⚠️ لا يوجد رقم Twilio مخصص — اضغط "📞 Twilio" للإعداد
            </div>`}
            <div class="company-actions">
                <button class="btn-view" onclick="viewCompany('${company.id}')">👁️ عرض</button>
                <button class="btn-edit" onclick="editCompany('${company.id}')">✏️ تعديل</button>
                <button class="btn-twilio" onclick="openTwilioSetup('${company.id}', '${(company.name || '').replace(/'/g, "\\'")}')">📞 Twilio</button>
                ${company.id !== 'default' ? `<button class="btn-delete" onclick="deleteCompany('${company.id}')">🗑️ حذف</button>` : ''}
            </div>
        </div>
    `).join('');
}

// تحديث إحصائيات الشركات
function updateCompaniesStats() {
    const totalEl = document.getElementById('total-companies');
    const activeEl = document.getElementById('active-companies');
    
    if (totalEl) totalEl.textContent = allCompanies.length;
    if (activeEl) activeEl.textContent = allCompanies.filter(c => c.isActive).length;
}

// الحصول على اسم الاشتراك
function getSubscriptionName(type) {
    const names = {
        'basic': 'أساسي',
        'pro': 'احترافي',
        'unlimited': 'غير محدود'
    };
    return names[type] || type;
}

// عرض تفاصيل شركة
function viewCompany(companyId) {
    const company = allCompanies.find(c => c.id === companyId);
    if (!company) return;
    
    alert(`🏢 ${company.name}\n\nالمدير: ${company.adminUsername}\nالاشتراك: ${getSubscriptionName(company.subscription)}\nالحالة: ${company.isActive ? 'نشط' : 'متوقف'}`);
}

// تعديل شركة
async function editCompany(companyId) {
    const company = allCompanies.find(c => c.id === companyId);
    if (!company) return;
    
    const newName = prompt('اسم الشركة:', company.name);
    if (!newName) return;
    
    const newTwilioPhone = prompt(
        '📞 رقم Twilio الخاص بالشركة:\n(اتركه فارغاً لاستخدام الرقم الافتراضي)\n(الصيغة: +12564884883)',
        company.twilioPhone || ''
    );
    // إذا ضغط Cancel يرجع null - نقبل القيمة الفارغة
    if (newTwilioPhone === null) return;
    
    try {
        const response = await fetch(`${baseUrl}/api/companies/${companyId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                companyName: newName,
                twilioPhone: newTwilioPhone.trim() || null
            })
        });
        
        if (response.ok) {
            const msg = newTwilioPhone.trim()
                ? `✅ تم تحديث الشركة\n\n📞 رقم Twilio: ${newTwilioPhone.trim()}\nسيُستخدم هذا الرقم كـ Caller ID لجميع مكالمات ${newName}`
                : '✅ تم تحديث الشركة (سيُستخدم الرقم الافتراضي)';
            alert(msg);
            loadCompanies();
        } else {
            const data = await response.json();
            alert('❌ ' + (data.error || 'خطأ في التحديث'));
        }
    } catch (error) {
        alert('❌ خطأ في الاتصال');
    }
}

// حذف/إيقاف شركة
async function deleteCompany(companyId) {
    if (!confirm('⚠️ هل تريد إيقاف هذه الشركة؟\n\nسيتم إيقاف جميع حسابات الموظفين التابعين لها.')) {
        return;
    }
    
    try {
        const response = await fetch(`${baseUrl}/api/companies/${companyId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('✅ تم إيقاف الشركة');
            loadCompanies();
        } else {
            const data = await response.json();
            alert('❌ ' + (data.error || 'خطأ في الحذف'));
        }
    } catch (error) {
        alert('❌ خطأ في الاتصال');
    }
}

// إضافة شركة جديدة
document.getElementById('add-company-btn')?.addEventListener('click', () => {
    document.getElementById('add-company-modal').classList.add('active');
});

document.getElementById('add-company-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const companyName = document.getElementById('company-name').value.trim();
    const companyPhone = document.getElementById('company-phone')?.value.trim() || '';
    const companyEmail = document.getElementById('company-email')?.value.trim() || '';
    const adminUsername = document.getElementById('company-admin-username').value.trim();
    const adminName = document.getElementById('company-admin-name').value.trim();
    const adminPassword = document.getElementById('company-admin-password').value;
    const subscription = document.getElementById('company-subscription').value;
    
    // التحقق من البيانات
    if (!companyName || !adminUsername || !adminName || !adminPassword) {
        alert('❌ يرجى إدخال جميع البيانات المطلوبة');
        return;
    }
    
    if (adminPassword.length < 8) {
        alert('❌ كلمة المرور يجب أن تكون 8 أحرف على الأقل');
        return;
    }
    
    const data = {
        companyName,
        companyPhone,
        companyEmail,
        adminName,
        username: adminUsername,
        password: adminPassword,
        selectedPlan: subscription === 'unlimited' ? 'enterprise' : (subscription === 'pro' ? 'pro' : 'free'),
        commercialNumber: 'ADMIN-' + Date.now(),
        adminTitle: 'مدير',
        adminEmail: companyEmail,
        adminPhone: companyPhone,
        businessType: 'other',
        country: 'غير محدد',
        city: 'غير محدد'
    };
    
    // عرض مؤشر تحميل
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = '⏳ جاري الإنشاء...';
    submitButton.disabled = true;
    
    try {
        const response = await fetch(`${baseUrl}/api/companies/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            alert(`✅ تم إنشاء الشركة بنجاح! 🎉\n\n` +
                  `📝 اسم الشركة: ${companyName}\n` +
                  `👤 اسم المدير: ${adminName}\n` +
                  `🔑 اسم المستخدم: ${adminUsername}\n` +
                  `📦 الباقة: ${subscription === 'basic' ? 'أساسي' : subscription === 'pro' ? 'احترافي' : 'غير محدود'}\n` +
                  `🆔 معرف الشركة: ${result.company.id}\n\n` +
                  `✅ تم إنشاء قاعدة بيانات منفصلة تماماً للشركة\n` +
                  `✅ تم إنشاء حساب المدير مع صلاحيات كاملة\n\n` +
                  `يمكن للمدير تسجيل الدخول الآن والبدء في العمل! 🚀`);
            
            document.getElementById('add-company-modal').classList.remove('active');
            document.getElementById('add-company-form').reset();
            
            // إعادة تعيين البطاقات
            document.querySelectorAll('.subscription-card').forEach(card => {
                card.style.borderColor = '#e0e6f0';
                card.style.background = 'white';
            });
            document.querySelector('.subscription-card[data-plan="basic"]').style.borderColor = '#667eea';
            document.querySelector('.subscription-card[data-plan="basic"]').style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)';
            
            // تحديث قائمة الشركات إذا كانت موجودة
            if (typeof loadCompanies === 'function') {
                await loadCompanies();
            }
        } else {
            alert('❌ فشل في إنشاء الشركة\n\n' + (result.error || 'خطأ غير معروف'));
        }
    } catch (error) {
        console.error('❌ خطأ في إضافة الشركة:', error);
        alert('❌ خطأ في الاتصال بالخادم\n\nالرجاء المحاولة مرة أخرى');
    } finally {
        // إعادة تفعيل الزر
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
});

// ========== إدارة الموظفين ==========
// إضافة موظف جديد
document.getElementById('add-employee-btn')?.addEventListener('click', () => {
    console.log('🔘 تم الضغط على زر إضافة موظف');
    const modal = document.getElementById('add-employee-modal');
    if (modal) {
        modal.classList.add('active');
    } else {
        console.error('❌ لم يتم العثور على modal إضافة الموظف');
    }
});

document.getElementById('add-employee-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('📝 إرسال نموذج إضافة موظف');
    
    const departmentMap = {
        '1': 'حجز وحدات الضيافة والفنادق',
        '2': 'تأجير السيارات',
        '3': 'البرامج والجولات السياحية',
        '0': 'خدمة العملاء',
        '9': 'الشكاوى'
    };
    
    const dept = document.getElementById('employee-department').value;
    const data = {
        fullname: document.getElementById('employee-fullname').value.trim(),
        username: document.getElementById('employee-username').value.trim(),
        password: document.getElementById('employee-password').value,
        phone: document.getElementById('employee-phone').value.trim(),
        department: dept,
        departmentArabic: departmentMap[dept] || 'غير محدد',
        email: document.getElementById('employee-email').value.trim(),
        role: 'employee',
        createdAt: new Date().toISOString()
    };
    
    console.log('📤 بيانات الموظف:', data);
    
    try {
        const response = await fetch(`${baseUrl}/api/employees/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        console.log('📥 استجابة الخادم:', result);
        
        if (response.ok && result.success) {
            alert(`✅ تم إضافة الموظف بنجاح!\n\nالاسم: ${data.fullname}\nاسم المستخدم: ${data.username}\n\n✅ تم حفظ البيانات بشكل دائم في قاعدة البيانات`);
            document.getElementById('add-employee-modal').classList.remove('active');
            document.getElementById('add-employee-form').reset();
            // إعادة تحميل قائمة الموظفين
            await loadEmployees();
        } else {
            alert('❌ ' + (result.error || 'خطأ في إضافة الموظف'));
        }
    } catch (error) {
        console.error('❌ خطأ في الاتصال:', error);
        alert('❌ خطأ في الاتصال بالخادم');
    }
});

// حذف موظف
async function deleteEmployee(employeeId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا الموظف؟\n\nملاحظة: البيانات محفوظة في قاعدة البيانات ويمكن استرجاعها.')) {
        return;
    }
    
    try {
        const response = await fetch(`${baseUrl}/api/employees/${employeeId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            alert('✅ تم حذف الموظف (يمكن استرجاع البيانات)');
            await loadEmployees();
        } else {
            alert('❌ ' + (result.error || 'خطأ في الحذف'));
        }
    } catch (error) {
        console.error('❌ خطأ:', error);
        alert('❌ خطأ في الاتصال');
    }
}

console.log('✅ Admin Dashboard Ready');

// ══════════════════════════════════════════════════════════════════════════════
// Twilio Setup Modal
// ══════════════════════════════════════════════════════════════════════════════

function openTwilioSetup(companyId, companyName) {
    // Reset form
    document.getElementById('twilio-setup-form').reset();
    document.getElementById('twilio-company-id').value = companyId;
    document.getElementById('twilio-setup-subtitle').textContent = `إعداد Twilio للشركة: ${companyName}`;
    document.getElementById('twilio-setup-result').style.display = 'none';
    document.getElementById('twilio-current-status').style.display = 'none';
    document.getElementById('twilio-delete-btn').style.display = 'none';

    // Show modal
    document.getElementById('twilio-setup-modal').classList.add('active');

    // Fetch existing credentials (if any)
    loadTwilioStatus(companyId);
}

function closeTwilioSetup() {
    document.getElementById('twilio-setup-modal').classList.remove('active');
}

async function loadTwilioStatus(companyId) {
    try {
        const res  = await fetch(`${baseUrl}/api/twilio-setup?companyId=${companyId}`, {
            headers: { Authorization: adminToken }
        });
        if (!res.ok) return;
        const data = await res.json();

        if (data.configured) {
            const statusEl = document.getElementById('twilio-current-status');
            statusEl.style.display = 'block';
            statusEl.style.background = 'rgba(16,185,129,0.1)';
            statusEl.style.border = '1px solid rgba(16,185,129,0.3)';
            statusEl.style.color = '#059669';
            statusEl.innerHTML = `
                ✅ <strong>Twilio مُعدَّل حالياً</strong><br>
                <small style="direction:ltr;display:block;margin-top:4px;">
                    SID: ${data.accountSid} &nbsp;|&nbsp;
                    رقم: ${data.phoneNumber || '—'} &nbsp;|&nbsp;
                    TwiML App: ${data.twimlAppSid || '—'}
                </small>
            `;
            // Pre-fill visible fields (excluding tokens)
            if (data.accountSid) document.getElementById('twilio-account-sid').value = data.accountSid;
            if (data.apiKey)     document.getElementById('twilio-api-key').value     = data.apiKey;
            if (data.phoneNumber)document.getElementById('twilio-phone-number').value= data.phoneNumber;
            document.getElementById('twilio-delete-btn').style.display = 'inline-block';
        }
    } catch (e) {
        console.warn('loadTwilioStatus:', e.message);
    }
}

async function saveTwilioSetup(e) {
    e.preventDefault();

    const companyId  = document.getElementById('twilio-company-id').value;
    const accountSid = document.getElementById('twilio-account-sid').value.trim();
    const authToken  = document.getElementById('twilio-auth-token').value.trim();
    const apiKey     = document.getElementById('twilio-api-key').value.trim();
    const apiSecret  = document.getElementById('twilio-api-secret').value.trim();
    const phoneNumber= document.getElementById('twilio-phone-number').value.trim();

    if (!accountSid || !authToken) {
        alert('⚠️ Account SID و Auth Token مطلوبان');
        return;
    }

    const saveBtn = document.getElementById('twilio-save-btn');
    const resultEl = document.getElementById('twilio-setup-result');
    saveBtn.disabled = true;
    saveBtn.textContent = '⏳ جارٍ الحفظ…';
    resultEl.style.display = 'none';

    try {
        const res = await fetch(`${baseUrl}/api/twilio-setup`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', Authorization: adminToken },
            body: JSON.stringify({ companyId, accountSid, authToken, apiKey, apiSecret, phoneNumber }),
        });
        const data = await res.json();

        resultEl.style.display = 'block';
        if (res.ok && data.success) {
            resultEl.style.background = 'rgba(16,185,129,0.1)';
            resultEl.style.border = '1px solid rgba(16,185,129,0.3)';
            resultEl.style.color = '#059669';
            resultEl.innerHTML = `
                ✅ <strong>${data.message}</strong><br>
                <small style="direction:ltr;display:block;margin-top:6px;">
                    TwiML App SID: ${data.twimlAppSid || '—'} &nbsp;|&nbsp; رقم: ${data.phoneNumber || phoneNumber || '—'}
                </small>
            `;
            // Refresh companies list so the card shows updated status
            await loadCompanies();
            // Close after 2 seconds
            setTimeout(closeTwilioSetup, 2000);
        } else {
            resultEl.style.background = 'rgba(231,76,60,0.1)';
            resultEl.style.border = '1px solid rgba(231,76,60,0.3)';
            resultEl.style.color = '#e74c3c';
            resultEl.innerHTML = `❌ <strong>${data.error || 'فشل الحفظ'}</strong>${data.details ? `<br><small>${data.details}</small>` : ''}`;
        }
    } catch (err) {
        resultEl.style.display = 'block';
        resultEl.style.background = 'rgba(231,76,60,0.1)';
        resultEl.style.color = '#e74c3c';
        resultEl.textContent = '❌ خطأ في الاتصال: ' + err.message;
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 حفظ الإعداد';
    }
}

async function deleteTwilioSetup() {
    const companyId = document.getElementById('twilio-company-id').value;
    if (!confirm('⚠️ هل أنت متأكد من إزالة إعدادات Twilio؟\nسيتم الرجوع إلى الإعدادات الافتراضية.')) return;

    const resultEl = document.getElementById('twilio-setup-result');
    try {
        const res  = await fetch(`${baseUrl}/api/twilio-setup?companyId=${companyId}`, {
            method: 'DELETE',
            headers: { Authorization: adminToken },
        });
        const data = await res.json();
        resultEl.style.display = 'block';
        if (res.ok && data.success) {
            resultEl.style.background = 'rgba(16,185,129,0.1)';
            resultEl.style.color = '#059669';
            resultEl.textContent = '✅ ' + data.message;
            await loadCompanies();
            setTimeout(closeTwilioSetup, 1500);
        } else {
            resultEl.style.background = 'rgba(231,76,60,0.1)';
            resultEl.style.color = '#e74c3c';
            resultEl.textContent = '❌ ' + (data.error || 'فشل الحذف');
        }
    } catch (err) {
        resultEl.style.display = 'block';
        resultEl.style.color = '#e74c3c';
        resultEl.textContent = '❌ خطأ: ' + err.message;
    }
}

function toggleTwilioTokenVis(fieldId, btn) {
    const inp = document.getElementById(fieldId);
    if (inp.type === 'password') { inp.type = 'text';     btn.textContent = '🙈'; }
    else                         { inp.type = 'password'; btn.textContent = '👁️'; }
}

// Close modal on outside click
document.getElementById('twilio-setup-modal')?.addEventListener('click', function(e) {
    if (e.target === this) closeTwilioSetup();
});

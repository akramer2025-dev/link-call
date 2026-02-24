// ========== لوحة تحكم المطور - Link Call ==========
console.log('🛠️ Admin Dashboard Loaded');

// التحقق من صلاحية الدخول
function checkAdminAccess() {
    const userRole = sessionStorage.getItem('userRole');
    const username = sessionStorage.getItem('username');
    
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
const baseUrl = window.location.origin;
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
function playRecording(url) {
    window.open(url, '_blank');
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
                    <audio controls src="${call.recordingUrl}" style="width: 100%; margin-top: 10px;"></audio>
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
        const response = await fetch(`${baseUrl}/companies`);
        if (response.ok) {
            const data = await response.json();
            allCompanies = data.companies || [];
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
            <div class="company-actions">
                <button class="btn-view" onclick="viewCompany('${company.id}')">👁️ عرض</button>
                <button class="btn-edit" onclick="editCompany('${company.id}')">✏️ تعديل</button>
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
    
    try {
        const response = await fetch(`${baseUrl}/companies/${companyId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
        });
        
        if (response.ok) {
            alert('✅ تم تحديث الشركة');
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
        const response = await fetch(`${baseUrl}/companies/${companyId}`, {
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
    
    const data = {
        name: document.getElementById('company-name').value,
        adminUsername: document.getElementById('company-admin-username').value,
        adminName: document.getElementById('company-admin-name').value,
        adminPassword: document.getElementById('company-admin-password').value,
        subscription: document.getElementById('company-subscription').value
    };
    
    try {
        const response = await fetch(`${baseUrl}/companies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            alert(`✅ تم إنشاء الشركة بنجاح!\n\nاسم المستخدم: ${result.admin.username}\nيمكن للمدير الدخول الآن.`);
            document.getElementById('add-company-modal').classList.remove('active');
            document.getElementById('add-company-form').reset();
            loadCompanies();
        } else {
            alert('❌ ' + (result.error || 'خطأ في إنشاء الشركة'));
        }
    } catch (error) {
        alert('❌ خطأ في الاتصال بالخادم');
    }
});

console.log('✅ Admin Dashboard Ready');

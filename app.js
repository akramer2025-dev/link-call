// معلومات Twilio
const TWILIO_PHONE_NUMBER = '+13204336644';
let currentCallSid = null;
let callStartTime;
let callTimer;
let isRecording = false;
let callCheckInterval = null;
let phoneNumber = ''; // متغير لتخزين رقم الهاتف

// 🔥 DEBUG: طباعة معلومات في بداية التحميل
console.log('🔥 app.js loaded - Version: 2.0.20251218');
console.log('🔥 Current URL:', window.location.href);

// عناصر الواجهة
const displayNumber = document.getElementById('display-number');
const dialpad = document.getElementById('dialpad');
const callScreen = document.getElementById('call-screen');
const callHistoryList = document.getElementById('call-history-list');
const contactsList = document.getElementById('contacts-list');
const recordingsList = document.getElementById('recordings-list');
const settingsPanel = document.getElementById('settings-panel');
const callBtn = document.getElementById('call-btn');
const endCallBtn = document.getElementById('end-call-btn');
const muteBtn = document.getElementById('mute-btn');
const holdBtn = document.getElementById('hold-btn');
const connectionStatus = document.getElementById('connection-status');
const statusText = document.getElementById('status-text');
const callNumber = document.getElementById('call-number');
const callStatus = document.getElementById('call-status');
const callDuration = document.getElementById('call-duration');
const recordingStatus = document.getElementById('recording-status');
const recordingsContainer = document.getElementById('recordings-container');

// أزرار القائمة الجانبية
const dialpadBtn = document.getElementById('dialpad-btn');
const callHistoryBtn = document.getElementById('call-history-btn');
const contactsBtn = document.getElementById('contacts-btn');
const recordingsBtn = document.getElementById('recordings-btn');
const settingsBtn = document.getElementById('settings-btn');
const workReportsBtn = document.getElementById('work-reports-btn');

// تحقق من وجود الأزرار
console.log('Buttons loaded:', {
    dialpadBtn: !!dialpadBtn,
    callHistoryBtn: !!callHistoryBtn,
    contactsBtn: !!contactsBtn,
    recordingsBtn: !!recordingsBtn,
    settingsBtn: !!settingsBtn,
    workReportsBtn: !!workReportsBtn
});

// المتغيرات
let isMuted = false;
let isOnHold = false;
let recordings = [];
let device = null;
let currentCall = null;

// قراءة بيانات من URL قبل أي شيء
const urlParams = new URLSearchParams(window.location.search);
const phoneFromUrl = urlParams.get('phone');
const autoLogin = urlParams.get('autoLogin');
const employeeId = urlParams.get('employeeId');
const employeeName = urlParams.get('employeeName');

console.log('🔍 قراءة URL Parameters:');
console.log('  - URL الكامل:', window.location.href);
console.log('  - phone:', phoneFromUrl);
console.log('  - autoLogin:', autoLogin);
console.log('  - employeeId:', employeeId);
console.log('  - employeeName:', employeeName);

// تسجيل دخول تلقائي إذا جاء من CRM
if (autoLogin === 'true' && employeeId && employeeName) {
    console.log('🔐 تسجيل دخول تلقائي من CRM:', employeeName);
    
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('username', employeeId);
    sessionStorage.setItem('userRole', 'employee');
    sessionStorage.setItem('fullname', decodeURIComponent(employeeName));
    sessionStorage.setItem('employeeId', employeeId);
    localStorage.setItem('employeeId', employeeId);
    localStorage.setItem('employeeName', decodeURIComponent(employeeName));
}

// إذا كان هناك رقم، نخزنه
if (phoneFromUrl) {
    phoneNumber = phoneFromUrl;
    console.log('📞 تم استقبال رقم من URL:', phoneFromUrl);
    console.log('📞 تم حفظ الرقم في phoneNumber:', phoneNumber);
} else {
    console.log('⚠️ لا يوجد رقم في URL');
}

// تهيئة التطبيق مع Twilio Voice SDK v2
async function initializeApp() {
    try {
        console.log('🔄 جاري تهيئة Twilio Device...');
        updateConnectionStatus('connecting', 'جاري الاتصال...');
        
        // عرض الرقم إذا كان موجود
        if (phoneNumber) {
            console.log('📱 عرض الرقم في الشاشة:', phoneNumber);
            displayNumber.textContent = phoneNumber;
            updateDeleteButton();
        } else {
            console.log('⚠️ phoneNumber فارغ في initializeApp');
        }
        // طلب إذن الميكروفون أولاً
        try {
            console.log('🎤 طلب إذن الميكروفون...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('✅ تم الحصول على إذن الميكروفون');
            // إيقاف الـ stream بعد الحصول على الإذن
            stream.getTracks().forEach(track => track.stop());
        } catch (micError) {
            console.error('❌ فشل الحصول على إذن الميكروفون:', micError);
            alert('يرجى السماح باستخدام الميكروفون لإجراء المكالمات');
            throw new Error('لم يتم منح إذن الميكروفون');
        }
        
        // انتظار تحميل Twilio SDK
        let attempts = 0;
        while (typeof Twilio === 'undefined' && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof Twilio === 'undefined' || !Twilio.Device) {
            throw new Error('Twilio SDK غير محمل. تأكد من الاتصال بالإنترنت.');
        }
        
        console.log('✅ Twilio SDK محمل بنجاح');
        
        // الحصول على Access Token
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/token?identity=employee_${Date.now()}`);
        const data = await response.json();
        
        if (!data.token) {
            throw new Error('فشل الحصول على Token');
        }
        
        console.log('✅ تم الحصول على Token');
        
        device = new Twilio.Device(data.token, {
            codecPreferences: ['opus', 'pcmu'],
            fakeLocalDTMF: true,
            enableRingingState: true,
            logLevel: 1
        });
        
        // معالجة الأحداث
        device.on('registered', () => {
            console.log('✅ Device مسجل ومستعد');
            updateConnectionStatus('connected', 'جاهز للمكالمات 📞');
            
            // تأكد من تفعيل AudioContext
            if (device.audio) {
                try {
                    device.audio._audioContext?.resume();
                } catch (e) {
                    console.warn('⚠️ تعذر استئناف AudioContext:', e);
                }
            }
            
            // إذا جاء من CRM، ابدأ المكالمة تلقائياً
            if (phoneFromUrl && phoneNumber) {
                console.log('🔄 بدء المكالمة تلقائياً مع:', phoneNumber);
                console.log('📞 الرقم المستخدم:', phoneNumber);
                setTimeout(() => {
                    makeCall();
                }, 1500); // تأخير 1.5 ثانية
            }
        });
        
        device.on('error', (error) => {
            console.error('❌ خطأ في Device:', error);
            updateConnectionStatus('error', 'خطأ: ' + error.message);
        });
        
        device.on('incoming', (call) => {
            console.log('📱 مكالمة واردة من:', call.parameters.From);
            handleIncomingCall(call);
        });
        
        // تسجيل الـ Device
        await device.register();
        
        // تحميل التسجيلات
        loadRecordings();
        
    } catch (error) {
        console.error('❌ خطأ في التهيئة:', error);
        updateConnectionStatus('error', 'خطأ: ' + error.message);
        alert('فشل الاتصال بالخادم. تأكد من أن الخادم يعمل.');
    }
}

// تحديث حالة الاتصال
function updateConnectionStatus(status, message) {
    connectionStatus.className = `connection-status ${status}`;
    statusText.textContent = message;
}

// تحديث حالة المكالمة
function updateCallStatus(status) {
    callStatus.textContent = status;
}

// إضافة رقم إلى الشاشة
function addDigit(digit) {
    phoneNumber += digit;
    displayNumber.textContent = phoneNumber;
    updateDeleteButton();
}

// حذف آخر رقم
function deleteDigit() {
    phoneNumber = phoneNumber.slice(0, -1);
    displayNumber.textContent = phoneNumber || '';
    updateDeleteButton();
}

// تحديث زر الحذف
function updateDeleteButton() {
    const deleteBtn = document.getElementById('delete-btn');
    if (deleteBtn) {
        if (phoneNumber.length > 0) {
            deleteBtn.classList.remove('hidden');
        } else {
            deleteBtn.classList.add('hidden');
        }
    }
}

// إجراء مكالمة باستخدام REST API
async function makeCall() {
    if (!phoneNumber) {
        alert('الرجاء إدخال رقم الهاتف');
        return;
    }

    // تحويل الرقم للصيغة الدولية
    let formattedNumber = phoneNumber.replace(/[\s-]/g, '');
    
    // تحويل الأرقام السعودية
    if (formattedNumber.startsWith('05')) {
        formattedNumber = '+966' + formattedNumber.substring(1);
    } else if (formattedNumber.startsWith('00966')) {
        formattedNumber = '+' + formattedNumber.substring(2);
    } else if (formattedNumber.startsWith('9665') && !formattedNumber.startsWith('+')) {
        formattedNumber = '+' + formattedNumber;
    }
    // تحويل الأرقام المصرية (01, 010, 011, 012, 015, 017)
    else if (formattedNumber.startsWith('01') && formattedNumber.length === 11) {
        formattedNumber = '+20' + formattedNumber.substring(1);
    } else if (formattedNumber.startsWith('0020')) {
        formattedNumber = '+' + formattedNumber.substring(2);
    } else if (formattedNumber.startsWith('201') && !formattedNumber.startsWith('+') && formattedNumber.length === 12) {
        formattedNumber = '+' + formattedNumber;
    }
    // إذا لم يبدأ بـ + ولم يكن رقم محلي معروف
    else if (!formattedNumber.startsWith('+') && formattedNumber.length > 10) {
        formattedNumber = '+' + formattedNumber;
    }
    // إذا رقم قصير (محلي سعودي)
    else if (!formattedNumber.startsWith('+') && formattedNumber.length <= 10) {
        formattedNumber = '+966' + formattedNumber;
    }

    console.log('📞 اتصال مباشر إلى:', formattedNumber);
    
    try {
        if (!device) {
            throw new Error('Device غير جاهز. أعد تحميل الصفحة.');
        }
        
        // إظهار شاشة المكالمة
        dialpad.classList.add('hidden');
        callScreen.classList.remove('hidden');
        
        // عرض اسم الموظف
        const employeeName = sessionStorage.getItem('fullname') || sessionStorage.getItem('username') || 'موظف';
        const callEmployeeName = document.getElementById('call-employee-name');
        if (callEmployeeName) {
            callEmployeeName.textContent = `👤 ${employeeName}`;
        }
        
        // عرض رقم الهاتف
        callNumber.textContent = `📞 ${formattedNumber}`;
        updateCallStatus('جاري الاتصال...');
        
        // إجراء المكالمة عبر Device
        console.log('📞 جاري الاتصال بـ:', formattedNumber);
        
        // التأكد من إذن الميكروفون قبل المكالمة
        try {
            const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('✅ الميكروفون جاهز للمكالمة');
            testStream.getTracks().forEach(track => track.stop());
        } catch (micError) {
            console.error('❌ الميكروفون غير متاح:', micError);
            alert('يرجى السماح باستخدام الميكروفون');
            endCall();
            return;
        }
        
        const employeeId = localStorage.getItem('employeeId') || 'unknown';
        
        const params = {
            To: formattedNumber,
            employeeId: employeeId  // إرسال معرف المدير
        };
        
        console.log('👤 معرف المدير للمكالمة:', employeeId);
        
        currentCall = await device.connect({ params });
        
        // معالجة أحداث المكالمة
        currentCall.on('accept', () => {
            console.log('📞 المكالمة بدأت - جاري الاتصال بالعميل...');
            updateCallStatus('جاري الاتصال... 📞');
            // لا نبدأ العداد هنا - ننتظر العميل يرد
        });
        
        currentCall.on('ringing', () => {
            console.log('📞 الرنين...');
            updateCallStatus('جاري الاتصال... 🔔');
        });
        
        // هذا الحدث يُطلق عندما يرد العميل فعلياً
        currentCall.on('connected', () => {
            console.log('✅ العميل رد على المكالمة - بدء العداد');
            updateCallStatus('متصل ✅');
            startCallTimer(); // نبدأ العداد هنا فقط
        });
        
        currentCall.on('disconnect', () => {
            console.log('⏹️ انتهت المكالمة');
            endCall();
        });
        
        currentCall.on('cancel', () => {
            console.log('🚫 تم إلغاء المكالمة');
            endCall();
        });
        
        currentCall.on('reject', () => {
            console.log('❌ تم رفض المكالمة');
            endCall();
        });
        
        currentCall.on('error', (error) => {
            console.error('❌ خطأ في المكالمة:', error);
            alert('خطأ في المكالمة: ' + error.message);
            endCall();
        });
        
    } catch (error) {
        console.error('❌ خطأ في المكالمة:', error);
        alert('فشل إجراء المكالمة: ' + error.message);
        endCall();
    }
}

// معالجة مكالمة واردة
function handleIncomingCall(call) {
    if (confirm(`مكالمة واردة من ${call.parameters.From}. هل تريد الرد؟`)) {
        currentCall = call;
        call.accept();
        
        dialpad.classList.add('hidden');
        callScreen.classList.remove('hidden');
        
        // عرض اسم الموظف
        const employeeName = sessionStorage.getItem('fullname') || sessionStorage.getItem('username') || 'موظف';
        const callEmployeeName = document.getElementById('call-employee-name');
        if (callEmployeeName) {
            callEmployeeName.textContent = `👤 ${employeeName}`;
        }
        
        // عرض رقم الهاتف
        callNumber.textContent = `📞 ${call.parameters.From}`;
        updateCallStatus('متصل ✅');
        startCallTimer(); // في المكالمة الواردة نبدأ العداد فوراً لأننا نحن من ردينا
        
        call.on('disconnect', () => {
            endCall();
        });
    } else {
        call.reject();
    }
}

// مراقبة حالة المكالمة (لن تُستخدم مع SDK)
function startCallMonitoring() {
    // لا حاجة لها مع SDK - الأحداث تُعالج مباشرة
    if (callCheckInterval) {
        clearInterval(callCheckInterval);
    }
    
    callCheckInterval = setInterval(async () => {
        if (!currentCallSid) {
            clearInterval(callCheckInterval);
            return;
        }
        
        try {
            const baseUrl = window.location.origin;
            const response = await fetch(`${baseUrl}/call-status/${currentCallSid}`);
            const data = await response.json();
            
            if (data.status === 'completed' || data.status === 'failed' || data.status === 'canceled' || 
                data.status === 'busy' || data.status === 'no-answer') {
                endCall();
            } else if (data.status === 'in-progress') {
                updateCallStatus('متصل ✅');
                if (!callTimer) startCallTimer();
            } else if (data.status === 'ringing') {
                updateCallStatus('جاري الاتصال... 📞');
            }
        } catch (error) {
            console.error('خطأ في مراقبة المكالمة:', error);
        }
    }, 2000);
}

// إنهاء المكالمة
async function endCall() {
    if (callCheckInterval) {
        clearInterval(callCheckInterval);
        callCheckInterval = null;
    }
    
    // إنهاء المكالمة عبر SDK
    if (currentCall) {
        try {
            currentCall.disconnect();
            console.log('✅ تم إنهاء المكالمة');
        } catch (error) {
            console.error('خطأ في إنهاء المكالمة:', error);
        }
        currentCall = null;
    }
    
    // حفظ المكالمة في السجل
    if (phoneNumber) {
        const callDurationText = callDuration.textContent;
        const [minutes, seconds] = callDurationText.split(':').map(Number);
        const totalSeconds = (minutes * 60) + seconds;
        
        saveCallToHistory({
            to: phoneNumber,
            direction: 'outbound',
            status: 'completed',
            startTime: new Date().toISOString(),
            duration: callDurationText
        });
        
        // تسجيل المكالمة في سجل العمل
        try {
            const employeeId = localStorage.getItem('employeeId');
            const employeeName = localStorage.getItem('employeeName');
            const baseUrl = window.location.origin;
            
            fetch(`${baseUrl}/work-tracking`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'activity',
                    employeeId: employeeId,
                    employeeName: employeeName,
                    data: {
                        type: 'call',
                        details: {
                            phoneNumber: phoneNumber,
                            duration: totalSeconds,
                            durationText: callDurationText,
                            status: 'completed',
                            timestamp: new Date().toISOString()
                        }
                    }
                })
            }).catch(err => console.error('خطأ في تسجيل المكالمة:', err));
        } catch (error) {
            console.error('خطأ في تسجيل المكالمة:', error);
        }
    }
    
    currentCallSid = null;
    
    stopCallTimer();
    stopRecording();
    
    // العودة إلى لوحة الأرقام
    callScreen.classList.add('hidden');
    dialpad.classList.remove('hidden');
    
    // مسح الرقم
    phoneNumber = '';
    displayNumber.textContent = '';
    callDuration.textContent = '00:00';
    updateDeleteButton();
    
    isMuted = false;
    isOnHold = false;
    
    updateConnectionStatus('connected', 'جاهز للمكالمات');
}

// بدء عداد المكالمة
function startCallTimer() {
    callStartTime = Date.now();
    callTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        callDuration.textContent = `${minutes}:${seconds}`;
    }, 1000);
}

// إيقاف عداد المكالمة
function stopCallTimer() {
    if (callTimer) {
        clearInterval(callTimer);
        callTimer = null;
    }
}

// كتم الصوت
function toggleMute() {
    if (!currentCall) return;
    
    isMuted = !isMuted;
    
    // استخدام SDK لكتم الصوت
    currentCall.mute(isMuted);
    console.log(isMuted ? '🔇 تم كتم الصوت' : '🔊 تم إلغاء كتم الصوت');
    
    muteBtn.style.background = isMuted ? '#f44336' : '#f5f5f5';
    muteBtn.style.color = isMuted ? 'white' : 'black';
}

// إيقاف مؤقت
function toggleHold() {
    if (!currentCallSid) return;
    
    isOnHold = !isOnHold;
    
    if (isOnHold) {
        updateCallStatus('في الانتظار');
    } else {
        updateCallStatus('متصل');
    }
    
    holdBtn.style.background = isOnHold ? '#ff9800' : '#f5f5f5';
    holdBtn.style.color = isOnHold ? 'white' : 'black';
}

// بدء التسجيل
async function startRecording() {
    if (!currentCallSid) return;
    
    try {
        const callSid = currentCallSid;
        const response = await fetch('http://localhost:3000/start-recording', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ callSid })
        });
        
        const data = await response.json();
        
        if (data.success) {
            isRecording = true;
            recordingStatus.classList.remove('hidden');
            console.log('بدأ التسجيل:', data.recordingSid);
        }
    } catch (error) {
        console.error('خطأ في بدء التسجيل:', error);
    }
}

// إيقاف التسجيل
async function stopRecording() {
    if (!isRecording || !currentCallSid) return;
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/stop-recording`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callSid: currentCallSid })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('⏹️ تم إيقاف التسجيل');
        }
    } catch (error) {
        console.error('خطأ في إيقاف التسجيل:', error);
    }
    
    recordingStatus.classList.add('hidden');
    isRecording = false;
    
    // إعادة تحميل قائمة التسجيلات
    setTimeout(() => loadRecordings(), 2000);
}

// تحميل التسجيلات
async function loadRecordings() {
    try {
        const userRole = sessionStorage.getItem('userRole');
        const canViewOwn = sessionStorage.getItem('canViewOwnRecordings') === 'true';
        const canViewAll = sessionStorage.getItem('canViewAllRecordings') === 'true';
        
        // التحقق من الصلاحيات
        if (userRole !== 'admin' && !canViewOwn && !canViewAll) {
            recordingsContainer.innerHTML = '<p style="text-align: center; color: #ff6b6b; padding: 20px;">⚠️ ليس لديك صلاحية لمشاهدة التسجيلات</p>';
            updateRecordingsBadge(0);
            return;
        }
        
        const baseUrl = window.location.origin;
        const employeeId = localStorage.getItem('employeeId');
        
        console.log('📋 جلب التسجيلات - employeeId:', employeeId, 'userRole:', userRole, 'canViewAll:', canViewAll);
        
        // بناء URL مع المعاملات
        let url = `${baseUrl}/recordings`;
        const params = new URLSearchParams();
        
        // إذا كان مدير وليس لديه صلاحية رؤية الكل
        if (employeeId && !canViewAll && userRole !== 'admin') {
            params.append('employeeId', employeeId);
            console.log('🔒 فلترة التسجيلات للمدير:', employeeId);
        } else {
            params.append('viewAll', 'true');
            console.log('🌐 عرض جميع التسجيلات');
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        console.log('🌐 URL:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        recordings = data.recordings || [];
        
        console.log(`📊 تم جلب ${recordings.length} تسجيل`);
        
        // عرض تفاصيل كل تسجيل للتشخيص
        recordings.forEach((rec, idx) => {
            console.log(`📼 تسجيل ${idx + 1}:`, {
                sid: rec.sid,
                to: rec.to,
                employeeId: rec.employeeId,
                callSid: rec.callSid,
                duration: rec.duration
            });
        });
        
        // جلب بيانات المديرين لعرض الأسماء
        const employeesResponse = await fetch(`${baseUrl}/employees`);
        const employeesData = await employeesResponse.json();
        window.employeesMap = {};
        if (employeesData && employeesData.employees) {
            employeesData.employees.forEach(emp => {
                window.employeesMap[emp.id] = emp.name;
            });
        }
        console.log('👥 تم تحميل بيانات', Object.keys(window.employeesMap).length, 'مدير');
        
        displayRecordings();
        updateRecordingsBadge(recordings.length);
        
    } catch (error) {
        console.error('خطأ في تحميل التسجيلات:', error);
    }
}

// تحديث عدد التسجيلات في الشارة
function updateRecordingsBadge(count) {
    const badge = document.getElementById('recordings-badge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

// عرض التسجيلات
function displayRecordings() {
    recordingsContainer.innerHTML = '';
    
    if (recordings.length === 0) {
        recordingsContainer.innerHTML = '<p style="text-align: center; color: #666;">لا توجد تسجيلات</p>';
        return;
    }
    
    // الحصول على اسم المستخدم الحالي
    const currentUser = sessionStorage.getItem('fullname') || sessionStorage.getItem('username') || 'غير معروف';
    
    recordings.forEach((recording, index) => {
        const item = document.createElement('div');
        item.className = 'recording-item';
        
        const date = new Date(recording.dateCreated);
        const formattedDate = date.toLocaleDateString('ar-EG', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // استخراج رقم الهاتف (الرقم المتصل به)
        let phoneNumber = recording.to || 'غير محدد';
        console.log(`📞 رقم التسجيل ${index + 1}:`, recording.to, '→', phoneNumber);
        
        // تنظيف رقم الهاتف
        if (phoneNumber !== 'غير محدد' && phoneNumber.startsWith('+')) {
            phoneNumber = phoneNumber.substring(1);
        }
        
        // الحصول على اسم المدير من employeeId
        console.log(`👤 employeeId للتسجيل ${index + 1}:`, recording.employeeId);
        const employeeName = window.employeesMap && recording.employeeId 
            ? (window.employeesMap[recording.employeeId] || window.employeesMap[String(recording.employeeId)] || 'غير معروف')
            : 'غير معروف';
        console.log(`✅ اسم الموظف للتسجيل ${index + 1}:`, employeeName);
        
        // حساب المدة بالدقائق والثواني
        const duration = recording.duration || 0;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        const durationText = minutes > 0 ? `${minutes} د ${seconds} ث` : `${seconds} ث`;
        
        // التحقق من صلاحية الحذف
        const userRole = sessionStorage.getItem('userRole');
        const canDelete = sessionStorage.getItem('canDeleteRecordings') === 'true';
        const showDeleteBtn = userRole === 'admin' || canDelete;
        
        item.innerHTML = `
            <div class="recording-info">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <span style="font-size: 24px;">📞</span>
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div class="recording-number" style="font-weight: bold; font-size: 16px; color: #333;">
                                ${phoneNumber}
                            </div>
                            <button onclick="copyPhoneNumber('${phoneNumber}')" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 4px; transition: all 0.3s;" title="نسخ الرقم">
                                📋 نسخ
                            </button>
                        </div>
                        <div style="font-size: 12px; color: #666;">
                            بواسطة: ${employeeName}
                        </div>
                    </div>
                </div>
                <div class="recording-date" style="font-size: 13px; color: #888;">
                    📅 ${formattedDate} • ⏱️ ${durationText}
                </div>
            </div>
            <div class="recording-controls">
                <button class="play-btn" onclick="playRecording('${recording.sid}')" style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                    ▶️ تشغيل
                </button>
                <button class="download-btn" onclick="downloadRecording('${recording.sid}', '${phoneNumber}')" style="background: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                    ⬇️ تحميل
                </button>
                ${showDeleteBtn ? `
                <button class="delete-btn" onclick="deleteRecording('${recording.sid}')" style="background: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                    🗑️ حذف
                </button>
                ` : ''}
            </div>
        `;
        
        recordingsContainer.appendChild(item);
    });
}

// متغير لحفظ المشغل الحالي
let currentAudio = null;
let currentPlayButton = null;

// تشغيل التسجيل
async function playRecording(recordingSid) {
    try {
        // إيقاف أي تسجيل يعمل حالياً
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
            if (currentPlayButton) {
                currentPlayButton.innerHTML = '▶️ تشغيل';
                currentPlayButton.style.background = '#4CAF50';
            }
        }
        
        const baseUrl = window.location.origin;
        const audioUrl = `${baseUrl}/play-recording/${recordingSid}`;
        const audio = new Audio(audioUrl);
        
        // البحت عن زر التشغيل
        const playBtn = event.target;
        currentPlayButton = playBtn;
        
        // تغيير الزر لـ "إيقاف"
        playBtn.innerHTML = '⏸️ إيقاف';
        playBtn.style.background = '#ff9800';
        
        audio.play();
        currentAudio = audio;
        
        console.log('🎵 تشغيل التسجيل:', recordingSid);
        
        // عند انتهاء التسجيل
        audio.onended = () => {
            playBtn.innerHTML = '▶️ تشغيل';
            playBtn.style.background = '#4CAF50';
            currentAudio = null;
            currentPlayButton = null;
        };
        
        // عند الضغط على الزر مرة أخرى (لإيقاف)
        playBtn.onclick = (e) => {
            e.preventDefault();
            if (currentAudio && !currentAudio.paused) {
                currentAudio.pause();
                playBtn.innerHTML = '▶️ تشغيل';
                playBtn.style.background = '#4CAF50';
                currentAudio = null;
                currentPlayButton = null;
            } else {
                playRecording(recordingSid);
            }
        };
        
    } catch (error) {
        console.error('خطأ في تشغيل التسجيل:', error);
        alert('فشل تشغيل التسجيل');
        if (currentPlayButton) {
            currentPlayButton.innerHTML = '▶️ تشغيل';
            currentPlayButton.style.background = '#4CAF50';
        }
    }
}

// حذف التسجيل
async function deleteRecording(recordingSid) {
    // التحقق من الصلاحية
    const userRole = sessionStorage.getItem('userRole');
    const canDelete = sessionStorage.getItem('canDeleteRecordings') === 'true';
    
    if (userRole !== 'admin' && !canDelete) {
        alert('⚠️ ليس لديك صلاحية لحذف التسجيلات');
        return;
    }
    
    if (!confirm('هل أنت متأكد من حذف هذا التسجيل؟')) {
        return;
    }
    
    try {
        console.log('🗑️ جاري حذف التسجيل:', recordingSid);
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/delete-recording/${recordingSid}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ تم حذف التسجيل');
            alert('✅ تم حذف التسجيل بنجاح');
            loadRecordings(); // إعادة تحميل القائمة
        } else {
            throw new Error(data.error || 'فشل حذف التسجيل');
        }
    } catch (error) {
        console.error('❌ خطأ في حذف التسجيل:', error);
        alert('❌ فشل حذف التسجيل: ' + error.message);
    }
}

// تحميل التسجيل مباشرة
async function downloadRecording(recordingSid, phoneNumber) {
    try {
        console.log('⬇️ جاري تحميل التسجيل:', recordingSid);
        
        const baseUrl = window.location.origin;
        
        // تحميل مباشر من السيرفر
        const downloadUrl = `${baseUrl}/download-recording/${recordingSid}`;
        
        // إنشاء رابط تحميل
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `recording_${phoneNumber}_${recordingSid}.mp3`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        console.log('✅ تم بدء التحميل');
    } catch (error) {
        console.error('❌ خطأ في تحميل التسجيل:', error);
        alert('فشل تحميل التسجيل: ' + error.message);
    }
}

// نسخ رقم الهاتف
async function copyPhoneNumber(phoneNumber) {
    try {
        // إضافة + إذا لم يكن موجود
        let formattedNumber = phoneNumber;
        if (!formattedNumber.startsWith('+')) {
            formattedNumber = '+' + formattedNumber;
        }
        
        await navigator.clipboard.writeText(formattedNumber);
        
        // إظهار رسالة نجاح
        const event = window.event;
        const button = event.target.closest('button');
        const originalText = button.innerHTML;
        
        button.innerHTML = '✅ تم النسخ';
        button.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        }, 2000);
        
        console.log('✅ تم نسخ الرقم:', formattedNumber);
    } catch (error) {
        console.error('❌ خطأ في نسخ الرقم:', error);
        
        // طريقة بديلة للنسخ
        try {
            const textArea = document.createElement('textarea');
            textArea.value = phoneNumber.startsWith('+') ? phoneNumber : '+' + phoneNumber;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            const event = window.event;
            const button = event.target.closest('button');
            const originalText = button.innerHTML;
            
            button.innerHTML = '✅ تم النسخ';
            button.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
            }, 2000);
            
            console.log('✅ تم نسخ الرقم (طريقة بديلة)');
        } catch (err) {
            alert('فشل نسخ الرقم: ' + error.message);
        }
    }
}

// معالجة أزرار لوحة الأرقام
document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const digit = btn.dataset.num;
        addDigit(digit);
        
        // DTMF غير متاح في REST API
    });
});

// معالجة أزرار التحكم
callBtn.addEventListener('click', makeCall);
endCallBtn.addEventListener('click', endCall);
muteBtn.addEventListener('click', toggleMute);
holdBtn.addEventListener('click', toggleHold);

// دالة لإخفاء جميع الأقسام
function hideAllSections() {
    dialpad.classList.add('hidden');
    callHistoryList.classList.add('hidden');
    contactsList.classList.add('hidden');
    recordingsList.classList.add('hidden');
    settingsPanel.classList.add('hidden');
    const workReportsPanel = document.getElementById('work-reports-panel');
    if (workReportsPanel) workReportsPanel.classList.add('hidden');
}

// دالة لإزالة التفعيل من جميع أزرار القائمة
function removeAllActiveStates() {
    dialpadBtn.classList.remove('active');
    callHistoryBtn.classList.remove('active');
    contactsBtn.classList.remove('active');
    recordingsBtn.classList.remove('active');
    settingsBtn.classList.remove('active');
    if (workReportsBtn) workReportsBtn.classList.remove('active');
}

// عرض الإعدادات
function showSettings() {
    hideAllSections();
    removeAllActiveStates();
    settingsPanel.classList.remove('hidden');
    settingsBtn.classList.add('active');
    // التركيز على حقل رقم الهاتف
    const userPhoneInput = document.getElementById('user-phone-number');
    if (userPhoneInput) {
        setTimeout(() => userPhoneInput.focus(), 100);
    }
}

// معالجة أزرار القائمة
if (dialpadBtn) {
    dialpadBtn.addEventListener('click', () => {
        console.log('Dialpad clicked');
        hideAllSections();
        removeAllActiveStates();
        dialpad.classList.remove('hidden');
        dialpadBtn.classList.add('active');
    });
}

if (callHistoryBtn) {
    callHistoryBtn.addEventListener('click', () => {
        console.log('Call history clicked');
        hideAllSections();
        removeAllActiveStates();
        callHistoryList.classList.remove('hidden');
        callHistoryBtn.classList.add('active');
        loadCallHistory();
    });
}

if (contactsBtn) {
    contactsBtn.addEventListener('click', () => {
        console.log('Contacts clicked');
        hideAllSections();
        removeAllActiveStates();
        contactsList.classList.remove('hidden');
        contactsBtn.classList.add('active');
        loadContacts();
    });
}

if (recordingsBtn) {
    recordingsBtn.addEventListener('click', () => {
        console.log('Recordings clicked');
        hideAllSections();
        removeAllActiveStates();
        recordingsList.classList.remove('hidden');
        recordingsBtn.classList.add('active');
        loadRecordings();
    });
}

if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        console.log('Settings clicked');
        hideAllSections();
        removeAllActiveStates();
        settingsPanel.classList.remove('hidden');
        settingsBtn.classList.add('active');
    });
}

if (workReportsBtn) {
    workReportsBtn.addEventListener('click', () => {
        console.log('Work Reports clicked');
        hideAllSections();
        removeAllActiveStates();
        document.getElementById('work-reports-panel').classList.remove('hidden');
        workReportsBtn.classList.add('active');
        
        // تعيين التواريخ الافتراضية (آخر 7 أيام)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        document.getElementById('report-end-date').valueAsDate = endDate;
        document.getElementById('report-start-date').valueAsDate = startDate;
    });
}

// زر تسجيل الخروج
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        if (confirm('هل تريد تسجيل الخروج؟')) {
            // تسجيل وقت الخروج
            try {
                const employeeId = localStorage.getItem('employeeId');
                const employeeName = localStorage.getItem('employeeName');
                const baseUrl = window.location.origin;
                
                await fetch(`${baseUrl}/work-tracking`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'logout',
                        employeeId: employeeId,
                        employeeName: employeeName
                    })
                });
            } catch (error) {
                console.error('خطأ في تسجيل وقت الخروج:', error);
            }
            
            sessionStorage.removeItem('isLoggedIn');
            sessionStorage.removeItem('username');
            window.location.href = 'login.html';
        }
    });
}

// ===== إدارة المديرين =====

// التحقق من صلاحية الوصول
function checkAdminAccess() {
    const username = sessionStorage.getItem('username');
    return username === 'akram';
}

// إخفاء/إظهار الأقسام حسب الصلاحية
const userRole = sessionStorage.getItem('userRole');
const employeesSection = document.getElementById('employees-section');
const adminAccountSection = document.getElementById('admin-account-section');
const adminAudioSection = document.getElementById('admin-audio-section');
const employeeProfileSection = document.getElementById('employee-profile-section');

if (userRole === 'admin') {
    // المطور يرى إدارة المديرين والإعدادات
    if (employeesSection) employeesSection.style.display = 'block';
    if (adminAccountSection) adminAccountSection.style.display = 'block';
    if (adminAudioSection) adminAudioSection.style.display = 'block';
    if (employeeProfileSection) employeeProfileSection.style.display = 'none';
} else {
    // المدير يرى فقط تعديل ملفه الشخصي
    if (employeesSection) employeesSection.style.display = 'none';
    if (adminAccountSection) adminAccountSection.style.display = 'none';
    if (adminAudioSection) adminAudioSection.style.display = 'none';
    if (employeeProfileSection) {
        employeeProfileSection.style.display = 'block';
        // تحميل بيانات المدير
        loadEmployeeProfile();
    }
}

// جلب المديرين من localStorage
function getEmployees() {
    const employees = localStorage.getItem('employees');
    return employees ? JSON.parse(employees) : [];
}

// حفظ المديرين في localStorage
function saveEmployees(employees) {
    localStorage.setItem('employees', JSON.stringify(employees));
}

// عرض قائمة المديرين
async function loadEmployeesList() {
    const userRole = sessionStorage.getItem('userRole');
    console.log('🔄 تحميل قائمة المديرين... Role:', userRole);
    
    if (userRole !== 'admin') {
        console.log('⚠️ المدير لا يمكنه رؤية قائمة المديرين');
        return;
    }
    
    const container = document.getElementById('employees-list-container');
    if (!container) {
        console.error('❌ لم يتم العثور على employees-list-container');
        return;
    }
    
    console.log('✅ Container موجود، جاري جلب البيانات...');
    
    try {
        const baseUrl = window.location.origin;
        console.log('🌐 جاري جلب البيانات من:', `${baseUrl}/employees`);
        
        const response = await fetch(`${baseUrl}/employees`);
        
        console.log('📡 استجابة السيرفر:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`خطأ في السيرفر: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('📊 البيانات المستلمة:', data);
        
        const employees = data.employees || [];
        
        console.log('👥 عدد المديرين:', employees.length);
        
        if (employees.length === 0) {
            container.innerHTML = '<p class="no-employees">لا يوجد مديرين مضافين. اضغط "إضافة مدير" لإضافة أول مدير.</p>';
            return;
        }
        
        container.innerHTML = employees.map(emp => {
            const perms = emp.permissions || {};
            const permsList = [];
            if (perms.viewOwnRecordings) permsList.push('📹 تسجيلات خاصة');
            if (perms.viewAllRecordings) permsList.push('📊 تسجيلات عامة');
            if (perms.deleteRecordings) permsList.push('🗑️ مسح');
            if (perms.editProfile) permsList.push('✏️ تعديل');
            
            return `
            <div class="employee-card">
                <div class="employee-header">
                    <div class="employee-info">
                        <h6>${emp.name}</h6>
                        <span class="employee-username">@${emp.username}</span>
                        <span class="employee-phone">📱 ${emp.phone || 'غير محدد'}</span>
                        <span class="employee-dept">📂 ${emp.departmentName}</span>
                        <div class="employee-perms" style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 5px;">
                            ${permsList.length > 0 
                                ? permsList.map(p => `<span style="background: #e3f2fd; padding: 3px 8px; border-radius: 12px; font-size: 11px;">${p}</span>`).join('') 
                                : '<span style="color: #999; font-size: 11px;">لا توجد صلاحيات</span>'}
                        </div>
                    </div>
                    <button class="delete-employee-btn" onclick="deleteEmployee(${emp.id}, '${emp.name.replace(/'/g, "\\'")}')" title="حذف">🗑️</button>
                </div>
            </div>
        `;
        }).join('');
    } catch (error) {
        console.error('❌ خطأ في تحميل المديرين:', error);
        console.error('تفاصيل الخطأ:', error.message, error.stack);
        container.innerHTML = `<p class="no-employees" style="color: #ff6b6b;">خطأ في تحميل البيانات<br><small>${error.message}</small></p>`;
    }
}

// الحصول على تسمية الصلاحية بالعربي
function getPermissionLabel(permission) {
    const labels = {
        'make_calls': '📞 مكالمات',
        'view_history': '📋 السجل',
        'view_recordings': '🎙️ تسجيلات',
        'manage_contacts': '👥 جهات الاتصال'
    };
    return labels[permission] || permission;
}

// إضافة مدير جديد
const addEmployeeBtn = document.getElementById('add-employee-btn');
if (addEmployeeBtn) {
    addEmployeeBtn.addEventListener('click', async (e) => {
        e.preventDefault(); // منع إعادة تحميل الصفحة
        
        if (!checkAdminAccess()) {
            alert('ليس لديك صلاحية للوصول لهذه الميزة!');
            return;
        }
        
        const username = document.getElementById('emp-username')?.value.trim();
        const password = document.getElementById('emp-password')?.value.trim();
        const name = document.getElementById('emp-fullname')?.value.trim();
        const phone = document.getElementById('emp-phone')?.value.trim() || '';
        const department = document.getElementById('emp-department')?.value;
        
        // جمع الصلاحيات
        const permissions = {
            viewOwnRecordings: document.getElementById('emp-perm-view-own-recordings')?.checked || false,
            viewAllRecordings: document.getElementById('emp-perm-view-all-recordings')?.checked || false,
            deleteRecordings: document.getElementById('emp-perm-delete-recordings')?.checked || false,
            editProfile: document.getElementById('emp-perm-edit-profile')?.checked || false
        };
        
        console.log('📝 بيانات المدير:', { username, name, department, permissions });
        
        if (!username || !password || !name || !department) {
            alert('الرجاء ملء جميع الحقول المطلوبة:\n- اسم المستخدم\n- كلمة المرور\n- الاسم الكامل\n- القسم');
            return;
        }
        
        // تعطيل الزر أثناء الحفظ
        addEmployeeBtn.disabled = true;
        addEmployeeBtn.textContent = '⏳ جاري الحفظ...';
        
        try {
            const baseUrl = window.location.origin;
            console.log('🔄 إرسال البيانات إلى:', `${baseUrl}/employees`);
            
            const response = await fetch(`${baseUrl}/employees`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password,
                    name,
                    phone,
                    department,
                    permissions
                })
            });
            
            console.log('📡 استجابة الخادم:', response.status);
            
            const data = await response.json();
            console.log('📄 البيانات المستلمة:', data);
            
            if (response.ok && data.success) {
                console.log('✅ تمت إضافة المدير بنجاح');
                
                // تنظيف النموذج
                document.getElementById('emp-username').value = '';
                document.getElementById('emp-password').value = '';
                document.getElementById('emp-fullname').value = '';
                document.getElementById('emp-phone').value = '';
                document.getElementById('emp-department').value = '';
                
                // إلغاء تحديد جميع الصلاحيات
                document.getElementById('emp-perm-view-own-recordings').checked = false;
                document.getElementById('emp-perm-view-all-recordings').checked = false;
                document.getElementById('emp-perm-delete-recordings').checked = false;
                document.getElementById('emp-perm-edit-profile').checked = false;
                
                // تحديث القائمة
                await loadEmployeesList();
                
                alert('✅ تم إضافة المدير بنجاح!\n\n' +
                      '👤 اسم المستخدم: ' + username + '\n' +
                      '🔑 كلمة المرور: ' + password + '\n' +
                      '📝 الاسم: ' + name);
            } else {
                console.error('❌ خطأ في إضافة المدير:', data);
                alert('❌ خطأ في إضافة المدير:\n' + (data.error || 'فشل في الحفظ'));
            }
        } catch (error) {
            console.error('❌ خطأ شبكة:', error);
            alert('❌ خطأ في الاتصال بالخادم:\n' + error.message);
        } finally {
            // إعادة تفعيل الزر
            addEmployeeBtn.disabled = false;
            addEmployeeBtn.textContent = '➕ إضافة مدير';
        }
    });
}

// حذف مدير
async function deleteEmployee(employeeId, fullname) {
    if (!checkAdminAccess()) {
        alert('ليس لديك صلاحية للوصول لهذه الميزة!');
        return;
    }
    
    if (!confirm(`هل تريد حذف المدير ${fullname}؟`)) {
        return;
    }
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/employees/${employeeId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadEmployeesList();
            alert('تم حذف المدير بنجاح! ✅');
        } else {
            alert('فشل في حذف المدير');
        }
    } catch (error) {
        console.error('خطأ في حذف مدير:', error);
        alert('فشل في حذف المدير');
    }
}

// جعل الدالة متاحة عالمياً
window.deleteEmployee = deleteEmployee;

// تحميل قائمة المديرين عند فتح الإعدادات
if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        console.log('⚙️ تم النقر على زر الإعدادات');
        setTimeout(() => {
            loadEmployeesList();
        }, 100); // انتظار قصير للتأكد من ظهور الـ container
    });
}

// تحميل القائمة عند تحميل الصفحة
setTimeout(() => {
    loadEmployeesList();
}, 500);

// عرض معلومات المستخدم في الهيدر
function displayUserInfo() {
    const username = sessionStorage.getItem('username');
    const fullname = sessionStorage.getItem('fullname');
    const role = sessionStorage.getItem('userRole');
    
    console.log('📋 معلومات المستخدم:', { username, fullname, role });
    
    const headerUsername = document.getElementById('header-username');
    const headerRole = document.getElementById('header-role');
    
    if (headerUsername) {
        // تأكد من عرض الاسم بشكل صحيح
        const displayName = fullname || username || 'مستخدم';
        console.log('✅ عرض الاسم:', displayName);
        headerUsername.textContent = displayName;
    }
    
    if (headerRole) {
        const roleText = role === 'admin' ? '👑 مطور رئيسي' : '👨‍💼 مدير';
        headerRole.textContent = roleText;
    }
}

// تحميل معلومات المستخدم عند فتح الصفحة
displayUserInfo();

// تحميل بيانات الملف الشخصي للمدير
function loadEmployeeProfile() {
    const fullname = sessionStorage.getItem('fullname');
    const username = sessionStorage.getItem('username');
    
    // الحصول على بيانات المدير من السيرفر
    const employeeId = localStorage.getItem('employeeId');
    
    if (employeeId) {
        // تحميل بيانات المدير من API
        const baseUrl = window.location.origin;
        fetch(`${baseUrl}/employees`)
            .then(res => res.json())
            .then(data => {
                const employee = data.employees.find(emp => emp.id === parseInt(employeeId));
                if (employee) {
                    document.getElementById('profile-fullname').value = employee.name || '';
                    document.getElementById('profile-phone').value = employee.phone || '';
                }
            })
            .catch(error => {
                console.error('خطأ في تحميل بيانات المدير:', error);
            });
    }
}

// تحديث الملف الشخصي للمدير
const updateProfileBtn = document.getElementById('update-profile-btn');
if (updateProfileBtn) {
    updateProfileBtn.addEventListener('click', async () => {
        const employeeId = localStorage.getItem('employeeId');
        const username = sessionStorage.getItem('username');
        const currentPassword = document.getElementById('profile-current-password').value.trim();
        const newFullname = document.getElementById('profile-fullname').value.trim();
        const newPhone = document.getElementById('profile-phone').value.trim();
        const newPassword = document.getElementById('profile-new-password').value.trim();
        
        if (!currentPassword) {
            alert('يرجى إدخال كلمة المرور الحالية للتأكيد');
            return;
        }
        
        if (!newFullname) {
            alert('يرجى إدخال الاسم الكامل');
            return;
        }
        
        try {
            updateProfileBtn.disabled = true;
            updateProfileBtn.textContent = 'جاري الحفظ...';
            
            const baseUrl = window.location.origin;
            const response = await fetch(`${baseUrl}/update-profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    employeeId: parseInt(employeeId),
                    username,
                    currentPassword,
                    newName: newFullname,
                    newPhone,
                    newPassword: newPassword || undefined
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                alert('✅ تم تحديث الملف الشخصي بنجاح!');
                
                // تحديث الاسم في sessionStorage
                sessionStorage.setItem('fullname', newFullname);
                localStorage.setItem('employeeName', newFullname);
                displayUserInfo();
                
                // مسح كلمات المرور
                document.getElementById('profile-current-password').value = '';
                document.getElementById('profile-new-password').value = '';
            } else {
                alert('❌ ' + (data.error || 'فشل التحديث'));
            }
        } catch (error) {
            console.error('خطأ في تحديث الملف:', error);
            alert('حدث خطأ أثناء التحديث');
        } finally {
            updateProfileBtn.disabled = false;
            updateProfileBtn.textContent = '💾 حفظ التعديلات';
        }
    });
}

// زر تسجيل الخروج في الهيدر
const logoutHeaderBtn = document.getElementById('logout-header-btn');
if (logoutHeaderBtn) {
    logoutHeaderBtn.addEventListener('click', async () => {
        if (confirm('هل تريد تسجيل الخروج؟')) {
            // تسجيل وقت الخروج
            try {
                const employeeId = localStorage.getItem('employeeId');
                const employeeName = localStorage.getItem('employeeName');
                const baseUrl = window.location.origin;
                
                await fetch(`${baseUrl}/work-tracking`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'logout',
                        employeeId: employeeId,
                        employeeName: employeeName
                    })
                });
            } catch (error) {
                console.error('خطأ في تسجيل وقت الخروج:', error);
            }
            
            sessionStorage.removeItem('isLoggedIn');
            sessionStorage.removeItem('username');
            sessionStorage.removeItem('userRole');
            sessionStorage.removeItem('fullname');
            sessionStorage.removeItem('permissions');
            window.location.href = 'login.html';
        }
    });
}

// معالجة زر الحذف
const deleteBtn = document.getElementById('delete-btn');
if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteDigit);
}

// معالجة لوحة المفاتيح
document.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9' || e.key === '*' || e.key === '#') {
        addDigit(e.key);
        if (currentConnection) {
            currentConnection.sendDigits(e.key);
        }
    } else if (e.key === 'Backspace') {
        deleteDigit();
    } else if (e.key === 'Enter') {
        if (!currentConnection) {
            makeCall();
        }
    } else if (e.key === 'Escape') {
        if (currentConnection) {
            endCall();
        }
    }
});

// حفظ المكالمة في السجل المحلي
function saveCallToHistory(call) {
    try {
        const calls = JSON.parse(localStorage.getItem('callHistory') || '[]');
        calls.unshift(call); // إضافة في البداية
        
        // الاحتفاظ بآخر 100 مكالمة فقط
        if (calls.length > 100) {
            calls.splice(100);
        }
        
        localStorage.setItem('callHistory', JSON.stringify(calls));
        console.log('✅ تم حفظ المكالمة في السجل');
    } catch (error) {
        console.error('خطأ في حفظ المكالمة:', error);
    }
}

// تحميل سجل المكالمات
async function loadCallHistory() {
    try {
        // تحميل المكالمات من localStorage بدلاً من السيرفر
        const calls = JSON.parse(localStorage.getItem('callHistory') || '[]');
        
        // تحميل جهات الاتصال لعرض الأسماء
        const baseUrl = window.location.origin;
        let contacts = [];
        try {
            const contactsResponse = await fetch(`${baseUrl}/api/contacts`);
            const contactsData = await contactsResponse.json();
            contacts = contactsData.contacts || [];
        } catch (err) {
            console.log('لم يتم تحميل جهات الاتصال');
        }
        
        const container = document.getElementById('call-history-container');
        container.innerHTML = '';
        
        if (calls.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📞</div>
                    <p>لا توجد مكالمات حتى الآن</p>
                </div>
            `;
            return;
        }
        
        // ترتيب المكالمات من الأحدث للأقدم
        calls.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        
        calls.forEach(call => {
            const date = new Date(call.startTime);
            const formattedDate = date.toLocaleString('ar-EG');
            const duration = call.duration ? `${call.duration} ثانية` : 'لم تكتمل';
            
            const callType = call.direction === 'inbound' ? '📥 واردة' : '📤 صادرة';
            const statusColor = call.status === 'completed' ? '#4ECDC4' : '#FF6B6B';
            
            // البحث عن اسم جهة الاتصال
            let displayName = call.to;
            const contact = contacts.find(c => {
                const cleanContactPhone = c.phone.replace(/[\s-+]/g, '');
                const cleanCallPhone = call.to.replace(/[\s-+]/g, '');
                return cleanContactPhone.includes(cleanCallPhone) || cleanCallPhone.includes(cleanContactPhone);
            });
            
            if (contact) {
                displayName = `👤 ${contact.name}`;
            }
            
            const item = document.createElement('div');
            item.className = 'call-item';
            item.innerHTML = `
                <div class="call-item-info">
                    <div class="call-item-number" style="${contact ? 'color: #667eea; font-weight: 600;' : ''}">${displayName}</div>
                    ${!contact ? `<div style="font-size: 12px; color: #999;">${call.to}</div>` : ''}
                    <div class="call-item-details">
                        <span class="call-item-type">${callType}</span>
                        <span>${formattedDate}</span>
                        <span style="color: ${statusColor}">${duration}</span>
                    </div>
                </div>
                <div class="call-item-actions">
                    <button class="play-btn" onclick="dialNumber('${call.to}')">📞 اتصال</button>
                </div>
            `;
            container.appendChild(item);
        });
    } catch (error) {
        console.error('خطأ في تحميل سجل المكالمات:', error);
    }
}

// تحميل جهات الاتصال
// تحميل جهات الاتصال
async function loadContacts() {
    const container = document.getElementById('contacts-container');
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/contacts`);
        const data = await response.json();
        const contacts = data.contacts || [];
        
        container.innerHTML = '';
        
        if (contacts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <p>لا توجد جهات اتصال</p>
                    <button class="add-contact-btn-empty" onclick="addContact()">إضافة جهة اتصال</button>
                </div>
            `;
            return;
        }
        
        contacts.forEach(contact => {
            const item = document.createElement('div');
            item.className = 'contact-item';
            const initial = contact.name.charAt(0).toUpperCase();
            
            item.innerHTML = `
                <div class="contact-avatar">${initial}</div>
                <div class="contact-info">
                    <div class="contact-name">${contact.name}</div>
                    <div class="contact-phone">${contact.phone}</div>
                </div>
                <div class="contact-actions">
                    <button class="contact-call-btn" onclick="callContact('${contact.phone}')" title="اتصال">📞</button>
                    <button class="contact-delete-btn" onclick="deleteContact(${contact.id}, '${contact.name}')" title="حذف" style="background: linear-gradient(135deg, #fa709a, #fee140); color: white; width: 35px; height: 35px; border: none; border-radius: 50%; cursor: pointer; font-size: 16px; transition: all 0.2s;">🗑️</button>
                </div>
            `;
            container.appendChild(item);
        });
        
        console.log('✅ تم تحميل', contacts.length, 'جهة اتصال');
    } catch (error) {
        console.error('خطأ في تحميل جهات الاتصال:', error);
        container.innerHTML = '<p style="text-align: center; color: #f44336;">خطأ في تحميل جهات الاتصال</p>';
    }
}

// إضافة جهة اتصال
async function addContact() {
    const name = prompt('أدخل اسم جهة الاتصال:');
    if (!name) return;
    
    const phone = prompt('أدخل رقم الهاتف:');
    if (!phone) return;
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ تمت إضافة جهة الاتصال');
            loadContacts();
        } else {
            throw new Error(data.error || 'فشل في إضافة جهة الاتصال');
        }
    } catch (error) {
        console.error('خطأ في إضافة جهة الاتصال:', error);
        alert('فشل في إضافة جهة الاتصال: ' + error.message);
    }
}

// حذف جهة اتصال
async function deleteContact(contactId, contactName) {
    if (!confirm(`هل تريد حذف ${contactName}؟`)) {
        return;
    }
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/contacts?id=${contactId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ تم حذف جهة الاتصال');
            loadContacts();
        } else {
            throw new Error(data.error || 'فشل في حذف جهة الاتصال');
        }
    } catch (error) {
        console.error('خطأ في حذف جهة الاتصال:', error);
        alert('فشل في حذف جهة الاتصال: ' + error.message);
    }
}

// الاتصال بجهة اتصال
function callContact(phone) {
    phoneNumber = phone;
    displayNumber.textContent = phone;
    makeCall();
}

// الاتصال برقم
function dialNumber(number) {
    // التبديل إلى لوحة المفاتيح
    hideAllSections();
    removeAllActiveStates();
    dialpad.classList.remove('hidden');
    dialpadBtn.classList.add('active');
    
    // ملء الرقم
    phoneNumber = number;
    displayNumber.textContent = number;
}

// معالجة زر إضافة جهة اتصال
const addContactBtn = document.getElementById('add-contact-btn');
if (addContactBtn) {
    addContactBtn.addEventListener('click', addContact);
}

// البحث في جهات الاتصال
const contactSearch = document.getElementById('contact-search');
if (contactSearch) {
    contactSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
        const filtered = contacts.filter(c => 
            c.name.toLowerCase().includes(searchTerm) || 
            c.phone.includes(searchTerm)
        );
        
        const container = document.getElementById('contacts-container');
        container.innerHTML = '';
        
        filtered.forEach(contact => {
            const item = document.createElement('div');
            item.className = 'contact-item';
            const initial = contact.name.charAt(0).toUpperCase();
            
            item.innerHTML = `
                <div class="contact-avatar">${initial}</div>
                <div class="contact-info">
                    <div class="contact-name">${contact.name}</div>
                    <div class="contact-phone">${contact.phone}</div>
                </div>
                <div class="contact-actions">
                    <button class="contact-call-btn" onclick="callContact('${contact.phone}')" title="اتصال">📞</button>
                </div>
            `;
            container.appendChild(item);
        });
    });
}

// تسجيل Service Worker للـ PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('✅ Service Worker مُسجل بنجاح:', registration.scope);
            })
            .catch(error => {
                console.log('❌ فشل تسجيل Service Worker:', error);
            });
    });
}

// تسجيل وقت الخروج عند إغلاق الصفحة
window.addEventListener('beforeunload', async (e) => {
    try {
        const employeeId = localStorage.getItem('employeeId');
        const employeeName = localStorage.getItem('employeeName');
        const baseUrl = window.location.origin;
        
        if (employeeId && employeeName) {
            // استخدام sendBeacon لإرسال البيانات حتى عند إغلاق الصفحة
            const data = JSON.stringify({
                action: 'logout',
                employeeId: employeeId,
                employeeName: employeeName
            });
            
            navigator.sendBeacon(`${baseUrl}/work-tracking`, data);
        }
    } catch (error) {
        console.error('خطأ في تسجيل وقت الخروج:', error);
    }
});

// تسجيل وقت الخروج عند إخفاء الصفحة
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'hidden') {
        try {
            const employeeId = localStorage.getItem('employeeId');
            const employeeName = localStorage.getItem('employeeName');
            const baseUrl = window.location.origin;
            
            if (employeeId && employeeName) {
                const data = JSON.stringify({
                    action: 'activity',
                    employeeId: employeeId,
                    employeeName: employeeName,
                    data: {
                        type: 'tab_hidden',
                        details: { timestamp: new Date().toISOString() }
                    }
                });
                
                navigator.sendBeacon(`${baseUrl}/work-tracking`, data);
            }
        } catch (error) {
            console.error('خطأ في تسجيل إخفاء التطبيق:', error);
        }
    }
});

// تهيئة التطبيق عند التحميل
initializeApp();

// تسجيل وقت الدخول للموظفين من CRM
if (autoLogin === 'true' && employeeId && employeeName) {
    const baseUrl = window.location.origin;
    fetch(`${baseUrl}/work-tracking`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'login',
            employeeId: employeeId,
            employeeName: decodeURIComponent(employeeName)
        })
    }).catch(err => console.log('⏰ تسجيل الوقت سيتم لاحقاً'));
}

// ===== استقبال أرقام جديدة من CRM عبر postMessage =====
window.addEventListener('message', (event) => {
    // التأكد من المصدر
    if (event.origin !== 'https://hotel-app-dce62.web.app' && !event.origin.includes('localhost')) {
        return;
    }
    
    if (event.data && event.data.type === 'NEW_CALL') {
        console.log('📞 استقبال مكالمة جديدة من CRM:', event.data.phone);
        
        // تحديث الرقم
        phoneNumber = event.data.phone;
        if (displayNumber) {
            displayNumber.textContent = event.data.phone;
            updateDeleteButton();
        }
        
        // بدء المكالمة تلقائياً
        if (device && device.state === 'registered') {
            console.log('✅ بدء المكالمة الجديدة...');
            setTimeout(() => makeCall(), 500);
        } else {
            console.log('⏳ انتظار اتصال Twilio...');
            const checkInterval = setInterval(() => {
                if (device && device.state === 'registered') {
                    clearInterval(checkInterval);
                    makeCall();
                }
            }, 500);
            setTimeout(() => clearInterval(checkInterval), 10000);
        }
    }
});

// ===== وظائف تقارير ساعات العمل =====

// تحميل تقرير ساعات العمل
async function loadWorkReports(startDate, endDate) {
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/work-tracking`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'get-all-reports',
                employeeId: 'admin', // مطلوب للـ validation
                employeeName: 'المطور الرئيسي',
                data: {
                    reportStartDate: startDate,
                    reportEndDate: endDate
                }
            })
        });
        
        const data = await response.json();
        
        console.log('📊 Response from work-tracking API:', data);
        if (data.success && data.reports) {
            displayWorkReports(data.reports);
        } else {
            document.getElementById('reports-container').innerHTML = 
                '<div class="no-data">لا توجد بيانات في هذه الفترة</div>';
        }
    } catch (error) {
        console.error('خطأ في تحميل التقارير:', error);
        document.getElementById('reports-container').innerHTML = 
            '<div class="error-message">خطأ في تحميل التقارير</div>';
    }
}

// عرض تقارير العمل
function displayWorkReports(reports) {
    const container = document.getElementById('reports-container');
    
    if (!reports || reports.length === 0) {
        container.innerHTML = '<div class="no-data">لا توجد بيانات في هذه الفترة</div>';
        return;
    }
    
    // ترتيب حسب عدد الساعات (الأكثر أولاً)
    reports.sort((a, b) => b.totalMinutes - a.totalMinutes);
    
    let html = '<div class="reports-summary">';
    html += `<div class="summary-card"><strong>إجمالي الموظفين:</strong> ${reports.length}</div>`;
    
    const totalHours = reports.reduce((sum, r) => sum + parseFloat(r.totalHours), 0);
    html += `<div class="summary-card"><strong>إجمالي ساعات العمل:</strong> ${totalHours.toFixed(2)} ساعة</div>`;
    
    const totalCalls = reports.reduce((sum, r) => sum + r.totalCalls, 0);
    html += `<div class="summary-card"><strong>إجمالي المكالمات:</strong> ${totalCalls} مكالمة</div>`;
    html += '</div>';
    
    html += '<table class="reports-table">';
    html += '<thead><tr>';
    html += '<th>#</th>';
    html += '<th>اسم الموظف</th>';
    html += '<th>عدد الأيام</th>';
    html += '<th>إجمالي الساعات</th>';
    html += '<th>عدد المكالمات</th>';
    html += '<th>متوسط ساعات/يوم</th>';
    html += '<th>الإجراءات</th>';
    html += '</tr></thead><tbody>';
    
    reports.forEach((report, index) => {
        const avgHours = (report.totalHours / report.days.length).toFixed(2);
        html += '<tr>';
        html += `<td>${index + 1}</td>`;
        html += `<td><strong>${report.employeeName}</strong></td>`;
        html += `<td>${report.days.length} يوم</td>`;
        html += `<td><span class="hours-badge">${report.totalHours} ساعة</span></td>`;
        html += `<td>${report.totalCalls} مكالمة</td>`;
        html += `<td>${avgHours} ساعة</td>`;
        html += `<td><button class="btn-details" onclick="showEmployeeDetails('${report.employeeId}', '${report.employeeName}')">التفاصيل</button></td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// عرض تفاصيل موظف محدد
async function showEmployeeDetails(employeeId, employeeName) {
    const startDate = document.getElementById('report-start-date').value;
    const endDate = document.getElementById('report-end-date').value;
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/work-tracking`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'get-report',
                employeeId: employeeId,
                employeeName: employeeName,
                data: {
                    startDate: startDate,
                    endDate: endDate
                }
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayEmployeeDetailsModal(data);
        }
    } catch (error) {
        console.error('خطأ في تحميل تفاصيل الموظف:', error);
        alert('خطأ في تحميل التفاصيل');
    }
}

// عرض نافذة منبثقة بتفاصيل الموظف
function displayEmployeeDetailsModal(data) {
    let html = `
        <div class="modal-overlay" onclick="this.remove()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>تفاصيل عمل ${data.employeeName}</h3>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="employee-summary">
                        <div class="summary-item">
                            <span class="label">إجمالي الساعات:</span>
                            <span class="value">${data.totalHours} ساعة</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">عدد الأيام:</span>
                            <span class="value">${data.totalDays} يوم</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">عدد المكالمات:</span>
                            <span class="value">${data.totalCalls} مكالمة</span>
                        </div>
                    </div>
                    <h4>تفاصيل يومية:</h4>
                    <table class="details-table">
                        <thead>
                            <tr>
                                <th>التاريخ</th>
                                <th>وقت الدخول</th>
                                <th>وقت الخروج</th>
                                <th>الساعات</th>
                                <th>المكالمات</th>
                            </tr>
                        </thead>
                        <tbody>`;
    
    data.dailyReport.forEach(day => {
        const loginTime = new Date(day.loginTime).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'});
        const logoutTime = day.logoutTime ? new Date(day.logoutTime).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'}) : 'لم يسجل خروج';
        const hours = (day.totalMinutes / 60).toFixed(2);
        
        html += `
            <tr>
                <td>${day.date}</td>
                <td>${loginTime}</td>
                <td>${logoutTime}</td>
                <td>${hours} ساعة</td>
                <td>${day.calls?.length || 0} مكالمة</td>
            </tr>`;
    });
    
    html += `
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

// زر إنشاء التقرير
const generateReportBtn = document.getElementById('generate-report-btn');
if (generateReportBtn) {
    generateReportBtn.addEventListener('click', () => {
        const startDate = document.getElementById('report-start-date').value;
        const endDate = document.getElementById('report-end-date').value;
        
        if (!startDate || !endDate) {
            alert('يرجى تحديد الفترة الزمنية');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            alert('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
            return;
        }
        
        loadWorkReports(startDate, endDate);
    });
}

// إخفاء زر تقارير العمل عن غير المطورين
if (userRole !== 'admin' && workReportsBtn) {
    workReportsBtn.style.display = 'none';
}

// ===== نظام إيقاف التطبيق بعد 5 دقائق من عدم النشاط =====

let inactivityTimer = null;
let inactivityWarningTimer = null;
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 دقائق
const WARNING_TIMEOUT = 4 * 60 * 1000; // تحذير بعد 4 دقائق

// دالة تسجيل الخروج التلقائي
async function autoLogout() {
    console.log('⏰ انتهت مهلة النشاط - تسجيل خروج تلقائي');
    
    try {
        const employeeId = localStorage.getItem('employeeId');
        const employeeName = localStorage.getItem('employeeName');
        const baseUrl = window.location.origin;
        
        if (employeeId && employeeName) {
            await fetch(`${baseUrl}/work-tracking`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'logout',
                    employeeId: employeeId,
                    employeeName: employeeName
                })
            });
        }
    } catch (error) {
        console.error('خطأ في تسجيل الخروج التلقائي:', error);
    }
    
    // مسح بيانات الجلسة
    sessionStorage.clear();
    
    // إعادة التوجيه لصفحة تسجيل الدخول
    alert('⏰ تم تسجيل الخروج تلقائياً بسبب عدم النشاط لمدة 5 دقائق');
    window.location.href = 'login.html';
}

// إعادة تعيين عداد عدم النشاط
function resetInactivityTimer() {
    // إلغاء التايمر السابق
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
    if (inactivityWarningTimer) {
        clearTimeout(inactivityWarningTimer);
    }
    
    // إزالة تحذير عدم النشاط إذا كان موجوداً
    const warningElement = document.getElementById('inactivity-warning');
    if (warningElement) {
        warningElement.remove();
    }
    
    // تعيين تايمر جديد للتحذير (4 دقائق)
    inactivityWarningTimer = setTimeout(() => {
        showInactivityWarning();
    }, WARNING_TIMEOUT);
    
    // تعيين تايمر جديد للخروج التلقائي (5 دقائق)
    inactivityTimer = setTimeout(() => {
        autoLogout();
    }, INACTIVITY_TIMEOUT);
}

// عرض تحذير عدم النشاط
function showInactivityWarning() {
    // إزالة التحذير القديم إذا كان موجوداً
    const oldWarning = document.getElementById('inactivity-warning');
    if (oldWarning) {
        oldWarning.remove();
    }
    
    const warningHtml = `
        <div id="inactivity-warning" class="inactivity-warning">
            <div class="warning-content">
                <div class="warning-icon">⚠️</div>
                <div class="warning-text">
                    <strong>تحذير عدم النشاط</strong>
                    <p>سيتم تسجيل خروجك تلقائياً بعد دقيقة واحدة</p>
                </div>
                <button class="warning-btn" onclick="dismissInactivityWarning()">أنا هنا</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', warningHtml);
}

// إغلاق تحذير عدم النشاط
function dismissInactivityWarning() {
    const warningElement = document.getElementById('inactivity-warning');
    if (warningElement) {
        warningElement.remove();
    }
    resetInactivityTimer();
}

// قائمة الأحداث التي تعتبر نشاطاً
const activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click'
];

// إضافة مستمعين لجميع أحداث النشاط
activityEvents.forEach(event => {
    document.addEventListener(event, resetInactivityTimer, true);
});

// بدء عداد عدم النشاط عند تحميل الصفحة
resetInactivityTimer();

console.log('✅ نظام مراقبة النشاط مفعّل - سيتم تسجيل الخروج بعد 5 دقائق من عدم النشاط');

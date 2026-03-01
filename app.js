// معلومات Twilio
const TWILIO_PHONE_NUMBER = '+13204336644';
const API_BASE_URL = window.location.origin;
let currentCallSid = null;
let callStartTime;
let callTimer;
let isRecording = false;
let callCheckInterval = null;
let phoneNumber = ''; // متغير لتخزين رقم الهاتف

// ===== PWA تثبيت التطبيق =====
let deferredPrompt;
const installBtn = document.getElementById('install-app-btn');

// التقاط حدث التثبيت
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('📲 PWA: يمكن تثبيت التطبيق');
    e.preventDefault();
    deferredPrompt = e;
    
    // إظهار زر التثبيت
    if (installBtn) {
        installBtn.style.display = 'block';
        installBtn.classList.add('install-available');
    }
});

// عند النقر على زر التثبيت
if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) {
            // إذا كان التطبيق مثبت أو لا يدعم PWA
            alert('التطبيق مثبت بالفعل أو المتصفح لا يدعم التثبيت\n\nلتثبيت التطبيق:\n1. افتح قائمة المتصفح (⋮)\n2. اختر "إضافة إلى الشاشة الرئيسية"');
            return;
        }
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('✅ PWA: تم قبول التثبيت');
            installBtn.style.display = 'none';
        } else {
            console.log('❌ PWA: تم رفض التثبيت');
        }
        
        deferredPrompt = null;
    });
}

// عند اكتمال التثبيت
window.addEventListener('appinstalled', () => {
    console.log('✅ PWA: تم تثبيت التطبيق بنجاح!');
    if (installBtn) {
        installBtn.style.display = 'none';
    }
    deferredPrompt = null;
});

// التحقق إذا كان التطبيق يعمل كـ PWA مثبت
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    console.log('📱 التطبيق يعمل كـ PWA مثبت');
}

// ===== تتبع المستخدمين الأونلاين =====
let heartbeatInterval = null;

// إرسال نبضة للخادم
async function sendHeartbeat() {
    const userId = sessionStorage.getItem('employeeId') || localStorage.getItem('employeeId');
    const userName = sessionStorage.getItem('fullname') || localStorage.getItem('employeeName') || 'مستخدم';
    
    if (!userId) return;
    
    try {
        await fetch(`${API_BASE_URL}/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, userName })
        });
    } catch (error) {
        console.error('خطأ في إرسال Heartbeat:', error);
    }
}

// بدء تتبع المستخدم الأونلاين
function startOnlineTracking() {
    const userId = sessionStorage.getItem('employeeId') || localStorage.getItem('employeeId');
    const userName = sessionStorage.getItem('fullname') || localStorage.getItem('employeeName');
    
    if (!userId) return;
    
    // تسجيل الدخول
    fetch(`${API_BASE_URL}/track-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userName })
    }).catch(err => console.error('خطأ في تسجيل الدخول:', err));
    
    // إرسال Heartbeat كل 15 ثانية
    sendHeartbeat();
    heartbeatInterval = setInterval(sendHeartbeat, 15000);
    
    console.log('🟢 بدأ تتبع الأونلاين للمستخدم:', userName);
}

// إيقاف تتبع المستخدم عند الخروج
function stopOnlineTracking() {
    const userId = sessionStorage.getItem('employeeId') || localStorage.getItem('employeeId');
    
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    
    if (userId) {
        // إرسال طلب تسجيل الخروج
        navigator.sendBeacon(`${API_BASE_URL}/track-logout`, new Blob([JSON.stringify({ userId })], { type: 'application/json' }));
    }
}

// بدء التتبع عند تحميل الصفحة
window.addEventListener('load', () => {
    startOnlineTracking();
});

// إيقاف التتبع عند إغلاق الصفحة
window.addEventListener('beforeunload', () => {
    stopOnlineTracking();
});

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
const speakerBtn = document.getElementById('speaker-btn');
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
let isSpeakerOn = false;
let availableAudioDevices = [];
let recordings = [];
let device = null;
let currentCall = null;

// ========== نظام الحساب التجريبي ==========
// التحقق إذا كان الحساب تجريبي
function isTrialAccount() {
    const userRole = sessionStorage.getItem('userRole');
    const username = sessionStorage.getItem('username');
    return userRole === 'trial' || username === 'trial';
}

// الحصول على عدد المكالمات المتبقية للحساب التجريبي
function getTrialCallsRemaining() {
    if (!isTrialAccount()) return -1; // -1 يعني غير محدود
    const maxCalls = 2;
    const usedCalls = parseInt(localStorage.getItem('trial_calls_used') || '0');
    return maxCalls - usedCalls;
}

// تسجيل مكالمة للحساب التجريبي
function recordTrialCall() {
    if (!isTrialAccount()) return;
    const usedCalls = parseInt(localStorage.getItem('trial_calls_used') || '0');
    localStorage.setItem('trial_calls_used', (usedCalls + 1).toString());
    console.log('📊 مكالمات الحساب التجريبي:', usedCalls + 1, '/ 2');
}

// التحقق من إمكانية إجراء مكالمة للحساب التجريبي
function canTrialMakeCall() {
    if (!isTrialAccount()) return true;
    const remaining = getTrialCallsRemaining();
    console.log('📊 المكالمات المتبقية للحساب التجريبي:', remaining);
    return remaining > 0;
}

// إظهار رسالة رصيد غير كافي
function showInsufficientBalanceAlert() {
    const alertHTML = `
        <div id="trial-alert-overlay" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        ">
            <div style="
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 20px;
                padding: 30px;
                text-align: center;
                max-width: 400px;
                margin: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.1);
            ">
                <div style="font-size: 60px; margin-bottom: 20px;">💳</div>
                <h2 style="color: #ff6b6b; margin-bottom: 15px; font-size: 24px;">رصيدك غير كافي!</h2>
                <p style="color: #a0aec0; margin-bottom: 10px; font-size: 16px;">
                    لقد استنفدت المكالمتين المجانيتين في الحساب التجريبي.
                </p>
                <p style="color: #cbd5e0; margin-bottom: 25px; font-size: 14px;">
                    للاستمرار في إجراء المكالمات، يرجى الترقية إلى حساب مدفوع.
                </p>
                <button onclick="document.getElementById('trial-alert-overlay').remove()" style="
                    background: linear-gradient(135deg, #6c5ce7, #a29bfe);
                    color: white;
                    border: none;
                    padding: 12px 40px;
                    border-radius: 25px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                ">
                    حسناً
                </button>
                <p style="color: #718096; margin-top: 20px; font-size: 12px;">
                    📞 للترقية تواصل معنا
                </p>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', alertHTML);
}
// ========== نهاية نظام الحساب التجريبي ==========

// قراءة بيانات من URL قبل أي شيء (urlParams و autoLogin معرّفين في index.html)
const phoneFromUrl = urlParams.get('phone') || urlParams.get('number');
const empId = urlParams.get('employeeId');
const empName = urlParams.get('employeeName');

console.log('🔍 قراءة URL Parameters:');
console.log('  - URL الكامل:', window.location.href);
console.log('  - phone:', phoneFromUrl);
console.log('  - autoLogin:', autoLogin);
console.log('  - employeeId:', empId);
console.log('  - employeeName:', empName);

// تسجيل دخول تلقائي إذا جاء من CRM
if (autoLogin === 'true' && empId && empName) {
    console.log('🔐 تسجيل دخول تلقائي من CRM:', empName);
    
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('username', empId);
    sessionStorage.setItem('userRole', 'employee');
    sessionStorage.setItem('fullname', decodeURIComponent(empName));
    sessionStorage.setItem('employeeId', empId);
    localStorage.setItem('employeeId', empId);
    localStorage.setItem('employeeName', decodeURIComponent(empName));
}

// إذا كان هناك رقم، نخزنه بعد تنظيفه
if (phoneFromUrl) {
    // تنظيف الرقم من الأحرف الخاصة والمسافات
    phoneNumber = phoneFromUrl
        .replace(/[\u200E\u200F\u202A\u202B\u202C\u202D\u202E\uFEFF]/g, '') // حذف Right-to-Left و Left-to-Right marks
        .replace(/[\s\-\(\)]/g, ''); // حذف المسافات والشرطات والأقواس
    
    console.log('📞 تم استقبال رقم من URL:', phoneFromUrl);
    console.log('📞 الرقم بعد التنظيف:', phoneNumber);
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
        let twilioWaitAttempts = 0;
        while (typeof Twilio === 'undefined' && twilioWaitAttempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 100));
            twilioWaitAttempts++;
        }
        
        if (typeof Twilio === 'undefined' || !Twilio.Device) {
            throw new Error('Twilio SDK غير محمل. تأكد من الاتصال بالإنترنت.');
        }
        
        console.log('✅ Twilio SDK محمل بنجاح');
        
        // الحصول على Access Token
        // استخدام identity ثابت مبني على employeeId لاستقبال المكالمات
        const baseUrl = API_BASE_URL;
        const empId = localStorage.getItem('employeeId') || sessionStorage.getItem('employeeId') || 'admin';
        const clientIdentity = `client_${empId}`;
        console.log('🆔 Client Identity:', clientIdentity);
        console.log('🔗 Fetching token from:', `${baseUrl}/token`);
        
        // محاولة الحصول على Token مع retry
        let response, data;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
            try {
                attempts++;
                console.log(`📡 محاولة ${attempts}/${maxAttempts}...`);
                response = await fetch(`${baseUrl}/token?identity=${clientIdentity}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                data = await response.json();
                
                if (!data.token) {
                    throw new Error('التوكن غير موجود في الاستجابة');
                }
                
                console.log('✅ تم الحصول على Token بنجاح');
                break; // نجحت المحاولة
                
            } catch (fetchError) {
                console.error(`❌ فشلت المحاولة ${attempts}:`, fetchError.message);
                
                if (attempts >= maxAttempts) {
                    throw new Error(`فشل الاتصال بعد ${maxAttempts} محاولات: ${fetchError.message}`);
                }
                
                // انتظر ثانية قبل المحاولة التالية
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        if (!data || !data.token) {
            throw new Error('فشل الحصول على Token');
        }
        
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
        
        // رسالة خطأ أكثر تفصيلاً
        const errorMsg = `⚠️ فشل الاتصال بالخادم!\n\n` +
                        `المشكلة: ${error.message}\n\n` +
                        `الحلول الممكنة:\n` +
                        `1. تحقق من اتصالك بالإنترنت\n` +
                        `2. قد يكون Vercel backend نائم (أول طلب يأخذ 5-10 ثواني)\n` +
                        `3. جرّب إعادة تحميل الصفحة\n\n` +
                        `إذا استمرت المشكلة، تواصل مع الدعم الفني.`;
        
        alert(errorMsg);
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

// تحديث زر الحذف وشاشة العرض
function updateDeleteButton() {
    const deleteBtn = document.getElementById('delete-btn');
    const phoneDisplay = document.querySelector('.phone-display');
    
    if (deleteBtn) {
        if (phoneNumber.length > 0) {
            deleteBtn.classList.remove('hidden');
        } else {
            deleteBtn.classList.add('hidden');
        }
    }
    
    // إظهار/إخفاء شاشة عرض الرقم
    if (phoneDisplay) {
        if (phoneNumber.length > 0) {
            phoneDisplay.classList.remove('empty');
        } else {
            phoneDisplay.classList.add('empty');
        }
    }
}

// إجراء مكالمة باستخدام REST API
async function makeCall() {
    if (!phoneNumber) {
        alert('الرجاء إدخال رقم الهاتف');
        return;
    }

    // 🔒 التحقق من الحساب التجريبي
    if (isTrialAccount() && !canTrialMakeCall()) {
        showInsufficientBalanceAlert();
        console.log('❌ الحساب التجريبي استنفد المكالمات المجانية');
        return;
    }

    // 🔒 التحقق من توفر الدقائق للموظف
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.id && userData.companyId) {
        try {
            const checkResponse = await fetch(`/api/employees-management/minutes/${userData.id}/check`);
            const checkData = await checkResponse.json();
            
            if (checkData.success && !checkData.available) {
                const reason = checkData.reason === 'account_inactive' 
                    ? 'حسابك غير نشط. الرجاء التواصل مع المدير.' 
                    : `رصيد الدقائق المتاح لك قد انتهى (${checkData.minutesRemaining || 0} دقيقة متبقية). الرجاء التواصل مع المدير لإضافة دقائق إضافية.`;
                
                alert('⚠️ لا يمكن إجراء المكالمة\n\n' + reason);
                console.log('❌ الدقائق المتاحة انتهت:', checkData);
                return;
            }
            
            console.log('✅ فحص الدقائق: متاح -', checkData.minutesRemaining || 0, 'دقيقة');
        } catch (error) {
            console.warn('⚠️ تعذر فحص الدقائق، المتابعة بدون فحص:', error);
        }
    }

    // تنظيف الرقم من المسافات والأحرف الخاصة فقط - بدون تحويل
    // إزالة جميع المسافات والأحرف الخاصة غير المرئية والشرطات
    let formattedNumber = phoneNumber
        .replace(/[\u200E\u200F\u202A\u202B\u202C\u202D\u202E\uFEFF]/g, '') // حذف Right-to-Left و Left-to-Right marks
        .replace(/[\s\-\(\)]/g, ''); // حذف المسافات والشرطات والأقواس
    
    console.log('🔍 الرقم بعد التنظيف:', formattedNumber);
    console.log('📞 اتصال مباشر بالرقم:', formattedNumber);
    
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
        
        // الحصول على رقم المتصل المختار
        const callerIdSelect = document.getElementById('caller-id-select');
        const selectedCallerId = callerIdSelect ? callerIdSelect.value : 'default';
        console.log('📱 رقم المتصل المختار:', selectedCallerId);
        
        // ============ Zadarma Call (أرقام مصرية!) ============
        if (selectedCallerId.startsWith('zadarma-')) {
            console.log('📞 استخدام Zadarma للاتصال (رقم مصري)');
            try {
                const response = await fetch(`${API_BASE}/zadarma-call`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: formattedNumber,
                        employeeId: employeeId
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    updateCallStatus('جاري الاتصال من ' + result.callerId + ' 📞');
                    showCallScreen(formattedNumber);
                    alert('✅ جاري الاتصال من الرقم المصري!\nالعميل سيرى: ' + result.callerId);
                } else if (result.setupSteps) {
                    alert('⚠️ Zadarma غير مُعد:\n\n' + result.setupSteps.join('\n'));
                } else {
                    alert('❌ ' + (result.error || 'فشل الاتصال'));
                }
            } catch (error) {
                console.error('❌ Zadarma Error:', error);
                alert('❌ خطأ في الاتصال بـ Zadarma');
            }
            return;
        }
        // ============ نهاية Zadarma ============
        
        const params = {
            To: formattedNumber,
            employeeId: employeeId,
            companyId: sessionStorage.getItem('companyId') || '',
            callerId: selectedCallerId
        };
        
        console.log('👤 معرف المدير للمكالمة:', employeeId);
        
        currentCall = await device.connect({ params });
        
        // معالجة أحداث المكالمة
        currentCall.on('accept', () => {
            console.log('📞 تم إنشاء المكالمة - جاري الاتصال...');
            updateCallStatus('جاري الاتصال... 📞');
            // لا نبدأ العداد هنا - ننتظر العميل يرد
        });
        
        currentCall.on('ringing', () => {
            console.log('📞 الرنين...');
            updateCallStatus('رنين... 🔔');
        });
        
        // هذا الحدث يُطلق عندما يرد العميل فعلياً - نبدأ العداد هنا
        currentCall.on('connected', () => {
            console.log('✅ العميل رد على المكالمة - بدء العداد');
            updateCallStatus('متصل ✅');
            startCallTimer(); // بدء العداد فقط عند رد العميل
            
            // 🔒 تسجيل المكالمة للحساب التجريبي
            recordTrialCall();
            if (isTrialAccount()) {
                const remaining = getTrialCallsRemaining();
                console.log('📊 المكالمات المتبقية للحساب التجريبي:', remaining);
            }
        });
        
        currentCall.on('disconnect', () => {
            console.log('⏹️ انتهت المكالمة');
            // التحقق إذا كان العداد لم يبدأ (يعني العميل لم يرد)
            if (!callTimer) {
                updateCallStatus('لم يتم الرد');
            }
            endCall();
        });
        
        currentCall.on('cancel', () => {
            console.log('🚫 تم إلغاء المكالمة من قبل العميل');
            updateCallStatus('تم إلغاء المكالمة من العميل 🚫');
            setTimeout(() => endCall(), 1500);
        });
        
        currentCall.on('reject', () => {
            console.log('❌ تم رفض المكالمة من العميل');
            updateCallStatus('رفض العميل المكالمة ❌');
            setTimeout(() => endCall(), 1500);
        });
        
        currentCall.on('error', (error) => {
            console.error('❌ خطأ في المكالمة:', error);
            // تحليل نوع الخطأ
            let errorMsg = 'خطأ في المكالمة';
            if (error.message && error.message.includes('busy')) {
                errorMsg = 'العميل مشغول حالياً';
            } else if (error.message && error.message.includes('no answer')) {
                errorMsg = 'لم يرد العميل';
            } else if (error.message && error.message.includes('invalid')) {
                errorMsg = 'رقم غير صحيح';
            }
            updateCallStatus(errorMsg + ' ⚠️');
            setTimeout(() => endCall(), 2000);
        });
        
    } catch (error) {
        console.error('❌ خطأ في المكالمة:', error);
        alert('فشل إجراء المكالمة: ' + error.message);
        endCall();
    }
}

// متغيرات المكالمة الواردة
let incomingCallRef = null;
let ringtoneAudio = null;

// تشغيل صوت الرنين
function playRingtone() {
    try {
        ringtoneAudio = document.getElementById('ringtone');
        if (ringtoneAudio) {
            ringtoneAudio.volume = 0.7;
            ringtoneAudio.play().catch(e => console.log('لا يمكن تشغيل الرنين:', e));
        }
    } catch (e) {
        console.log('خطأ في الرنين:', e);
    }
}

// إيقاف صوت الرنين
function stopRingtone() {
    if (ringtoneAudio) {
        ringtoneAudio.pause();
        ringtoneAudio.currentTime = 0;
    }
}

// إظهار شاشة المكالمة الواردة
function showIncomingCallScreen(callerNumber, callerName) {
    const overlay = document.getElementById('incoming-call-overlay');
    const numberEl = document.getElementById('incoming-caller-number');
    const nameEl = document.getElementById('incoming-caller-name');
    
    if (overlay) {
        numberEl.textContent = callerNumber || 'رقم مجهول';
        nameEl.textContent = callerName || 'جهة اتصال غير معروفة';
        overlay.classList.remove('hidden');
        playRingtone();
        
        // إشعار المتصفح
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('📞 مكالمة واردة', {
                body: `من: ${callerNumber}`,
                icon: '📞',
                requireInteraction: true
            });
        }
    }
}

// إخفاء شاشة المكالمة الواردة
function hideIncomingCallScreen() {
    const overlay = document.getElementById('incoming-call-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
    stopRingtone();
}

// معالجة مكالمة واردة
function handleIncomingCall(call) {
    console.log('📞 مكالمة واردة من:', call.parameters.From);
    
    // حفظ المكالمة
    incomingCallRef = call;
    
    // إظهار شاشة المكالمة الاحترافية
    showIncomingCallScreen(call.parameters.From, null);
    
    // عند قطع المكالمة من المتصل
    call.on('cancel', () => {
        console.log('❌ المتصل أغلق المكالمة');
        hideIncomingCallScreen();
        incomingCallRef = null;
    });
    
    call.on('disconnect', () => {
        endCall();
    });
}

// قبول المكالمة الواردة
function acceptIncomingCall() {
    if (incomingCallRef) {
        hideIncomingCallScreen();
        
        currentCall = incomingCallRef;
        incomingCallRef.accept();
        
        dialpad.classList.add('hidden');
        callScreen.classList.remove('hidden');
        
        // عرض اسم الموظف
        const employeeName = sessionStorage.getItem('fullname') || sessionStorage.getItem('username') || 'موظف';
        const callEmployeeName = document.getElementById('call-employee-name');
        if (callEmployeeName) {
            callEmployeeName.textContent = `👤 ${employeeName}`;
        }
        
        // عرض رقم الهاتف
        callNumber.textContent = `📞 ${incomingCallRef.parameters.From}`;
        updateCallStatus('متصل ✅');
        startCallTimer();
        
        incomingCallRef = null;
    }
}

// رفض المكالمة الواردة
function rejectIncomingCall() {
    if (incomingCallRef) {
        hideIncomingCallScreen();
        incomingCallRef.reject();
        incomingCallRef = null;
    }
}

// ربط أزرار المكالمة الواردة
document.addEventListener('DOMContentLoaded', () => {
    const acceptBtn = document.getElementById('accept-call-btn');
    const rejectBtn = document.getElementById('reject-call-btn');
    
    if (acceptBtn) {
        acceptBtn.addEventListener('click', acceptIncomingCall);
    }
    if (rejectBtn) {
        rejectBtn.addEventListener('click', rejectIncomingCall);
    }
    
    // طلب إذن الإشعارات
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // تصفية خيارات الاتصال بناءً على صلاحيات الموظف
    filterCallerIdOptions();
});

// تصفية خيارات رقم المتصل بناءً على الصلاحيات
function filterCallerIdOptions() {
    const callerIdSelect = document.getElementById('caller-id-select');
    if (!callerIdSelect) return;
    
    const userRole = sessionStorage.getItem('userRole');
    const isCompanyAdmin = sessionStorage.getItem('isCompanyAdmin') === 'true';
    
    // المطور و مدير الشركة لديهم كل الصلاحيات
    if (userRole === 'admin' && !isCompanyAdmin) {
        console.log('🔓 المطور لديه كل صلاحيات الاتصال');
        return;
    }
    if (userRole === 'company-admin' || isCompanyAdmin) {
        console.log('🔓 مدير الشركة لديه كل صلاحيات الاتصال');
        return;
    }
    
    // قراءة الصلاحيات
    const canCallFromUSA = sessionStorage.getItem('canCallFromUSA') !== 'false';
    const canCallFromEgypt = sessionStorage.getItem('canCallFromEgypt') === 'true';
    const canCallFromSaudi = sessionStorage.getItem('canCallFromSaudi') === 'true';
    
    console.log('📞 صلاحيات الاتصال:', { canCallFromUSA, canCallFromEgypt, canCallFromSaudi });
    
    // إخفاء الخيارات غير المسموح بها
    const options = callerIdSelect.querySelectorAll('option');
    options.forEach(option => {
        const value = option.value;
        
        if (value === 'default' && !canCallFromUSA) {
            option.style.display = 'none';
            option.disabled = true;
        } else if (value === 'zadarma-egypt' && !canCallFromEgypt) {
            option.style.display = 'none';
            option.disabled = true;
        } else if (value === 'zadarma-saudi' && !canCallFromSaudi) {
            option.style.display = 'none';
            option.disabled = true;
        }
    });
    
    // اختيار أول خيار متاح
    const firstAvailable = callerIdSelect.querySelector('option:not([disabled])');
    if (firstAvailable) {
        callerIdSelect.value = firstAvailable.value;
    }
    
    // إذا لم يكن هناك أي صلاحية
    if (!canCallFromUSA && !canCallFromEgypt && !canCallFromSaudi) {
        callerIdSelect.innerHTML = '<option value="" disabled selected>❌ لا توجد صلاحيات اتصال</option>';
        const callBtn = document.getElementById('call-btn');
        if (callBtn) {
            callBtn.disabled = true;
            callBtn.title = 'لا توجد لديك صلاحيات للاتصال';
        }
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
            const baseUrl = API_BASE_URL;
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
            const baseUrl = API_BASE_URL;
            
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
    isSpeakerOn = false;
    updateSpeakerButton();
    
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
        
        // 🔒 تسجيل استخدام الدقائق
        if (callDuration > 0) {
            const minutesUsed = Math.ceil(callDuration / 60); // تقريب لأعلى دقيقة
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            
            if (userData.id && userData.companyId) {
                // تسجيل الدقائق بشكل غير متزامن (لا ننتظر النتيجة)
                fetch('/api/employees-management/minutes/record', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        employeeId: userData.id,
                        minutesUsed: minutesUsed,
                        callId: currentCallSid || 'unknown',
                        callType: callDirection || 'outbound'
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        console.log(`✅ تم تسجيل ${minutesUsed} دقيقة - المتبقي: ${data.usage.minutesRemaining}`);
                        
                        // إذا انتهى الرصيد، إظهار تنبيه
                        if (!data.usage.accountActive) {
                            setTimeout(() => {
                                alert('⚠️ تنبيه\n\nرصيد الدقائق المتاح لك قد انتهى.\nتم إيقاف حسابك مؤقتاً.\n\nالرجاء التواصل مع المدير لإضافة دقائق إضافية.');
                            }, 2000);
                        } else if (data.usage.minutesRemaining < 100) {
                            // تنبيه عند اقتراب انتهاء الرصيد
                            setTimeout(() => {
                                alert(`⚠️ تحذير\n\nرصيدك من الدقائق قارب على الانتهاء.\nالمتبقي: ${data.usage.minutesRemaining} دقيقة فقط.`);
                            }, 2000);
                        }
                    }
                })
                .catch(error => {
                    console.error('❌ خطأ في تسجيل الدقائق:', error);
                });
            }
        }
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

// تبديل السبيكر
async function toggleSpeaker() {
    if (!device) return;
    
    try {
        // الحصول على قائمة أجهزة الصوت المتاحة
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
        
        console.log('🔊 أجهزة الصوت المتاحة:', audioOutputs);
        
        if (audioOutputs.length > 1) {
            // التبديل بين الأجهزة
            isSpeakerOn = !isSpeakerOn;
            
            // اختيار الجهاز المناسب
            // عادةً الجهاز الأول هو السماعة الافتراضية (earpiece) والثاني هو السبيكر
            const targetDevice = isSpeakerOn ? audioOutputs[1] : audioOutputs[0];
            
            // استخدام Twilio Device لتغيير جهاز الإخراج
            if (device.audio && device.audio.speakerDevices) {
                await device.audio.speakerDevices.set(targetDevice.deviceId);
                console.log(isSpeakerOn ? '🔊 تم تشغيل السبيكر' : '🔈 تم التبديل للسماعة');
            }
            
            // تحديث واجهة المستخدم
            updateSpeakerButton();
        } else {
            // إذا كان جهاز واحد فقط، نحاول استخدام setSinkId مباشرة على عنصر الصوت
            isSpeakerOn = !isSpeakerOn;
            
            // البحث عن عنصر الصوت في الصفحة
            const audioElements = document.querySelectorAll('audio');
            for (const audio of audioElements) {
                if (audio.setSinkId && audioOutputs.length > 0) {
                    const targetIndex = isSpeakerOn ? Math.min(1, audioOutputs.length - 1) : 0;
                    await audio.setSinkId(audioOutputs[targetIndex].deviceId);
                }
            }
            
            updateSpeakerButton();
            console.log(isSpeakerOn ? '🔊 تم تشغيل السبيكر' : '🔈 تم التبديل للسماعة');
        }
    } catch (error) {
        console.error('❌ خطأ في تبديل السبيكر:', error);
        
        // في حالة الخطأ، نغير الحالة بصرياً فقط
        isSpeakerOn = !isSpeakerOn;
        updateSpeakerButton();
        
        // إظهار رسالة للمستخدم
        alert('ملاحظة: تبديل السبيكر قد لا يعمل على جميع المتصفحات والأجهزة');
    }
}

// تحديث زر السبيكر
function updateSpeakerButton() {
    if (speakerBtn) {
        speakerBtn.style.background = isSpeakerOn ? '#4CAF50' : '#f5f5f5';
        speakerBtn.style.color = isSpeakerOn ? 'white' : 'black';
        speakerBtn.querySelector('.icon').textContent = isSpeakerOn ? '🔊' : '🔈';
        speakerBtn.querySelector('.label').textContent = isSpeakerOn ? 'السبيكر ✓' : 'السبيكر';
    }
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
        const baseUrl = API_BASE_URL;
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
        
        const baseUrl = API_BASE_URL;
        const employeeId = localStorage.getItem('employeeId');
        const companyId = sessionStorage.getItem('companyId'); // للشركات
        const isCompanyAdmin = sessionStorage.getItem('isCompanyAdmin') === 'true';
        
        console.log('📋 جلب التسجيلات - employeeId:', employeeId, 'companyId:', companyId, 'userRole:', userRole, 'canViewAll:', canViewAll);
        
        // بناء URL مع المعاملات
        let url = `${baseUrl}/recordings`;
        const params = new URLSearchParams();

        // companyId مطلوب دائماً للـ API
        if (companyId) {
            params.append('companyId', companyId);
        }

        // تحديد نطاق التسجيلات
        if (isCompanyAdmin || canViewAll || userRole === 'admin') {
            // مدير الشركة أو من لديه صلاحية رؤية الكل
            params.append('viewAll', 'true');
            console.log('🏢 جلب جميع تسجيلات الشركة:', companyId);
        } else if (employeeId) {
            // الموظف يرى تسجيلاته فقط
            params.append('employeeId', employeeId);
            console.log('🔒 فلترة التسجيلات للموظف:', employeeId);
        } else {
            params.append('viewAll', 'true');
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

        // ─── تعبئة فلتر الموظف + إظهاره للمدير ───
        const isAdminOrManager = (userRole === 'admin') || (sessionStorage.getItem('isCompanyAdmin') === 'true');
        const filterBar = document.getElementById('recordings-filter-bar');
        if (isAdminOrManager && filterBar) {
            filterBar.style.display = 'flex';
            const sel = document.getElementById('rec-emp-filter');
            if (sel) {
                sel.innerHTML = '<option value="">كل الموظفين</option>';
                // جمع الموظفين الموجودين فعلاً في التسجيلات
                const empIds = [...new Set(recordings.map(r => r.employeeId).filter(Boolean))];
                empIds.forEach(eid => {
                    const name = window.employeesMap[eid] || window.employeesMap[String(eid)] || eid;
                    const opt = document.createElement('option');
                    opt.value = eid;
                    opt.textContent = name;
                    sel.appendChild(opt);
                });
            }
        }

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

// فلتر التسجيلات بالموظف المختار
function applyRecordingsFilter() {
    displayRecordings();
}

// عرض التسجيلات
function displayRecordings() {
    recordingsContainer.innerHTML = '';

    // فلترة الموظف
    const sel = document.getElementById('rec-emp-filter');
    const filterEmpId = sel ? sel.value : '';
    let list = recordings;
    if (filterEmpId) {
        list = recordings.filter(r => String(r.employeeId) === String(filterEmpId));
    }

    if (list.length === 0) {
        recordingsContainer.innerHTML = '<p style="text-align:center;color:#666;padding:20px">لا توجد تسجيلات</p>';
        return;
    }

    // الحصول على اسم المستخدم الحالي
    const currentUser = sessionStorage.getItem('fullname') || sessionStorage.getItem('username') || 'غير معروف';

    list.forEach((recording, index) => {
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
                            <button onclick="copyPhoneNumber('${phoneNumber}')" style="background: linear-gradient(135deg, #5ec4d4, #1e3a5f); color: white; border: none; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 4px; transition: all 0.3s;" title="نسخ الرقم">
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
        
        const baseUrl = API_BASE_URL;
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
        const baseUrl = API_BASE_URL;
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
        
        const baseUrl = API_BASE_URL;
        
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
            button.style.background = 'linear-gradient(135deg, #5ec4d4, #1e3a5f)';
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
                button.style.background = 'linear-gradient(135deg, #5ec4d4, #1e3a5f)';
            }, 2000);
            
            console.log('✅ تم نسخ الرقم (طريقة بديلة)');
        } catch (err) {
            alert('فشل نسخ الرقم: ' + error.message);
        }
    }
}

// أصوات DTMF للأرقام
const dtmfSounds = {
    '1': 697, '2': 697, '3': 697,
    '4': 770, '5': 770, '6': 770,
    '7': 852, '8': 852, '9': 852,
    '*': 941, '0': 941, '#': 941
};
const dtmfHighFreq = {
    '1': 1209, '2': 1336, '3': 1477,
    '4': 1209, '5': 1336, '6': 1477,
    '7': 1209, '8': 1336, '9': 1477,
    '*': 1209, '0': 1336, '#': 1477
};

// تشغيل صوت DTMF
function playDTMF(digit) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const duration = 0.15; // 150ms
        
        // التردد المنخفض
        const osc1 = audioContext.createOscillator();
        osc1.frequency.value = dtmfSounds[digit];
        osc1.type = 'sine';
        
        // التردد العالي
        const osc2 = audioContext.createOscillator();
        osc2.frequency.value = dtmfHighFreq[digit];
        osc2.type = 'sine';
        
        // التحكم في الصوت
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.3;
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        osc1.start();
        osc2.start();
        
        setTimeout(() => {
            osc1.stop();
            osc2.stop();
            audioContext.close();
        }, duration * 1000);
    } catch (e) {
        console.log('DTMF not supported');
    }
}

// معالجة أزرار لوحة الأرقام
document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const digit = btn.dataset.num;
        playDTMF(digit); // تشغيل صوت DTMF
        addDigit(digit);
    });
});

// معالجة أزرار التحكم
// زر الاتصال يظهر قائمة اختيار رقم الاتصال
const callerIdSelector = document.getElementById('caller-id-selector');
const confirmCallBtn = document.getElementById('confirm-call-btn');

callBtn.addEventListener('click', () => {
    if (!phoneNumber || phoneNumber.length < 3) {
        alert('الرجاء إدخال رقم صحيح');
        return;
    }
    // إظهار قائمة اختيار رقم الاتصال
    if (callerIdSelector) {
        callerIdSelector.classList.toggle('hidden');
    }
});

// زر تأكيد الاتصال يبدأ المكالمة
if (confirmCallBtn) {
    confirmCallBtn.addEventListener('click', () => {
        if (callerIdSelector) {
            callerIdSelector.classList.add('hidden');
        }
        makeCall();
    });
}

endCallBtn.addEventListener('click', endCall);
muteBtn.addEventListener('click', toggleMute);
if (speakerBtn) speakerBtn.addEventListener('click', toggleSpeaker);
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
        applyRoleBasedVisibility();
    });
}

if (callHistoryBtn) {
    callHistoryBtn.addEventListener('click', () => {
        console.log('Call history clicked');
        hideAllSections();
        removeAllActiveStates();
        callHistoryList.classList.remove('hidden');
        callHistoryBtn.classList.add('active');
        applyRoleBasedVisibility();
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
        applyRoleBasedVisibility();
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
        applyRoleBasedVisibility();
        loadRecordings();
    });
}

if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        console.log('⚙️ تم النقر على زر الإعدادات');
        hideAllSections();
        removeAllActiveStates();
        settingsPanel.classList.remove('hidden');
        settingsBtn.classList.add('active');
        
        // إعادة تطبيق الصلاحيات لضمان ظهور الأقسام الصحيحة
        applyRoleBasedVisibility();
        // تطبيق مرة ثانية بعد تأخير بسيط (لضمان ظهور الأقسام في جميع المتصفحات)
        setTimeout(() => applyRoleBasedVisibility(), 50);
        
        // تحميل قائمة الموظفين
        setTimeout(() => {
            loadEmployeesList();
        }, 100);
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
                const baseUrl = API_BASE_URL;
                
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
function applyRoleBasedVisibility() {
    const userRole = sessionStorage.getItem('userRole');
    const isCompanyAdmin = sessionStorage.getItem('isCompanyAdmin') === 'true';
    const employeesSection = document.getElementById('employees-section');
    const adminAccountSection = document.getElementById('admin-account-section');
    const adminAudioSection = document.getElementById('admin-audio-section');
    const employeeProfileSection = document.getElementById('employee-profile-section');
    const pricingSection = document.getElementById('pricing-section');
    const adminPanelSection = document.getElementById('admin-panel-section');
    const adminDashboardSection = document.getElementById('admin-dashboard-section');
    const companyAdminSection = document.getElementById('company-admin-section');
    const manageEmployeesNavBtn = document.getElementById('manage-employees-nav-btn');
    const companyReportsNavBtn = document.getElementById('company-reports-nav-btn');
    const companyCrmNavBtn = document.getElementById('company-crm-nav-btn');
    const balanceHeader = document.getElementById('balance-header');
    const balanceSection = document.getElementById('balance-section');
    const mobileBalance = document.getElementById('mobile-balance');

    if (userRole === 'admin' && !isCompanyAdmin) {
        // المطور يرى إدارة المديرين والإعدادات والتسعيرة
        if (employeesSection) employeesSection.style.display = 'block';
        if (adminAccountSection) adminAccountSection.style.display = 'block';
        if (adminAudioSection) adminAudioSection.style.display = 'block';
        if (pricingSection) pricingSection.style.display = 'block';
        if (adminPanelSection) adminPanelSection.style.display = 'block';
        if (adminDashboardSection) adminDashboardSection.style.display = 'block';
        if (companyAdminSection) companyAdminSection.style.display = 'none';
        if (employeeProfileSection) employeeProfileSection.style.display = 'none';
        if (manageEmployeesNavBtn) manageEmployeesNavBtn.style.display = 'none';
        if (balanceHeader) balanceHeader.style.display = 'flex';
        if (balanceSection) balanceSection.style.display = 'block';
        if (mobileBalance) mobileBalance.style.display = 'flex';
    } else if (userRole === 'company-admin' || isCompanyAdmin) {
        // مدير الشركة
        if (employeesSection) employeesSection.style.display = 'none';
        if (adminAccountSection) adminAccountSection.style.display = 'none';
        if (adminAudioSection) adminAudioSection.style.display = 'none';
        if (pricingSection) pricingSection.style.display = 'none';
        if (adminPanelSection) adminPanelSection.style.display = 'none';
        if (adminDashboardSection) adminDashboardSection.style.display = 'none';
        if (companyAdminSection) companyAdminSection.style.display = 'block';
        if (manageEmployeesNavBtn) manageEmployeesNavBtn.style.display = 'flex';
        if (companyReportsNavBtn) companyReportsNavBtn.style.display = 'flex';
        if (companyCrmNavBtn) companyCrmNavBtn.style.display = 'flex';
        // إخفاء رصيد Twilio - غير مناسب لمدير الشركة
        if (balanceHeader) balanceHeader.style.display = 'none';
        if (balanceSection) balanceSection.style.display = 'none';
        if (mobileBalance) mobileBalance.style.display = 'none';
        if (employeeProfileSection) {
            employeeProfileSection.style.display = 'block';
            loadEmployeeProfile();
        }
    } else {
        // ─── موظف الشركة ─── الصلاحيات تحدد ما يراه
        const permsRaw = sessionStorage.getItem('permissions');
        let perms = [];
        try {
            const parsed = JSON.parse(permsRaw || '[]');
            perms = Array.isArray(parsed) ? parsed : [];
        } catch(e) { perms = []; }

        const canMakeCalls      = perms.includes('make_calls');
        const canViewContacts   = perms.includes('view_contacts');
        const canViewCalls      = perms.includes('view_calls');
        const canViewRecordings = perms.includes('listen_recordings');
        const canViewReports    = perms.includes('view_reports');
        const canManageEmployees= perms.includes('manage_employees');

        console.log('👤 موظف الشركة - الصلاحيات:', perms);

        // إخفاء كل أقسام إدارة المطور / مدير الشركة
        if (employeesSection)       employeesSection.style.display       = 'none';
        if (adminAccountSection)    adminAccountSection.style.display    = 'none';
        if (adminAudioSection)      adminAudioSection.style.display      = 'none';
        if (pricingSection)         pricingSection.style.display         = 'none';
        if (adminPanelSection)      adminPanelSection.style.display      = 'none';
        if (adminDashboardSection)  adminDashboardSection.style.display  = 'none';
        if (companyAdminSection)    companyAdminSection.style.display    = 'none';
        if (balanceHeader)          balanceHeader.style.display          = 'none';
        if (balanceSection)         balanceSection.style.display         = 'none';
        if (mobileBalance)          mobileBalance.style.display          = 'none';

        // ── أزرار التنقل الجانبية ─ حسب الصلاحيات فقط ──
        if (manageEmployeesNavBtn)
            manageEmployeesNavBtn.style.display = canManageEmployees ? 'flex' : 'none';
        if (companyReportsNavBtn)
            companyReportsNavBtn.style.display  = canViewReports    ? 'flex' : 'none';
        if (companyCrmNavBtn)
            companyCrmNavBtn.style.display      = canViewContacts   ? 'flex' : 'none';

        // ── أزرار القائمة الرئيسية ─ حسب الصلاحيات ──
        const contactsBtn    = document.getElementById('contacts-btn');
        const callHistoryBtn = document.getElementById('call-history-btn');
        const recordingsBtn  = document.getElementById('recordings-btn');

        if (contactsBtn)    contactsBtn.style.display    = canViewContacts   ? 'flex' : 'none';
        if (callHistoryBtn) callHistoryBtn.style.display = canViewCalls      ? 'flex' : 'none';
        if (recordingsBtn)  recordingsBtn.style.display  = canViewRecordings ? 'flex' : 'none';

        // ── الديالر: اخفِه إن لم يكن لديه صلاحية الاتصال ──
        const dialpadEl = document.getElementById('dialpad');
        if (dialpadEl) dialpadEl.style.display = canMakeCalls ? 'flex' : 'none';

        // ── رسالة ترحيب إن لم يكن لديه أي صلاحية ──
        if (!canMakeCalls && perms.length === 0) {
            console.warn('⚠️ الموظف ليس لديه أي صلاحيات مضافة بعد');
        }

        // ── الملف الشخصي دائماً ظاهر ──
        if (employeeProfileSection) {
            employeeProfileSection.style.display = 'block';
            loadEmployeeProfile();
        }
    }
}

// تطبيق الصلاحيات عند تحميل الصفحة
applyRoleBasedVisibility();

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
        const baseUrl = API_BASE_URL;
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
            // صلاحيات الاتصال
            const callPerms = [];
            if (perms.callFromUSA) callPerms.push('🇺🇸');
            if (perms.callFromEgypt) callPerms.push('🇪🇬');
            if (perms.callFromSaudi) callPerms.push('🇸🇦');
            if (callPerms.length > 0) permsList.push('📞 ' + callPerms.join(' '));
            
            // التحقق إذا كان حساب تجريبي
            const trialBadge = emp.isTrial || emp.role === 'trial' 
                ? '<span style="background: #fff3cd; color: #856404; padding: 2px 8px; border-radius: 10px; font-size: 10px; margin-right: 5px;">🎁 تجريبي</span>' 
                : '';
            
            // الحصول على اسم الموظف بشكل آمن
            const empName = emp.name || emp.fullname || emp.username || 'غير معروف';
            const safeEmpName = empName.replace(/'/g, "\\'");
            
            return `
            <div class="employee-card">
                <div class="employee-header">
                    <div class="employee-info">
                        <h6>${empName} ${trialBadge}</h6>
                        <span class="employee-username">@${emp.username || 'غير محدد'}</span>
                        <span class="employee-phone">📱 ${emp.phone || 'غير محدد'}</span>
                        <span class="employee-dept">📂 ${emp.departmentName || emp.departmentArabic || 'غير محدد'}</span>
                        <div class="employee-perms" style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 5px;">
                            ${permsList.length > 0 
                                ? permsList.map(p => `<span style="background: #e3f2fd; padding: 3px 8px; border-radius: 12px; font-size: 11px;">${p}</span>`).join('') 
                                : '<span style="color: #999; font-size: 11px;">لا توجد صلاحيات</span>'}
                        </div>
                    </div>
                    <div class="employee-actions" style="display: flex; gap: 8px;">
                        <button class="edit-employee-btn" onclick="openEditEmployeeModal(${emp.id}, '${safeEmpName}', '${emp.username || ''}', '${emp.phone || ''}', '${emp.department || ''}')" title="تعديل" style="background: #4CAF50; border: none; color: white; padding: 8px 12px; border-radius: 8px; cursor: pointer;">✏️</button>
                        <button class="delete-employee-btn" onclick="deleteEmployee(${emp.id}, '${safeEmpName}')" title="حذف" style="background: #f44336; border: none; color: white; padding: 8px 12px; border-radius: 8px; cursor: pointer;">🗑️</button>
                    </div>
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
            editProfile: document.getElementById('emp-perm-edit-profile')?.checked || false,
            // صلاحيات الاتصال من الدول
            callFromUSA: document.getElementById('emp-perm-call-usa')?.checked || false,
            callFromEgypt: document.getElementById('emp-perm-call-egypt')?.checked || false,
            callFromSaudi: document.getElementById('emp-perm-call-saudi')?.checked || false
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
            const baseUrl = API_BASE_URL;
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
                // إعادة تعيين صلاحيات الاتصال
                document.getElementById('emp-perm-call-usa').checked = true; // أمريكا افتراضي
                document.getElementById('emp-perm-call-egypt').checked = false;
                document.getElementById('emp-perm-call-saudi').checked = false;
                
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
        const baseUrl = API_BASE_URL;
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

// فتح نافذة تعديل المدير
function openEditEmployeeModal(employeeId, fullname, username, phone, department) {
    if (!checkAdminAccess()) {
        alert('ليس لديك صلاحية للوصول لهذه الميزة!');
        return;
    }
    
    // إنشاء الـ Modal
    const modalHTML = `
        <div id="edit-employee-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        ">
            <div style="
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 20px;
                padding: 30px;
                max-width: 450px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.1);
            ">
                <h2 style="color: #fff; margin-bottom: 20px; text-align: center;">✏️ تعديل المدير</h2>
                <p style="color: #a0aec0; text-align: center; margin-bottom: 20px;">@${username}</p>
                
                <div style="margin-bottom: 15px;">
                    <label style="color: #cbd5e0; display: block; margin-bottom: 5px;">الاسم الكامل:</label>
                    <input type="text" id="edit-emp-fullname" value="${fullname}" style="
                        width: 100%;
                        padding: 12px;
                        border-radius: 10px;
                        border: 1px solid rgba(255,255,255,0.2);
                        background: rgba(255,255,255,0.1);
                        color: white;
                        font-size: 14px;
                        box-sizing: border-box;
                    ">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="color: #cbd5e0; display: block; margin-bottom: 5px;">📱 رقم الهاتف:</label>
                    <input type="tel" id="edit-emp-phone" value="${phone}" placeholder="+966..." style="
                        width: 100%;
                        padding: 12px;
                        border-radius: 10px;
                        border: 1px solid rgba(255,255,255,0.2);
                        background: rgba(255,255,255,0.1);
                        color: white;
                        font-size: 14px;
                        box-sizing: border-box;
                    ">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="color: #cbd5e0; display: block; margin-bottom: 5px;">🔐 كلمة المرور الجديدة:</label>
                    <input type="password" id="edit-emp-password" placeholder="اتركها فارغة إن لم ترد التغيير" style="
                        width: 100%;
                        padding: 12px;
                        border-radius: 10px;
                        border: 1px solid rgba(255,255,255,0.2);
                        background: rgba(255,255,255,0.1);
                        color: white;
                        font-size: 14px;
                        box-sizing: border-box;
                    ">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="color: #cbd5e0; display: block; margin-bottom: 5px;">📂 القسم:</label>
                    <select id="edit-emp-department" style="
                        width: 100%;
                        padding: 12px;
                        border-radius: 10px;
                        border: 1px solid rgba(255,255,255,0.2);
                        background: rgba(255,255,255,0.1);
                        color: white;
                        font-size: 14px;
                        box-sizing: border-box;
                    ">
                        <option value="1" ${department === '1' ? 'selected' : ''}>الحجوزات</option>
                        <option value="2" ${department === '2' ? 'selected' : ''}>المبيعات</option>
                        <option value="3" ${department === '3' ? 'selected' : ''}>خدمة العملاء</option>
                        <option value="4" ${department === '4' ? 'selected' : ''}>الحسابات</option>
                        <option value="5" ${department === '5' ? 'selected' : ''}>الدعم الفنى</option>
                        <option value="6" ${department === '6' ? 'selected' : ''}>الشكاوى والاقتراحات</option>
                        <option value="trial" ${department === 'trial' ? 'selected' : ''}>حساب تجريبي</option>
                    </select>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="updateEmployee(${employeeId})" style="
                        background: linear-gradient(135deg, #4CAF50, #45a049);
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 25px;
                        font-size: 16px;
                        cursor: pointer;
                    ">💾 حفظ التعديلات</button>
                    <button onclick="document.getElementById('edit-employee-modal').remove()" style="
                        background: linear-gradient(135deg, #6c757d, #5a6268);
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 25px;
                        font-size: 16px;
                        cursor: pointer;
                    ">❌ إلغاء</button>
                </div>
            </div>
        </div>
    `;
    
    // إزالة أي modal قديم
    const oldModal = document.getElementById('edit-employee-modal');
    if (oldModal) oldModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// تحديث بيانات المدير
async function updateEmployee(employeeId) {
    const fullname = document.getElementById('edit-emp-fullname').value.trim();
    const phone = document.getElementById('edit-emp-phone').value.trim();
    const password = document.getElementById('edit-emp-password').value.trim();
    const department = document.getElementById('edit-emp-department').value;
    
    if (!fullname) {
        alert('الرجاء إدخال الاسم الكامل');
        return;
    }
    
    try {
        const baseUrl = API_BASE_URL;
        const response = await fetch(`${baseUrl}/employees/${employeeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fullname,
                phone,
                password: password || undefined, // إرسال كلمة المرور فقط إذا تم إدخالها
                department
            })
        });
        
        if (response.ok) {
            document.getElementById('edit-employee-modal').remove();
            loadEmployeesList();
            alert('تم تحديث بيانات المدير بنجاح! ✅');
        } else {
            const data = await response.json();
            alert('فشل في تحديث البيانات: ' + (data.error || 'خطأ غير معروف'));
        }
    } catch (error) {
        console.error('خطأ في تحديث المدير:', error);
        alert('فشل في تحديث البيانات');
    }
}

// جعل الدوال متاحة عالمياً
window.openEditEmployeeModal = openEditEmployeeModal;
window.updateEmployee = updateEmployee;

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
    const sidebarUsername = document.getElementById('sidebar-username');
    const sidebarRole = document.getElementById('sidebar-role');
    
    const displayName = fullname || username || 'مستخدم';
    console.log('✅ عرض الاسم:', displayName);
    
    if (headerUsername) {
        headerUsername.textContent = displayName;
    }
    
    if (sidebarUsername) {
        sidebarUsername.textContent = displayName;
    }
    
    // تحديد النص بناءً على نوع الحساب
    const isCompanyAdmin = sessionStorage.getItem('isCompanyAdmin') === 'true';
    const ROLE_NAMES_AR = {
        'agent':      '👤 موظف',
        'supervisor': '👔 مشرف',
        'viewer':     '👁️ مراقب',
        'manager':    '👨‍💼 مدير'
    };
    let roleText;
    if (role === 'company-admin' || isCompanyAdmin) {
        roleText = '🏢 مدير شركة';
    } else if (role === 'admin') {
        roleText = '👑 مطور';
    } else {
        // الموظف — نعرض اسم دوره بالعربي
        roleText = ROLE_NAMES_AR[role] || ('👤 ' + (role || 'موظف'));
    }
    
    if (headerRole) {
        headerRole.textContent = roleText;
    }
    
    if (sidebarRole) {
        sidebarRole.textContent = roleText;
    }
    
    // إظهار زر لوحة التحكم للمطور فقط (وليس مدير الشركة)
    const adminLinkBtn = document.getElementById('admin-link-btn');
    if (adminLinkBtn) {
        if ((role === 'admin' && !isCompanyAdmin) || username === 'akram') {
            adminLinkBtn.style.display = 'flex';
        } else {
            adminLinkBtn.style.display = 'none';
        }
    }
}

// تحميل معلومات المستخدم عند فتح الصفحة
displayUserInfo();

// إعادة عرض اسم الدور عند تغيير اللغة
document.addEventListener('langChanged', () => {
    displayUserInfo();
});

// ========== جلب رصيد الحساب ==========
let rechargeUrl = 'https://console.twilio.com/us1/billing/manage-billing/billing-overview';

async function loadAccountBalance() {
    const balanceEl = document.getElementById('account-balance');
    const currencyEl = document.getElementById('balance-currency');
    const statusEl = document.getElementById('balance-status');
    const accountStatusEl = document.getElementById('account-status');
    const balanceDisplay = document.querySelector('.balance-display');

    // عناصر الهيدر
    const headerBalanceEl = document.getElementById('header-balance');
    const headerBalanceContainer = document.getElementById('balance-header');
    const sidebarBalanceEl = document.getElementById('sidebar-balance');

    try {
        if (balanceEl) {
            balanceEl.textContent = '...';
            if (statusEl) statusEl.textContent = 'جاري التحميل...';
        }

        const baseUrl = API_BASE_URL;
        const companyId = sessionStorage.getItem('companyId');

        // إذا كان مدير شركة أو موظف شركة → اقرأ رصيد الشركة من API الخاص بنا
        if (companyId) {
            const r = await fetch(`${baseUrl}/api/companies/balance?companyId=${companyId}`);
            if (r.ok) {
                const d = await r.json();
                if (d.success) {
                    const balance = parseFloat(d.balance || 0).toFixed(2);
                    if (balanceEl)        balanceEl.textContent = balance;
                    if (currencyEl)      currencyEl.textContent = 'USD';
                    if (headerBalanceEl) headerBalanceEl.textContent = balance;
                    if (sidebarBalanceEl) sidebarBalanceEl.textContent = balance;
                    if (accountStatusEl) accountStatusEl.textContent = '\u2705 نشط';
                    if (balanceDisplay)  balanceDisplay.classList.remove('balance-low','balance-medium','balance-good');
                    if (headerBalanceContainer) headerBalanceContainer.classList.remove('low','medium');
                    if (parseFloat(balance) < 5) {
                        if (statusEl) statusEl.textContent = '\u26a0\ufe0f الرصيد منخفض!';
                        if (balanceDisplay) balanceDisplay.classList.add('balance-low');
                        if (headerBalanceContainer) headerBalanceContainer.classList.add('low');
                    } else if (parseFloat(balance) < 20) {
                        if (statusEl) statusEl.textContent = '\ud83d\udca1 الرصيد متوسط';
                        if (balanceDisplay) balanceDisplay.classList.add('balance-medium');
                        if (headerBalanceContainer) headerBalanceContainer.classList.add('medium');
                    } else {
                        if (statusEl) statusEl.textContent = '\u2705 الرصيد جيد';
                        if (balanceDisplay) balanceDisplay.classList.add('balance-good');
                    }
                    // تحديث اسم الشركة والمدير تلقائياً لو كان مخزّن بشكل خاطئ
                    if (d.companyName) {
                        sessionStorage.setItem('companyName', d.companyName);
                        const el = document.getElementById('companyName');
                        if (el) el.textContent = d.companyName;
                    }
                    if (d.adminName) {
                        const storedName = sessionStorage.getItem('fullname') || '';
                        if (storedName.includes('?') || storedName.includes('￿d')) {
                            sessionStorage.setItem('fullname', d.adminName);
                            const hEl = document.getElementById('header-username');
                            const sEl = document.getElementById('sidebar-username');
                            if (hEl) hEl.textContent = d.adminName;
                            if (sEl) sEl.textContent = d.adminName;
                        }
                    }
                    console.log('💰 الرصيد الحالي:', balance, 'USD');
                    return;
                }
            }
        }

        // fallback → رصيد Twilio (للمطور الرئيسي فقط)
        const response = await fetch(`${baseUrl}/account/balance`);
        
        if (response.ok) {
            const data = await response.json();
            
            // عرض الرصيد
            const balance = parseFloat(data.balance).toFixed(2);
            
            if (balanceEl) {
                balanceEl.textContent = balance;
                currencyEl.textContent = data.currency || 'USD';
            }
            
            // تحديث الهيدر
            if (headerBalanceEl) {
                headerBalanceEl.textContent = balance;
            }
            
            // تحديث القائمة الجانبية
            if (sidebarBalanceEl) {
                sidebarBalanceEl.textContent = balance;
            }
            
            // حفظ رابط الشحن
            if (data.rechargeUrl) {
                rechargeUrl = data.rechargeUrl;
            }
            
            // حالة الحساب
            if (accountStatusEl) {
                accountStatusEl.textContent = data.accountStatus === 'active' ? '✅ نشط' : data.accountStatus;
            }
            
            // تحديد حالة الرصيد (منخفض/متوسط/جيد)
            if (balanceDisplay) {
                balanceDisplay.classList.remove('balance-low', 'balance-medium', 'balance-good');
            }
            if (headerBalanceContainer) {
                headerBalanceContainer.classList.remove('low', 'medium');
            }
            
            if (balance < 5) {
                if (statusEl) statusEl.textContent = '⚠️ الرصيد منخفض! يُنصح بإعادة الشحن';
                if (balanceDisplay) balanceDisplay.classList.add('balance-low');
                if (headerBalanceContainer) headerBalanceContainer.classList.add('low');
            } else if (balance < 20) {
                if (statusEl) statusEl.textContent = '💡 الرصيد متوسط';
                if (balanceDisplay) balanceDisplay.classList.add('balance-medium');
                if (headerBalanceContainer) headerBalanceContainer.classList.add('medium');
            } else {
                if (statusEl) statusEl.textContent = '✅ الرصيد جيد';
                if (balanceDisplay) balanceDisplay.classList.add('balance-good');
            }
            
            console.log('💰 الرصيد الحالي:', balance, data.currency);
            
        } else {
            throw new Error('فشل جلب الرصيد');
        }
    } catch (error) {
        console.error('خطأ في جلب الرصيد:', error);
        if (balanceEl) balanceEl.textContent = '--';
        if (statusEl) statusEl.textContent = '❌ تعذر جلب الرصيد';
        if (headerBalanceEl) headerBalanceEl.textContent = '--';
    }
}

// فتح صفحة إعادة الشحن
function openRechargeUrl() {
    window.open(rechargeUrl, '_blank');
}

// تحميل الرصيد يتم تلقائياً كل 5 ثواني في startBalanceAutoRefresh

// تحميل بيانات الملف الشخصي للمدير
function loadEmployeeProfile() {
    const fullname = sessionStorage.getItem('fullname');
    const username = sessionStorage.getItem('username');
    
    // الحصول على بيانات المدير من السيرفر
    const employeeId = localStorage.getItem('employeeId');
    
    if (employeeId) {
        // تحميل بيانات المدير من API
        const baseUrl = API_BASE_URL;
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
            
            const baseUrl = API_BASE_URL;
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

// وظيفة تسجيل الخروج المشتركة
async function performLogout() {
    if (confirm('هل تريد تسجيل الخروج؟')) {
        // تسجيل وقت الخروج
        try {
            const employeeId = localStorage.getItem('employeeId');
            const employeeName = localStorage.getItem('employeeName');
            const baseUrl = API_BASE_URL;
            
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
}

// زر تسجيل الخروج في الهيدر
const logoutHeaderBtn = document.getElementById('logout-header-btn');
if (logoutHeaderBtn) {
    logoutHeaderBtn.addEventListener('click', performLogout);
}

// زر تسجيل الخروج في القائمة الجانبية
const sidebarLogoutBtn = document.getElementById('sidebar-logout-btn');
if (sidebarLogoutBtn) {
    sidebarLogoutBtn.addEventListener('click', performLogout);
}

// إظهار زر لوحة التحكم في القائمة الجانبية للمطور فقط
const sidebarAdminBtn = document.getElementById('sidebar-admin-btn');
if (sidebarAdminBtn) {
    const role = sessionStorage.getItem('userRole');
    const isCompanyAdmin = sessionStorage.getItem('isCompanyAdmin') === 'true';
    const username = sessionStorage.getItem('username');
    // فقط المطور (وليس مدير الشركة) يرى لوحة التحكم
    if ((role === 'admin' && !isCompanyAdmin) || username === 'akram') {
        sidebarAdminBtn.style.display = 'flex';
    }
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
        if (currentCall) {
            currentCall.sendDigits(e.key);
        }
    } else if (e.key === 'Backspace') {
        deleteDigit();
    } else if (e.key === 'Enter') {
        if (!currentCall) {
            makeCall();
        }
    } else if (e.key === 'Escape') {
        if (currentCall) {
            endCall();
        }
    }
});

// حفظ المكالمة في السجل المحلي + Firestore
function saveCallToHistory(call) {
    try {
        // 1) حفظ محلي فوري
        const calls = JSON.parse(localStorage.getItem('callHistory') || '[]');
        calls.unshift(call);
        if (calls.length > 100) calls.splice(100);
        localStorage.setItem('callHistory', JSON.stringify(calls));
        updateCallHistoryBadge();

        // 2) حفظ في Firestore عبر API (للمزامنة بين الأجهزة)
        const companyId = sessionStorage.getItem('companyId');
        const employeeId = localStorage.getItem('employeeId') || sessionStorage.getItem('username') || 'unknown';
        const employeeName = sessionStorage.getItem('fullname') || sessionStorage.getItem('username') || 'unknown';
        if (companyId) {
            // البحث عن اسم جهة الاتصال من الكاش
            let contactName = null;
            if (_cachedContacts && _cachedContacts.length > 0) {
                const cleanTo = (call.to || '').replace(/[\s\-+]/g, '');
                const found = _cachedContacts.find(c => {
                    const cp = (c.phone || '').replace(/[\s\-+]/g, '');
                    return cp.includes(cleanTo) || cleanTo.includes(cp);
                });
                if (found) contactName = found.name;
            }
            fetch(`${API_BASE_URL}/api/call-history`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyId,
                    callData: {
                        ...call,
                        employeeId,
                        employeeName,
                        contactName: contactName || null,
                        sid: `call_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
                    }
                })
            }).catch(err => console.warn('⚠️ تعذر حفظ المكالمة في Firestore:', err.message));
        }
        console.log('✅ تم حفظ المكالمة في السجل');
    } catch (error) {
        console.error('خطأ في حفظ المكالمة:', error);
    }
}

// تحديث عدد المكالمات على الـ badge
function updateCallHistoryBadge() {
    const badge = document.getElementById('call-history-badge');
    if (!badge) return;
    
    try {
        const calls = JSON.parse(localStorage.getItem('callHistory') || '[]');
        const count = calls.length;
        
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    } catch (error) {
        console.error('خطأ في تحديث badge سجل المكالمات:', error);
    }
}

// استدعاء تحديث الـ badge عند تحميل الصفحة
setTimeout(updateCallHistoryBadge, 500);

// تحميل سجل المكالمات من Firestore (للمزامنة بين الأجهزة)
async function loadCallHistory() {
    const container = document.getElementById('call-history-container');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center;color:#aaa;padding:20px">⏳ جاري التحميل...</p>';
    try {
        const companyId = sessionStorage.getItem('companyId');
        const userRole   = sessionStorage.getItem('userRole');
        const isAdmin    = sessionStorage.getItem('isCompanyAdmin') === 'true' || userRole === 'admin';
        const employeeId = localStorage.getItem('employeeId');

        // ─── جلب المكالمات من Firestore ───
        let calls = [];
        if (companyId) {
            const params = new URLSearchParams({ companyId });
            if (!isAdmin && employeeId) params.append('employeeId', employeeId);
            const resp = await fetch(`${API_BASE_URL}/api/call-history?${params}`);
            const data = await resp.json();
            calls = data.calls || [];
            console.log(`📞 سجل المكالمات: ${calls.length} مكالمة من Firestore`);
        }

        // ─── fallback: localStorage إذا كانت Firestore فارغة ───
        if (calls.length === 0) {
            calls = JSON.parse(localStorage.getItem('callHistory') || '[]');
        }

        // ─── جهات الاتصال لعرض الأسماء ───
        let contacts = _cachedContacts || [];
        if (contacts.length === 0 && companyId) {
            try {
                const cr = await fetch(`${API_BASE_URL}/api/contacts?companyId=${encodeURIComponent(companyId)}`);
                const cd = await cr.json();
                contacts = cd.contacts || [];
            } catch (_) {}
        }

        container.innerHTML = '';
        if (calls.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="empty-icon">📞</div><p>لا توجد مكالمات حتى الآن</p></div>`;
            return;
        }

        calls.sort((a, b) => new Date(b.startTime || b.createdAt || 0) - new Date(a.startTime || a.createdAt || 0));

        calls.forEach(call => {
            const dateStr = call.startTime || call.createdAt;
            const formattedDate = dateStr ? new Date(dateStr).toLocaleString('ar-EG') : '—';
            const durationRaw = call.duration;
            let durationText = 'لم تكتمل';
            if (durationRaw) {
                const sec = parseInt(durationRaw);
                if (!isNaN(sec) && sec > 0) {
                    const m = Math.floor(sec / 60), s = sec % 60;
                    durationText = m > 0 ? `${m} د ${s} ث` : `${s} ث`;
                } else if (durationRaw.includes(':')) {
                    durationText = durationRaw;
                }
            }

            const callType   = call.direction === 'inbound' ? '📥 واردة' : '📤 صادرة';
            const statusColor = call.status === 'completed' ? '#4ECDC4' : '#FF6B6B';
            const toNum = call.to || '';

            // اسم جهة الاتصال — يُعطى الأولوية لـ contactName المحفوظ في Firestore
            let displayName = toNum;
            let isContact   = false;
            if (call.contactName) {
                displayName = `👤 ${call.contactName}`;
                isContact = true;
            } else if (contacts.length > 0) {
                const cleanTo = toNum.replace(/[\s\-+]/g, '');
                const found = contacts.find(c => {
                    const cp = (c.phone || '').replace(/[\s\-+]/g, '');
                    return cp.includes(cleanTo) || cleanTo.includes(cp);
                });
                if (found) { displayName = `👤 ${found.name}`; isContact = true; }
            }

            // اسم الموظف
            const empName = call.employeeName || (window.employeesMap && call.employeeId ? window.employeesMap[call.employeeId] : null) || '';

            const item = document.createElement('div');
            item.className = 'call-item';
            item.innerHTML = `
                <div class="call-item-info">
                    <div class="call-item-number" style="${isContact ? 'color:#5ec4d4;font-weight:600;' : ''}">${displayName}</div>
                    ${isContact ? `<div style="font-size:12px;color:#999">${toNum}</div>` : ''}
                    ${empName ? `<div style="font-size:12px;color:#a0aab4">👤 ${empName}</div>` : ''}
                    <div class="call-item-details">
                        <span class="call-item-type">${callType}</span>
                        <span>${formattedDate}</span>
                        <span style="color:${statusColor}">${durationText}</span>
                    </div>
                </div>
                <div class="call-item-actions">
                    <button class="play-btn" onclick="dialNumber('${toNum}')">📞 اتصال</button>
                </div>
            `;
            container.appendChild(item);
        });
    } catch (error) {
        console.error('خطأ في تحميل سجل المكالمات:', error);
        container.innerHTML = '<p style="text-align:center;color:#f44336;padding:20px">⚠ خطأ في تحميل السجل</p>';
    }
}

// تحميل جهات الاتصال
// تحميل جهات الاتصال
// cache للبحث السريع بدون طلب API جديد
let _cachedContacts = [];

function _renderContactItem(contact) {
    const item = document.createElement('div');
    item.className = 'contact-item';
    const initial = (contact.name || '?').charAt(0).toUpperCase();
    const cid  = contact._id || contact.id || contact.contactId || '';
    const safeId = cid.toString().replace(/'/g, '');
    const safeName = (contact.name || '').replace(/'/g, '&#39;');
    const safePhone = (contact.phone || '').replace(/'/g, '');
    item.innerHTML = `
        <div class="contact-avatar">${initial}</div>
        <div class="contact-info">
            <div class="contact-name">${contact.name || ''}</div>
            <div class="contact-phone">${contact.phone || ''}</div>
        </div>
        <div class="contact-actions">
            <button class="contact-call-btn" onclick="callContact('${safePhone}')" title="اتصال">📞</button>
            <button class="contact-delete-btn" onclick="deleteContact('${safeId}', '${safeName}')" title="حذف" style="background: linear-gradient(135deg, #fa709a, #fee140); color: white; width: 35px; height: 35px; border: none; border-radius: 50%; cursor: pointer; font-size: 16px; transition: all 0.2s;">🗑️</button>
        </div>
    `;
    return item;
}

async function loadContacts() {
    const container = document.getElementById('contacts-container');
    const companyId = sessionStorage.getItem('companyId');

    if (!companyId) {
        console.warn('⚠️ loadContacts: لا يوجد companyId في sessionStorage');
        return;
    }

    try {
        const baseUrl = API_BASE_URL;
        const response = await fetch(`${baseUrl}/api/contacts?companyId=${encodeURIComponent(companyId)}`);
        const data = await response.json();
        const contacts = data.contacts || [];
        _cachedContacts = contacts; // cache للبحث

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

        contacts.forEach(contact => container.appendChild(_renderContactItem(contact)));
        console.log('✅ تم تحميل', contacts.length, 'جهة اتصال للشركة', companyId);
    } catch (error) {
        console.error('خطأ في تحميل جهات الاتصال:', error);
        container.innerHTML = '<p style="text-align: center; color: #f44336;">خطأ في تحميل جهات الاتصال</p>';
    }
}

// إضافة جهة اتصال
// ─── مودال إضافة جهة اتصال ───────────────────────────────────────────────────
function addContact() {
    // مسح القيم والأخطاء
    ['nc-name','nc-phone','nc-email','nc-notes'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    ['nc-name-err','nc-phone-err','nc-error-banner'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    const btn = document.getElementById('nc-submit-btn');
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
    document.getElementById('nc-submit-text').textContent = 'حفظ جهة الاتصال';
    document.getElementById('nc-submit-icon').textContent = '✓';

    // إظهار المودال
    const modal = document.getElementById('add-contact-modal');
    modal.style.display = 'flex';
    setTimeout(() => { const el = document.getElementById('nc-name'); if (el) el.focus(); }, 80);
}

function closeAddContactModal() {
    const modal = document.getElementById('add-contact-modal');
    if (modal) modal.style.display = 'none';
}

// إغلاق عند النقر خارج المودال
document.getElementById('add-contact-modal')?.addEventListener('click', function(e) {
    if (e.target === this) closeAddContactModal();
});

async function submitAddContact() {
    // تنظيف سابق
    ['nc-name-err','nc-phone-err','nc-error-banner'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const name  = (document.getElementById('nc-name')?.value  || '').trim();
    const phone = (document.getElementById('nc-phone')?.value || '').trim();
    const email = (document.getElementById('nc-email')?.value || '').trim();
    const notes = (document.getElementById('nc-notes')?.value || '').trim();

    let valid = true;
    if (!name)  { document.getElementById('nc-name-err').style.display  = 'block'; valid = false; }
    if (!phone) { document.getElementById('nc-phone-err').style.display = 'block'; valid = false; }
    if (!valid) return;

    const companyId = sessionStorage.getItem('companyId');
    const addedBy   = sessionStorage.getItem('username') || 'unknown';

    if (!companyId) {
        showContactError('لم يتم العثور على معلومات الشركة. يرجى تسجيل الدخول أولاً');
        return;
    }

    // حالة التحميل
    const btn = document.getElementById('nc-submit-btn');
    btn.disabled = true;
    btn.style.opacity = '0.7';
    document.getElementById('nc-submit-text').textContent = 'جاري الحفظ...';
    document.getElementById('nc-submit-icon').textContent = '⏳';

    try {
        const response = await fetch(`${API_BASE_URL}/api/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyId, name, phone, email: email || null, notes: notes || '', addedBy, device: 'web' })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            document.getElementById('nc-submit-text').textContent = 'تمت الإضافة!';
            document.getElementById('nc-submit-icon').textContent = '✅';
            btn.style.background = 'linear-gradient(135deg,#43e97b,#38f9d7)';
            btn.style.opacity = '1';
            setTimeout(() => {
                closeAddContactModal();
                loadContacts();
            }, 900);
        } else {
            btn.disabled = false;
            btn.style.opacity = '1';
            document.getElementById('nc-submit-text').textContent = 'حفظ جهة الاتصال';
            document.getElementById('nc-submit-icon').textContent = '✓';
            showContactError(data.error || 'فشل في إضافة جهة الاتصال');
        }
    } catch (error) {
        btn.disabled = false;
        btn.style.opacity = '1';
        document.getElementById('nc-submit-text').textContent = 'حفظ جهة الاتصال';
        document.getElementById('nc-submit-icon').textContent = '✓';
        showContactError('خطأ في الاتصال بالخادم: ' + error.message);
    }
}

function showContactError(msg) {
    const el = document.getElementById('nc-error-banner');
    if (el) { el.textContent = '⚠ ' + msg; el.style.display = 'block'; }
}



// حذف جهة اتصال (soft delete - لا تُمسح من Firestore)
async function deleteContact(contactId, contactName) {
    if (!confirm(`هل تريد حذف ${contactName}؟`)) return;

    const companyId = sessionStorage.getItem('companyId');
    const deletedBy = sessionStorage.getItem('username') || 'unknown';

    if (!companyId) {
        alert('لم يتم العثور على معلومات الشركة');
        return;
    }

    try {
        const baseUrl = API_BASE_URL;
        const response = await fetch(
            `${baseUrl}/api/contacts?companyId=${encodeURIComponent(companyId)}&contactId=${encodeURIComponent(contactId)}&deletedBy=${encodeURIComponent(deletedBy)}`,
            { method: 'DELETE' }
        );

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('✅ تم حذف جهة الاتصال (soft delete)');
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

// البحث في جهات الاتصال — يعمل على الـ cache المحلي (بدون طلب API جديد)
const contactSearch = document.getElementById('contact-search');
if (contactSearch) {
    contactSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const container  = document.getElementById('contacts-container');

        if (!searchTerm) {
            // البحث فارغ → أعد عرض الكل
            container.innerHTML = '';
            _cachedContacts.forEach(c => container.appendChild(_renderContactItem(c)));
            return;
        }

        const filtered = _cachedContacts.filter(c =>
            (c.name  || '').toLowerCase().includes(searchTerm) ||
            (c.phone || '').includes(searchTerm)
        );

        container.innerHTML = '';
        if (filtered.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#888;padding:30px">لا نتائج للبحث</p>';
            return;
        }
        filtered.forEach(c => container.appendChild(_renderContactItem(c)));
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
        const baseUrl = API_BASE_URL;
        
        if (employeeId && employeeName) {
            // استخدام sendBeacon لإرسال البيانات حتى عند إغلاق الصفحة
            const data = JSON.stringify({
                action: 'logout',
                employeeId: employeeId,
                employeeName: employeeName
            });
            
            // استخدام Blob مع application/json حتى يتم parse الـ body صح
            const blob = new Blob([data], { type: 'application/json' });
            navigator.sendBeacon(`${baseUrl}/work-tracking`, blob);
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
            const baseUrl = API_BASE_URL;
            
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
                
                const blob = new Blob([data], { type: 'application/json' });
                navigator.sendBeacon(`${baseUrl}/work-tracking`, blob);
            }
        } catch (error) {
            console.error('خطأ في تسجيل إخفاء التطبيق:', error);
        }
    }
});

// تهيئة التطبيق عند التحميل
initializeApp();

// تسجيل وقت الدخول للموظفين من CRM
if (autoLogin === 'true' && empId && empName) {
    const baseUrl = API_BASE_URL;
    fetch(`${baseUrl}/work-tracking`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'login',
            employeeId: empId,
            employeeName: decodeURIComponent(empName)
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
        const baseUrl = API_BASE_URL;
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
        const baseUrl = API_BASE_URL;
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
const userRole = sessionStorage.getItem('userRole');
if (userRole !== 'admin' && workReportsBtn) {
    workReportsBtn.style.display = 'none';
}

// ===== تحديث الرصيد تلقائياً كل 5 ثواني =====
let balanceRefreshInterval = null;

function startBalanceAutoRefresh() {
    // تحديث فوري
    loadAccountBalance();
    
    // تحديث كل 5 ثواني
    balanceRefreshInterval = setInterval(() => {
        loadAccountBalance();
    }, 5000);
    
    console.log('✅ تحديث الرصيد التلقائي مفعّل - كل 5 ثواني');
}

// بدء تحديث الرصيد عند تحميل الصفحة
startBalanceAutoRefresh();

console.log('✅ التطبيق يعمل بشكل مستمر - لا يوجد تسجيل خروج تلقائي');

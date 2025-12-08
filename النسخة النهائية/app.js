// معلومات Twilio
const TWILIO_PHONE_NUMBER = '+13204336644';
let currentCallSid = null;
let callStartTime;
let callTimer;
let isRecording = false;
let callCheckInterval = null;

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

// تحقق من وجود الأزرار
console.log('Buttons loaded:', {
    dialpadBtn: !!dialpadBtn,
    callHistoryBtn: !!callHistoryBtn,
    contactsBtn: !!contactsBtn,
    recordingsBtn: !!recordingsBtn,
    settingsBtn: !!settingsBtn
});

// المتغيرات
let phoneNumber = '';
let isMuted = false;
let isOnHold = false;
let recordings = [];
let device = null;
let currentCall = null;

// تهيئة التطبيق مع Twilio Voice SDK v2
async function initializeApp() {
    try {
        console.log('🔄 جاري تهيئة Twilio Device...');
        updateConnectionStatus('connecting', 'جاري الاتصال...');
        
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
    // تحويل الأرقام المصرية
    else if (formattedNumber.startsWith('01')) {
        formattedNumber = '+20' + formattedNumber.substring(1);
    } else if (formattedNumber.startsWith('0020')) {
        formattedNumber = '+' + formattedNumber.substring(2);
    } else if (formattedNumber.startsWith('201') && !formattedNumber.startsWith('+')) {
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
        callNumber.textContent = formattedNumber;
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
            employeeId: employeeId  // إرسال معرف الموظف
        };
        
        console.log('👤 معرف الموظف للمكالمة:', employeeId);
        
        currentCall = await device.connect({ params });
        
        // معالجة أحداث المكالمة
        currentCall.on('accept', () => {
            console.log('✅ تم قبول المكالمة');
            updateCallStatus('متصل ✅');
            startCallTimer();
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
        callNumber.textContent = call.parameters.From;
        updateCallStatus('متصل ✅');
        startCallTimer();
        
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
        saveCallToHistory({
            to: phoneNumber,
            direction: 'outbound',
            status: 'completed',
            startTime: new Date().toISOString(),
            duration: callDuration.textContent
        });
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
        // التحقق من صلاحية مشاهدة التسجيلات
        const canViewRecordings = sessionStorage.getItem('canViewRecordings') === 'true';
        const userRole = sessionStorage.getItem('userRole');
        
        if (!canViewRecordings && userRole !== 'admin') {
            recordingsContainer.innerHTML = '<p style="text-align: center; color: #ff6b6b; padding: 20px;">⚠️ ليس لديك صلاحية لمشاهدة التسجيلات</p>';
            updateRecordingsBadge(0);
            return;
        }
        
        const baseUrl = window.location.origin;
        const employeeId = localStorage.getItem('employeeId');
        
        const response = await fetch(`${baseUrl}/recordings`);
        const data = await response.json();
        
        // تصفية التسجيلات للموظف الحالي فقط (إلا إذا كان admin)
        const allRecordings = data.recordings || [];
        
        if (userRole === 'admin') {
            // المطور يرى كل التسجيلات
            recordings = allRecordings;
        } else {
            // الموظف يرى تسجيلاته فقط
            recordings = allRecordings.filter(rec => {
                if (rec.employeeId) {
                    return rec.employeeId === employeeId;
                }
                return false; // لا تعرض التسجيلات بدون employeeId للموظفين
            });
        }
        
        console.log(`📊 إجمالي التسجيلات: ${allRecordings.length}, تسجيلات الموظف: ${recordings.length}`);
        
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
        
        // استخراج رقم الهاتف من callSid أو from/to
        const phoneNumber = recording.to || recording.from || 'غير محدد';
        
        // حساب المدة بالدقائق والثواني
        const duration = recording.duration || 0;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        const durationText = minutes > 0 ? `${minutes} د ${seconds} ث` : `${seconds} ث`;
        
        item.innerHTML = `
            <div class="recording-info">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <span style="font-size: 24px;">📞</span>
                    <div>
                        <div class="recording-number" style="font-weight: bold; font-size: 16px; color: #333;">
                            ${phoneNumber}
                        </div>
                        <div style="font-size: 12px; color: #666;">
                            بواسطة: ${currentUser}
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
                <button class="delete-btn" onclick="deleteRecording('${recording.sid}')" style="background: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                    🗑️ حذف
                </button>
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
            alert('تم حذف التسجيل بنجاح');
            loadRecordings(); // إعادة تحميل القائمة
        } else {
            throw new Error(data.error || 'فشل حذف التسجيل');
        }
    } catch (error) {
        console.error('خطأ في حذف التسجيل:', error);
        alert('فشل حذف التسجيل: ' + error.message);
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
}

// دالة لإزالة التفعيل من جميع أزرار القائمة
function removeAllActiveStates() {
    dialpadBtn.classList.remove('active');
    callHistoryBtn.classList.remove('active');
    contactsBtn.classList.remove('active');
    recordingsBtn.classList.remove('active');
    settingsBtn.classList.remove('active');
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

// زر تسجيل الخروج
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (confirm('هل تريد تسجيل الخروج؟')) {
            sessionStorage.removeItem('isLoggedIn');
            sessionStorage.removeItem('username');
            window.location.href = 'login.html';
        }
    });
}

// ===== إدارة الموظفين =====

// التحقق من صلاحية الوصول
function checkAdminAccess() {
    const username = sessionStorage.getItem('username');
    return username === 'akram';
}

// إخفاء/إظهار قسم الموظفين حسب الصلاحية
const employeesSection = document.getElementById('employees-section');
if (employeesSection) {
    if (!checkAdminAccess()) {
        employeesSection.style.display = 'none';
    }
}

// جلب الموظفين من localStorage
function getEmployees() {
    const employees = localStorage.getItem('employees');
    return employees ? JSON.parse(employees) : [];
}

// حفظ الموظفين في localStorage
function saveEmployees(employees) {
    localStorage.setItem('employees', JSON.stringify(employees));
}

// عرض قائمة الموظفين
async function loadEmployeesList() {
    if (!checkAdminAccess()) return;
    
    const container = document.getElementById('employees-list-container');
    if (!container) return;
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/employees`);
        const data = await response.json();
        
        const employees = data.employees || [];
        
        if (employees.length === 0) {
            container.innerHTML = '<p class="no-employees">لا يوجد موظفين مضافين</p>';
            return;
        }
        
        container.innerHTML = employees.map(emp => `
            <div class="employee-card">
                <div class="employee-header">
                    <div class="employee-info">
                        <h6>${emp.name}</h6>
                        <span class="employee-username">@${emp.username}</span>
                        <span class="employee-phone">📱 ${emp.phone || 'غير محدد'}</span>
                        <span class="employee-dept">📂 ${emp.departmentName}</span>
                        <span class="employee-perm ${emp.canViewRecordings ? 'has-perm' : 'no-perm'}">
                            ${emp.canViewRecordings ? '✅ يمكنه مشاهدة التسجيلات' : '❌ لا يمكنه مشاهدة التسجيلات'}
                        </span>
                    </div>
                    <button class="delete-employee-btn" onclick="deleteEmployee(${emp.id}, '${emp.name.replace(/'/g, "\\'")}')" title="حذف">🗑️</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('خطأ في تحميل الموظفين:', error);
        container.innerHTML = '<p class="no-employees">خطأ في تحميل البيانات</p>';
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

// إضافة موظف جديد
const addEmployeeBtn = document.getElementById('add-employee-btn');
if (addEmployeeBtn) {
    addEmployeeBtn.addEventListener('click', async () => {
        if (!checkAdminAccess()) {
            alert('ليس لديك صلاحية للوصول لهذه الميزة!');
            return;
        }
        
        const username = document.getElementById('emp-username').value.trim();
        const password = document.getElementById('emp-password').value.trim();
        const name = document.getElementById('emp-fullname').value.trim();
        const phone = document.getElementById('emp-phone').value.trim();
        const department = document.getElementById('emp-department').value;
        const canViewRecordings = document.getElementById('emp-can-view-recordings')?.checked || false;
        
        if (!username || !password || !name || !department) {
            alert('الرجاء ملء جميع الحقول المطلوبة (اسم المستخدم، كلمة المرور، الاسم، القسم)!');
            return;
        }
        
        console.log('📝 إضافة موظف:', { username, name, department, canViewRecordings });
        
        try {
            const baseUrl = window.location.origin;
            const response = await fetch(`${baseUrl}/employees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    password,
                    name,
                    phone,
                    department,
                    canViewRecordings
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ تمت إضافة الموظف بنجاح');
                
                // تنظيف النموذج
                document.getElementById('emp-username').value = '';
                document.getElementById('emp-password').value = '';
                document.getElementById('emp-fullname').value = '';
                document.getElementById('emp-phone').value = '';
                document.getElementById('emp-department').value = '1';
                if (document.getElementById('emp-can-view-recordings')) {
                    document.getElementById('emp-can-view-recordings').checked = false;
                }
                
                // تحديث القائمة
                await loadEmployeesList();
                
                alert('تم إضافة الموظف بنجاح! ✅\n\nاسم المستخدم: ' + username + '\nكلمة المرور: ' + password);
            } else {
                console.error('❌ خطأ في إضافة الموظف:', data.error);
                alert('خطأ: ' + (data.error || 'فشل في إضافة الموظف'));
            }
        } catch (error) {
            console.error('❌ خطأ في إضافة موظف:', error);
            alert('فشل في إضافة الموظف: ' + error.message);
        }
    });
}

// حذف موظف
async function deleteEmployee(employeeId, fullname) {
    if (!checkAdminAccess()) {
        alert('ليس لديك صلاحية للوصول لهذه الميزة!');
        return;
    }
    
    if (!confirm(`هل تريد حذف الموظف ${fullname}؟`)) {
        return;
    }
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/employees/${employeeId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadEmployeesList();
            alert('تم حذف الموظف بنجاح! ✅');
        } else {
            alert('فشل في حذف الموظف');
        }
    } catch (error) {
        console.error('خطأ في حذف موظف:', error);
        alert('فشل في حذف الموظف');
    }
}

// جعل الدالة متاحة عالمياً
window.deleteEmployee = deleteEmployee;

// تحميل قائمة الموظفين عند فتح الإعدادات
if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        loadEmployeesList();
    });
}

// تحميل القائمة عند تحميل الصفحة
loadEmployeesList();

// عرض معلومات المستخدم في الهيدر
function displayUserInfo() {
    const username = sessionStorage.getItem('username');
    const fullname = sessionStorage.getItem('fullname');
    const role = sessionStorage.getItem('userRole');
    
    const headerUsername = document.getElementById('header-username');
    const headerRole = document.getElementById('header-role');
    
    if (headerUsername) {
        headerUsername.textContent = fullname || username || 'مستخدم';
    }
    
    if (headerRole) {
        const roleText = role === 'admin' ? '👑 مطور رئيسي' : '👨‍💼 موظف';
        headerRole.textContent = roleText;
    }
}

// تحميل معلومات المستخدم عند فتح الصفحة
displayUserInfo();

// زر تسجيل الخروج في الهيدر
const logoutHeaderBtn = document.getElementById('logout-header-btn');
if (logoutHeaderBtn) {
    logoutHeaderBtn.addEventListener('click', () => {
        if (confirm('هل تريد تسجيل الخروج؟')) {
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
            
            const item = document.createElement('div');
            item.className = 'call-item';
            item.innerHTML = `
                <div class="call-item-info">
                    <div class="call-item-number">${call.to}</div>
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
function loadContacts() {
    const container = document.getElementById('contacts-container');
    
    // مثال توضيحي - يمكن حفظ جهات الاتصال في localStorage
    const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
    
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
            </div>
        `;
        container.appendChild(item);
    });
}

// إضافة جهة اتصال
function addContact() {
    const name = prompt('أدخل اسم جهة الاتصال:');
    if (!name) return;
    
    const phone = prompt('أدخل رقم الهاتف:');
    if (!phone) return;
    
    const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
    contacts.push({ name, phone });
    localStorage.setItem('contacts', JSON.stringify(contacts));
    
    loadContacts();
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

// تهيئة التطبيق عند التحميل
initializeApp();

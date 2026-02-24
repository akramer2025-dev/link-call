// „⁄·Ê„«  Twilio
const TWILIO_PHONE_NUMBER = '+13204336644';
let currentCallSid = null;
let callStartTime;
let callTimer;
let isRecording = false;
let callCheckInterval = null;
let phoneNumber = ''; // „ €Ì— · Œ“Ì‰ —ﬁ„ «·Â« ›

// ===== PWA  À»Ì  «· ÿ»Ìﬁ =====
let deferredPrompt;
const installBtn = document.getElementById('install-app-btn');

// «· ﬁ«ÿ ÕœÀ «· À»Ì 
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('?? PWA: Ì„ﬂ‰  À»Ì  «· ÿ»Ìﬁ');
    e.preventDefault();
    deferredPrompt = e;
    
    // ≈ŸÂ«— “— «· À»Ì 
    if (installBtn) {
        installBtn.style.display = 'block';
        installBtn.classList.add('install-available');
    }
});

// ⁄‰œ «·‰ﬁ— ⁄·Ï “— «· À»Ì 
if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) {
            // ≈–« ﬂ«‰ «· ÿ»Ìﬁ „À»  √Ê ·« Ìœ⁄„ PWA
            alert('«· ÿ»Ìﬁ „À»  »«·›⁄· √Ê «·„ ’›Õ ·« Ìœ⁄„ «· À»Ì \n\n· À»Ì  «· ÿ»Ìﬁ:\n1. «› Õ ﬁ«∆„… «·„ ’›Õ (?)\n2. «Œ — "≈÷«›… ≈·Ï «·‘«‘… «·—∆Ì”Ì…"');
            return;
        }
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('? PWA:  „ ﬁ»Ê· «· À»Ì ');
            installBtn.style.display = 'none';
        } else {
            console.log('? PWA:  „ —›÷ «· À»Ì ');
        }
        
        deferredPrompt = null;
    });
}

// ⁄‰œ «ﬂ „«· «· À»Ì 
window.addEventListener('appinstalled', () => {
    console.log('? PWA:  „  À»Ì  «· ÿ»Ìﬁ »‰Ã«Õ!');
    if (installBtn) {
        installBtn.style.display = 'none';
    }
    deferredPrompt = null;
});

// «· Õﬁﬁ ≈–« ﬂ«‰ «· ÿ»Ìﬁ Ì⁄„· ﬂ‹ PWA „À» 
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    console.log('?? «· ÿ»Ìﬁ Ì⁄„· ﬂ‹ PWA „À» ');
}

// =====   »⁄ «·„” Œœ„Ì‰ «·√Ê‰·«Ì‰ =====
let heartbeatInterval = null;

// ≈—”«· ‰»÷… ··Œ«œ„
async function sendHeartbeat() {
    const userId = sessionStorage.getItem('employeeId') || localStorage.getItem('employeeId');
    const userName = sessionStorage.getItem('fullname') || localStorage.getItem('employeeName') || '„” Œœ„';
    
    if (!userId) return;
    
    try {
        await fetch(`${window.location.origin}/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, userName })
        });
    } catch (error) {
        console.error('Œÿ√ ›Ì ≈—”«· Heartbeat:', error);
    }
}

// »œ¡   »⁄ «·„” Œœ„ «·√Ê‰·«Ì‰
function startOnlineTracking() {
    const userId = sessionStorage.getItem('employeeId') || localStorage.getItem('employeeId');
    const userName = sessionStorage.getItem('fullname') || localStorage.getItem('employeeName');
    
    if (!userId) return;
    
    //  ”ÃÌ· «·œŒÊ·
    fetch(`${window.location.origin}/track-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userName })
    }).catch(err => console.error('Œÿ√ ›Ì  ”ÃÌ· «·œŒÊ·:', err));
    
    // ≈—”«· Heartbeat ﬂ· 15 À«‰Ì…
    sendHeartbeat();
    heartbeatInterval = setInterval(sendHeartbeat, 15000);
    
    console.log('?? »œ√   »⁄ «·√Ê‰·«Ì‰ ··„” Œœ„:', userName);
}

// ≈Ìﬁ«›   »⁄ «·„” Œœ„ ⁄‰œ «·Œ—ÊÃ
function stopOnlineTracking() {
    const userId = sessionStorage.getItem('employeeId') || localStorage.getItem('employeeId');
    
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    
    if (userId) {
        // ≈—”«· ÿ·»  ”ÃÌ· «·Œ—ÊÃ
        navigator.sendBeacon(`${window.location.origin}/track-logout`, JSON.stringify({ userId }));
    }
}

// »œ¡ «·  »⁄ ⁄‰œ  Õ„Ì· «·’›Õ…
window.addEventListener('load', () => {
    startOnlineTracking();
});

// ≈Ìﬁ«› «·  »⁄ ⁄‰œ ≈€·«ﬁ «·’›Õ…
window.addEventListener('beforeunload', () => {
    stopOnlineTracking();
});

// ?? DEBUG: ÿ»«⁄… „⁄·Ê„«  ›Ì »œ«Ì… «· Õ„Ì·
console.log('?? app.js loaded - Version: 2.0.20251218');
console.log('?? Current URL:', window.location.href);

// ⁄‰«’— «·Ê«ÃÂ…
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

// √“—«— «·ﬁ«∆„… «·Ã«‰»Ì…
const dialpadBtn = document.getElementById('dialpad-btn');
const callHistoryBtn = document.getElementById('call-history-btn');
const contactsBtn = document.getElementById('contacts-btn');
const recordingsBtn = document.getElementById('recordings-btn');
const settingsBtn = document.getElementById('settings-btn');
const workReportsBtn = document.getElementById('work-reports-btn');

//  Õﬁﬁ „‰ ÊÃÊœ «·√“—«—
console.log('Buttons loaded:', {
    dialpadBtn: !!dialpadBtn,
    callHistoryBtn: !!callHistoryBtn,
    contactsBtn: !!contactsBtn,
    recordingsBtn: !!recordingsBtn,
    settingsBtn: !!settingsBtn,
    workReportsBtn: !!workReportsBtn
});

// «·„ €Ì—« 
let isMuted = false;
let isOnHold = false;
let isSpeakerOn = false;
let availableAudioDevices = [];
let recordings = [];
let device = null;
let currentCall = null;

// ========== ‰Ÿ«„ «·Õ”«» «· Ã—Ì»Ì ==========
// «· Õﬁﬁ ≈–« ﬂ«‰ «·Õ”«»  Ã—Ì»Ì
function isTrialAccount() {
    const userRole = sessionStorage.getItem('userRole');
    const username = sessionStorage.getItem('username');
    return userRole === 'trial' || username === 'trial';
}

// «·Õ’Ê· ⁄·Ï ⁄œœ «·„ﬂ«·„«  «·„ »ﬁÌ… ··Õ”«» «· Ã—Ì»Ì
function getTrialCallsRemaining() {
    if (!isTrialAccount()) return -1; // -1 Ì⁄‰Ì €Ì— „ÕœÊœ
    const maxCalls = 2;
    const usedCalls = parseInt(localStorage.getItem('trial_calls_used') || '0');
    return maxCalls - usedCalls;
}

//  ”ÃÌ· „ﬂ«·„… ··Õ”«» «· Ã—Ì»Ì
function recordTrialCall() {
    if (!isTrialAccount()) return;
    const usedCalls = parseInt(localStorage.getItem('trial_calls_used') || '0');
    localStorage.setItem('trial_calls_used', (usedCalls + 1).toString());
    console.log('?? „ﬂ«·„«  «·Õ”«» «· Ã—Ì»Ì:', usedCalls + 1, '/ 2');
}

// «· Õﬁﬁ „‰ ≈„ﬂ«‰Ì… ≈Ã—«¡ „ﬂ«·„… ··Õ”«» «· Ã—Ì»Ì
function canTrialMakeCall() {
    if (!isTrialAccount()) return true;
    const remaining = getTrialCallsRemaining();
    console.log('?? «·„ﬂ«·„«  «·„ »ﬁÌ… ··Õ”«» «· Ã—Ì»Ì:', remaining);
    return remaining > 0;
}

// ≈ŸÂ«— —”«·… —’Ìœ €Ì— ﬂ«›Ì
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
                <div style="font-size: 60px; margin-bottom: 20px;">??</div>
                <h2 style="color: #ff6b6b; margin-bottom: 15px; font-size: 24px;">—’Ìœﬂ €Ì— ﬂ«›Ì!</h2>
                <p style="color: #a0aec0; margin-bottom: 10px; font-size: 16px;">
                    ·ﬁœ «” ‰›œ  «·„ﬂ«·„ Ì‰ «·„Ã«‰Ì Ì‰ ›Ì «·Õ”«» «· Ã—Ì»Ì.
                </p>
                <p style="color: #cbd5e0; margin-bottom: 25px; font-size: 14px;">
                    ··«” „—«— ›Ì ≈Ã—«¡ «·„ﬂ«·„« ° Ì—ÃÏ «· —ﬁÌ… ≈·Ï Õ”«» „œ›Ê⁄.
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
                    Õ”‰«
                </button>
                <p style="color: #718096; margin-top: 20px; font-size: 12px;">
                    ?? ·· —ﬁÌ…  Ê«’· „⁄‰«
                </p>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', alertHTML);
}
// ========== ‰Â«Ì… ‰Ÿ«„ «·Õ”«» «· Ã—Ì»Ì ==========

// ﬁ—«¡… »Ì«‰«  „‰ URL ﬁ»· √Ì ‘Ì¡ (urlParams Ê autoLogin „⁄—¯›Ì‰ ›Ì index.html)
const phoneFromUrl = urlParams.get('phone') || urlParams.get('number');
const empId = urlParams.get('employeeId');
const empName = urlParams.get('employeeName');

console.log('?? ﬁ—«¡… URL Parameters:');
console.log('  - URL «·ﬂ«„·:', window.location.href);
console.log('  - phone:', phoneFromUrl);
console.log('  - autoLogin:', autoLogin);
console.log('  - employeeId:', empId);
console.log('  - employeeName:', empName);

//  ”ÃÌ· œŒÊ·  ·ﬁ«∆Ì ≈–« Ã«¡ „‰ CRM
if (autoLogin === 'true' && empId && empName) {
    console.log('??  ”ÃÌ· œŒÊ·  ·ﬁ«∆Ì „‰ CRM:', empName);
    
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('username', empId);
    sessionStorage.setItem('userRole', 'employee');
    sessionStorage.setItem('fullname', decodeURIComponent(empName));
    sessionStorage.setItem('employeeId', empId);
    localStorage.setItem('employeeId', empId);
    localStorage.setItem('employeeName', decodeURIComponent(empName));
}

// ≈–« ﬂ«‰ Â‰«ﬂ —ﬁ„° ‰Œ“‰Â »⁄œ  ‰ŸÌ›Â
if (phoneFromUrl) {
    //  ‰ŸÌ› «·—ﬁ„ „‰ «·√Õ—› «·Œ«’… Ê«·„”«›« 
    phoneNumber = phoneFromUrl
        .replace(/[\u200E\u200F\u202A\u202B\u202C\u202D\u202E\uFEFF]/g, '') // Õ–› Right-to-Left Ê Left-to-Right marks
        .replace(/[\s\-\(\)]/g, ''); // Õ–› «·„”«›«  Ê«·‘—ÿ«  Ê«·√ﬁÊ«”
    
    console.log('??  „ «” ﬁ»«· —ﬁ„ „‰ URL:', phoneFromUrl);
    console.log('?? «·—ﬁ„ »⁄œ «· ‰ŸÌ›:', phoneNumber);
    console.log('??  „ Õ›Ÿ «·—ﬁ„ ›Ì phoneNumber:', phoneNumber);
} else {
    console.log('?? ·« ÌÊÃœ —ﬁ„ ›Ì URL');
}

//  ÂÌ∆… «· ÿ»Ìﬁ „⁄ Twilio Voice SDK v2
async function initializeApp() {
    try {
        console.log('?? Ã«—Ì  ÂÌ∆… Twilio Device...');
        updateConnectionStatus('connecting', 'Ã«—Ì «·« ’«·...');
        
        // ⁄—÷ «·—ﬁ„ ≈–« ﬂ«‰ „ÊÃÊœ
        if (phoneNumber) {
            console.log('?? ⁄—÷ «·—ﬁ„ ›Ì «·‘«‘…:', phoneNumber);
            displayNumber.textContent = phoneNumber;
            updateDeleteButton();
        } else {
            console.log('?? phoneNumber ›«—€ ›Ì initializeApp');
        }
        // ÿ·» ≈–‰ «·„Ìﬂ—Ê›Ê‰ √Ê·«
        try {
            console.log('?? ÿ·» ≈–‰ «·„Ìﬂ—Ê›Ê‰...');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('?  „ «·Õ’Ê· ⁄·Ï ≈–‰ «·„Ìﬂ—Ê›Ê‰');
            // ≈Ìﬁ«› «·‹ stream »⁄œ «·Õ’Ê· ⁄·Ï «·≈–‰
            stream.getTracks().forEach(track => track.stop());
        } catch (micError) {
            console.error('? ›‘· «·Õ’Ê· ⁄·Ï ≈–‰ «·„Ìﬂ—Ê›Ê‰:', micError);
            alert('Ì—ÃÏ «·”„«Õ »«” Œœ«„ «·„Ìﬂ—Ê›Ê‰ ·≈Ã—«¡ «·„ﬂ«·„« ');
            throw new Error('·„ Ì „ „‰Õ ≈–‰ «·„Ìﬂ—Ê›Ê‰');
        }
        
        // «‰ Ÿ«—  Õ„Ì· Twilio SDK
        let attempts = 0;
        while (typeof Twilio === 'undefined' && attempts < 30) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof Twilio === 'undefined' || !Twilio.Device) {
            throw new Error('Twilio SDK €Ì— „Õ„·.  √ﬂœ „‰ «·« ’«· »«·≈‰ —‰ .');
        }
        
        console.log('? Twilio SDK „Õ„· »‰Ã«Õ');
        
        // «·Õ’Ê· ⁄·Ï Access Token
        // «” Œœ«„ identity À«»  „»‰Ì ⁄·Ï employeeId ·«” ﬁ»«· «·„ﬂ«·„« 
        const baseUrl = window.location.origin;
        const empId = localStorage.getItem('employeeId') || sessionStorage.getItem('employeeId') || 'admin';
        const clientIdentity = `client_${empId}`;
        console.log('?? Client Identity:', clientIdentity);
        const response = await fetch(`${baseUrl}/token?identity=${clientIdentity}`);
        const data = await response.json();
        
        if (!data.token) {
            throw new Error('›‘· «·Õ’Ê· ⁄·Ï Token');
        }
        
        console.log('?  „ «·Õ’Ê· ⁄·Ï Token');
        
        device = new Twilio.Device(data.token, {
            codecPreferences: ['opus', 'pcmu'],
            fakeLocalDTMF: true,
            enableRingingState: true,
            logLevel: 1
        });
        
        // „⁄«·Ã… «·√Õœ«À
        device.on('registered', () => {
            console.log('? Device „”Ã· Ê„” ⁄œ');
            updateConnectionStatus('connected', 'Ã«Â“ ··„ﬂ«·„«  ??');
            
            //  √ﬂœ „‰  ›⁄Ì· AudioContext
            if (device.audio) {
                try {
                    device.audio._audioContext?.resume();
                } catch (e) {
                    console.warn('??  ⁄–— «” ∆‰«› AudioContext:', e);
                }
            }
            
            // ≈–« Ã«¡ „‰ CRM° «»œ√ «·„ﬂ«·„…  ·ﬁ«∆Ì«
            if (phoneFromUrl && phoneNumber) {
                console.log('?? »œ¡ «·„ﬂ«·„…  ·ﬁ«∆Ì« „⁄:', phoneNumber);
                console.log('?? «·—ﬁ„ «·„” Œœ„:', phoneNumber);
                setTimeout(() => {
                    makeCall();
                }, 1500); //  √ŒÌ— 1.5 À«‰Ì…
            }
        });
        
        device.on('error', (error) => {
            console.error('? Œÿ√ ›Ì Device:', error);
            updateConnectionStatus('error', 'Œÿ√: ' + error.message);
        });
        
        device.on('incoming', (call) => {
            console.log('?? „ﬂ«·„… Ê«—œ… „‰:', call.parameters.From);
            handleIncomingCall(call);
        });
        
        //  ”ÃÌ· «·‹ Device
        await device.register();
        
        //  Õ„Ì· «· ”ÃÌ·« 
        loadRecordings();
        
    } catch (error) {
        console.error('? Œÿ√ ›Ì «· ÂÌ∆…:', error);
        updateConnectionStatus('error', 'Œÿ√: ' + error.message);
        alert('›‘· «·« ’«· »«·Œ«œ„.  √ﬂœ „‰ √‰ «·Œ«œ„ Ì⁄„·.');
    }
}

//  ÕœÌÀ Õ«·… «·« ’«·
function updateConnectionStatus(status, message) {
    connectionStatus.className = `connection-status ${status}`;
    statusText.textContent = message;
}

//  ÕœÌÀ Õ«·… «·„ﬂ«·„…
function updateCallStatus(status) {
    callStatus.textContent = status;
}

// ≈÷«›… —ﬁ„ ≈·Ï «·‘«‘…
function addDigit(digit) {
    phoneNumber += digit;
    displayNumber.textContent = phoneNumber;
    updateDeleteButton();
}

// Õ–› ¬Œ— —ﬁ„
function deleteDigit() {
    phoneNumber = phoneNumber.slice(0, -1);
    displayNumber.textContent = phoneNumber || '';
    updateDeleteButton();
}

//  ÕœÌÀ “— «·Õ–›
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

// ≈Ã—«¡ „ﬂ«·„… »«” Œœ«„ REST API
async function makeCall() {
    if (!phoneNumber) {
        alert('«·—Ã«¡ ≈œŒ«· —ﬁ„ «·Â« ›');
        return;
    }

    // ?? «· Õﬁﬁ „‰ «·Õ”«» «· Ã—Ì»Ì
    if (isTrialAccount() && !canTrialMakeCall()) {
        showInsufficientBalanceAlert();
        console.log('? «·Õ”«» «· Ã—Ì»Ì «” ‰›œ «·„ﬂ«·„«  «·„Ã«‰Ì…');
        return;
    }

    //  ‰ŸÌ› «·—ﬁ„ „‰ «·„”«›«  Ê«·√Õ—› «·Œ«’… ›ﬁÿ - »œÊ‰  ÕÊÌ·
    // ≈“«·… Ã„Ì⁄ «·„”«›«  Ê«·√Õ—› «·Œ«’… €Ì— «·„—∆Ì… Ê«·‘—ÿ« 
    let formattedNumber = phoneNumber
        .replace(/[\u200E\u200F\u202A\u202B\u202C\u202D\u202E\uFEFF]/g, '') // Õ–› Right-to-Left Ê Left-to-Right marks
        .replace(/[\s\-\(\)]/g, ''); // Õ–› «·„”«›«  Ê«·‘—ÿ«  Ê«·√ﬁÊ«”
    
    console.log('?? «·—ﬁ„ »⁄œ «· ‰ŸÌ›:', formattedNumber);
    console.log('?? « ’«· „»«‘— »«·—ﬁ„:', formattedNumber);
    
    try {
        if (!device) {
            throw new Error('Device €Ì— Ã«Â“. √⁄œ  Õ„Ì· «·’›Õ….');
        }
        
        // ≈ŸÂ«— ‘«‘… «·„ﬂ«·„…
        dialpad.classList.add('hidden');
        callScreen.classList.remove('hidden');
        
        // ⁄—÷ «”„ «·„ÊŸ›
        const employeeName = sessionStorage.getItem('fullname') || sessionStorage.getItem('username') || '„ÊŸ›';
        const callEmployeeName = document.getElementById('call-employee-name');
        if (callEmployeeName) {
            callEmployeeName.textContent = `?? ${employeeName}`;
        }
        
        // ⁄—÷ —ﬁ„ «·Â« ›
        callNumber.textContent = `?? ${formattedNumber}`;
        updateCallStatus('Ã«—Ì «·« ’«·...');
        
        // ≈Ã—«¡ «·„ﬂ«·„… ⁄»— Device
        console.log('?? Ã«—Ì «·« ’«· »‹:', formattedNumber);
        
        // «· √ﬂœ „‰ ≈–‰ «·„Ìﬂ—Ê›Ê‰ ﬁ»· «·„ﬂ«·„…
        try {
            const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('? «·„Ìﬂ—Ê›Ê‰ Ã«Â“ ··„ﬂ«·„…');
            testStream.getTracks().forEach(track => track.stop());
        } catch (micError) {
            console.error('? «·„Ìﬂ—Ê›Ê‰ €Ì— „ «Õ:', micError);
            alert('Ì—ÃÏ «·”„«Õ »«” Œœ«„ «·„Ìﬂ—Ê›Ê‰');
            endCall();
            return;
        }
        
        const employeeId = localStorage.getItem('employeeId') || 'unknown';
        
        // «·Õ’Ê· ⁄·Ï —ﬁ„ «·„ ’· «·„Œ «—
        const callerIdSelect = document.getElementById('caller-id-select');
        const selectedCallerId = callerIdSelect ? callerIdSelect.value : 'default';
        console.log('?? —ﬁ„ «·„ ’· «·„Œ «—:', selectedCallerId);
        
        // ============ Zadarma Call (√—ﬁ«„ „’—Ì…!) ============
        if (selectedCallerId.startsWith('zadarma-')) {
            console.log('?? «” Œœ«„ Zadarma ··« ’«· (—ﬁ„ „’—Ì)');
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
                    updateCallStatus('Ã«—Ì «·« ’«· „‰ ' + result.callerId + ' ??');
                    showCallScreen(formattedNumber);
                    alert('? Ã«—Ì «·« ’«· „‰ «·—ﬁ„ «·„’—Ì!\n«·⁄„Ì· ”Ì—Ï: ' + result.callerId);
                } else if (result.setupSteps) {
                    alert('?? Zadarma €Ì— „ı⁄œ:\n\n' + result.setupSteps.join('\n'));
                } else {
                    alert('? ' + (result.error || '›‘· «·« ’«·'));
                }
            } catch (error) {
                console.error('? Zadarma Error:', error);
                alert('? Œÿ√ ›Ì «·« ’«· »‹ Zadarma');
            }
            return;
        }
        // ============ ‰Â«Ì… Zadarma ============
        
        const params = {
            To: formattedNumber,
            employeeId: employeeId,
            callerId: selectedCallerId
        };
        
        console.log('?? „⁄—› «·„œÌ— ··„ﬂ«·„…:', employeeId);
        
        currentCall = await device.connect({ params });
        
        // „⁄«·Ã… √Õœ«À «·„ﬂ«·„…
        currentCall.on('accept', () => {
            console.log('??  „ ≈‰‘«¡ «·„ﬂ«·„… - Ã«—Ì «·« ’«·...');
            updateCallStatus('Ã«—Ì «·« ’«·... ??');
            // ·« ‰»œ√ «·⁄œ«œ Â‰« - ‰‰ Ÿ— «·⁄„Ì· Ì—œ
        });
        
        currentCall.on('ringing', () => {
            console.log('?? «·—‰Ì‰...');
            updateCallStatus('—‰Ì‰... ??');
        });
        
        // Â–« «·ÕœÀ Ìıÿ·ﬁ ⁄‰œ„« Ì—œ «·⁄„Ì· ›⁄·Ì« - ‰»œ√ «·⁄œ«œ Â‰«
        currentCall.on('connected', () => {
            console.log('? «·⁄„Ì· —œ ⁄·Ï «·„ﬂ«·„… - »œ¡ «·⁄œ«œ');
            updateCallStatus('„ ’· ?');
            startCallTimer(); // »œ¡ «·⁄œ«œ ›ﬁÿ ⁄‰œ —œ «·⁄„Ì·
            
            // ??  ”ÃÌ· «·„ﬂ«·„… ··Õ”«» «· Ã—Ì»Ì
            recordTrialCall();
            if (isTrialAccount()) {
                const remaining = getTrialCallsRemaining();
                console.log('?? «·„ﬂ«·„«  «·„ »ﬁÌ… ··Õ”«» «· Ã—Ì»Ì:', remaining);
            }
        });
        
        currentCall.on('disconnect', () => {
            console.log('?? «‰ Â  «·„ﬂ«·„…');
            // «· Õﬁﬁ ≈–« ﬂ«‰ «·⁄œ«œ ·„ Ì»œ√ (Ì⁄‰Ì «·⁄„Ì· ·„ Ì—œ)
            if (!callTimer) {
                updateCallStatus('·„ Ì „ «·—œ');
            }
            endCall();
        });
        
        currentCall.on('cancel', () => {
            console.log('??  „ ≈·€«¡ «·„ﬂ«·„… „‰ ﬁ»· «·⁄„Ì·');
            updateCallStatus(' „ ≈·€«¡ «·„ﬂ«·„… „‰ «·⁄„Ì· ??');
            setTimeout(() => endCall(), 1500);
        });
        
        currentCall.on('reject', () => {
            console.log('?  „ —›÷ «·„ﬂ«·„… „‰ «·⁄„Ì·');
            updateCallStatus('—›÷ «·⁄„Ì· «·„ﬂ«·„… ?');
            setTimeout(() => endCall(), 1500);
        });
        
        currentCall.on('error', (error) => {
            console.error('? Œÿ√ ›Ì «·„ﬂ«·„…:', error);
            //  Õ·Ì· ‰Ê⁄ «·Œÿ√
            let errorMsg = 'Œÿ√ ›Ì «·„ﬂ«·„…';
            if (error.message && error.message.includes('busy')) {
                errorMsg = '«·⁄„Ì· „‘€Ê· Õ«·Ì«';
            } else if (error.message && error.message.includes('no answer')) {
                errorMsg = '·„ Ì—œ «·⁄„Ì·';
            } else if (error.message && error.message.includes('invalid')) {
                errorMsg = '—ﬁ„ €Ì— ’ÕÌÕ';
            }
            updateCallStatus(errorMsg + ' ??');
            setTimeout(() => endCall(), 2000);
        });
        
    } catch (error) {
        console.error('? Œÿ√ ›Ì «·„ﬂ«·„…:', error);
        alert('›‘· ≈Ã—«¡ «·„ﬂ«·„…: ' + error.message);
        endCall();
    }
}

// „ €Ì—«  «·„ﬂ«·„… «·Ê«—œ…
let incomingCallRef = null;
let ringtoneAudio = null;

//  ‘€Ì· ’Ê  «·—‰Ì‰
function playRingtone() {
    try {
        ringtoneAudio = document.getElementById('ringtone');
        if (ringtoneAudio) {
            ringtoneAudio.volume = 0.7;
            ringtoneAudio.play().catch(e => console.log('·« Ì„ﬂ‰  ‘€Ì· «·—‰Ì‰:', e));
        }
    } catch (e) {
        console.log('Œÿ√ ›Ì «·—‰Ì‰:', e);
    }
}

// ≈Ìﬁ«› ’Ê  «·—‰Ì‰
function stopRingtone() {
    if (ringtoneAudio) {
        ringtoneAudio.pause();
        ringtoneAudio.currentTime = 0;
    }
}

// ≈ŸÂ«— ‘«‘… «·„ﬂ«·„… «·Ê«—œ…
function showIncomingCallScreen(callerNumber, callerName) {
    const overlay = document.getElementById('incoming-call-overlay');
    const numberEl = document.getElementById('incoming-caller-number');
    const nameEl = document.getElementById('incoming-caller-name');
    
    if (overlay) {
        numberEl.textContent = callerNumber || '—ﬁ„ „ÃÂÊ·';
        nameEl.textContent = callerName || 'ÃÂ… « ’«· €Ì— „⁄—Ê›…';
        overlay.classList.remove('hidden');
        playRingtone();
        
        // ≈‘⁄«— «·„ ’›Õ
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('?? „ﬂ«·„… Ê«—œ…', {
                body: `„‰: ${callerNumber}`,
                icon: '??',
                requireInteraction: true
            });
        }
    }
}

// ≈Œ›«¡ ‘«‘… «·„ﬂ«·„… «·Ê«—œ…
function hideIncomingCallScreen() {
    const overlay = document.getElementById('incoming-call-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
    stopRingtone();
}

// „⁄«·Ã… „ﬂ«·„… Ê«—œ…
function handleIncomingCall(call) {
    console.log('?? „ﬂ«·„… Ê«—œ… „‰:', call.parameters.From);
    
    // Õ›Ÿ «·„ﬂ«·„…
    incomingCallRef = call;
    
    // ≈ŸÂ«— ‘«‘… «·„ﬂ«·„… «·«Õ —«›Ì…
    showIncomingCallScreen(call.parameters.From, null);
    
    // ⁄‰œ ﬁÿ⁄ «·„ﬂ«·„… „‰ «·„ ’·
    call.on('cancel', () => {
        console.log('? «·„ ’· √€·ﬁ «·„ﬂ«·„…');
        hideIncomingCallScreen();
        incomingCallRef = null;
    });
    
    call.on('disconnect', () => {
        endCall();
    });
}

// ﬁ»Ê· «·„ﬂ«·„… «·Ê«—œ…
function acceptIncomingCall() {
    if (incomingCallRef) {
        hideIncomingCallScreen();
        
        currentCall = incomingCallRef;
        incomingCallRef.accept();
        
        dialpad.classList.add('hidden');
        callScreen.classList.remove('hidden');
        
        // ⁄—÷ «”„ «·„ÊŸ›
        const employeeName = sessionStorage.getItem('fullname') || sessionStorage.getItem('username') || '„ÊŸ›';
        const callEmployeeName = document.getElementById('call-employee-name');
        if (callEmployeeName) {
            callEmployeeName.textContent = `?? ${employeeName}`;
        }
        
        // ⁄—÷ —ﬁ„ «·Â« ›
        callNumber.textContent = `?? ${incomingCallRef.parameters.From}`;
        updateCallStatus('„ ’· ?');
        startCallTimer();
        
        incomingCallRef = null;
    }
}

// —›÷ «·„ﬂ«·„… «·Ê«—œ…
function rejectIncomingCall() {
    if (incomingCallRef) {
        hideIncomingCallScreen();
        incomingCallRef.reject();
        incomingCallRef = null;
    }
}

// —»ÿ √“—«— «·„ﬂ«·„… «·Ê«—œ…
document.addEventListener('DOMContentLoaded', () => {
    const acceptBtn = document.getElementById('accept-call-btn');
    const rejectBtn = document.getElementById('reject-call-btn');
    
    if (acceptBtn) {
        acceptBtn.addEventListener('click', acceptIncomingCall);
    }
    if (rejectBtn) {
        rejectBtn.addEventListener('click', rejectIncomingCall);
    }
    
    // ÿ·» ≈–‰ «·≈‘⁄«—« 
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    //  ’›Ì… ŒÌ«—«  «·« ’«· »‰«¡ ⁄·Ï ’·«ÕÌ«  «·„ÊŸ›
    filterCallerIdOptions();
});

//  ’›Ì… ŒÌ«—«  —ﬁ„ «·„ ’· »‰«¡ ⁄·Ï «·’·«ÕÌ« 
function filterCallerIdOptions() {
    const callerIdSelect = document.getElementById('caller-id-select');
    if (!callerIdSelect) return;
    
    const userRole = sessionStorage.getItem('userRole');
    
    // «·„ÿÊ— ·œÌÂ ﬂ· «·’·«ÕÌ« 
    if (userRole === 'admin') {
        console.log('?? «·„œÌ— ·œÌÂ ﬂ· ’·«ÕÌ«  «·« ’«·');
        return;
    }
    
    // ﬁ—«¡… «·’·«ÕÌ« 
    const canCallFromUSA = sessionStorage.getItem('canCallFromUSA') !== 'false';
    const canCallFromEgypt = sessionStorage.getItem('canCallFromEgypt') === 'true';
    const canCallFromSaudi = sessionStorage.getItem('canCallFromSaudi') === 'true';
    
    console.log('?? ’·«ÕÌ«  «·« ’«·:', { canCallFromUSA, canCallFromEgypt, canCallFromSaudi });
    
    // ≈Œ›«¡ «·ŒÌ«—«  €Ì— «·„”„ÊÕ »Â«
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
    
    // «Œ Ì«— √Ê· ŒÌ«— „ «Õ
    const firstAvailable = callerIdSelect.querySelector('option:not([disabled])');
    if (firstAvailable) {
        callerIdSelect.value = firstAvailable.value;
    }
    
    // ≈–« ·„ Ìﬂ‰ Â‰«ﬂ √Ì ’·«ÕÌ…
    if (!canCallFromUSA && !canCallFromEgypt && !canCallFromSaudi) {
        callerIdSelect.innerHTML = '<option value="" disabled selected>? ·«  ÊÃœ ’·«ÕÌ«  « ’«·</option>';
        const callBtn = document.getElementById('call-btn');
        if (callBtn) {
            callBtn.disabled = true;
            callBtn.title = '·«  ÊÃœ ·œÌﬂ ’·«ÕÌ«  ··« ’«·';
        }
    }
}

// „—«ﬁ»… Õ«·… «·„ﬂ«·„… (·‰  ı” Œœ„ „⁄ SDK)
function startCallMonitoring() {
    // ·« Õ«Ã… ·Â« „⁄ SDK - «·√Õœ«À  ı⁄«·Ã „»«‘—…
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
                updateCallStatus('„ ’· ?');
                if (!callTimer) startCallTimer();
            } else if (data.status === 'ringing') {
                updateCallStatus('Ã«—Ì «·« ’«·... ??');
            }
        } catch (error) {
            console.error('Œÿ√ ›Ì „—«ﬁ»… «·„ﬂ«·„…:', error);
        }
    }, 2000);
}

// ≈‰Â«¡ «·„ﬂ«·„…
async function endCall() {
    if (callCheckInterval) {
        clearInterval(callCheckInterval);
        callCheckInterval = null;
    }
    
    // ≈‰Â«¡ «·„ﬂ«·„… ⁄»— SDK
    if (currentCall) {
        try {
            currentCall.disconnect();
            console.log('?  „ ≈‰Â«¡ «·„ﬂ«·„…');
        } catch (error) {
            console.error('Œÿ√ ›Ì ≈‰Â«¡ «·„ﬂ«·„…:', error);
        }
        currentCall = null;
    }
    
    // Õ›Ÿ «·„ﬂ«·„… ›Ì «·”Ã·
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
        
        //  ”ÃÌ· «·„ﬂ«·„… ›Ì ”Ã· «·⁄„·
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
            }).catch(err => console.error('Œÿ√ ›Ì  ”ÃÌ· «·„ﬂ«·„…:', err));
        } catch (error) {
            console.error('Œÿ√ ›Ì  ”ÃÌ· «·„ﬂ«·„…:', error);
        }
    }
    
    currentCallSid = null;
    
    stopCallTimer();
    stopRecording();
    
    // «·⁄Êœ… ≈·Ï ·ÊÕ… «·√—ﬁ«„
    callScreen.classList.add('hidden');
    dialpad.classList.remove('hidden');
    
    // „”Õ «·—ﬁ„
    phoneNumber = '';
    displayNumber.textContent = '';
    callDuration.textContent = '00:00';
    updateDeleteButton();
    
    isMuted = false;
    isOnHold = false;
    isSpeakerOn = false;
    updateSpeakerButton();
    
    updateConnectionStatus('connected', 'Ã«Â“ ··„ﬂ«·„« ');
}

// »œ¡ ⁄œ«œ «·„ﬂ«·„…
function startCallTimer() {
    callStartTime = Date.now();
    callTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        callDuration.textContent = `${minutes}:${seconds}`;
    }, 1000);
}

// ≈Ìﬁ«› ⁄œ«œ «·„ﬂ«·„…
function stopCallTimer() {
    if (callTimer) {
        clearInterval(callTimer);
        callTimer = null;
    }
}

// ﬂ „ «·’Ê 
function toggleMute() {
    if (!currentCall) return;
    
    isMuted = !isMuted;
    
    // «” Œœ«„ SDK ·ﬂ „ «·’Ê 
    currentCall.mute(isMuted);
    console.log(isMuted ? '??  „ ﬂ „ «·’Ê ' : '??  „ ≈·€«¡ ﬂ „ «·’Ê ');
    
    muteBtn.style.background = isMuted ? '#f44336' : '#f5f5f5';
    muteBtn.style.color = isMuted ? 'white' : 'black';
}

// ≈Ìﬁ«› „ƒﬁ 
function toggleHold() {
    if (!currentCallSid) return;
    
    isOnHold = !isOnHold;
    
    if (isOnHold) {
        updateCallStatus('›Ì «·«‰ Ÿ«—');
    } else {
        updateCallStatus('„ ’·');
    }
    
    holdBtn.style.background = isOnHold ? '#ff9800' : '#f5f5f5';
    holdBtn.style.color = isOnHold ? 'white' : 'black';
}

//  »œÌ· «·”»Ìﬂ—
async function toggleSpeaker() {
    if (!device) return;
    
    try {
        // «·Õ’Ê· ⁄·Ï ﬁ«∆„… √ÃÂ“… «·’Ê  «·„ «Õ…
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
        
        console.log('?? √ÃÂ“… «·’Ê  «·„ «Õ…:', audioOutputs);
        
        if (audioOutputs.length > 1) {
            // «· »œÌ· »Ì‰ «·√ÃÂ“…
            isSpeakerOn = !isSpeakerOn;
            
            // «Œ Ì«— «·ÃÂ«“ «·„‰«”»
            // ⁄«œ… «·ÃÂ«“ «·√Ê· ÂÊ «·”„«⁄… «·«› —«÷Ì… (earpiece) Ê«·À«‰Ì ÂÊ «·”»Ìﬂ—
            const targetDevice = isSpeakerOn ? audioOutputs[1] : audioOutputs[0];
            
            // «” Œœ«„ Twilio Device · €ÌÌ— ÃÂ«“ «·≈Œ—«Ã
            if (device.audio && device.audio.speakerDevices) {
                await device.audio.speakerDevices.set(targetDevice.deviceId);
                console.log(isSpeakerOn ? '??  „  ‘€Ì· «·”»Ìﬂ—' : '??  „ «· »œÌ· ··”„«⁄…');
            }
            
            //  ÕœÌÀ Ê«ÃÂ… «·„” Œœ„
            updateSpeakerButton();
        } else {
            // ≈–« ﬂ«‰ ÃÂ«“ Ê«Õœ ›ﬁÿ° ‰Õ«Ê· «” Œœ«„ setSinkId „»«‘—… ⁄·Ï ⁄‰’— «·’Ê 
            isSpeakerOn = !isSpeakerOn;
            
            // «·»ÕÀ ⁄‰ ⁄‰’— «·’Ê  ›Ì «·’›Õ…
            const audioElements = document.querySelectorAll('audio');
            for (const audio of audioElements) {
                if (audio.setSinkId && audioOutputs.length > 0) {
                    const targetIndex = isSpeakerOn ? Math.min(1, audioOutputs.length - 1) : 0;
                    await audio.setSinkId(audioOutputs[targetIndex].deviceId);
                }
            }
            
            updateSpeakerButton();
            console.log(isSpeakerOn ? '??  „  ‘€Ì· «·”»Ìﬂ—' : '??  „ «· »œÌ· ··”„«⁄…');
        }
    } catch (error) {
        console.error('? Œÿ√ ›Ì  »œÌ· «·”»Ìﬂ—:', error);
        
        // ›Ì Õ«·… «·Œÿ√° ‰€Ì— «·Õ«·… »’—Ì« ›ﬁÿ
        isSpeakerOn = !isSpeakerOn;
        updateSpeakerButton();
        
        // ≈ŸÂ«— —”«·… ··„” Œœ„
        alert('„·«ÕŸ…:  »œÌ· «·”»Ìﬂ— ﬁœ ·« Ì⁄„· ⁄·Ï Ã„Ì⁄ «·„ ’›Õ«  Ê«·√ÃÂ“…');
    }
}

//  ÕœÌÀ “— «·”»Ìﬂ—
function updateSpeakerButton() {
    if (speakerBtn) {
        speakerBtn.style.background = isSpeakerOn ? '#4CAF50' : '#f5f5f5';
        speakerBtn.style.color = isSpeakerOn ? 'white' : 'black';
        speakerBtn.querySelector('.icon').textContent = isSpeakerOn ? '??' : '??';
        speakerBtn.querySelector('.label').textContent = isSpeakerOn ? '«·”»Ìﬂ— ?' : '«·”»Ìﬂ—';
    }
}

// »œ¡ «· ”ÃÌ·
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
            console.log('»œ√ «· ”ÃÌ·:', data.recordingSid);
        }
    } catch (error) {
        console.error('Œÿ√ ›Ì »œ¡ «· ”ÃÌ·:', error);
    }
}

// ≈Ìﬁ«› «· ”ÃÌ·
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
            console.log('??  „ ≈Ìﬁ«› «· ”ÃÌ·');
        }
    } catch (error) {
        console.error('Œÿ√ ›Ì ≈Ìﬁ«› «· ”ÃÌ·:', error);
    }
    
    recordingStatus.classList.add('hidden');
    isRecording = false;
    
    // ≈⁄«œ…  Õ„Ì· ﬁ«∆„… «· ”ÃÌ·« 
    setTimeout(() => loadRecordings(), 2000);
}

//  Õ„Ì· «· ”ÃÌ·« 
async function loadRecordings() {
    try {
        const userRole = sessionStorage.getItem('userRole');
        const canViewOwn = sessionStorage.getItem('canViewOwnRecordings') === 'true';
        const canViewAll = sessionStorage.getItem('canViewAllRecordings') === 'true';
        
        // «· Õﬁﬁ „‰ «·’·«ÕÌ« 
        if (userRole !== 'admin' && !canViewOwn && !canViewAll) {
            recordingsContainer.innerHTML = '<p style="text-align: center; color: #ff6b6b; padding: 20px;">?? ·Ì” ·œÌﬂ ’·«ÕÌ… ·„‘«Âœ… «· ”ÃÌ·« </p>';
            updateRecordingsBadge(0);
            return;
        }
        
        const baseUrl = window.location.origin;
        const employeeId = localStorage.getItem('employeeId');
        
        console.log('?? Ã·» «· ”ÃÌ·«  - employeeId:', employeeId, 'userRole:', userRole, 'canViewAll:', canViewAll);
        
        // »‰«¡ URL „⁄ «·„⁄«„·« 
        let url = `${baseUrl}/recordings`;
        const params = new URLSearchParams();
        
        // ≈–« ﬂ«‰ „œÌ— Ê·Ì” ·œÌÂ ’·«ÕÌ… —ƒÌ… «·ﬂ·
        if (employeeId && !canViewAll && userRole !== 'admin') {
            params.append('employeeId', employeeId);
            console.log('?? ›· —… «· ”ÃÌ·«  ··„œÌ—:', employeeId);
        } else {
            params.append('viewAll', 'true');
            console.log('?? ⁄—÷ Ã„Ì⁄ «· ”ÃÌ·« ');
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        console.log('?? URL:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        recordings = data.recordings || [];
        
        console.log(`??  „ Ã·» ${recordings.length}  ”ÃÌ·`);
        
        // ⁄—÷  ›«’Ì· ﬂ·  ”ÃÌ· ·· ‘ŒÌ’
        recordings.forEach((rec, idx) => {
            console.log(`??  ”ÃÌ· ${idx + 1}:`, {
                sid: rec.sid,
                to: rec.to,
                employeeId: rec.employeeId,
                callSid: rec.callSid,
                duration: rec.duration
            });
        });
        
        // Ã·» »Ì«‰«  «·„œÌ—Ì‰ ·⁄—÷ «·√”„«¡
        const employeesResponse = await fetch(`${baseUrl}/employees`);
        const employeesData = await employeesResponse.json();
        window.employeesMap = {};
        if (employeesData && employeesData.employees) {
            employeesData.employees.forEach(emp => {
                window.employeesMap[emp.id] = emp.name;
            });
        }
        console.log('??  „  Õ„Ì· »Ì«‰« ', Object.keys(window.employeesMap).length, '„œÌ—');
        
        displayRecordings();
        updateRecordingsBadge(recordings.length);
        
    } catch (error) {
        console.error('Œÿ√ ›Ì  Õ„Ì· «· ”ÃÌ·« :', error);
    }
}

//  ÕœÌÀ ⁄œœ «· ”ÃÌ·«  ›Ì «·‘«—…
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

// ⁄—÷ «· ”ÃÌ·« 
function displayRecordings() {
    recordingsContainer.innerHTML = '';
    
    if (recordings.length === 0) {
        recordingsContainer.innerHTML = '<p style="text-align: center; color: #666;">·«  ÊÃœ  ”ÃÌ·« </p>';
        return;
    }
    
    // «·Õ’Ê· ⁄·Ï «”„ «·„” Œœ„ «·Õ«·Ì
    const currentUser = sessionStorage.getItem('fullname') || sessionStorage.getItem('username') || '€Ì— „⁄—Ê›';
    
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
        
        // «” Œ—«Ã —ﬁ„ «·Â« › («·—ﬁ„ «·„ ’· »Â)
        let phoneNumber = recording.to || '€Ì— „Õœœ';
        console.log(`?? —ﬁ„ «· ”ÃÌ· ${index + 1}:`, recording.to, '?', phoneNumber);
        
        //  ‰ŸÌ› —ﬁ„ «·Â« ›
        if (phoneNumber !== '€Ì— „Õœœ' && phoneNumber.startsWith('+')) {
            phoneNumber = phoneNumber.substring(1);
        }
        
        // «·Õ’Ê· ⁄·Ï «”„ «·„œÌ— „‰ employeeId
        console.log(`?? employeeId ·· ”ÃÌ· ${index + 1}:`, recording.employeeId);
        const employeeName = window.employeesMap && recording.employeeId 
            ? (window.employeesMap[recording.employeeId] || window.employeesMap[String(recording.employeeId)] || '€Ì— „⁄—Ê›')
            : '€Ì— „⁄—Ê›';
        console.log(`? «”„ «·„ÊŸ› ·· ”ÃÌ· ${index + 1}:`, employeeName);
        
        // Õ”«» «·„œ… »«·œﬁ«∆ﬁ Ê«·ÀÊ«‰Ì
        const duration = recording.duration || 0;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        const durationText = minutes > 0 ? `${minutes} œ ${seconds} À` : `${seconds} À`;
        
        // «· Õﬁﬁ „‰ ’·«ÕÌ… «·Õ–›
        const userRole = sessionStorage.getItem('userRole');
        const canDelete = sessionStorage.getItem('canDeleteRecordings') === 'true';
        const showDeleteBtn = userRole === 'admin' || canDelete;
        
        item.innerHTML = `
            <div class="recording-info">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <span style="font-size: 24px;">??</span>
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div class="recording-number" style="font-weight: bold; font-size: 16px; color: #333;">
                                ${phoneNumber}
                            </div>
                            <button onclick="copyPhoneNumber('${phoneNumber}')" style="background: linear-gradient(135deg, #5ec4d4, #1e3a5f); color: white; border: none; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 4px; transition: all 0.3s;" title="‰”Œ «·—ﬁ„">
                                ?? ‰”Œ
                            </button>
                        </div>
                        <div style="font-size: 12px; color: #666;">
                            »Ê«”ÿ…: ${employeeName}
                        </div>
                    </div>
                </div>
                <div class="recording-date" style="font-size: 13px; color: #888;">
                    ?? ${formattedDate} ï ?? ${durationText}
                </div>
            </div>
            <div class="recording-controls">
                <button class="play-btn" onclick="playRecording('${recording.sid}')" style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                    ??  ‘€Ì·
                </button>
                <button class="download-btn" onclick="downloadRecording('${recording.sid}', '${phoneNumber}')" style="background: #2196F3; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                    ??  Õ„Ì·
                </button>
                ${showDeleteBtn ? `
                <button class="delete-btn" onclick="deleteRecording('${recording.sid}')" style="background: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                    ??? Õ–›
                </button>
                ` : ''}
            </div>
        `;
        
        recordingsContainer.appendChild(item);
    });
}

// „ €Ì— ·Õ›Ÿ «·„‘€· «·Õ«·Ì
let currentAudio = null;
let currentPlayButton = null;

//  ‘€Ì· «· ”ÃÌ·
async function playRecording(recordingSid) {
    try {
        // ≈Ìﬁ«› √Ì  ”ÃÌ· Ì⁄„· Õ«·Ì«
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
            if (currentPlayButton) {
                currentPlayButton.innerHTML = '??  ‘€Ì·';
                currentPlayButton.style.background = '#4CAF50';
            }
        }
        
        const baseUrl = window.location.origin;
        const audioUrl = `${baseUrl}/play-recording/${recordingSid}`;
        const audio = new Audio(audioUrl);
        
        // «·»Õ  ⁄‰ “— «· ‘€Ì·
        const playBtn = event.target;
        currentPlayButton = playBtn;
        
        //  €ÌÌ— «·“— ·‹ "≈Ìﬁ«›"
        playBtn.innerHTML = '?? ≈Ìﬁ«›';
        playBtn.style.background = '#ff9800';
        
        audio.play();
        currentAudio = audio;
        
        console.log('??  ‘€Ì· «· ”ÃÌ·:', recordingSid);
        
        // ⁄‰œ «‰ Â«¡ «· ”ÃÌ·
        audio.onended = () => {
            playBtn.innerHTML = '??  ‘€Ì·';
            playBtn.style.background = '#4CAF50';
            currentAudio = null;
            currentPlayButton = null;
        };
        
        // ⁄‰œ «·÷€ÿ ⁄·Ï «·“— „—… √Œ—Ï (·≈Ìﬁ«›)
        playBtn.onclick = (e) => {
            e.preventDefault();
            if (currentAudio && !currentAudio.paused) {
                currentAudio.pause();
                playBtn.innerHTML = '??  ‘€Ì·';
                playBtn.style.background = '#4CAF50';
                currentAudio = null;
                currentPlayButton = null;
            } else {
                playRecording(recordingSid);
            }
        };
        
    } catch (error) {
        console.error('Œÿ√ ›Ì  ‘€Ì· «· ”ÃÌ·:', error);
        alert('›‘·  ‘€Ì· «· ”ÃÌ·');
        if (currentPlayButton) {
            currentPlayButton.innerHTML = '??  ‘€Ì·';
            currentPlayButton.style.background = '#4CAF50';
        }
    }
}

// Õ–› «· ”ÃÌ·
async function deleteRecording(recordingSid) {
    // «· Õﬁﬁ „‰ «·’·«ÕÌ…
    const userRole = sessionStorage.getItem('userRole');
    const canDelete = sessionStorage.getItem('canDeleteRecordings') === 'true';
    
    if (userRole !== 'admin' && !canDelete) {
        alert('?? ·Ì” ·œÌﬂ ’·«ÕÌ… ·Õ–› «· ”ÃÌ·« ');
        return;
    }
    
    if (!confirm('Â· √‰  „ √ﬂœ „‰ Õ–› Â–« «· ”ÃÌ·ø')) {
        return;
    }
    
    try {
        console.log('??? Ã«—Ì Õ–› «· ”ÃÌ·:', recordingSid);
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/delete-recording/${recordingSid}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('?  „ Õ–› «· ”ÃÌ·');
            alert('?  „ Õ–› «· ”ÃÌ· »‰Ã«Õ');
            loadRecordings(); // ≈⁄«œ…  Õ„Ì· «·ﬁ«∆„…
        } else {
            throw new Error(data.error || '›‘· Õ–› «· ”ÃÌ·');
        }
    } catch (error) {
        console.error('? Œÿ√ ›Ì Õ–› «· ”ÃÌ·:', error);
        alert('? ›‘· Õ–› «· ”ÃÌ·: ' + error.message);
    }
}

//  Õ„Ì· «· ”ÃÌ· „»«‘—…
async function downloadRecording(recordingSid, phoneNumber) {
    try {
        console.log('?? Ã«—Ì  Õ„Ì· «· ”ÃÌ·:', recordingSid);
        
        const baseUrl = window.location.origin;
        
        //  Õ„Ì· „»«‘— „‰ «·”Ì—›—
        const downloadUrl = `${baseUrl}/download-recording/${recordingSid}`;
        
        // ≈‰‘«¡ —«»ÿ  Õ„Ì·
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `recording_${phoneNumber}_${recordingSid}.mp3`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        console.log('?  „ »œ¡ «· Õ„Ì·');
    } catch (error) {
        console.error('? Œÿ√ ›Ì  Õ„Ì· «· ”ÃÌ·:', error);
        alert('›‘·  Õ„Ì· «· ”ÃÌ·: ' + error.message);
    }
}

// ‰”Œ —ﬁ„ «·Â« ›
async function copyPhoneNumber(phoneNumber) {
    try {
        // ≈÷«›… + ≈–« ·„ Ìﬂ‰ „ÊÃÊœ
        let formattedNumber = phoneNumber;
        if (!formattedNumber.startsWith('+')) {
            formattedNumber = '+' + formattedNumber;
        }
        
        await navigator.clipboard.writeText(formattedNumber);
        
        // ≈ŸÂ«— —”«·… ‰Ã«Õ
        const event = window.event;
        const button = event.target.closest('button');
        const originalText = button.innerHTML;
        
        button.innerHTML = '?  „ «·‰”Œ';
        button.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.background = 'linear-gradient(135deg, #5ec4d4, #1e3a5f)';
        }, 2000);
        
        console.log('?  „ ‰”Œ «·—ﬁ„:', formattedNumber);
    } catch (error) {
        console.error('? Œÿ√ ›Ì ‰”Œ «·—ﬁ„:', error);
        
        // ÿ—Ìﬁ… »œÌ·… ··‰”Œ
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
            
            button.innerHTML = '?  „ «·‰”Œ';
            button.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.background = 'linear-gradient(135deg, #5ec4d4, #1e3a5f)';
            }, 2000);
            
            console.log('?  „ ‰”Œ «·—ﬁ„ (ÿ—Ìﬁ… »œÌ·…)');
        } catch (err) {
            alert('›‘· ‰”Œ «·—ﬁ„: ' + error.message);
        }
    }
}

// „⁄«·Ã… √“—«— ·ÊÕ… «·√—ﬁ«„
document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const digit = btn.dataset.num;
        addDigit(digit);
        
        // DTMF €Ì— „ «Õ ›Ì REST API
    });
});

// „⁄«·Ã… √“—«— «· Õﬂ„
callBtn.addEventListener('click', makeCall);
endCallBtn.addEventListener('click', endCall);
muteBtn.addEventListener('click', toggleMute);
if (speakerBtn) speakerBtn.addEventListener('click', toggleSpeaker);
holdBtn.addEventListener('click', toggleHold);

// œ«·… ·≈Œ›«¡ Ã„Ì⁄ «·√ﬁ”«„
function hideAllSections() {
    dialpad.classList.add('hidden');
    callHistoryList.classList.add('hidden');
    contactsList.classList.add('hidden');
    recordingsList.classList.add('hidden');
    settingsPanel.classList.add('hidden');
    const workReportsPanel = document.getElementById('work-reports-panel');
    if (workReportsPanel) workReportsPanel.classList.add('hidden');
}

// œ«·… ·≈“«·… «· ›⁄Ì· „‰ Ã„Ì⁄ √“—«— «·ﬁ«∆„…
function removeAllActiveStates() {
    dialpadBtn.classList.remove('active');
    callHistoryBtn.classList.remove('active');
    contactsBtn.classList.remove('active');
    recordingsBtn.classList.remove('active');
    settingsBtn.classList.remove('active');
    if (workReportsBtn) workReportsBtn.classList.remove('active');
}

// ⁄—÷ «·≈⁄œ«œ« 
function showSettings() {
    hideAllSections();
    removeAllActiveStates();
    settingsPanel.classList.remove('hidden');
    settingsBtn.classList.add('active');
    // «· —ﬂÌ“ ⁄·Ï Õﬁ· —ﬁ„ «·Â« ›
    const userPhoneInput = document.getElementById('user-phone-number');
    if (userPhoneInput) {
        setTimeout(() => userPhoneInput.focus(), 100);
    }
}

// „⁄«·Ã… √“—«— «·ﬁ«∆„…
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
        
        //  ⁄ÌÌ‰ «· Ê«—ÌŒ «·«› —«÷Ì… (¬Œ— 7 √Ì«„)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        document.getElementById('report-end-date').valueAsDate = endDate;
        document.getElementById('report-start-date').valueAsDate = startDate;
    });
}

// “—  ”ÃÌ· «·Œ—ÊÃ
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        if (confirm('Â·  —Ìœ  ”ÃÌ· «·Œ—ÊÃø')) {
            //  ”ÃÌ· Êﬁ  «·Œ—ÊÃ
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
                console.error('Œÿ√ ›Ì  ”ÃÌ· Êﬁ  «·Œ—ÊÃ:', error);
            }
            
            sessionStorage.removeItem('isLoggedIn');
            sessionStorage.removeItem('username');
            window.location.href = 'login.html';
        }
    });
}

// ===== ≈œ«—… «·„œÌ—Ì‰ =====

// «· Õﬁﬁ „‰ ’·«ÕÌ… «·Ê’Ê·
function checkAdminAccess() {
    const username = sessionStorage.getItem('username');
    return username === 'akram';
}

// ≈Œ›«¡/≈ŸÂ«— «·√ﬁ”«„ Õ”» «·’·«ÕÌ…
const userRole = sessionStorage.getItem('userRole');
const employeesSection = document.getElementById('employees-section');
const adminAccountSection = document.getElementById('admin-account-section');
const adminAudioSection = document.getElementById('admin-audio-section');
const employeeProfileSection = document.getElementById('employee-profile-section');
const pricingSection = document.getElementById('pricing-section');

if (userRole === 'admin') {
    // «·„ÿÊ— Ì—Ï ≈œ«—… «·„œÌ—Ì‰ Ê«·≈⁄œ«œ«  Ê«· ”⁄Ì—…
    if (employeesSection) employeesSection.style.display = 'block';
    if (adminAccountSection) adminAccountSection.style.display = 'block';
    if (adminAudioSection) adminAudioSection.style.display = 'block';
    if (pricingSection) pricingSection.style.display = 'block';
    if (employeeProfileSection) employeeProfileSection.style.display = 'none';
} else {
    // «·„œÌ— Ì—Ï ›ﬁÿ  ⁄œÌ· „·›Â «·‘Œ’Ì
    if (employeesSection) employeesSection.style.display = 'none';
    if (adminAccountSection) adminAccountSection.style.display = 'none';
    if (adminAudioSection) adminAudioSection.style.display = 'none';
    if (pricingSection) pricingSection.style.display = 'none';
    if (employeeProfileSection) {
        employeeProfileSection.style.display = 'block';
        //  Õ„Ì· »Ì«‰«  «·„œÌ—
        loadEmployeeProfile();
    }
}

// Ã·» «·„œÌ—Ì‰ „‰ localStorage
function getEmployees() {
    const employees = localStorage.getItem('employees');
    return employees ? JSON.parse(employees) : [];
}

// Õ›Ÿ «·„œÌ—Ì‰ ›Ì localStorage
function saveEmployees(employees) {
    localStorage.setItem('employees', JSON.stringify(employees));
}

// ⁄—÷ ﬁ«∆„… «·„œÌ—Ì‰
async function loadEmployeesList() {
    const userRole = sessionStorage.getItem('userRole');
    console.log('??  Õ„Ì· ﬁ«∆„… «·„œÌ—Ì‰... Role:', userRole);
    
    if (userRole !== 'admin') {
        console.log('?? «·„œÌ— ·« Ì„ﬂ‰Â —ƒÌ… ﬁ«∆„… «·„œÌ—Ì‰');
        return;
    }
    
    const container = document.getElementById('employees-list-container');
    if (!container) {
        console.error('? ·„ Ì „ «·⁄ÀÊ— ⁄·Ï employees-list-container');
        return;
    }
    
    console.log('? Container „ÊÃÊœ° Ã«—Ì Ã·» «·»Ì«‰« ...');
    
    try {
        const baseUrl = window.location.origin;
        console.log('?? Ã«—Ì Ã·» «·»Ì«‰«  „‰:', `${baseUrl}/employees`);
        
        const response = await fetch(`${baseUrl}/employees`);
        
        console.log('?? «” Ã«»… «·”Ì—›—:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`Œÿ√ ›Ì «·”Ì—›—: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('?? «·»Ì«‰«  «·„” ·„…:', data);
        
        const employees = data.employees || [];
        
        console.log('?? ⁄œœ «·„œÌ—Ì‰:', employees.length);
        
        if (employees.length === 0) {
            container.innerHTML = '<p class="no-employees">·« ÌÊÃœ „œÌ—Ì‰ „÷«›Ì‰. «÷€ÿ "≈÷«›… „œÌ—" ·≈÷«›… √Ê· „œÌ—.</p>';
            return;
        }
        
        container.innerHTML = employees.map(emp => {
            const perms = emp.permissions || {};
            const permsList = [];
            if (perms.viewOwnRecordings) permsList.push('??  ”ÃÌ·«  Œ«’…');
            if (perms.viewAllRecordings) permsList.push('??  ”ÃÌ·«  ⁄«„…');
            if (perms.deleteRecordings) permsList.push('??? „”Õ');
            if (perms.editProfile) permsList.push('??  ⁄œÌ·');
            // ’·«ÕÌ«  «·« ’«·
            const callPerms = [];
            if (perms.callFromUSA) callPerms.push('????');
            if (perms.callFromEgypt) callPerms.push('????');
            if (perms.callFromSaudi) callPerms.push('????');
            if (callPerms.length > 0) permsList.push('?? ' + callPerms.join(' '));
            
            // «· Õﬁﬁ ≈–« ﬂ«‰ Õ”«»  Ã—Ì»Ì
            const trialBadge = emp.isTrial || emp.role === 'trial' 
                ? '<span style="background: #fff3cd; color: #856404; padding: 2px 8px; border-radius: 10px; font-size: 10px; margin-right: 5px;">??  Ã—Ì»Ì</span>' 
                : '';
            
            // «·Õ’Ê· ⁄·Ï «”„ «·„ÊŸ› »‘ﬂ· ¬„‰
            const empName = emp.name || emp.fullname || emp.username || '€Ì— „⁄—Ê›';
            const safeEmpName = empName.replace(/'/g, "\\'");
            
            return `
            <div class="employee-card">
                <div class="employee-header">
                    <div class="employee-info">
                        <h6>${empName} ${trialBadge}</h6>
                        <span class="employee-username">@${emp.username || '€Ì— „Õœœ'}</span>
                        <span class="employee-phone">?? ${emp.phone || '€Ì— „Õœœ'}</span>
                        <span class="employee-dept">?? ${emp.departmentName || emp.departmentArabic || '€Ì— „Õœœ'}</span>
                        <div class="employee-perms" style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 5px;">
                            ${permsList.length > 0 
                                ? permsList.map(p => `<span style="background: #e3f2fd; padding: 3px 8px; border-radius: 12px; font-size: 11px;">${p}</span>`).join('') 
                                : '<span style="color: #999; font-size: 11px;">·«  ÊÃœ ’·«ÕÌ« </span>'}
                        </div>
                    </div>
                    <div class="employee-actions" style="display: flex; gap: 8px;">
                        <button class="edit-employee-btn" onclick="openEditEmployeeModal(${emp.id}, '${safeEmpName}', '${emp.username || ''}', '${emp.phone || ''}', '${emp.department || ''}')" title=" ⁄œÌ·" style="background: #4CAF50; border: none; color: white; padding: 8px 12px; border-radius: 8px; cursor: pointer;">??</button>
                        <button class="delete-employee-btn" onclick="deleteEmployee(${emp.id}, '${safeEmpName}')" title="Õ–›" style="background: #f44336; border: none; color: white; padding: 8px 12px; border-radius: 8px; cursor: pointer;">???</button>
                    </div>
                </div>
            </div>
        `;
        }).join('');
    } catch (error) {
        console.error('? Œÿ√ ›Ì  Õ„Ì· «·„œÌ—Ì‰:', error);
        console.error(' ›«’Ì· «·Œÿ√:', error.message, error.stack);
        container.innerHTML = `<p class="no-employees" style="color: #ff6b6b;">Œÿ√ ›Ì  Õ„Ì· «·»Ì«‰« <br><small>${error.message}</small></p>`;
    }
}

// «·Õ’Ê· ⁄·Ï  ”„Ì… «·’·«ÕÌ… »«·⁄—»Ì
function getPermissionLabel(permission) {
    const labels = {
        'make_calls': '?? „ﬂ«·„« ',
        'view_history': '?? «·”Ã·',
        'view_recordings': '???  ”ÃÌ·« ',
        'manage_contacts': '?? ÃÂ«  «·« ’«·'
    };
    return labels[permission] || permission;
}

// ≈÷«›… „œÌ— ÃœÌœ
const addEmployeeBtn = document.getElementById('add-employee-btn');
if (addEmployeeBtn) {
    addEmployeeBtn.addEventListener('click', async (e) => {
        e.preventDefault(); // „‰⁄ ≈⁄«œ…  Õ„Ì· «·’›Õ…
        
        if (!checkAdminAccess()) {
            alert('·Ì” ·œÌﬂ ’·«ÕÌ… ··Ê’Ê· ·Â–Â «·„Ì“…!');
            return;
        }
        
        const username = document.getElementById('emp-username')?.value.trim();
        const password = document.getElementById('emp-password')?.value.trim();
        const name = document.getElementById('emp-fullname')?.value.trim();
        const phone = document.getElementById('emp-phone')?.value.trim() || '';
        const department = document.getElementById('emp-department')?.value;
        
        // Ã„⁄ «·’·«ÕÌ« 
        const permissions = {
            viewOwnRecordings: document.getElementById('emp-perm-view-own-recordings')?.checked || false,
            viewAllRecordings: document.getElementById('emp-perm-view-all-recordings')?.checked || false,
            deleteRecordings: document.getElementById('emp-perm-delete-recordings')?.checked || false,
            editProfile: document.getElementById('emp-perm-edit-profile')?.checked || false,
            // ’·«ÕÌ«  «·« ’«· „‰ «·œÊ·
            callFromUSA: document.getElementById('emp-perm-call-usa')?.checked || false,
            callFromEgypt: document.getElementById('emp-perm-call-egypt')?.checked || false,
            callFromSaudi: document.getElementById('emp-perm-call-saudi')?.checked || false
        };
        
        console.log('?? »Ì«‰«  «·„œÌ—:', { username, name, department, permissions });
        
        if (!username || !password || !name || !department) {
            alert('«·—Ã«¡ „·¡ Ã„Ì⁄ «·ÕﬁÊ· «·„ÿ·Ê»…:\n- «”„ «·„” Œœ„\n- ﬂ·„… «·„—Ê—\n- «·«”„ «·ﬂ«„·\n- «·ﬁ”„');
            return;
        }
        
        //  ⁄ÿÌ· «·“— √À‰«¡ «·Õ›Ÿ
        addEmployeeBtn.disabled = true;
        addEmployeeBtn.textContent = '? Ã«—Ì «·Õ›Ÿ...';
        
        try {
            const baseUrl = window.location.origin;
            console.log('?? ≈—”«· «·»Ì«‰«  ≈·Ï:', `${baseUrl}/employees`);
            
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
            
            console.log('?? «” Ã«»… «·Œ«œ„:', response.status);
            
            const data = await response.json();
            console.log('?? «·»Ì«‰«  «·„” ·„…:', data);
            
            if (response.ok && data.success) {
                console.log('?  „  ≈÷«›… «·„œÌ— »‰Ã«Õ');
                
                //  ‰ŸÌ› «·‰„Ê–Ã
                document.getElementById('emp-username').value = '';
                document.getElementById('emp-password').value = '';
                document.getElementById('emp-fullname').value = '';
                document.getElementById('emp-phone').value = '';
                document.getElementById('emp-department').value = '';
                
                // ≈·€«¡  ÕœÌœ Ã„Ì⁄ «·’·«ÕÌ« 
                document.getElementById('emp-perm-view-own-recordings').checked = false;
                document.getElementById('emp-perm-view-all-recordings').checked = false;
                document.getElementById('emp-perm-delete-recordings').checked = false;
                document.getElementById('emp-perm-edit-profile').checked = false;
                // ≈⁄«œ…  ⁄ÌÌ‰ ’·«ÕÌ«  «·« ’«·
                document.getElementById('emp-perm-call-usa').checked = true; // √„—Ìﬂ« «› —«÷Ì
                document.getElementById('emp-perm-call-egypt').checked = false;
                document.getElementById('emp-perm-call-saudi').checked = false;
                
                //  ÕœÌÀ «·ﬁ«∆„…
                await loadEmployeesList();
                
                alert('?  „ ≈÷«›… «·„œÌ— »‰Ã«Õ!\n\n' +
                      '?? «”„ «·„” Œœ„: ' + username + '\n' +
                      '?? ﬂ·„… «·„—Ê—: ' + password + '\n' +
                      '?? «·«”„: ' + name);
            } else {
                console.error('? Œÿ√ ›Ì ≈÷«›… «·„œÌ—:', data);
                alert('? Œÿ√ ›Ì ≈÷«›… «·„œÌ—:\n' + (data.error || '›‘· ›Ì «·Õ›Ÿ'));
            }
        } catch (error) {
            console.error('? Œÿ√ ‘»ﬂ…:', error);
            alert('? Œÿ√ ›Ì «·« ’«· »«·Œ«œ„:\n' + error.message);
        } finally {
            // ≈⁄«œ…  ›⁄Ì· «·“—
            addEmployeeBtn.disabled = false;
            addEmployeeBtn.textContent = '? ≈÷«›… „œÌ—';
        }
    });
}

// Õ–› „œÌ—
async function deleteEmployee(employeeId, fullname) {
    if (!checkAdminAccess()) {
        alert('·Ì” ·œÌﬂ ’·«ÕÌ… ··Ê’Ê· ·Â–Â «·„Ì“…!');
        return;
    }
    
    if (!confirm(`Â·  —Ìœ Õ–› «·„œÌ— ${fullname}ø`)) {
        return;
    }
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/employees/${employeeId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadEmployeesList();
            alert(' „ Õ–› «·„œÌ— »‰Ã«Õ! ?');
        } else {
            alert('›‘· ›Ì Õ–› «·„œÌ—');
        }
    } catch (error) {
        console.error('Œÿ√ ›Ì Õ–› „œÌ—:', error);
        alert('›‘· ›Ì Õ–› «·„œÌ—');
    }
}

// Ã⁄· «·œ«·… „ «Õ… ⁄«·„Ì«
window.deleteEmployee = deleteEmployee;

// › Õ ‰«›–…  ⁄œÌ· «·„œÌ—
function openEditEmployeeModal(employeeId, fullname, username, phone, department) {
    if (!checkAdminAccess()) {
        alert('·Ì” ·œÌﬂ ’·«ÕÌ… ··Ê’Ê· ·Â–Â «·„Ì“…!');
        return;
    }
    
    // ≈‰‘«¡ «·‹ Modal
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
                <h2 style="color: #fff; margin-bottom: 20px; text-align: center;">??  ⁄œÌ· «·„œÌ—</h2>
                <p style="color: #a0aec0; text-align: center; margin-bottom: 20px;">@${username}</p>
                
                <div style="margin-bottom: 15px;">
                    <label style="color: #cbd5e0; display: block; margin-bottom: 5px;">«·«”„ «·ﬂ«„·:</label>
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
                    <label style="color: #cbd5e0; display: block; margin-bottom: 5px;">?? —ﬁ„ «·Â« ›:</label>
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
                    <label style="color: #cbd5e0; display: block; margin-bottom: 5px;">?? ﬂ·„… «·„—Ê— «·ÃœÌœ…:</label>
                    <input type="password" id="edit-emp-password" placeholder="« —ﬂÂ« ›«—€… ≈‰ ·„  —œ «· €ÌÌ—" style="
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
                    <label style="color: #cbd5e0; display: block; margin-bottom: 5px;">?? «·ﬁ”„:</label>
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
                        <option value="1" ${department === '1' ? 'selected' : ''}>«·ÕÃÊ“« </option>
                        <option value="2" ${department === '2' ? 'selected' : ''}>«·„»Ì⁄« </option>
                        <option value="3" ${department === '3' ? 'selected' : ''}>Œœ„… «·⁄„·«¡</option>
                        <option value="4" ${department === '4' ? 'selected' : ''}>«·Õ”«»« </option>
                        <option value="5" ${department === '5' ? 'selected' : ''}>«·œ⁄„ «·›‰Ï</option>
                        <option value="6" ${department === '6' ? 'selected' : ''}>«·‘ﬂ«ÊÏ Ê«·«ﬁ —«Õ« </option>
                        <option value="trial" ${department === 'trial' ? 'selected' : ''}>Õ”«»  Ã—Ì»Ì</option>
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
                    ">?? Õ›Ÿ «· ⁄œÌ·« </button>
                    <button onclick="document.getElementById('edit-employee-modal').remove()" style="
                        background: linear-gradient(135deg, #6c757d, #5a6268);
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 25px;
                        font-size: 16px;
                        cursor: pointer;
                    ">? ≈·€«¡</button>
                </div>
            </div>
        </div>
    `;
    
    // ≈“«·… √Ì modal ﬁœÌ„
    const oldModal = document.getElementById('edit-employee-modal');
    if (oldModal) oldModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

//  ÕœÌÀ »Ì«‰«  «·„œÌ—
async function updateEmployee(employeeId) {
    const fullname = document.getElementById('edit-emp-fullname').value.trim();
    const phone = document.getElementById('edit-emp-phone').value.trim();
    const password = document.getElementById('edit-emp-password').value.trim();
    const department = document.getElementById('edit-emp-department').value;
    
    if (!fullname) {
        alert('«·—Ã«¡ ≈œŒ«· «·«”„ «·ﬂ«„·');
        return;
    }
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/employees/${employeeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fullname,
                phone,
                password: password || undefined, // ≈—”«· ﬂ·„… «·„—Ê— ›ﬁÿ ≈–«  „ ≈œŒ«·Â«
                department
            })
        });
        
        if (response.ok) {
            document.getElementById('edit-employee-modal').remove();
            loadEmployeesList();
            alert(' „  ÕœÌÀ »Ì«‰«  «·„œÌ— »‰Ã«Õ! ?');
        } else {
            const data = await response.json();
            alert('›‘· ›Ì  ÕœÌÀ «·»Ì«‰« : ' + (data.error || 'Œÿ√ €Ì— „⁄—Ê›'));
        }
    } catch (error) {
        console.error('Œÿ√ ›Ì  ÕœÌÀ «·„œÌ—:', error);
        alert('›‘· ›Ì  ÕœÌÀ «·»Ì«‰« ');
    }
}

// Ã⁄· «·œÊ«· „ «Õ… ⁄«·„Ì«
window.openEditEmployeeModal = openEditEmployeeModal;
window.updateEmployee = updateEmployee;

//  Õ„Ì· ﬁ«∆„… «·„œÌ—Ì‰ ⁄‰œ › Õ «·≈⁄œ«œ« 
if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        console.log('??  „ «·‰ﬁ— ⁄·Ï “— «·≈⁄œ«œ« ');
        setTimeout(() => {
            loadEmployeesList();
        }, 100); // «‰ Ÿ«— ﬁ’Ì— ·· √ﬂœ „‰ ŸÂÊ— «·‹ container
    });
}

//  Õ„Ì· «·ﬁ«∆„… ⁄‰œ  Õ„Ì· «·’›Õ…
setTimeout(() => {
    loadEmployeesList();
}, 500);

// ⁄—÷ „⁄·Ê„«  «·„” Œœ„ ›Ì «·ÂÌœ—
function displayUserInfo() {
    const username = sessionStorage.getItem('username');
    const fullname = sessionStorage.getItem('fullname');
    const role = sessionStorage.getItem('userRole');
    
    console.log('?? „⁄·Ê„«  «·„” Œœ„:', { username, fullname, role });
    
    const headerUsername = document.getElementById('header-username');
    const headerRole = document.getElementById('header-role');
    
    if (headerUsername) {
        //  √ﬂœ „‰ ⁄—÷ «·«”„ »‘ﬂ· ’ÕÌÕ
        const displayName = fullname || username || '„” Œœ„';
        console.log('? ⁄—÷ «·«”„:', displayName);
        headerUsername.textContent = displayName;
    }
    
    if (headerRole) {
        const roleText = role === 'admin' ? '?? „ÿÊ— —∆Ì”Ì' : '??û?? „œÌ—';
        headerRole.textContent = roleText;
    }
    
    // ≈ŸÂ«— “— ·ÊÕ… «· Õﬂ„ ··√œ„‰ ›ﬁÿ
    const adminLinkBtn = document.getElementById('admin-link-btn');
    if (adminLinkBtn) {
        if (role === 'admin' || username === 'akram') {
            adminLinkBtn.style.display = 'flex';
        } else {
            adminLinkBtn.style.display = 'none';
        }
    }
}

//  Õ„Ì· „⁄·Ê„«  «·„” Œœ„ ⁄‰œ › Õ «·’›Õ…
displayUserInfo();

// ========== Ã·» —’Ìœ «·Õ”«» ==========
let rechargeUrl = 'https://console.twilio.com/us1/billing/manage-billing/billing-overview';

async function loadAccountBalance() {
    const balanceEl = document.getElementById('account-balance');
    const currencyEl = document.getElementById('balance-currency');
    const statusEl = document.getElementById('balance-status');
    const accountStatusEl = document.getElementById('account-status');
    const balanceDisplay = document.querySelector('.balance-display');
    
    // ⁄‰«’— «·ÂÌœ—
    const headerBalanceEl = document.getElementById('header-balance');
    const headerBalanceContainer = document.getElementById('balance-header');
    
    try {
        if (balanceEl) {
            balanceEl.textContent = '...';
            statusEl.textContent = 'Ã«—Ì «· Õ„Ì·...';
        }
        
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/account/balance`);
        
        if (response.ok) {
            const data = await response.json();
            
            // ⁄—÷ «·—’Ìœ
            const balance = parseFloat(data.balance).toFixed(2);
            
            if (balanceEl) {
                balanceEl.textContent = balance;
                currencyEl.textContent = data.currency || 'USD';
            }
            
            //  ÕœÌÀ «·ÂÌœ—
            if (headerBalanceEl) {
                headerBalanceEl.textContent = balance;
            }
            
            // Õ›Ÿ —«»ÿ «·‘Õ‰
            if (data.rechargeUrl) {
                rechargeUrl = data.rechargeUrl;
            }
            
            // Õ«·… «·Õ”«»
            if (accountStatusEl) {
                accountStatusEl.textContent = data.accountStatus === 'active' ? '? ‰‘ÿ' : data.accountStatus;
            }
            
            //  ÕœÌœ Õ«·… «·—’Ìœ („‰Œ›÷/„ Ê”ÿ/ÃÌœ)
            if (balanceDisplay) {
                balanceDisplay.classList.remove('balance-low', 'balance-medium', 'balance-good');
            }
            if (headerBalanceContainer) {
                headerBalanceContainer.classList.remove('low', 'medium');
            }
            
            if (balance < 5) {
                if (statusEl) statusEl.textContent = '?? «·—’Ìœ „‰Œ›÷! Ìı‰’Õ »≈⁄«œ… «·‘Õ‰';
                if (balanceDisplay) balanceDisplay.classList.add('balance-low');
                if (headerBalanceContainer) headerBalanceContainer.classList.add('low');
            } else if (balance < 20) {
                if (statusEl) statusEl.textContent = '?? «·—’Ìœ „ Ê”ÿ';
                if (balanceDisplay) balanceDisplay.classList.add('balance-medium');
                if (headerBalanceContainer) headerBalanceContainer.classList.add('medium');
            } else {
                if (statusEl) statusEl.textContent = '? «·—’Ìœ ÃÌœ';
                if (balanceDisplay) balanceDisplay.classList.add('balance-good');
            }
            
            console.log('?? «·—’Ìœ «·Õ«·Ì:', balance, data.currency);
            
        } else {
            throw new Error('›‘· Ã·» «·—’Ìœ');
        }
    } catch (error) {
        console.error('Œÿ√ ›Ì Ã·» «·—’Ìœ:', error);
        if (balanceEl) balanceEl.textContent = '--';
        if (statusEl) statusEl.textContent = '?  ⁄–— Ã·» «·—’Ìœ';
        if (headerBalanceEl) headerBalanceEl.textContent = '--';
    }
}

// › Õ ’›Õ… ≈⁄«œ… «·‘Õ‰
function openRechargeUrl() {
    window.open(rechargeUrl, '_blank');
}

//  Õ„Ì· «·—’Ìœ Ì „  ·ﬁ«∆Ì« ﬂ· 5 ÀÊ«‰Ì ›Ì startBalanceAutoRefresh

//  Õ„Ì· »Ì«‰«  «·„·› «·‘Œ’Ì ··„œÌ—
function loadEmployeeProfile() {
    const fullname = sessionStorage.getItem('fullname');
    const username = sessionStorage.getItem('username');
    
    // «·Õ’Ê· ⁄·Ï »Ì«‰«  «·„œÌ— „‰ «·”Ì—›—
    const employeeId = localStorage.getItem('employeeId');
    
    if (employeeId) {
        //  Õ„Ì· »Ì«‰«  «·„œÌ— „‰ API
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
                console.error('Œÿ√ ›Ì  Õ„Ì· »Ì«‰«  «·„œÌ—:', error);
            });
    }
}

//  ÕœÌÀ «·„·› «·‘Œ’Ì ··„œÌ—
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
            alert('Ì—ÃÏ ≈œŒ«· ﬂ·„… «·„—Ê— «·Õ«·Ì… ·· √ﬂÌœ');
            return;
        }
        
        if (!newFullname) {
            alert('Ì—ÃÏ ≈œŒ«· «·«”„ «·ﬂ«„·');
            return;
        }
        
        try {
            updateProfileBtn.disabled = true;
            updateProfileBtn.textContent = 'Ã«—Ì «·Õ›Ÿ...';
            
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
                alert('?  „  ÕœÌÀ «·„·› «·‘Œ’Ì »‰Ã«Õ!');
                
                //  ÕœÌÀ «·«”„ ›Ì sessionStorage
                sessionStorage.setItem('fullname', newFullname);
                localStorage.setItem('employeeName', newFullname);
                displayUserInfo();
                
                // „”Õ ﬂ·„«  «·„—Ê—
                document.getElementById('profile-current-password').value = '';
                document.getElementById('profile-new-password').value = '';
            } else {
                alert('? ' + (data.error || '›‘· «· ÕœÌÀ'));
            }
        } catch (error) {
            console.error('Œÿ√ ›Ì  ÕœÌÀ «·„·›:', error);
            alert('ÕœÀ Œÿ√ √À‰«¡ «· ÕœÌÀ');
        } finally {
            updateProfileBtn.disabled = false;
            updateProfileBtn.textContent = '?? Õ›Ÿ «· ⁄œÌ·« ';
        }
    });
}

// “—  ”ÃÌ· «·Œ—ÊÃ ›Ì «·ÂÌœ—
const logoutHeaderBtn = document.getElementById('logout-header-btn');
if (logoutHeaderBtn) {
    logoutHeaderBtn.addEventListener('click', async () => {
        if (confirm('Â·  —Ìœ  ”ÃÌ· «·Œ—ÊÃø')) {
            //  ”ÃÌ· Êﬁ  «·Œ—ÊÃ
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
                console.error('Œÿ√ ›Ì  ”ÃÌ· Êﬁ  «·Œ—ÊÃ:', error);
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

// „⁄«·Ã… “— «·Õ–›
const deleteBtn = document.getElementById('delete-btn');
if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteDigit);
}

// „⁄«·Ã… ·ÊÕ… «·„›« ÌÕ
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

// Õ›Ÿ «·„ﬂ«·„… ›Ì «·”Ã· «·„Õ·Ì
function saveCallToHistory(call) {
    try {
        const calls = JSON.parse(localStorage.getItem('callHistory') || '[]');
        calls.unshift(call); // ≈÷«›… ›Ì «·»œ«Ì…
        
        // «·«Õ ›«Ÿ »¬Œ— 100 „ﬂ«·„… ›ﬁÿ
        if (calls.length > 100) {
            calls.splice(100);
        }
        
        localStorage.setItem('callHistory', JSON.stringify(calls));
        console.log('?  „ Õ›Ÿ «·„ﬂ«·„… ›Ì «·”Ã·');
        
        //  ÕœÌÀ «·‹ badge
        updateCallHistoryBadge();
    } catch (error) {
        console.error('Œÿ√ ›Ì Õ›Ÿ «·„ﬂ«·„…:', error);
    }
}

//  ÕœÌÀ ⁄œœ «·„ﬂ«·„«  ⁄·Ï «·‹ badge
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
        console.error('Œÿ√ ›Ì  ÕœÌÀ badge ”Ã· «·„ﬂ«·„« :', error);
    }
}

// «” œ⁄«¡  ÕœÌÀ «·‹ badge ⁄‰œ  Õ„Ì· «·’›Õ…
setTimeout(updateCallHistoryBadge, 500);

//  Õ„Ì· ”Ã· «·„ﬂ«·„« 
async function loadCallHistory() {
    try {
        //  Õ„Ì· «·„ﬂ«·„«  „‰ localStorage »œ·« „‰ «·”Ì—›—
        const calls = JSON.parse(localStorage.getItem('callHistory') || '[]');
        
        //  Õ„Ì· ÃÂ«  «·« ’«· ·⁄—÷ «·√”„«¡
        const baseUrl = window.location.origin;
        let contacts = [];
        try {
            const contactsResponse = await fetch(`${baseUrl}/api/contacts`);
            const contactsData = await contactsResponse.json();
            contacts = contactsData.contacts || [];
        } catch (err) {
            console.log('·„ Ì „  Õ„Ì· ÃÂ«  «·« ’«·');
        }
        
        const container = document.getElementById('call-history-container');
        container.innerHTML = '';
        
        if (calls.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">??</div>
                    <p>·«  ÊÃœ „ﬂ«·„«  Õ Ï «·¬‰</p>
                </div>
            `;
            return;
        }
        
        //  — Ì» «·„ﬂ«·„«  „‰ «·√ÕœÀ ··√ﬁœ„
        calls.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        
        calls.forEach(call => {
            const date = new Date(call.startTime);
            const formattedDate = date.toLocaleString('ar-EG');
            const duration = call.duration ? `${call.duration} À«‰Ì…` : '·„  ﬂ „·';
            
            const callType = call.direction === 'inbound' ? '?? Ê«—œ…' : '?? ’«œ—…';
            const statusColor = call.status === 'completed' ? '#4ECDC4' : '#FF6B6B';
            
            // «·»ÕÀ ⁄‰ «”„ ÃÂ… «·« ’«·
            let displayName = call.to;
            const contact = contacts.find(c => {
                const cleanContactPhone = c.phone.replace(/[\s-+]/g, '');
                const cleanCallPhone = call.to.replace(/[\s-+]/g, '');
                return cleanContactPhone.includes(cleanCallPhone) || cleanCallPhone.includes(cleanContactPhone);
            });
            
            if (contact) {
                displayName = `?? ${contact.name}`;
            }
            
            const item = document.createElement('div');
            item.className = 'call-item';
            item.innerHTML = `
                <div class="call-item-info">
                    <div class="call-item-number" style="${contact ? 'color: #5ec4d4; font-weight: 600;' : ''}">${displayName}</div>
                    ${!contact ? `<div style="font-size: 12px; color: #999;">${call.to}</div>` : ''}
                    <div class="call-item-details">
                        <span class="call-item-type">${callType}</span>
                        <span>${formattedDate}</span>
                        <span style="color: ${statusColor}">${duration}</span>
                    </div>
                </div>
                <div class="call-item-actions">
                    <button class="play-btn" onclick="dialNumber('${call.to}')">?? « ’«·</button>
                </div>
            `;
            container.appendChild(item);
        });
    } catch (error) {
        console.error('Œÿ√ ›Ì  Õ„Ì· ”Ã· «·„ﬂ«·„« :', error);
    }
}

//  Õ„Ì· ÃÂ«  «·« ’«·
//  Õ„Ì· ÃÂ«  «·« ’«·
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
                    <div class="empty-icon">??</div>
                    <p>·«  ÊÃœ ÃÂ«  « ’«·</p>
                    <button class="add-contact-btn-empty" onclick="addContact()">≈÷«›… ÃÂ… « ’«·</button>
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
                    <button class="contact-call-btn" onclick="callContact('${contact.phone}')" title="« ’«·">??</button>
                    <button class="contact-delete-btn" onclick="deleteContact(${contact.id}, '${contact.name}')" title="Õ–›" style="background: linear-gradient(135deg, #fa709a, #fee140); color: white; width: 35px; height: 35px; border: none; border-radius: 50%; cursor: pointer; font-size: 16px; transition: all 0.2s;">???</button>
                </div>
            `;
            container.appendChild(item);
        });
        
        console.log('?  „  Õ„Ì·', contacts.length, 'ÃÂ… « ’«·');
    } catch (error) {
        console.error('Œÿ√ ›Ì  Õ„Ì· ÃÂ«  «·« ’«·:', error);
        container.innerHTML = '<p style="text-align: center; color: #f44336;">Œÿ√ ›Ì  Õ„Ì· ÃÂ«  «·« ’«·</p>';
    }
}

// ≈÷«›… ÃÂ… « ’«·
async function addContact() {
    const name = prompt('√œŒ· «”„ ÃÂ… «·« ’«·:');
    if (!name) return;
    
    const phone = prompt('√œŒ· —ﬁ„ «·Â« ›:');
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
            console.log('?  „  ≈÷«›… ÃÂ… «·« ’«·');
            loadContacts();
        } else {
            throw new Error(data.error || '›‘· ›Ì ≈÷«›… ÃÂ… «·« ’«·');
        }
    } catch (error) {
        console.error('Œÿ√ ›Ì ≈÷«›… ÃÂ… «·« ’«·:', error);
        alert('›‘· ›Ì ≈÷«›… ÃÂ… «·« ’«·: ' + error.message);
    }
}

// Õ–› ÃÂ… « ’«·
async function deleteContact(contactId, contactName) {
    if (!confirm(`Â·  —Ìœ Õ–› ${contactName}ø`)) {
        return;
    }
    
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/contacts?id=${contactId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('?  „ Õ–› ÃÂ… «·« ’«·');
            loadContacts();
        } else {
            throw new Error(data.error || '›‘· ›Ì Õ–› ÃÂ… «·« ’«·');
        }
    } catch (error) {
        console.error('Œÿ√ ›Ì Õ–› ÃÂ… «·« ’«·:', error);
        alert('›‘· ›Ì Õ–› ÃÂ… «·« ’«·: ' + error.message);
    }
}

// «·« ’«· »ÃÂ… « ’«·
function callContact(phone) {
    phoneNumber = phone;
    displayNumber.textContent = phone;
    makeCall();
}

// «·« ’«· »—ﬁ„
function dialNumber(number) {
    // «· »œÌ· ≈·Ï ·ÊÕ… «·„›« ÌÕ
    hideAllSections();
    removeAllActiveStates();
    dialpad.classList.remove('hidden');
    dialpadBtn.classList.add('active');
    
    // „·¡ «·—ﬁ„
    phoneNumber = number;
    displayNumber.textContent = number;
}

// „⁄«·Ã… “— ≈÷«›… ÃÂ… « ’«·
const addContactBtn = document.getElementById('add-contact-btn');
if (addContactBtn) {
    addContactBtn.addEventListener('click', addContact);
}

// «·»ÕÀ ›Ì ÃÂ«  «·« ’«·
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
                    <button class="contact-call-btn" onclick="callContact('${contact.phone}')" title="« ’«·">??</button>
                </div>
            `;
            container.appendChild(item);
        });
    });
}

//  ”ÃÌ· Service Worker ··‹ PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('? Service Worker „ı”Ã· »‰Ã«Õ:', registration.scope);
            })
            .catch(error => {
                console.log('? ›‘·  ”ÃÌ· Service Worker:', error);
            });
    });
}

//  ”ÃÌ· Êﬁ  «·Œ—ÊÃ ⁄‰œ ≈€·«ﬁ «·’›Õ…
window.addEventListener('beforeunload', async (e) => {
    try {
        const employeeId = localStorage.getItem('employeeId');
        const employeeName = localStorage.getItem('employeeName');
        const baseUrl = window.location.origin;
        
        if (employeeId && employeeName) {
            // «” Œœ«„ sendBeacon ·≈—”«· «·»Ì«‰«  Õ Ï ⁄‰œ ≈€·«ﬁ «·’›Õ…
            const data = JSON.stringify({
                action: 'logout',
                employeeId: employeeId,
                employeeName: employeeName
            });
            
            navigator.sendBeacon(`${baseUrl}/work-tracking`, data);
        }
    } catch (error) {
        console.error('Œÿ√ ›Ì  ”ÃÌ· Êﬁ  «·Œ—ÊÃ:', error);
    }
});

//  ”ÃÌ· Êﬁ  «·Œ—ÊÃ ⁄‰œ ≈Œ›«¡ «·’›Õ…
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
            console.error('Œÿ√ ›Ì  ”ÃÌ· ≈Œ›«¡ «· ÿ»Ìﬁ:', error);
        }
    }
});

//  ÂÌ∆… «· ÿ»Ìﬁ ⁄‰œ «· Õ„Ì·
initializeApp();

//  ”ÃÌ· Êﬁ  «·œŒÊ· ··„ÊŸ›Ì‰ „‰ CRM
if (autoLogin === 'true' && empId && empName) {
    const baseUrl = window.location.origin;
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
    }).catch(err => console.log('?  ”ÃÌ· «·Êﬁ  ”Ì „ ·«Õﬁ«'));
}

// ===== «” ﬁ»«· √—ﬁ«„ ÃœÌœ… „‰ CRM ⁄»— postMessage =====
window.addEventListener('message', (event) => {
    // «· √ﬂœ „‰ «·„’œ—
    if (event.origin !== 'https://hotel-app-dce62.web.app' && !event.origin.includes('localhost')) {
        return;
    }
    
    if (event.data && event.data.type === 'NEW_CALL') {
        console.log('?? «” ﬁ»«· „ﬂ«·„… ÃœÌœ… „‰ CRM:', event.data.phone);
        
        //  ÕœÌÀ «·—ﬁ„
        phoneNumber = event.data.phone;
        if (displayNumber) {
            displayNumber.textContent = event.data.phone;
            updateDeleteButton();
        }
        
        // »œ¡ «·„ﬂ«·„…  ·ﬁ«∆Ì«
        if (device && device.state === 'registered') {
            console.log('? »œ¡ «·„ﬂ«·„… «·ÃœÌœ…...');
            setTimeout(() => makeCall(), 500);
        } else {
            console.log('? «‰ Ÿ«— « ’«· Twilio...');
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

// ===== ÊŸ«∆›  ﬁ«—Ì— ”«⁄«  «·⁄„· =====

//  Õ„Ì·  ﬁ—Ì— ”«⁄«  «·⁄„·
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
                employeeId: 'admin', // „ÿ·Ê» ··‹ validation
                employeeName: '«·„ÿÊ— «·—∆Ì”Ì',
                data: {
                    reportStartDate: startDate,
                    reportEndDate: endDate
                }
            })
        });
        
        const data = await response.json();
        
        console.log('?? Response from work-tracking API:', data);
        if (data.success && data.reports) {
            displayWorkReports(data.reports);
        } else {
            document.getElementById('reports-container').innerHTML = 
                '<div class="no-data">·«  ÊÃœ »Ì«‰«  ›Ì Â–Â «·› —…</div>';
        }
    } catch (error) {
        console.error('Œÿ√ ›Ì  Õ„Ì· «· ﬁ«—Ì—:', error);
        document.getElementById('reports-container').innerHTML = 
            '<div class="error-message">Œÿ√ ›Ì  Õ„Ì· «· ﬁ«—Ì—</div>';
    }
}

// ⁄—÷  ﬁ«—Ì— «·⁄„·
function displayWorkReports(reports) {
    const container = document.getElementById('reports-container');
    
    if (!reports || reports.length === 0) {
        container.innerHTML = '<div class="no-data">·«  ÊÃœ »Ì«‰«  ›Ì Â–Â «·› —…</div>';
        return;
    }
    
    //  — Ì» Õ”» ⁄œœ «·”«⁄«  («·√ﬂÀ— √Ê·«)
    reports.sort((a, b) => b.totalMinutes - a.totalMinutes);
    
    let html = '<div class="reports-summary">';
    html += `<div class="summary-card"><strong>≈Ã„«·Ì «·„ÊŸ›Ì‰:</strong> ${reports.length}</div>`;
    
    const totalHours = reports.reduce((sum, r) => sum + parseFloat(r.totalHours), 0);
    html += `<div class="summary-card"><strong>≈Ã„«·Ì ”«⁄«  «·⁄„·:</strong> ${totalHours.toFixed(2)} ”«⁄…</div>`;
    
    const totalCalls = reports.reduce((sum, r) => sum + r.totalCalls, 0);
    html += `<div class="summary-card"><strong>≈Ã„«·Ì «·„ﬂ«·„« :</strong> ${totalCalls} „ﬂ«·„…</div>`;
    html += '</div>';
    
    html += '<table class="reports-table">';
    html += '<thead><tr>';
    html += '<th>#</th>';
    html += '<th>«”„ «·„ÊŸ›</th>';
    html += '<th>⁄œœ «·√Ì«„</th>';
    html += '<th>≈Ã„«·Ì «·”«⁄« </th>';
    html += '<th>⁄œœ «·„ﬂ«·„« </th>';
    html += '<th>„ Ê”ÿ ”«⁄« /ÌÊ„</th>';
    html += '<th>«·≈Ã—«¡« </th>';
    html += '</tr></thead><tbody>';
    
    reports.forEach((report, index) => {
        const avgHours = (report.totalHours / report.days.length).toFixed(2);
        html += '<tr>';
        html += `<td>${index + 1}</td>`;
        html += `<td><strong>${report.employeeName}</strong></td>`;
        html += `<td>${report.days.length} ÌÊ„</td>`;
        html += `<td><span class="hours-badge">${report.totalHours} ”«⁄…</span></td>`;
        html += `<td>${report.totalCalls} „ﬂ«·„…</td>`;
        html += `<td>${avgHours} ”«⁄…</td>`;
        html += `<td><button class="btn-details" onclick="showEmployeeDetails('${report.employeeId}', '${report.employeeName}')">«· ›«’Ì·</button></td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ⁄—÷  ›«’Ì· „ÊŸ› „Õœœ
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
        console.error('Œÿ√ ›Ì  Õ„Ì·  ›«’Ì· «·„ÊŸ›:', error);
        alert('Œÿ√ ›Ì  Õ„Ì· «· ›«’Ì·');
    }
}

// ⁄—÷ ‰«›–… „‰»Àﬁ… » ›«’Ì· «·„ÊŸ›
function displayEmployeeDetailsModal(data) {
    let html = `
        <div class="modal-overlay" onclick="this.remove()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3> ›«’Ì· ⁄„· ${data.employeeName}</h3>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">◊</button>
                </div>
                <div class="modal-body">
                    <div class="employee-summary">
                        <div class="summary-item">
                            <span class="label">≈Ã„«·Ì «·”«⁄« :</span>
                            <span class="value">${data.totalHours} ”«⁄…</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">⁄œœ «·√Ì«„:</span>
                            <span class="value">${data.totalDays} ÌÊ„</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">⁄œœ «·„ﬂ«·„« :</span>
                            <span class="value">${data.totalCalls} „ﬂ«·„…</span>
                        </div>
                    </div>
                    <h4> ›«’Ì· ÌÊ„Ì…:</h4>
                    <table class="details-table">
                        <thead>
                            <tr>
                                <th>«· «—ÌŒ</th>
                                <th>Êﬁ  «·œŒÊ·</th>
                                <th>Êﬁ  «·Œ—ÊÃ</th>
                                <th>«·”«⁄« </th>
                                <th>«·„ﬂ«·„« </th>
                            </tr>
                        </thead>
                        <tbody>`;
    
    data.dailyReport.forEach(day => {
        const loginTime = new Date(day.loginTime).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'});
        const logoutTime = day.logoutTime ? new Date(day.logoutTime).toLocaleTimeString('ar-EG', {hour: '2-digit', minute: '2-digit'}) : '·„ Ì”Ã· Œ—ÊÃ';
        const hours = (day.totalMinutes / 60).toFixed(2);
        
        html += `
            <tr>
                <td>${day.date}</td>
                <td>${loginTime}</td>
                <td>${logoutTime}</td>
                <td>${hours} ”«⁄…</td>
                <td>${day.calls?.length || 0} „ﬂ«·„…</td>
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

// “— ≈‰‘«¡ «· ﬁ—Ì—
const generateReportBtn = document.getElementById('generate-report-btn');
if (generateReportBtn) {
    generateReportBtn.addEventListener('click', () => {
        const startDate = document.getElementById('report-start-date').value;
        const endDate = document.getElementById('report-end-date').value;
        
        if (!startDate || !endDate) {
            alert('Ì—ÃÏ  ÕœÌœ «·› —… «·“„‰Ì…');
            return;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            alert(' «—ÌŒ «·»œ«Ì… ÌÃ» √‰ ÌﬂÊ‰ ﬁ»·  «—ÌŒ «·‰Â«Ì…');
            return;
        }
        
        loadWorkReports(startDate, endDate);
    });
}

// ≈Œ›«¡ “—  ﬁ«—Ì— «·⁄„· ⁄‰ €Ì— «·„ÿÊ—Ì‰
if (userRole !== 'admin' && workReportsBtn) {
    workReportsBtn.style.display = 'none';
}

// =====  ÕœÌÀ «·—’Ìœ  ·ﬁ«∆Ì« ﬂ· 5 ÀÊ«‰Ì =====
let balanceRefreshInterval = null;

function startBalanceAutoRefresh() {
    //  ÕœÌÀ ›Ê—Ì
    loadAccountBalance();
    
    //  ÕœÌÀ ﬂ· 5 ÀÊ«‰Ì
    balanceRefreshInterval = setInterval(() => {
        loadAccountBalance();
    }, 5000);
    
    console.log('?  ÕœÌÀ «·—’Ìœ «· ·ﬁ«∆Ì „›⁄¯· - ﬂ· 5 ÀÊ«‰Ì');
}

// »œ¡  ÕœÌÀ «·—’Ìœ ⁄‰œ  Õ„Ì· «·’›Õ…
startBalanceAutoRefresh();

console.log('? «· ÿ»Ìﬁ Ì⁄„· »‘ﬂ· „” „— - ·« ÌÊÃœ  ”ÃÌ· Œ—ÊÃ  ·ﬁ«∆Ì');

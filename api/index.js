const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
const path = require('path');
const https = require('https');
const fs = require('fs');

// ===================== Plivo Integration =====================
let plivoClient = null;
const PLIVO_AUTH_ID = process.env.PLIVO_AUTH_ID;
const PLIVO_AUTH_TOKEN = process.env.PLIVO_AUTH_TOKEN;
const PLIVO_PHONE_NUMBER = process.env.PLIVO_PHONE_NUMBER; // رقم Plivo (مصري أو سعودي)

if (PLIVO_AUTH_ID && PLIVO_AUTH_TOKEN) {
    try {
        const plivo = require('plivo');
        plivoClient = new plivo.Client(PLIVO_AUTH_ID, PLIVO_AUTH_TOKEN);
        console.log('✅ Plivo متصل - رقم:', PLIVO_PHONE_NUMBER);
    } catch (error) {
        console.log('⚠️ Plivo غير متاح:', error.message);
    }
} else {
    console.log('⚠️ Plivo غير مُعد - لإضافته أضف PLIVO_AUTH_ID و PLIVO_AUTH_TOKEN');
}
// ===================== نهاية Plivo =====================

// ===================== Zadarma Integration (أرقام مصرية!) =====================
const ZADARMA_KEY = process.env.ZADARMA_KEY;
const ZADARMA_SECRET = process.env.ZADARMA_SECRET;
const ZADARMA_SIP = process.env.ZADARMA_SIP; // SIP ID الخاص بك
const ZADARMA_PHONE = process.env.ZADARMA_PHONE; // الرقم المصري من Zadarma

if (ZADARMA_KEY && ZADARMA_SECRET) {
    console.log('✅ Zadarma معد - رقم مصري:', ZADARMA_PHONE);
} else {
    console.log('⚠️ Zadarma غير مُعد - للأرقام المصرية أضف ZADARMA_KEY و ZADARMA_SECRET');
    console.log('   👉 https://zadarma.com/');
}
// ===================== نهاية Zadarma =====================

// Upstash Redis للتخزين السحابي
let redis;
try {
    const { Redis } = require('@upstash/redis');
    redis = new Redis({
        url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('✅ Upstash Redis متصل');
} catch (error) {
    console.log('⚠️ Upstash Redis غير متاح (تشغيل محلي)');
}

const app = express();
const PORT = 3000;

// قراءة بيانات المديرين (للتشغيل المحلي فقط)
let employeesData = {
    employees: [
        {
            id: 1,
            name: "أميرة",
            username: "amira",
            password: "Aa123456",
            department: "1",
            phone: "",
            permissions: {
                viewOwnRecordings: true,
                viewAllRecordings: true,
                deleteRecordings: false,
                editProfile: true
            },
            createdAt: "2025-12-08T00:00:00.000Z"
        },
        {
            id: 3,
            name: "شاكر",
            username: "shaker",
            password: "Aa123456",
            department: "3",
            phone: "",
            permissions: {
                viewOwnRecordings: true,
                viewAllRecordings: true,
                deleteRecordings: false,
                editProfile: true
            },
            createdAt: "2025-12-08T00:00:00.000Z"
        },
        {
            id: 5,
            name: "إسلام",
            username: "eslam",
            password: "Aa123456",
            department: "5",
            phone: "",
            permissions: {
                viewOwnRecordings: true,
                viewAllRecordings: false,
                deleteRecordings: false,
                editProfile: true
            },
            createdAt: "2025-12-08T00:00:00.000Z"
        },
        {
            id: 6,
            name: "نوره",
            username: "Noura",
            password: "Aa123456",
            department: "1",
            phone: "",
            permissions: {
                viewOwnRecordings: true,
                viewAllRecordings: false,
                deleteRecordings: false,
                editProfile: true
            },
            createdAt: "2025-12-16T00:00:00.000Z"
        },
        {
            id: 7,
            name: "سمر",
            username: "samar",
            password: "Aa123456",
            department: "1",
            phone: "",
            permissions: {
                viewOwnRecordings: true,
                viewAllRecordings: false,
                deleteRecordings: false,
                editProfile: true
            },
            createdAt: "2025-12-16T00:00:00.000Z"
        },
        {
            id: 8,
            name: "محمد",
            username: "mohamed",
            password: "Aa123456",
            department: "1",
            phone: "",
            permissions: {
                viewOwnRecordings: true,
                viewAllRecordings: false,
                deleteRecordings: false,
                editProfile: true
            },
            createdAt: "2026-02-03T00:00:00.000Z"
        }
    ],
    departments: {
        "1": { name: "الحجوزات", employees: [] },
        "2": { name: "المبيعات", employees: [] },
        "3": { name: "خدمة العملاء", employees: [] },
        "4": { name: "الحسابات", employees: [] },
        "5": { name: "الدعم الفنى", employees: [] },
        "6": { name: "الشكاوى والاقتراحات", employees: [] }
    }
};

// محاولة تحميل من الملف (للتشغيل المحلي)
try {
    const data = fs.readFileSync(path.join(__dirname, '..', 'employees.json'), 'utf8');
    employeesData = JSON.parse(data);
    console.log('✅ تم تحميل بيانات المديرين من الملف');
} catch (error) {
    console.log('⚠️ سيتم استخدام Redis للتخزين');
}

// دوال مساعدة للتعامل مع Redis أو الملف
async function getEmployeesData() {
    // على Vercel نحاول Redis أولاً
    if (process.env.VERCEL && redis) {
        try {
            const data = await redis.get('employees_data');
            if (data && Array.isArray(data.employees)) {
                console.log('✅ تم جلب البيانات من Redis:', data.employees.length, 'موظف');
                return data;
            }
            console.log('⚠️ Redis فارغ أو بيانات غير صالحة، استخدام employees.json');
        } catch (error) {
            console.error('❌ خطأ في قراءة Redis:', error);
        }
    }
    // قراءة من الملف دايمًا كـ fallback
    try {
        const raw = fs.readFileSync(path.join(__dirname, '..', 'employees.json'), 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.employees) {
            console.log('✅ تم قراءة employees.json:', parsed.employees.length, 'موظف');
            return parsed;
        }
    } catch (e) {
        console.log('⚠️ تعذرت قراءة employees.json، استخدام البيانات الافتراضية');
    }
    return employeesData;
}

async function saveEmployeesData(data) {
    console.log('💾 محاولة حفظ البيانات...', {
        employeesCount: data.employees.length,
        isVercel: !!process.env.VERCEL,
        hasRedis: !!redis
    });
    
    if (redis && process.env.VERCEL) {
        try {
            await redis.set('employees_data', data);
            console.log('✅ تم حفظ البيانات في Upstash Redis بنجاح');
            
            // التحقق من الحفظ
            const saved = await redis.get('employees_data');
            const savedCount = saved?.employees?.length || 0;
            console.log('✅ تم التحقق: عدد المديرين المحفوظين:', savedCount);
            
            if (savedCount !== data.employees.length) {
                console.error('❌ عدد المديرين المحفوظين لا يطابق:', savedCount, '!=', data.employees.length);
            }
            
            return true;
        } catch (error) {
            console.error('❌ خطأ في حفظ Redis:', error);
            return false;
        }
    } else {
        // حفظ في ملف للتشغيل المحلي
        try {
            fs.writeFileSync(
                path.join(__dirname, '..', 'employees.json'),
                JSON.stringify(data, null, 2)
            );
            employeesData = data;
            console.log('✅ تم حفظ البيانات في الملف المحلي');
            return true;
        } catch (error) {
            console.error('❌ خطأ في حفظ الملف:', error);
            return false;
        }
    }
}

// إعدادات Twilio - يجب تعيينها في .env أو Vercel Environment Variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_TWIML_APP_SID = process.env.TWILIO_TWIML_APP_SID;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER; // الرقم الأمريكي المشترى (Twilio Phone Number)
const TWILIO_PHONE_NUMBER_EGYPT = process.env.TWILIO_PHONE_NUMBER_EGYPT || '+201555512778'; // الرقم المصري (Verified)
const TWILIO_PHONE_NUMBER_SAUDI = process.env.TWILIO_PHONE_NUMBER_SAUDI || '+966555254915'; // الرقم السعودي (Verified)
const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
const TWILIO_API_SECRET = process.env.TWILIO_API_SECRET;

// دالة للحصول على رقم المتصل المناسب
function getCallerIdNumber(callerId) {
    if (callerId === 'egypt') {
        console.log('📱 استخدام الرقم المصري (Verified):', TWILIO_PHONE_NUMBER_EGYPT);
        return TWILIO_PHONE_NUMBER_EGYPT;
    }
    if (callerId === 'saudi') {
        console.log('📱 استخدام الرقم السعودي (Verified):', TWILIO_PHONE_NUMBER_SAUDI);
        return TWILIO_PHONE_NUMBER_SAUDI;
    }
    // الافتراضي: الرقم الأمريكي المشترى من Twilio
    console.log('📱 استخدام الرقم الأمريكي (Twilio Number):', TWILIO_PHONE_NUMBER);
    return TWILIO_PHONE_NUMBER;
}

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error('❌ خطأ: يجب تعيين متغيرات Twilio في ملف .env');
    console.error('أنشئ ملف .env وأضف:');
    console.error('TWILIO_ACCOUNT_SID=your_account_sid');
    console.error('TWILIO_AUTH_TOKEN=your_auth_token');
    console.error('TWILIO_TWIML_APP_SID=your_twiml_app_sid');
    console.error('TWILIO_PHONE_NUMBER=your_twilio_number');
}

// تهيئة عميل Twilio
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes للصفحات الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'login.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'login.html'));
});

// Routes للملفات الثابتة (CSS, JS, Images)
app.get('/style.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, '..', 'style.css'));
});

app.get('/login-style.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, '..', 'login-style.css'));
});

app.get('/app.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, '..', 'app.js'));
});

app.get('/logo.jpg', (req, res) => {
    res.setHeader('Content-Type', 'image/jpeg');
    res.sendFile(path.join(__dirname, '..', 'logo.jpg'));
});

app.get('/icon-512.png', (req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(path.join(__dirname, '..', 'icon-512.png'));
});

app.get('/icon-192.png', (req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(path.join(__dirname, '..', 'icon-192.png'));
});

app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(path.join(__dirname, '..', 'manifest.json'));
});

app.get('/service-worker.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, '..', 'service-worker.js'));
});

// معالج تتبع العمل
app.all('/work-tracking', async (req, res) => {
    try {
        console.log('📊 Work tracking request:', req.method, req.body);
        
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
        
        const { action, employeeId, employeeName, data } = req.body || {};

        if (!action || !employeeId) {
            console.log('❌ Missing action or employeeId');
            return res.status(400).json({ 
                error: 'يجب تحديد action و employeeId' 
            });
        }
        
        console.log(`✅ Processing action: ${action} for employee: ${employeeId}`);

        const timestamp = new Date().toISOString();
        const date = new Date().toISOString().split('T')[0];

        switch (action) {
            case 'login':
                const loginKey = `work:${employeeId}:${date}`;
                let workSession = await kv.get(loginKey) || {
                    employeeId,
                    employeeName,
                    date,
                    loginTime: timestamp,
                    logoutTime: null,
                    totalMinutes: 0,
                    calls: [],
                    activities: []
                };

                if (!workSession.logoutTime && workSession.loginTime !== timestamp) {
                    workSession.activities.push({ type: 'login', time: timestamp });
                } else {
                    workSession.loginTime = timestamp;
                }

                await kv.set(loginKey, workSession);
                return res.status(200).json({ success: true, message: 'تم تسجيل الدخول', session: workSession });

            case 'logout':
                const logoutKey = `work:${employeeId}:${date}`;
                let session = await kv.get(logoutKey);
                if (!session) return res.status(404).json({ error: 'لم يتم العثور على جلسة' });

                session.logoutTime = timestamp;
                const minutes = Math.floor((new Date(timestamp) - new Date(session.loginTime)) / 1000 / 60);
                session.totalMinutes = minutes;
                session.activities.push({ type: 'logout', time: timestamp });

                await kv.set(logoutKey, session);
                return res.status(200).json({ success: true, session });

            case 'activity':
                const activityKey = `work:${employeeId}:${date}`;
                let activitySession = await kv.get(activityKey);
                if (!activitySession) return res.status(404).json({ error: 'لم يتم العثور على جلسة' });

                const activity = { type: data?.type, time: timestamp, details: data?.details || {} };
                activitySession.activities.push(activity);

                if (data?.type === 'call') {
                    activitySession.calls.push({
                        time: timestamp,
                        phoneNumber: data.details?.phoneNumber,
                        duration: data.details?.duration,
                        status: data.details?.status
                    });
                }

                await kv.set(activityKey, activitySession);
                return res.status(200).json({ success: true, activity });

            case 'heartbeat':
                // نبض القلب للمستخدم المتصل
                const heartbeatKey = `online:${employeeId}`;
                await kv.set(heartbeatKey, { employeeId, employeeName, lastSeen: timestamp }, { ex: 60 });
                return res.status(200).json({ success: true });

            default:
                return res.status(400).json({ error: 'Action غير صحيح' });
        }

    } catch (error) {
        console.error('❌ خطأ في تتبع العمل:', error);
        return res.status(500).json({ error: 'فشل في تتبع العمل', details: error.message });
    }
});

// توليد Token للعميل (للمكالمات من المتصفح مباشرة)
app.get('/token', async (req, res) => {
    try {
        const identity = req.query.identity || 'employee_' + Date.now();
        
        console.log('🔑 توليد Token للمدير:', identity);
        console.log('🔑 Account SID:', TWILIO_ACCOUNT_SID);
        console.log('🔑 API Key exists:', !!TWILIO_API_KEY);
        console.log('🔑 TwiML App SID:', TWILIO_TWIML_APP_SID);
        
        // إنشاء API Key جديد إذا لم يكن موجود
        let apiKey = TWILIO_API_KEY;
        let apiSecret = TWILIO_API_SECRET;
        
        if (!apiKey || !apiSecret) {
            console.log('⚙️ إنشاء API Key جديد...');
            try {
                const newKey = await twilioClient.newKeys.create({
                    friendlyName: 'Link Call Auto Key'
                });
                apiKey = newKey.sid;
                apiSecret = newKey.secret;
                console.log('✅ API Key جديد تم إنشاؤه:', apiKey);
            } catch (error) {
                console.error('❌ فشل إنشاء API Key:', error.message);
                return res.status(500).json({ 
                    error: 'فشل في إنشاء API Key',
                    details: 'يرجى إنشاء API Key يدوياً من Twilio Console'
                });
            }
        }
        
        const AccessToken = twilio.jwt.AccessToken;
        const VoiceGrant = AccessToken.VoiceGrant;
        
        // استخدام API Key الصحيح
        const token = new AccessToken(
            TWILIO_ACCOUNT_SID,
            apiKey,
            apiSecret,
            { 
                identity: identity,
                ttl: 3600 // ساعة واحدة
            }
        );

        const voiceGrant = new VoiceGrant({
            outgoingApplicationSid: TWILIO_TWIML_APP_SID,
            incomingAllow: true
        });

        token.addGrant(voiceGrant);
        
        const jwt = token.toJwt();
        console.log('✅ Token تم إنشاؤه بنجاح');

        res.json({
            token: jwt,
            identity: identity
        });
    } catch (error) {
        console.error('❌ خطأ في توليد Token:', error);
        res.status(500).json({ 
            error: 'فشل في توليد Token',
            details: error.message 
        });
    }
});

// تم نقل /voice endpoint للأسفل (للمكالمات الواردة مع IVR)

// إجراء مكالمة باستخدام Conference (للصوت الثنائي)
app.post('/make-direct-call', async (req, res) => {
    try {
        const { to } = req.body;
        
        console.log('📞 بدء Conference call إلى:', to);
        
        // رقم المستخدم الافتراضي (موبايلك)
        const userPhone = '+966559902557';
        
        // إنشاء conference فريد
        const conferenceName = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const baseUrl = process.env.NGROK_URL || 'https://unacetic-nearly-tawanna.ngrok-free.dev';
        
        console.log('📞 Conference:', conferenceName);
        console.log('👤 موبايلك:', userPhone);
        console.log('📱 الرقم المطلوب:', to);
        
        // المكالمة الأولى: الاتصال بموبايلك مع رد تلقائي
        const call1 = await twilioClient.calls.create({
            url: `${baseUrl}/join-conference?conference=${encodeURIComponent(conferenceName)}&participant=user&to=${encodeURIComponent(to)}`,
            to: userPhone,
            from: TWILIO_PHONE_NUMBER,
            machineDetection: 'Enable', // كشف الرد الآلي
            asyncAmd: 'true'
        });
        
        console.log('✅ اتصال بموبايلك:', call1.sid);
        
        // الانتظار 1 ثانية فقط ثم الاتصال بالطرف الآخر
        setTimeout(async () => {
            try {
                const call2 = await twilioClient.calls.create({
                    url: `${baseUrl}/join-conference?conference=${encodeURIComponent(conferenceName)}&participant=other`,
                    to: to,
                    from: TWILIO_PHONE_NUMBER
                });
                
                console.log('✅ اتصال بالرقم الآخر:', call2.sid);
            } catch (error) {
                console.error('❌ خطأ في الاتصال بالرقم الآخر:', error);
            }
        }, 1000);
        
        res.json({
            success: true,
            callSid: call1.sid,
            conferenceName: conferenceName,
            status: call1.status
        });
    } catch (error) {
        console.error('❌ خطأ في إجراء المكالمة:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// ==================== اتصال مع Verified Caller ID ====================
// هذا الـ endpoint يدعم الأرقام المحققة (السعودية/المصرية) عبر Conference

// الخطوة 1: المتصفح يتصل بهذا الـ endpoint ويدخل Conference
app.post('/verified-outgoing-call', async (req, res) => {
    let toNumber = req.body.To;
    const employeeId = req.body.employeeId || 'unknown';
    const callerIdChoice = req.body.callerId || 'default';
    
    console.log('📞 ================ مكالمة Verified Caller ID ================');
    console.log('📞 الرقم المطلوب:', toNumber);
    console.log('👤 معرف الموظف:', employeeId);
    console.log('📱 رقم المتصل المختار:', callerIdChoice);
    
    // تنظيف الرقم
    if (toNumber) {
        toNumber = toNumber.replace(/[\u200E\u200F\u202A\u202B\u202C\u202D\u202E\uFEFF\s\-\(\)]/g, '');
    }
    
    const twiml = new twilio.twiml.VoiceResponse();
    
    // إذا كان الرقم المختار هو الأمريكي (default)، استخدم الطريقة العادية
    if (callerIdChoice === 'default' || !toNumber) {
        console.log('📱 استخدام الطريقة العادية (الرقم الأمريكي)');
        if (toNumber) {
            const dial = twiml.dial({
                callerId: TWILIO_PHONE_NUMBER,
                record: 'record-from-answer',
                recordingStatusCallback: `/recording-status?employeeId=${employeeId}&to=${encodeURIComponent(toNumber)}`,
                recordingStatusCallbackEvent: ['completed'],
                timeout: 30,
                answerOnBridge: true
            });
            dial.number(toNumber);
        } else {
            twiml.say({ voice: 'Polly.Zeina', language: 'ar-AE' }, 'لم يتم تحديد رقم للاتصال');
        }
        res.type('text/xml');
        return res.send(twiml.toString());
    }
    
    // للأرقام المحققة (السعودية/المصرية) - استخدام Conference
    const conferenceName = `verified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const selectedCallerNumber = getCallerIdNumber(callerIdChoice);
    
    console.log('📱✅ الرقم المحقق:', selectedCallerNumber);
    console.log('🎯 Conference:', conferenceName);
    
    // إضافة المتصفح للـ Conference
    const dial = twiml.dial({
        timeout: 60
    });
    dial.conference({
        startConferenceOnEnter: true,
        endConferenceOnExit: true,
        beep: false,
        waitUrl: 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical',
        statusCallback: `/conference-status?employeeId=${employeeId}&to=${encodeURIComponent(toNumber)}`,
        statusCallbackEvent: ['start', 'end', 'join', 'leave']
    }, conferenceName);
    
    // إرسال TwiML للمتصفح فوراً
    res.type('text/xml');
    res.send(twiml.toString());
    
    // الآن نتصل بالعميل عبر REST API من الرقم المحقق
    const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : (process.env.NGROK_URL || 'https://link-call-jade.vercel.app');
    
    setTimeout(async () => {
        try {
            console.log('📞 جاري الاتصال بالعميل من الرقم المحقق...');
            const call = await twilioClient.calls.create({
                url: `${baseUrl}/join-verified-conference?conference=${encodeURIComponent(conferenceName)}&employeeId=${employeeId}`,
                to: toNumber,
                from: selectedCallerNumber, // الرقم المحقق (السعودي أو المصري)
                statusCallback: `${baseUrl}/call-status-webhook?employeeId=${employeeId}`,
                statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
                record: true,
                recordingStatusCallback: `${baseUrl}/recording-status?employeeId=${employeeId}&to=${encodeURIComponent(toNumber)}`,
                recordingStatusCallbackEvent: ['completed']
            });
            console.log('✅ تم إنشاء المكالمة للعميل:', call.sid);
            
            // حفظ علاقة المكالمة
            await saveCallEmployeeMapping(call.sid, employeeId, toNumber);
        } catch (error) {
            console.error('❌ خطأ في الاتصال بالعميل:', error.message);
        }
    }, 1000); // انتظار ثانية ليدخل المتصفح أولاً
});

// TwiML لإضافة العميل للـ Conference
app.all('/join-verified-conference', (req, res) => {
    const conferenceName = req.query.conference || req.body.conference;
    const employeeId = req.query.employeeId || 'unknown';
    
    console.log('📞 إضافة العميل للـ Conference:', conferenceName);
    
    const twiml = new twilio.twiml.VoiceResponse();
    
    // رسالة ترحيب للعميل
    twiml.say({ 
        voice: 'Polly.Zeina', 
        language: 'ar-AE' 
    }, 'جاري توصيلك، الرجاء الانتظار');
    
    const dial = twiml.dial();
    dial.conference({
        startConferenceOnEnter: true,
        endConferenceOnExit: false,
        beep: false
    }, conferenceName);
    
    res.type('text/xml');
    res.send(twiml.toString());
});

// حالة Conference
app.post('/conference-status', (req, res) => {
    console.log('🎯 Conference Status:', {
        conferenceSid: req.body.ConferenceSid,
        statusCallbackEvent: req.body.StatusCallbackEvent,
        friendlyName: req.body.FriendlyName
    });
    res.sendStatus(200);
});

// ==================== نهاية Verified Caller ID ====================

// ==================== Plivo Calling (بديل محلي أرخص) ====================

// الاتصال عبر Plivo (للأرقام المحلية المصرية/السعودية)
app.post('/plivo-call', async (req, res) => {
    if (!plivoClient) {
        return res.status(400).json({ 
            error: 'Plivo غير مُعد. أضف PLIVO_AUTH_ID و PLIVO_AUTH_TOKEN في Vercel',
            setupUrl: 'https://console.plivo.com/dashboard/'
        });
    }
    
    const { to, from, employeeId } = req.body;
    
    console.log('📞 ================ Plivo Call ================');
    console.log('📞 إلى:', to);
    console.log('📱 من:', from || PLIVO_PHONE_NUMBER);
    console.log('👤 الموظف:', employeeId);
    
    try {
        const baseUrl = 'https://link-call-jade.vercel.app';
        
        const call = await plivoClient.calls.create(
            from || PLIVO_PHONE_NUMBER, // الرقم المصري/السعودي من Plivo
            to,
            `${baseUrl}/plivo-answer?employeeId=${employeeId}`,
            {
                answerMethod: 'POST',
                hangupUrl: `${baseUrl}/plivo-hangup?employeeId=${employeeId}`,
                hangupMethod: 'POST',
                record: true,
                recordingCallbackUrl: `${baseUrl}/plivo-recording?employeeId=${employeeId}`,
                recordingCallbackMethod: 'POST'
            }
        );
        
        console.log('✅ Plivo Call created:', call.requestUuid);
        res.json({ 
            success: true, 
            callId: call.requestUuid,
            message: 'جاري الاتصال عبر Plivo'
        });
    } catch (error) {
        console.error('❌ Plivo Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Plivo Answer XML
app.all('/plivo-answer', (req, res) => {
    const employeeId = req.query.employeeId;
    console.log('📞 Plivo Answer - Employee:', employeeId);
    
    // Plivo XML (مشابه لـ TwiML)
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Speak language="ar">جاري توصيلك بالخدمة</Speak>
        <Record maxLength="3600" recordSession="true" redirect="false"/>
    </Response>`;
    
    res.type('application/xml');
    res.send(xml);
});

// Plivo Hangup
app.post('/plivo-hangup', (req, res) => {
    console.log('📞 Plivo Hangup:', req.body);
    res.sendStatus(200);
});

// Plivo Recording Callback
app.post('/plivo-recording', async (req, res) => {
    console.log('🎙️ Plivo Recording:', req.body);
    
    const recordingUrl = req.body.RecordingUrl;
    const callUuid = req.body.CallUUID;
    const employeeId = req.query.employeeId;
    
    if (recordingUrl && redis) {
        try {
            // حفظ التسجيل
            const recording = {
                sid: callUuid,
                recordingUrl: recordingUrl,
                duration: req.body.RecordingDuration,
                employeeId: employeeId,
                provider: 'plivo',
                createdAt: new Date().toISOString()
            };
            
            await redis.lpush('recordings', JSON.stringify(recording));
            console.log('✅ Plivo recording saved');
        } catch (error) {
            console.error('❌ Error saving Plivo recording:', error);
        }
    }
    
    res.sendStatus(200);
});

// جلب أرقام Plivo المتاحة
app.get('/plivo-numbers', async (req, res) => {
    if (!plivoClient) {
        return res.json({ 
            available: false,
            message: 'Plivo غير مُعد',
            numbers: []
        });
    }
    
    try {
        const numbers = await plivoClient.numbers.list();
        res.json({ 
            available: true,
            numbers: numbers.map(n => ({
                number: n.number,
                country: n.country,
                type: n.type
            }))
        });
    } catch (error) {
        res.json({ 
            available: true,
            error: error.message,
            numbers: PLIVO_PHONE_NUMBER ? [{ number: PLIVO_PHONE_NUMBER }] : []
        });
    }
});

// حالة Plivo
app.get('/plivo-status', (req, res) => {
    res.json({
        configured: !!plivoClient,
        phoneNumber: PLIVO_PHONE_NUMBER || null,
        setupUrl: 'https://console.plivo.com/dashboard/'
    });
});

// ==================== نهاية Plivo ====================

// ==================== Zadarma Integration (أرقام مصرية!) ====================
const crypto = require('crypto');

// دالة توقيع طلبات Zadarma
function signZadarmaRequest(method, params) {
    const sortedParams = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('');
    const signStr = method + sortedParams + ZADARMA_SECRET;
    return crypto.createHash('md5').update(signStr).digest('hex');
}

// الاتصال عبر Zadarma (للرقم المصري)
app.post('/zadarma-call', async (req, res) => {
    if (!ZADARMA_KEY || !ZADARMA_SECRET) {
        return res.status(400).json({ 
            error: 'Zadarma غير مُعد',
            setupSteps: [
                '1. سجل في https://zadarma.com/',
                '2. اشتري رقم مصري من Virtual Numbers',
                '3. اذهب إلى Settings → API وانسخ Key و Secret',
                '4. أضفهم في Vercel: ZADARMA_KEY, ZADARMA_SECRET, ZADARMA_SIP, ZADARMA_PHONE'
            ]
        });
    }
    
    const { to, employeeId } = req.body;
    
    console.log('📞 ================ Zadarma Call (مصر) ================');
    console.log('📞 إلى:', to);
    console.log('📱 من (الرقم المصري):', ZADARMA_PHONE);
    console.log('👤 الموظف:', employeeId);
    
    try {
        // Zadarma API - إجراء مكالمة
        const params = {
            from: ZADARMA_SIP, // SIP الداخلي
            to: to,
            predicted_dst: to,
            caller_id: ZADARMA_PHONE // الرقم المصري الذي سيظهر للعميل
        };
        
        const signature = signZadarmaRequest('/v1/request/callback/', params);
        
        const response = await fetch('https://api.zadarma.com/v1/request/callback/', {
            method: 'POST',
            headers: {
                'Authorization': `${ZADARMA_KEY}:${signature}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams(params).toString()
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            console.log('✅ Zadarma Call created');
            res.json({ 
                success: true, 
                message: 'جاري الاتصال من الرقم المصري عبر Zadarma',
                callerId: ZADARMA_PHONE
            });
        } else {
            console.error('❌ Zadarma Error:', result);
            res.status(400).json({ error: result.message || 'فشل الاتصال' });
        }
    } catch (error) {
        console.error('❌ Zadarma Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// حالة Zadarma
app.get('/zadarma-status', (req, res) => {
    res.json({
        configured: !!(ZADARMA_KEY && ZADARMA_SECRET),
        phoneNumber: ZADARMA_PHONE || null,
        sipId: ZADARMA_SIP || null,
        setupUrl: 'https://zadarma.com/',
        pricing: 'https://zadarma.com/en/tariffs/calls/'
    });
});

// ==================== نهاية Zadarma ====================

// TwiML بسيط للاتصال المباشر
app.all('/simple-dial', (req, res) => {
    const toNumber = req.query.to || req.body.to;
    
    console.log('📞 TwiML للاتصال بـ:', toNumber);
    
    const twiml = new twilio.twiml.VoiceResponse();
    
    if (toNumber) {
        twiml.dial(toNumber);
    } else {
        twiml.say('No number provided');
    }
    
    res.type('text/xml');
    res.send(twiml.toString());
});

// TwiML للمكالمات الصادرة من المتصفح (Voice URL لـ TwiML App)
// حفظ معرفات المديرين للمكالمات (في الذاكرة مؤقتاً)
// تخزين علاقة المكالمات بالمديرين في Redis
async function saveCallEmployeeMapping(callSid, employeeId, toNumber = null) {
    try {
        if (redis) {
            const data = { employeeId };
            if (toNumber) {
                data.to = toNumber;
            }
            await redis.set(`call:${callSid}`, JSON.stringify(data), { ex: 604800 }); // حفظ لمدة 7 أيام
            console.log(`✅ حفظ علاقة المكالمة ${callSid} بالمدير ${employeeId}${toNumber ? ' ورقم ' + toNumber : ''}`);
        }
    } catch (error) {
        console.error('خطأ في حفظ علاقة المكالمة:', error);
    }
}

async function getCallEmployeeId(callSid) {
    try {
        if (redis) {
            const data = await redis.get(`call:${callSid}`);
            if (data) {
                // التعامل مع البيانات القديمة (نص فقط) والجديدة (JSON)
                try {
                    const parsed = JSON.parse(data);
                    return parsed;
                } catch {
                    // بيانات قديمة - مجرد employeeId
                    return { employeeId: data, to: null };
                }
            }
        }
    } catch (error) {
        console.error('خطأ في جلب معرف المدير:', error);
    }
    return null;
}

app.post('/outgoing-call', async (req, res) => {
    let toNumber = req.body.To;
    const employeeId = req.body.employeeId || 'unknown';
    const callerIdChoice = req.body.callerId || 'default';
    
    console.log('📞 ================ مكالمة صادرة جديدة ================');
    console.log('📞 الرقم الأصلي:', toNumber);
    console.log('👤 معرف المدير:', employeeId);
    console.log('📱 رقم المتصل المختار:', callerIdChoice);
    
    // تنظيف الرقم
    if (toNumber) {
        toNumber = toNumber.replace(/[\u200E\u200F\u202A\u202B\u202C\u202D\u202E\uFEFF\s\-\(\)]/g, '');
        
        if (toNumber.match(/^\+9660[1-9]\d{7,8}$/)) {
            toNumber = toNumber.replace(/^\+9660/, '+966');
        } else if (toNumber.match(/^\+200\d+$/)) {
            toNumber = toNumber.replace(/^\+200/, '+20');
        }
    }
    
    console.log('📞 الرقم النهائي:', toNumber);
    
    const twiml = new twilio.twiml.VoiceResponse();
    
    // ========== اختيار الطريقة حسب رقم المتصل ==========
    
    // الطريقة 1: الرقم الأمريكي (الافتراضي) - الطريقة العادية
    if (callerIdChoice === 'default' || !toNumber) {
        console.log('📱 استخدام الرقم الأمريكي (طريقة عادية)');
        if (toNumber) {
            const dial = twiml.dial({
                callerId: TWILIO_PHONE_NUMBER,
                record: 'record-from-answer',
                recordingStatusCallback: `/recording-status?employeeId=${employeeId}&to=${encodeURIComponent(toNumber)}`,
                recordingStatusCallbackEvent: ['completed'],
                statusCallback: `/call-status-webhook?employeeId=${employeeId}`,
                statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
                timeout: 30,
                answerOnBridge: true
            });
            dial.number(toNumber);
        } else {
            twiml.say({ voice: 'Polly.Zeina', language: 'ar-AE' }, 'لم يتم تحديد رقم للاتصال');
        }
        res.type('text/xml');
        return res.send(twiml.toString());
    }
    
    // الطريقة 2: الأرقام المحققة (السعودية/المصرية) - استخدام Conference + REST API
    console.log('📱 استخدام رقم محقق (Verified) - طريقة Conference');
    
    const selectedCallerNumber = getCallerIdNumber(callerIdChoice);
    const conferenceName = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('📱✅ الرقم المحقق:', selectedCallerNumber);
    console.log('🎯 Conference:', conferenceName);
    
    // إضافة المتصفح للـ Conference
    const dial = twiml.dial({ timeout: 60 });
    dial.conference({
        startConferenceOnEnter: true,
        endConferenceOnExit: true,
        beep: false,
        waitUrl: 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical'
    }, conferenceName);
    
    // إرسال TwiML للمتصفح
    res.type('text/xml');
    res.send(twiml.toString());
    
    // الآن الاتصال بالعميل من الرقم المحقق عبر REST API
    const baseUrl = 'https://link-call-jade.vercel.app';
    
    setTimeout(async () => {
        try {
            console.log('📞 جاري الاتصال بالعميل من الرقم المحقق...');
            const call = await twilioClient.calls.create({
                url: `${baseUrl}/join-conference-twiml?conference=${encodeURIComponent(conferenceName)}`,
                to: toNumber,
                from: selectedCallerNumber,
                statusCallback: `${baseUrl}/call-status-webhook?employeeId=${employeeId}`,
                statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
                record: true,
                recordingStatusCallback: `${baseUrl}/recording-status?employeeId=${employeeId}&to=${encodeURIComponent(toNumber)}`,
                recordingStatusCallbackEvent: ['completed']
            });
            console.log('✅ تم الاتصال بالعميل:', call.sid);
            await saveCallEmployeeMapping(call.sid, employeeId, toNumber);
        } catch (error) {
            console.error('❌ خطأ في الاتصال بالعميل:', error.message);
        }
    }, 1500);
});

// TwiML لإضافة العميل للـ Conference
app.all('/join-conference-twiml', (req, res) => {
    const conferenceName = req.query.conference;
    console.log('📞 إضافة العميل للـ Conference:', conferenceName);
    
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say({ voice: 'Polly.Zeina', language: 'ar-AE' }, 'جاري توصيلك');
    
    const dial = twiml.dial();
    dial.conference({
        startConferenceOnEnter: true,
        endConferenceOnExit: false,
        beep: false
    }, conferenceName);
    
    res.type('text/xml');
    res.send(twiml.toString());
});

// الحصول على حالة المكالمة
app.get('/call-status/:callSid', async (req, res) => {
    try {
        const call = await twilioClient.calls(req.params.callSid).fetch();
        console.log(`📊 حالة المكالمة ${req.params.callSid}: ${call.status}`);
        res.json({
            status: call.status,
            duration: call.duration,
            direction: call.direction,
            startTime: call.startTime,
            endTime: call.endTime
        });
    } catch (error) {
        console.error('خطأ في جلب حالة المكالمة:', error);
        res.status(500).json({ error: error.message });
    }
});

// إنهاء مكالمة
app.post('/end-call', async (req, res) => {
    try {
        const { callSid } = req.body;
        await twilioClient.calls(callSid).update({ status: 'completed' });
        
        res.json({ success: true });
    } catch (error) {
        console.error('خطأ في إنهاء المكالمة:', error);
        res.status(500).json({ error: error.message });
    }
});

// TwiML للانضمام إلى Conference
app.post('/join-conference', (req, res) => {
    const conferenceName = req.query.conference;
    const participant = req.query.participant;
    const toNumber = req.query.to;
    const twiml = new twilio.twiml.VoiceResponse();
    
    console.log('🎯 انضمام إلى Conference:', conferenceName, '- دور:', participant);
    
    if (participant === 'user') {
        // المستخدم (موبايلك) - رسالة توضيحية
        if (toNumber) {
            twiml.say({ 
                voice: 'Polly.Zeina', 
                language: 'ar-AE' 
            }, `جاري الاتصال بالرقم ${toNumber.replace(/\+966/, '').replace(/\+20/, '')}`);
        } else {
            twiml.say({ voice: 'Polly.Zeina', language: 'ar-AE' }, 'جاري توصيل المكالمة');
        }
    }
    
    // إضافة المشارك إلى Conference
    const dial = twiml.dial();
    dial.conference({
        startConferenceOnEnter: true,  // بدء Conference فوراً
        endConferenceOnExit: participant === 'user', // إنهاء لما تقفل انت
        waitUrl: 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical',
        beep: false,
        record: 'record-from-start',
        recordingStatusCallback: `${process.env.NGROK_URL || 'https://unacetic-nearly-tawanna.ngrok-free.dev'}/recording-status`
    }, conferenceName);
    
    res.type('text/xml');
    res.send(twiml.toString());
});

// ==================== استقبال المكالمات في المتصفح ====================

// استقبال مكالمة واردة وتحويلها للمتصفح مباشرة
app.post('/incoming-to-browser', async (req, res) => {
    const fromNumber = req.body.From || 'Unknown';
    const toNumber = req.body.To || '';
    const callSid = req.body.CallSid;
    
    console.log('📞 ================ مكالمة واردة للمتصفح ================');
    console.log('📞 من:', fromNumber);
    console.log('📱 إلى:', toNumber);
    console.log('🆔 Call SID:', callSid);
    
    const twiml = new twilio.twiml.VoiceResponse();
    
    // البحث عن المطور المتصل (المتاح في المتصفح)
    // استخدام identity المطور الرئيسي
    const defaultIdentity = 'client_admin'; // المطور الرئيسي
    
    console.log('📱 توجيه المكالمة للـ Client:', defaultIdentity);
    
    // رسالة للمتصل أثناء الانتظار
    twiml.say({
        voice: 'Polly.Zeina',
        language: 'ar-AE'
    }, 'جاري توصيلك، الرجاء الانتظار');
    
    // تحويل المكالمة للمتصفح
    const dial = twiml.dial({
        callerId: fromNumber,
        timeout: 30,
        record: 'record-from-answer',
        recordingStatusCallback: '/recording-status?employeeId=admin',
        recordingStatusCallbackEvent: ['completed'],
        action: '/incoming-call-status',
        method: 'POST'
    });
    
    // الاتصال بالـ Client في المتصفح
    // سيتم توجيه المكالمة لكل الـ clients المسجلين بهذا الـ identity
    dial.client({
        statusCallback: '/client-call-status',
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
    }, defaultIdentity);
    
    // إذا لم يرد أحد
    twiml.say({
        voice: 'Polly.Zeina',
        language: 'ar-AE'
    }, 'عذراً، لا يوجد أحد متاح حالياً. يرجى المحاولة لاحقاً.');
    
    res.type('text/xml');
    res.send(twiml.toString());
});

// معالجة حالة المكالمة الواردة
app.post('/incoming-call-status', (req, res) => {
    console.log('📞 حالة المكالمة الواردة:', {
        callSid: req.body.CallSid,
        dialCallStatus: req.body.DialCallStatus,
        dialCallDuration: req.body.DialCallDuration
    });
    
    const twiml = new twilio.twiml.VoiceResponse();
    
    // إذا لم يتم الرد
    if (req.body.DialCallStatus !== 'completed') {
        twiml.say({
            voice: 'Polly.Zeina',
            language: 'ar-AE'
        }, 'عذراً، لم يتم الرد. شكراً لاتصالك.');
    }
    
    res.type('text/xml');
    res.send(twiml.toString());
});

// حالة الـ Client call
app.post('/client-call-status', (req, res) => {
    console.log('📱 حالة Client Call:', {
        callSid: req.body.CallSid,
        callStatus: req.body.CallStatus
    });
    res.sendStatus(200);
});

// ==================== نهاية استقبال المكالمات ====================

// TwiML للمكالمات الواردة - نظام IVR
app.post('/voice', (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();
    
    console.log('📞 مكالمة واردة من:', req.body.From);
    
    // الرسالة الترحيبية مع القائمة
    const gather = twiml.gather({
        numDigits: 1,
        action: '/ivr-response',
        method: 'POST',
        timeout: 10
    });
    
    gather.say({
        voice: 'Polly.Zeina',
        language: 'ar-AE'
    }, 'مرحباً بك في شركة المسار الساخن للسفر والسياحة. ' +
       'لحجز وحدات الضيافة والفنادق اضغط واحد. ' +
       'لتأجير السيارات اضغط اثنين. ' +
       'للبرامج والجولات السياحية اضغط ثلاثة. ' +
       'للتحدث مع خدمة العملاء اضغط صفر. ' +
       'لتقديم شكوى اضغط تسعة.');
    
    // إذا لم يختر العميل شيء
    twiml.say({
        voice: 'Polly.Zeina',
        language: 'ar-AE'
    }, 'لم نتلق أي اختيار. شكراً لاتصالك بنا.');
    
    res.type('text/xml');
    res.send(twiml.toString());
});

// معالجة اختيار العميل من IVR
app.post('/ivr-response', async (req, res) => {
    const digit = req.body.Digits;
    const twiml = new twilio.twiml.VoiceResponse();
    
    console.log('🔢 العميل اختار:', digit);
    
    // الحصول على بيانات المديرين
    const data = await getEmployeesData();
    const department = data.departments[digit];
    
    if (department && department.employees.length > 0) {
        // اختيار مدير عشوائي (أو أول مدير متاح)
        const employeePhone = department.employees[0];
        
        twiml.say({
            voice: 'Polly.Zeina',
            language: 'ar-AE'
        }, `جاري تحويلك إلى قسم ${department.name}. الرجاء الانتظار.`);
        
        // تحويل المكالمة للمدير
        const dial = twiml.dial({
            timeout: 30,
            callerId: TWILIO_PHONE_NUMBER
        });
        dial.number(employeePhone);
        
        // إذا لم يرد المدير
        twiml.say({
            voice: 'Polly.Zeina',
            language: 'ar-AE'
        }, 'عذراً، جميع مديرينا مشغولون حالياً. يرجى المحاولة لاحقاً. شكراً لاتصالك بنا.');
    } else {
        // لا يوجد مديرين متاحين في هذا القسم
        twiml.say({
            voice: 'Polly.Zeina',
            language: 'ar-AE'
        }, 'عذراً، هذا القسم غير متاح حالياً. يرجى المحاولة لاحقاً. شكراً لاتصالك بنا.');
    }
    
    res.type('text/xml');
    res.send(twiml.toString());
});

// webhook لمتابعة أحداث المكالمة
app.post('/call-events', (req, res) => {
    console.log('🔔 حدث مكالمة:', {
        CallSid: req.body.CallSid,
        CallStatus: req.body.CallStatus,
        Duration: req.body.CallDuration
    });
    res.sendStatus(200);
});

// معالجة حالة التسجيل
// webhook لحالة المكالمة
app.post('/call-status-webhook', async (req, res) => {
    const callSid = req.body.CallSid;
    const employeeId = req.query.employeeId || req.body.employeeId;
    const callStatus = req.body.CallStatus;
    const toNumber = req.body.To || req.body.Called;
    
    console.log(`📞 حالة المكالمة ${callSid}: ${callStatus}, مدير: ${employeeId}, إلى: ${toNumber}`);
    
    // حفظ علاقة المكالمة بالمدير ورقم الهاتف في جميع الحالات
    if (callSid && employeeId) {
        await saveCallEmployeeMapping(callSid, employeeId, toNumber);
        console.log(`✅ تم ربط المكالمة ${callSid} بالمدير ${employeeId}`);
    }
    
    res.sendStatus(200);
});

app.post('/recording-status', async (req, res) => {
    const recordingSid = req.body.RecordingSid;
    const callSid = req.body.CallSid;
    const employeeId = req.query.employeeId || req.body.employeeId;
    const toNumber = req.query.to || req.body.To || req.body.Called;
    
    console.log('✅ تم إكمال التسجيل:', recordingSid);
    console.log('📞 مكالمة:', callSid);
    console.log('👤 مدير:', employeeId);
    console.log('📱 إلى:', toNumber);
    console.log('⏱️ مدة:', req.body.RecordingDuration);
    
    // حفظ علاقة التسجيل بالمدير ورقم الهاتف (backup)
    if (callSid && employeeId) {
        await saveCallEmployeeMapping(callSid, employeeId, toNumber);
        console.log(`✅ تم تأكيد ربط التسجيل ${callSid} بالمدير ${employeeId}`);
    }
    
    res.sendStatus(200);
});

// بدء تسجيل مكالمة نشطة
app.post('/start-recording', async (req, res) => {
    try {
        const { callSid } = req.body;
        
        const recording = await twilioClient.calls(callSid)
            .recordings
            .create({
                recordingChannels: 'dual',
                recordingStatusCallback: '/recording-status',
                recordingStatusCallbackEvent: ['completed']
            });
        
        res.json({
            success: true,
            recordingSid: recording.sid
        });
    } catch (error) {
        console.error('خطأ في بدء التسجيل:', error);
        res.status(500).json({ error: 'فشل في بدء التسجيل' });
    }
});

// جلب قائمة التسجيلات
app.get('/recordings', async (req, res) => {
    try {
        const { employeeId, viewAll } = req.query;
        console.log('📼 جلب التسجيلات - employeeId:', employeeId, 'viewAll:', viewAll);
        
        const recordings = await twilioClient.recordings.list({ limit: 50 });
        
        // جلب معلومات المكالمات لكل تسجيل
        const recordingsData = await Promise.all(recordings.map(async (recording) => {
            try {
                // البحث عن معرف المدير ورقم الهاتف من KV أولاً
                const callData = await getCallEmployeeId(recording.callSid);
                let recordingEmployeeId = callData?.employeeId || null;
                let savedToNumber = callData?.to || null;
                
                // جلب معلومات المكالمة
                const call = await twilioClient.calls(recording.callSid).fetch();
                
                // إذا لم نجد في KV، نحاول استخراجه من StatusCallback URL
                if (!recordingEmployeeId && recording.uri) {
                    const match = recording.uri.match(/employeeId=([^&]+)/);
                    if (match) {
                        recordingEmployeeId = match[1];
                    }
                }
                
                // استخدام الرقم المحفوظ أو من المكالمة
                const toNumber = savedToNumber || call.to;
                
                return {
                    sid: recording.sid,
                    callSid: recording.callSid,
                    duration: recording.duration,
                    dateCreated: recording.dateCreated,
                    uri: recording.uri,
                    // معلومات المكالمة
                    from: call.from,
                    to: toNumber || 'غير محدد',
                    direction: call.direction,
                    employeeId: recordingEmployeeId || 'unknown'  // إضافة معرف المدير
                };
            } catch (error) {
                // إذا فشل جلب معلومات المكالمة، نحاول من KV
                console.error('خطأ في جلب معلومات تسجيل:', error);
                const callData = await getCallEmployeeId(recording.callSid);
                return {
                    sid: recording.sid,
                    callSid: recording.callSid,
                    duration: recording.duration,
                    dateCreated: recording.dateCreated,
                    uri: recording.uri,
                    from: 'غير معروف',
                    to: callData?.to || 'غير محدد',
                    direction: 'outbound-api',
                    employeeId: callData?.employeeId || 'unknown'  // لا يوجد معرف مدير
                };
            }
        }));
        
        // فلترة التسجيلات حسب الصلاحيات
        let filteredRecordings = recordingsData;
        
        console.log('📋 فلترة التسجيلات:', {
            employeeId,
            viewAll,
            totalRecordings: recordingsData.length,
            shouldFilter: employeeId && viewAll !== 'true'
        });
        
        if (employeeId && viewAll !== 'true') {
            // إذا كان مدير وليس لديه صلاحية رؤية الكل، نعرض تسجيلاته فقط
            filteredRecordings = recordingsData.filter(rec => {
                // تجاهل التسجيلات بدون employeeId (قديمة)
                if (!rec.employeeId || rec.employeeId === 'unknown') {
                    return false;
                }
                
                const match = rec.employeeId === employeeId || 
                             rec.employeeId === String(employeeId) ||
                             rec.employeeId === parseInt(employeeId);
                console.log(`🔍 مقارنة: rec.employeeId="${rec.employeeId}" مع employeeId="${employeeId}" = ${match}`);
                return match;
            });
            console.log(`✅ تم فلترة: ${filteredRecordings.length} من إجمالي ${recordingsData.length} (تم تجاهل التسجيلات القديمة)`);
        } else {
            console.log('🌐 عرض جميع التسجيلات (admin أو viewAll)');
        }
        
        res.json({ recordings: filteredRecordings });
    } catch (error) {
        console.error('خطأ في جلب التسجيلات:', error);
        res.json({ recordings: [] }); // إرجاع قائمة فارغة بدلاً من خطأ
    }
});

// جلب رابط تسجيل محدد
app.get('/recording/:sid', async (req, res) => {
    try {
        const { sid } = req.params;
        const recording = await twilioClient.recordings(sid).fetch();
        
        // رابط التسجيل الكامل
        const recordingUrl = `https://api.twilio.com${recording.uri.replace('.json', '.mp3')}`;
        
        res.json({
            url: recordingUrl,
            duration: recording.duration,
            dateCreated: recording.dateCreated
        });
    } catch (error) {
        console.error('خطأ في جلب التسجيل:', error);
        res.status(500).json({ error: 'فشل في جلب التسجيل' });
    }
});

// حذف تسجيل
app.delete('/recording/:sid', async (req, res) => {
    try {
        const { sid } = req.params;
        await twilioClient.recordings(sid).remove();
        
        res.json({ success: true, message: 'تم حذف التسجيل بنجاح' });
    } catch (error) {
        console.error('خطأ في حذف التسجيل:', error);
        res.status(500).json({ error: 'فشل في حذف التسجيل' });
    }
});

// حذف تسجيل (endpoint بديل)
app.delete('/delete-recording/:sid', async (req, res) => {
    try {
        const { sid } = req.params;
        console.log('🗑️ جاري حذف التسجيل:', sid);
        await twilioClient.recordings(sid).remove();
        
        res.json({ success: true, message: 'تم حذف التسجيل بنجاح' });
    } catch (error) {
        console.error('خطأ في حذف التسجيل:', error);
        res.status(500).json({ error: 'فشل في حذف التسجيل', details: error.message });
    }
});

// إيقاف التسجيل أثناء المكالمة
app.post('/stop-recording', async (req, res) => {
    try {
        const { callSid } = req.body;
        console.log('⏹️ إيقاف التسجيل للمكالمة:', callSid);
        
        // الحصول على كل التسجيلات النشطة لهذه المكالمة
        const recordings = await twilioClient.recordings.list({
            callSid: callSid,
            status: 'in-progress'
        });
        
        if (recordings.length > 0) {
            // إيقاف آخر تسجيل نشط
            const recording = recordings[0];
            await twilioClient.recordings(recording.sid).update({ status: 'stopped' });
            console.log('✅ تم إيقاف التسجيل:', recording.sid);
            res.json({ success: true, recordingSid: recording.sid });
        } else {
            res.json({ success: false, message: 'لا يوجد تسجيل نشط' });
        }
    } catch (error) {
        console.error('خطأ في إيقاف التسجيل:', error);
        res.status(500).json({ error: 'فشل في إيقاف التسجيل', details: error.message });
    }
});

// تشغيل التسجيل مباشرة (proxy بدون authentication)
app.get('/play-recording/:sid', async (req, res) => {
    try {
        const { sid } = req.params;
        const recording = await twilioClient.recordings(sid).fetch();
        
        // إعادة توجيه للتسجيل مع credentials
        const recordingPath = recording.uri.replace('.json', '.mp3');
        const authHeader = 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
        
        const options = {
            hostname: 'api.twilio.com',
            path: recordingPath,
            headers: {
                'Authorization': authHeader
            }
        };
        
        https.get(options, (twilioRes) => {
            res.setHeader('Content-Type', 'audio/mpeg');
            twilioRes.pipe(res);
        }).on('error', (err) => {
            console.error('خطأ في جلب التسجيل:', err);
            res.status(500).json({ error: 'فشل في جلب التسجيل' });
        });
    } catch (error) {
        console.error('خطأ في تشغيل التسجيل:', error);
        res.status(500).json({ error: 'فشل في تشغيل التسجيل' });
    }
});

// تحميل التسجيل مباشرة (بدون تسجيل دخول)
app.get('/download-recording/:sid', async (req, res) => {
    try {
        const { sid } = req.params;
        console.log('⬇️ طلب تحميل تسجيل:', sid);
        
        const recording = await twilioClient.recordings(sid).fetch();
        
        // إعادة توجيه للتسجيل مع credentials
        const recordingPath = recording.uri.replace('.json', '.mp3');
        const authHeader = 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
        
        const options = {
            hostname: 'api.twilio.com',
            path: recordingPath,
            headers: {
                'Authorization': authHeader
            }
        };
        
        https.get(options, (twilioRes) => {
            // تعيين headers للتحميل
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Disposition', `attachment; filename="recording_${sid}.mp3"`);
            twilioRes.pipe(res);
            console.log('✅ جاري تحميل التسجيل');
        }).on('error', (err) => {
            console.error('❌ خطأ في تحميل التسجيل:', err);
            res.status(500).json({ error: 'فشل في تحميل التسجيل' });
        });
    } catch (error) {
        console.error('❌ خطأ في تحميل التسجيل:', error);
        res.status(500).json({ error: 'فشل في تحميل التسجيل' });
    }
});

// جلب سجل المكالمات
app.get('/call-history', async (req, res) => {
    try {
        const calls = await twilioClient.calls.list({ limit: 50 });
        
        const callsData = calls.map(call => ({
            sid: call.sid,
            from: call.from,
            to: call.to,
            status: call.status,
            duration: call.duration,
            startTime: call.startTime,
            endTime: call.endTime,
            direction: call.direction
        }));
        
        res.json({ calls: callsData });
    } catch (error) {
        console.error('خطأ في جلب سجل المكالمات:', error);
        res.json({ calls: [] }); // إرجاع قائمة فارغة بدلاً من خطأ
    }
});

// ========== إدارة المديرين ==========

// جلب قائمة المديرين
app.get('/employees', async (req, res) => {
    try {
        const data = await getEmployeesData();
        
        // إرسال المديرين مع أسماء الأقسام
        const employeesWithDepts = data.employees.map(emp => ({
            ...emp,
            departmentName: data.departments && data.departments[emp.department] ? data.departments[emp.department].name : ''
        }));
        
        res.json({
            employees: employeesWithDepts,
            departments: data.departments || {}
        });
    } catch (error) {
        console.error('❌ خطأ في جلب المديرين:', error);
        res.status(500).json({ error: error.message });
    }
});

// إضافة مدير جديد
app.post('/employees', async (req, res) => {
    try {
        const { username, password, fullname, name, phone, department, permissions } = req.body;
        const employeeName = fullname || name; // قبول كلا الاسمين
        
        console.log('📝 إضافة مدير جديد:', { username, employeeName, department });
        
        const data = await getEmployeesData();
        
        // التحقق من عدم وجود مدير بنفس اسم المستخدم
        const exists = data.employees.find(emp => emp.username === username);
        if (exists) {
            return res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
        }
        
        // إنشاء ID جديد بشكل صحيح (أعلى ID موجود + 1)
        const maxId = data.employees.reduce((max, emp) => Math.max(max, emp.id || 0), 0);
        
        const newEmployee = {
            id: maxId + 1,
            username,
            password,
            fullname: employeeName,
            name: employeeName,
            phone: phone || '',
            department,
            departmentArabic: data.departments[department]?.name || 'غير محدد',
            role: 'employee',
            permissions: permissions || {
                viewOwnRecordings: false,
                viewAllRecordings: false,
                deleteRecordings: false,
                editProfile: false
            },
            createdAt: new Date().toISOString()
        };
        
        data.employees.push(newEmployee);
        
        // إضافة المدير لقسمه (التحقق من وجود الـ array)
        if (data.departments && data.departments[department]) {
            if (!data.departments[department].employees) {
                data.departments[department].employees = [];
            }
            if (phone && !data.departments[department].employees.includes(phone)) {
                data.departments[department].employees.push(phone);
            }
        }
        
        // حفظ البيانات
        const saved = await saveEmployeesData(data);
        
        if (!saved) {
            console.error('❌ فشل في حفظ البيانات للمدير:', username);
            return res.status(500).json({ error: 'فشل في حفظ البيانات' });
        }
        
        console.log('✅ تمت إضافة المدير بنجاح:', newEmployee.username, 'ID:', newEmployee.id);
        res.json({ success: true, employee: newEmployee });
    } catch (error) {
        console.error('خطأ في إضافة مدير:', error);
        res.status(500).json({ error: error.message });
    }
});

// تسجيل دخول المدير
// تهيئة Redis بالبيانات الافتراضية (للمطور فقط)
app.get('/init-kv', async (req, res) => {
    if (!redis || !process.env.VERCEL) {
        return res.json({ error: 'Redis غير متاح (تشغيل محلي)', data: employeesData });
    }
    
    try {
        console.log('🔄 تهيئة Upstash Redis بالبيانات الافتراضية...');
        console.log('📊 عدد المديرين المراد حفظهم:', employeesData.employees.length);
        
        // حفظ مباشر في Redis
        await redis.set('employees_data', employeesData);
        console.log('✅ تم الحفظ في Redis');
        
        // التحقق من الحفظ
        const saved = await redis.get('employees_data');
        console.log('✅ تم التحقق: عدد المديرين المحفوظين:', saved?.employees?.length || 0);
        
        return res.json({
            success: true,
            message: 'تم تهيئة Redis بنجاح',
            employeesCount: saved?.employees?.length || 0,
            employees: saved?.employees || []
        });
    } catch (error) {
        console.error('❌ خطأ في تهيئة Redis:', error);
        res.status(500).json({ 
            error: error.message,
            stack: error.stack,
            defaultData: employeesData
        });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('🔐 محاولة تسجيل دخول:', username);
        
        const data = await getEmployeesData();
        console.log('📊 عدد المديرين في القاعدة:', data.employees.length);
        
        // البحث عن المدير
        const employee = data.employees.find(emp => 
            emp.username === username && emp.password === password
        );
        
        if (!employee) {
            console.log('❌ فشل تسجيل الدخول: بيانات خاطئة');
            return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }
        
        console.log('✅ تم تسجيل الدخول:', employee.name);
        
        res.json({
            success: true,
            employee: {
                id: employee.id,
                name: employee.name,
                username: employee.username,
                department: employee.department,
                departmentName: data.departments[employee.department]?.name || '',
                role: employee.role || 'employee',
                isTrial: employee.isTrial || false,
                maxCalls: employee.maxCalls || null,
                permissions: employee.permissions || {
                    viewOwnRecordings: false,
                    viewAllRecordings: false,
                    deleteRecordings: false,
                    editProfile: false
                },
                phone: employee.phone
            }
        });
    } catch (error) {
        console.error('❌ خطأ في تسجيل الدخول:', error);
        res.status(500).json({ error: error.message });
    }
});

// تحديث الملف الشخصي للمدير
app.post('/update-profile', async (req, res) => {
    try {
        const { employeeId, username, currentPassword, newName, newPhone, newPassword } = req.body;
        
        console.log('📝 تحديث ملف شخصي:', employeeId);
        
        const data = await getEmployeesData();
        
        // البحث عن المدير
        const employee = data.employees.find(emp => emp.id === employeeId);
        
        if (!employee) {
            return res.status(404).json({ error: 'المدير غير موجود' });
        }
        
        // التحقق من كلمة المرور الحالية
        if (employee.password !== currentPassword) {
            return res.status(401).json({ error: 'كلمة المرور الحالية غير صحيحة' });
        }
        
        // تحديث البيانات
        employee.name = newName;
        if (newPhone) employee.phone = newPhone;
        if (newPassword) employee.password = newPassword;
        
        await saveEmployeesData(data);
        
        console.log('✅ تم تحديث الملف الشخصي:', employee.name);
        
        res.json({
            success: true,
            message: 'تم تحديث الملف الشخصي بنجاح',
            employee: {
                id: employee.id,
                name: employee.name,
                phone: employee.phone
            }
        });
    } catch (error) {
        console.error('❌ خطأ في تحديث الملف:', error);
        res.status(500).json({ error: error.message });
    }
});

// حذف مدير
app.delete('/employees/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const data = await getEmployeesData();
        
        const employeeIndex = data.employees.findIndex(emp => emp.id === id);
        
        if (employeeIndex === -1) {
            return res.status(404).json({ error: 'المدير غير موجود' });
        }
        
        const employee = data.employees[employeeIndex];
        
        // إزالة من القسم
        if (data.departments[employee.department]) {
            const phoneIndex = data.departments[employee.department].employees.indexOf(employee.phone);
            if (phoneIndex > -1) {
                data.departments[employee.department].employees.splice(phoneIndex, 1);
            }
        }
        
        // إزالة من القائمة
        data.employees.splice(employeeIndex, 1);
        
        // حفظ البيانات
        await saveEmployeesData(data);
        
        res.json({ success: true });
    } catch (error) {
        console.error('خطأ في حذف مدير:', error);
        res.status(500).json({ error: error.message });
    }
});

// تحديث بيانات مدير (PUT)
app.put('/employees/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, fullname, phone, password, role, department, permissions } = req.body;
        const employeeName = name || fullname; // قبول كلا المتغيرين
        
        console.log('📝 تحديث مدير ID:', id, req.body);
        
        const data = await getEmployeesData();
        
        const employeeIndex = data.employees.findIndex(emp => emp.id === id);
        
        if (employeeIndex === -1) {
            return res.status(404).json({ error: 'المدير غير موجود' });
        }
        
        const employee = data.employees[employeeIndex];
        const oldDepartment = employee.department;
        const oldPhone = employee.phone;
        
        // تحديث البيانات
        if (employeeName) employee.name = employeeName;
        if (phone) employee.phone = phone;
        if (password) employee.password = password;
        if (role) employee.role = role;
        if (department) employee.department = department;
        if (permissions) employee.permissions = permissions;
        
        // إذا تغير القسم، تحديث الأقسام
        if (department && department !== oldDepartment) {
            // إزالة من القسم القديم
            if (data.departments[oldDepartment]) {
                const idx = data.departments[oldDepartment].employees.indexOf(oldPhone);
                if (idx > -1) {
                    data.departments[oldDepartment].employees.splice(idx, 1);
                }
            }
            // إضافة للقسم الجديد
            if (data.departments[department]) {
                if (!data.departments[department].employees.includes(employee.phone)) {
                    data.departments[department].employees.push(employee.phone);
                }
            }
        }
        
        // إذا تغير الهاتف، تحديث في القسم
        if (phone && phone !== oldPhone && data.departments[employee.department]) {
            const idx = data.departments[employee.department].employees.indexOf(oldPhone);
            if (idx > -1) {
                data.departments[employee.department].employees[idx] = phone;
            }
        }
        
        // حفظ البيانات
        await saveEmployeesData(data);
        
        console.log('✅ تم تحديث المدير:', employee.name);
        
        res.json({
            success: true,
            message: 'تم تحديث بيانات المدير بنجاح',
            employee: employee
        });
    } catch (error) {
        console.error('❌ خطأ في تحديث المدير:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== إدارة جهات الاتصال ==========

// بيانات جهات الاتصال الافتراضية
let contactsData = { contacts: [] };

// محاولة تحميل من الملف (للتشغيل المحلي فقط)
if (!process.env.VERCEL) {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'contacts.json'), 'utf8');
        contactsData = JSON.parse(data);
        console.log('✅ تم تحميل جهات الاتصال من الملف');
    } catch (error) {
        console.log('⚠️ سيتم إنشاء ملف جهات اتصال جديد');
    }
}

// دوال مساعدة لقراءة وحفظ جهات الاتصال
async function getContactsData() {
    if (process.env.VERCEL) {
        // على Vercel نحاول Redis أولاً
        if (redis) {
            try {
                const data = await redis.get('contacts_data');
                if (data) {
                    console.log('✅ تم تحميل جهات الاتصال من Redis');
                    return data;
                }
            } catch (error) {
                console.error('خطأ في قراءة جهات الاتصال من Redis:', error);
            }
        }
        // إرجاع البيانات الفارغة إذا لم توجد
        return { contacts: [] };
    }
    return contactsData;
}

async function saveContactsData(data) {
    if (process.env.VERCEL) {
        // على Vercel استخدم Redis فقط
        if (!redis) {
            throw new Error('Redis غير متاح');
        }
        try {
            await redis.set('contacts_data', data);
            console.log('✅ تم حفظ جهات الاتصال في Redis');
            return true;
        } catch (error) {
            console.error('خطأ في حفظ جهات الاتصال في Redis:', error);
            throw error;
        }
    } else {
        // للتشغيل المحلي احفظ في ملف
        try {
            fs.writeFileSync(
                path.join(__dirname, 'contacts.json'),
                JSON.stringify(data, null, 2)
            );
            contactsData = data;
            console.log('✅ تم حفظ جهات الاتصال في الملف');
            return true;
        } catch (error) {
            console.error('خطأ في حفظ ملف جهات الاتصال:', error);
            throw error;
        }
    }
}

// جلب جميع جهات الاتصال
app.get('/api/contacts', async (req, res) => {
    try {
        const data = await getContactsData();
        res.json(data);
    } catch (error) {
        console.error('خطأ في جلب جهات الاتصال:', error);
        res.status(500).json({ error: error.message });
    }
});

// إضافة جهة اتصال جديدة
app.post('/api/contacts', async (req, res) => {
    try {
        const { name, phone } = req.body;
        
        if (!name || !phone) {
            return res.status(400).json({ error: 'الاسم ورقم الهاتف مطلوبان' });
        }
        
        const data = await getContactsData();
        
        // التحقق من عدم تكرار الرقم
        const exists = data.contacts.find(c => c.phone === phone);
        if (exists) {
            return res.status(400).json({ error: 'رقم الهاتف موجود بالفعل' });
        }
        
        const newContact = {
            id: Date.now(),
            name,
            phone,
            createdAt: new Date().toISOString(),
            createdBy: req.body.createdBy || 'unknown'
        };
        
        data.contacts.push(newContact);
        await saveContactsData(data);
        
        console.log('✅ تمت إضافة جهة اتصال:', name, phone);
        res.json({ success: true, contact: newContact });
    } catch (error) {
        console.error('خطأ في إضافة جهة اتصال:', error);
        res.status(500).json({ error: error.message });
    }
});

// حذف جهة اتصال
app.delete('/api/contacts', async (req, res) => {
    try {
        const id = parseInt(req.query.id);
        
        if (!id) {
            return res.status(400).json({ error: 'معرف جهة الاتصال مطلوب' });
        }
        
        const data = await getContactsData();
        const contactIndex = data.contacts.findIndex(c => c.id === id);
        
        if (contactIndex === -1) {
            return res.status(404).json({ error: 'جهة الاتصال غير موجودة' });
        }
        
        const contact = data.contacts[contactIndex];
        data.contacts.splice(contactIndex, 1);
        await saveContactsData(data);
        
        console.log('✅ تم حذف جهة اتصال:', contact.name);
        res.json({ success: true });
    } catch (error) {
        console.error('خطأ في حذف جهة اتصال:', error);
        res.status(500).json({ error: error.message });
    }
});

// endpoint لعرض حالة البيانات (للتشخيص)
app.get('/debug/data-status', async (req, res) => {
    try {
        const data = await getEmployeesData();
        res.json({
            totalEmployees: data.employees.length,
            employees: data.employees.map(emp => ({
                id: emp.id,
                name: emp.name,
                username: emp.username,
                department: emp.department
            })),
            departments: data.departments,
            isVercel: !!process.env.VERCEL,
            hasKV: !!kv
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== API رصيد Twilio ==========

// جلب رصيد الحساب
app.get('/account/balance', async (req, res) => {
    try {
        if (!twilioClient) {
            return res.status(500).json({ error: 'خدمة Twilio غير متاحة' });
        }
        
        // جلب معلومات الحساب من Twilio
        const account = await twilioClient.api.accounts(TWILIO_ACCOUNT_SID).fetch();
        
        // جلب الرصيد من Balance API
        const balanceUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Balance.json`;
        const authHeader = 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
        
        const balanceResponse = await fetch(balanceUrl, {
            headers: { 'Authorization': authHeader }
        });
        
        let balance = 0;
        let currency = 'USD';
        
        if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            balance = parseFloat(balanceData.balance) || 0;
            currency = balanceData.currency || 'USD';
        }
        
        res.json({
            success: true,
            balance: balance,
            currency: currency,
            accountName: account.friendlyName,
            accountStatus: account.status,
            // رابط لإعادة الشحن
            rechargeUrl: 'https://console.twilio.com/us1/billing/manage-billing/billing-overview'
        });
        
    } catch (error) {
        console.error('خطأ في جلب الرصيد:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== Admin Dashboard APIs ==========

// إحصائيات لوحة التحكم
app.get('/admin/dashboard-stats', async (req, res) => {
    try {
        // جلب المكالمات من Twilio
        const recordings = await getRecordingsFromTwilio();
        const employees = await getEmployeesData();
        
        const completed = recordings.filter(r => r.status === 'completed').length;
        const missed = recordings.filter(r => r.status === 'no-answer' || r.status === 'missed' || r.status === 'failed').length;
        const totalDuration = recordings.reduce((sum, r) => sum + (parseInt(r.duration) || 0), 0);
        
        res.json({
            totalCalls: recordings.length,
            answeredCalls: completed,
            missedCalls: missed,
            activeEmployees: employees.employees.length,
            totalDuration: totalDuration,
            totalRecordings: recordings.filter(r => r.recordingUrl).length
        });
    } catch (error) {
        console.error('خطأ في إحصائيات لوحة التحكم:', error);
        res.json({
            totalCalls: 0,
            answeredCalls: 0,
            missedCalls: 0,
            activeEmployees: 0,
            totalDuration: 0,
            totalRecordings: 0
        });
    }
});

// جميع المكالمات
app.get('/admin/all-calls', async (req, res) => {
    try {
        const calls = await getRecordingsFromTwilio();
        res.json(calls);
    } catch (error) {
        console.error('خطأ في جلب المكالمات:', error);
        res.status(500).json({ error: error.message });
    }
});

// جلب المكالمات من Twilio
async function getRecordingsFromTwilio() {
    if (!twilioClient) return [];
    
    try {
        const calls = await twilioClient.calls.list({ limit: 500 });
        const recordings = await twilioClient.recordings.list({ limit: 500 });
        
        // دمج بيانات التسجيلات مع المكالمات
        const recordingsMap = new Map();
        for (const rec of recordings) {
            const callSid = rec.callSid;
            if (!recordingsMap.has(callSid)) {
                recordingsMap.set(callSid, []);
            }
            recordingsMap.get(callSid).push(rec);
        }
        
        return calls.map(call => {
            const callRecordings = recordingsMap.get(call.sid) || [];
            const latestRecording = callRecordings[0];
            
            return {
                sid: call.sid,
                to: call.to,
                from: call.from,
                status: call.status,
                duration: call.duration,
                dateCreated: call.dateCreated,
                direction: call.direction,
                recordingSid: latestRecording?.sid,
                recordingUrl: latestRecording ? `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Recordings/${latestRecording.sid}.mp3` : null,
                employeeId: call.fromFormatted,
                employeeName: null
            };
        });
    } catch (error) {
        console.error('خطأ في جلب المكالمات من Twilio:', error);
        return [];
    }
}

// حذف مكالمة
app.delete('/admin/delete-call', async (req, res) => {
    try {
        const { callSid } = req.body;
        
        if (!callSid || !twilioClient) {
            return res.status(400).json({ error: 'معرف المكالمة مطلوب' });
        }
        
        // حذف التسجيلات المرتبطة بالمكالمة
        const recordings = await twilioClient.recordings.list({ callSid });
        for (const rec of recordings) {
            await twilioClient.recordings(rec.sid).remove();
        }
        
        console.log('✅ تم حذف المكالمة:', callSid);
        res.json({ success: true });
    } catch (error) {
        console.error('خطأ في حذف المكالمة:', error);
        res.status(500).json({ error: error.message });
    }
});

// OpenAI API Key للتحويل الصوتي
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// تحويل الصوت إلى نص باستخدام OpenAI Whisper
app.post('/admin/transcribe', async (req, res) => {
    try {
        const { recordingSid } = req.body;
        
        if (!recordingSid) {
            return res.status(400).json({ error: 'معرف التسجيل مطلوب' });
        }
        
        // التحقق من وجود Twilio client
        if (!twilioClient) {
            return res.status(500).json({ error: 'خدمة Twilio غير متاحة' });
        }
        
        // التحقق من OpenAI API Key
        if (!OPENAI_API_KEY) {
            return res.json({
                success: true,
                transcript: '⚠️ خدمة تحويل الصوت إلى نص غير مفعّلة. أضف OPENAI_API_KEY في متغيرات البيئة.',
                note: 'احصل على API Key من https://platform.openai.com/api-keys'
            });
        }
        
        console.log('🎙️ بدء تحويل التسجيل:', recordingSid);
        
        // جلب ملف التسجيل من Twilio
        const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Recordings/${recordingSid}.mp3`;
        const authHeader = 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
        
        // تحميل ملف الصوت
        const audioResponse = await fetch(recordingUrl, {
            headers: { 'Authorization': authHeader }
        });
        
        if (!audioResponse.ok) {
            throw new Error('فشل في تحميل ملف التسجيل');
        }
        
        const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
        console.log('📥 تم تحميل الملف، الحجم:', audioBuffer.byteLength, 'bytes');
        
        // إنشاء boundary للـ multipart form
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
        
        // بناء الـ multipart يدوياً
        const parts = [];
        
        // إضافة الملف
        parts.push(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="file"; filename="${recordingSid}.mp3"\r\n` +
            `Content-Type: audio/mpeg\r\n\r\n`
        );
        parts.push(audioBuffer);
        parts.push('\r\n');
        
        // إضافة model
        parts.push(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="model"\r\n\r\n` +
            `whisper-1\r\n`
        );
        
        // إضافة language
        parts.push(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="language"\r\n\r\n` +
            `ar\r\n`
        );
        
        // إنهاء الـ form
        parts.push(`--${boundary}--\r\n`);
        
        // دمج الأجزاء
        const bodyParts = parts.map(part => 
            typeof part === 'string' ? Buffer.from(part) : part
        );
        const body = Buffer.concat(bodyParts);
        
        const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`
            },
            body: body
        });
        
        if (!whisperResponse.ok) {
            const error = await whisperResponse.json().catch(() => ({}));
            console.error('❌ خطأ Whisper:', error);
            throw new Error(error.error?.message || 'فشل في تحويل الصوت');
        }
        
        const result = await whisperResponse.json();
        console.log('✅ تم تحويل التسجيل بنجاح');
        
        return res.json({
            success: true,
            transcript: result.text || 'لم يتم التعرف على نص'
        });
        
    } catch (error) {
        console.error('❌ خطأ في تحويل الصوت إلى نص:', error);
        res.status(500).json({ error: error.message });
    }
});

// خدمة ملفات Admin Dashboard
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin.html'));
});

app.get('/admin-style.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, '..', 'admin-style.css'));
});

app.get('/admin.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, '..', 'admin.js'));
});

// ===== تتبع المستخدمين الأونلاين =====
let onlineUsers = new Map(); // { odUserId: { name, lastSeen, loginTime } }
let lastLoggedInUser = null;

// Heartbeat - إرسال نبضة من المستخدم للتأكيد على أنه أونلاين
app.post('/heartbeat', (req, res) => {
    const { userId, userName } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: 'userId مطلوب' });
    }
    
    const now = new Date();
    const existingUser = onlineUsers.get(userId);
    
    onlineUsers.set(userId, {
        name: userName || 'مستخدم',
        lastSeen: now,
        loginTime: existingUser?.loginTime || now
    });
    
    console.log(`💓 Heartbeat من: ${userName} (${userId})`);
    res.json({ success: true, time: now });
});

// تسجيل الدخول - تتبع آخر مستخدم
app.post('/track-login', (req, res) => {
    const { userId, userName } = req.body;
    
    const now = new Date();
    
    // حفظ آخر مستخدم سجل دخول
    lastLoggedInUser = {
        userId,
        name: userName,
        loginTime: now
    };
    
    // إضافة للمستخدمين الأونلاين
    onlineUsers.set(userId, {
        name: userName,
        lastSeen: now,
        loginTime: now
    });
    
    console.log(`🔐 تسجيل دخول: ${userName} (${userId}) في ${now.toLocaleTimeString('ar-EG')}`);
    res.json({ success: true });
});

// تسجيل الخروج
app.post('/track-logout', (req, res) => {
    const { userId } = req.body;
    
    if (userId) {
        const user = onlineUsers.get(userId);
        console.log(`👋 تسجيل خروج: ${user?.name || userId}`);
        onlineUsers.delete(userId);
    }
    
    res.json({ success: true });
});

// الحصول على المستخدمين الأونلاين
app.get('/online-users', (req, res) => {
    const now = new Date();
    const TIMEOUT = 30000; // 30 ثانية - إذا لم يرسل heartbeat يعتبر أوفلاين
    
    // تنظيف المستخدمين غير النشطين
    for (const [userId, userData] of onlineUsers.entries()) {
        if (now - userData.lastSeen > TIMEOUT) {
            console.log(`⚠️ المستخدم ${userData.name} أصبح أوفلاين (انتهت المهلة)`);
            onlineUsers.delete(userId);
        }
    }
    
    // تحويل Map لـ Array
    const users = Array.from(onlineUsers.entries()).map(([userId, data]) => ({
        userId,
        name: data.name,
        loginTime: data.loginTime,
        lastSeen: data.lastSeen,
        onlineDuration: Math.floor((now - data.loginTime) / 1000 / 60) // بالدقائق
    }));
    
    res.json({
        count: users.length,
        users,
        lastLoggedIn: lastLoggedInUser
    });
});

// ===== نظام الشركات المتعددة (Multi-Tenant) =====
console.log('🏢 تهيئة نظام الشركات المتعددة...');

// بنية بيانات الشركات
let companiesData = {
    companies: [
        {
            id: 'default',
            name: 'Link Call',
            adminUsername: 'akram',
            createdAt: '2025-01-01T00:00:00.000Z',
            subscription: 'unlimited',
            isActive: true,
            settings: {
                maxEmployees: 100,
                maxCallMinutes: -1, // غير محدود
                canRecordCalls: true,
                twilioAccountSid: '', // إذا كان للشركة حساب Twilio خاص
                twilioAuthToken: ''
            }
        }
    ]
};

// دوال مساعدة للشركات
async function getCompaniesData() {
    if (process.env.VERCEL && redis) {
        try {
            const data = await redis.get('companies_data');
            if (data && data.companies) {
                return data;
            }
        } catch (error) {
            console.error('❌ خطأ في قراءة بيانات الشركات:', error);
        }
    }
    return companiesData;
}

async function saveCompaniesData(data) {
    if (redis && process.env.VERCEL) {
        try {
            await redis.set('companies_data', data);
            console.log('✅ تم حفظ بيانات الشركات');
            return true;
        } catch (error) {
            console.error('❌ خطأ في حفظ بيانات الشركات:', error);
            return false;
        }
    }
    companiesData = data;
    return true;
}

// الحصول على قائمة الشركات (للمطور الرئيسي فقط)
app.get('/companies', async (req, res) => {
    try {
        const data = await getCompaniesData();
        res.json({
            success: true,
            count: data.companies.length,
            companies: data.companies.map(c => ({
                id: c.id,
                name: c.name,
                adminUsername: c.adminUsername,
                isActive: c.isActive,
                subscription: c.subscription,
                createdAt: c.createdAt,
                employeesCount: 0 // سيتم حسابه لاحقاً
            }))
        });
    } catch (error) {
        console.error('خطأ في جلب الشركات:', error);
        res.status(500).json({ error: error.message });
    }
});

// إنشاء شركة جديدة
app.post('/companies', async (req, res) => {
    try {
        const { name, adminUsername, adminPassword, adminName, subscription = 'basic' } = req.body;
        
        if (!name || !adminUsername || !adminPassword) {
            return res.status(400).json({ error: 'اسم الشركة واسم المستخدم وكلمة المرور مطلوبين' });
        }
        
        const companiesDataObj = await getCompaniesData();
        const employeesDataObj = await getEmployeesData();
        
        // التحقق من عدم وجود شركة بنفس الاسم
        if (companiesDataObj.companies.find(c => c.name === name)) {
            return res.status(400).json({ error: 'اسم الشركة موجود بالفعل' });
        }
        
        // التحقق من عدم وجود مستخدم بنفس الاسم
        const existingUser = employeesDataObj.employees.find(e => e.username === adminUsername);
        if (existingUser || adminUsername === 'akram') {
            return res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
        }
        
        // إنشاء ID فريد للشركة
        const companyId = 'company_' + Date.now();
        
        // إنشاء الشركة
        const newCompany = {
            id: companyId,
            name,
            adminUsername,
            createdAt: new Date().toISOString(),
            subscription,
            isActive: true,
            settings: {
                maxEmployees: subscription === 'basic' ? 5 : subscription === 'pro' ? 20 : 100,
                maxCallMinutes: subscription === 'basic' ? 500 : subscription === 'pro' ? 2000 : -1,
                canRecordCalls: subscription !== 'basic'
            }
        };
        
        // إنشاء مدير الشركة
        const maxId = employeesDataObj.employees.reduce((max, emp) => Math.max(max, emp.id || 0), 0);
        const newAdmin = {
            id: maxId + 1,
            username: adminUsername,
            password: adminPassword,
            name: adminName || name + ' - مدير',
            fullname: adminName || name + ' - مدير',
            companyId: companyId,
            role: 'company_admin',
            department: '1',
            phone: '',
            permissions: {
                viewOwnRecordings: true,
                viewAllRecordings: true,
                deleteRecordings: true,
                editProfile: true,
                manageEmployees: true,
                viewReports: true,
                callFromUSA: true,
                callFromEgypt: false,
                callFromSaudi: false
            },
            createdAt: new Date().toISOString()
        };
        
        companiesDataObj.companies.push(newCompany);
        employeesDataObj.employees.push(newAdmin);
        
        await saveCompaniesData(companiesDataObj);
        await saveEmployeesData(employeesDataObj);
        
        console.log('✅ تم إنشاء شركة جديدة:', name);
        res.json({
            success: true,
            company: newCompany,
            admin: {
                id: newAdmin.id,
                username: newAdmin.username,
                name: newAdmin.name
            }
        });
    } catch (error) {
        console.error('خطأ في إنشاء شركة:', error);
        res.status(500).json({ error: error.message });
    }
});

// تعديل شركة
app.put('/companies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, isActive, subscription, settings } = req.body;
        
        const data = await getCompaniesData();
        const companyIndex = data.companies.findIndex(c => c.id === id);
        
        if (companyIndex === -1) {
            return res.status(404).json({ error: 'الشركة غير موجودة' });
        }
        
        // تحديث البيانات
        if (name) data.companies[companyIndex].name = name;
        if (isActive !== undefined) data.companies[companyIndex].isActive = isActive;
        if (subscription) data.companies[companyIndex].subscription = subscription;
        if (settings) {
            data.companies[companyIndex].settings = {
                ...data.companies[companyIndex].settings,
                ...settings
            };
        }
        
        await saveCompaniesData(data);
        
        res.json({ success: true, company: data.companies[companyIndex] });
    } catch (error) {
        console.error('خطأ في تعديل شركة:', error);
        res.status(500).json({ error: error.message });
    }
});

// حذف شركة (إيقاف فقط)
app.delete('/companies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (id === 'default') {
            return res.status(400).json({ error: 'لا يمكن حذف الشركة الافتراضية' });
        }
        
        const data = await getCompaniesData();
        const companyIndex = data.companies.findIndex(c => c.id === id);
        
        if (companyIndex === -1) {
            return res.status(404).json({ error: 'الشركة غير موجودة' });
        }
        
        // إيقاف الشركة بدلاً من حذفها
        data.companies[companyIndex].isActive = false;
        await saveCompaniesData(data);
        
        console.log('❌ تم إيقاف شركة:', data.companies[companyIndex].name);
        res.json({ success: true, message: 'تم إيقاف الشركة' });
    } catch (error) {
        console.error('خطأ في حذف شركة:', error);
        res.status(500).json({ error: error.message });
    }
});

// الحصول على موظفي شركة معينة
app.get('/companies/:id/employees', async (req, res) => {
    try {
        const { id } = req.params;
        const data = await getEmployeesData();
        
        // إذا كانت الشركة الافتراضية، نرجع الموظفين بدون companyId أو companyId = default
        const employees = data.employees.filter(e => 
            id === 'default' 
                ? (!e.companyId || e.companyId === 'default')
                : e.companyId === id
        );
        
        res.json({
            success: true,
            count: employees.length,
            employees: employees.map(e => ({
                id: e.id,
                name: e.name,
                username: e.username,
                department: e.department,
                role: e.role,
                createdAt: e.createdAt
            }))
        });
    } catch (error) {
        console.error('خطأ في جلب موظفي الشركة:', error);
        res.status(500).json({ error: error.message });
    }
});

// إحصائيات شركة
app.get('/companies/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;
        const employeesDataObj = await getEmployeesData();
        
        // عد الموظفين
        const employees = employeesDataObj.employees.filter(e => 
            id === 'default' 
                ? (!e.companyId || e.companyId === 'default')
                : e.companyId === id
        );
        
        // يمكن إضافة إحصائيات المكالمات لاحقاً
        res.json({
            success: true,
            stats: {
                employeesCount: employees.length,
                onlineNow: 0, // سيتم حسابه
                totalCalls: 0,
                totalDuration: 0
            }
        });
    } catch (error) {
        console.error('خطأ في جلب إحصائيات الشركة:', error);
        res.status(500).json({ error: error.message });
    }
});

// الحصول على بيانات شركة المستخدم الحالي
app.get('/my-company', async (req, res) => {
    try {
        const { userId } = req.query;
        
        if (!userId) {
            return res.status(400).json({ error: 'userId مطلوب' });
        }
        
        const employeesDataObj = await getEmployeesData();
        const user = employeesDataObj.employees.find(e => e.id.toString() === userId);
        
        if (!user) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }
        
        const companiesDataObj = await getCompaniesData();
        const company = companiesDataObj.companies.find(c => c.id === (user.companyId || 'default'));
        
        if (!company) {
            return res.json({
                success: true,
                company: {
                    id: 'default',
                    name: 'Link Call',
                    isDefault: true
                }
            });
        }
        
        res.json({
            success: true,
            company: {
                id: company.id,
                name: company.name,
                subscription: company.subscription,
                isActive: company.isActive,
                settings: company.settings
            },
            userRole: user.role
        });
    } catch (error) {
        console.error('خطأ في جلب بيانات الشركة:', error);
        res.status(500).json({ error: error.message });
    }
});

console.log('✅ نظام الشركات المتعددة جاهز');

// Export for Vercel serverless
module.exports = app;

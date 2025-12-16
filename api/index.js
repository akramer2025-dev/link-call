const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
const path = require('path');
const https = require('https');
const fs = require('fs');

// Vercel KV للتخزين السحابي
let kv;
try {
    kv = require('@vercel/kv').kv;
} catch (error) {
    console.log('⚠️ Vercel KV غير متاح (تشغيل محلي)');
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
                viewAllRecordings: false,
                deleteRecordings: false,
                editProfile: true
            },
            createdAt: "2025-12-08T00:00:00.000Z"
        },
        {
            id: 2,
            name: "ساهر",
            username: "saher",
            password: "Aa123456",
            department: "2",
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
            id: 3,
            name: "شاكر",
            username: "shaker",
            password: "Aa123456",
            department: "3",
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
            id: 4,
            name: "تسنيم",
            username: "tasneem",
            password: "Aa123456",
            department: "4",
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
    const data = fs.readFileSync(path.join(__dirname, 'employees.json'), 'utf8');
    employeesData = JSON.parse(data);
    console.log('✅ تم تحميل بيانات المديرين من الملف');
} catch (error) {
    console.log('⚠️ سيتم استخدام KV للتخزين');
}

// دوال مساعدة للتعامل مع KV أو الملف
async function getEmployeesData() {
    // على Vercel نحاول KV أولاً، وإذا فشل نرجع البيانات الافتراضية
    if (process.env.VERCEL) {
        if (kv) {
            try {
                const data = await kv.get('employees_data');
                if (data && data.employees && data.employees.length > 0) {
                    return data;
                }
                console.log('⚠️ KV فارغ، استخدام البيانات الافتراضية');
            } catch (error) {
                console.error('❌ خطأ في قراءة KV:', error);
            }
        }
        // إرجاع البيانات المدمجة في الكود
        return employeesData;
    }
    // تشغيل محلي
    return employeesData;
}

async function saveEmployeesData(data) {
    console.log('💾 محاولة حفظ البيانات...', {
        employeesCount: data.employees.length,
        isVercel: !!process.env.VERCEL,
        hasKV: !!kv
    });
    
    if (kv && process.env.VERCEL) {
        try {
            await kv.set('employees_data', data);
            console.log('✅ تم حفظ البيانات في Vercel KV بنجاح');
            
            // التحقق من الحفظ
            const saved = await kv.get('employees_data');
            console.log('✅ تم التحقق: عدد المديرين المحفوظين:', saved?.employees?.length || 0);
            
            return true;
        } catch (error) {
            console.error('❌ خطأ في حفظ KV:', error);
            return false;
        }
    } else {
        // حفظ في ملف للتشغيل المحلي
        try {
            fs.writeFileSync(
                path.join(__dirname, 'employees.json'),
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
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
const TWILIO_API_SECRET = process.env.TWILIO_API_SECRET;

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
    res.sendFile(path.join(__dirname, '..', 'style.css'));
});

app.get('/login-style.css', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'login-style.css'));
});

app.get('/app.js', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'app.js'));
});

app.get('/logo.jpg', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'logo.jpg'));
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
// تخزين علاقة المكالمات بالمديرين في Vercel KV
async function saveCallEmployeeMapping(callSid, employeeId, toNumber = null) {
    try {
        if (kv) {
            const data = { employeeId };
            if (toNumber) {
                data.to = toNumber;
            }
            await kv.set(`call:${callSid}`, JSON.stringify(data), { ex: 604800 }); // حفظ لمدة 7 أيام
            console.log(`✅ حفظ علاقة المكالمة ${callSid} بالمدير ${employeeId}${toNumber ? ' ورقم ' + toNumber : ''}`);
        }
    } catch (error) {
        console.error('خطأ في حفظ علاقة المكالمة:', error);
    }
}

async function getCallEmployeeId(callSid) {
    try {
        if (kv) {
            const data = await kv.get(`call:${callSid}`);
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

app.post('/outgoing-call', (req, res) => {
    const toNumber = req.body.To;
    const employeeId = req.body.employeeId || 'unknown';
    
    console.log('📞 اتصال صادر من المتصفح إلى:', toNumber);
    console.log('👤 معرف المدير:', employeeId);
    
    const twiml = new twilio.twiml.VoiceResponse();
    
    if (toNumber) {
        const dial = twiml.dial({
            callerId: TWILIO_PHONE_NUMBER,
            record: 'record-from-answer',
            recordingStatusCallback: `/recording-status?employeeId=${employeeId}&to=${encodeURIComponent(toNumber)}`,
            recordingStatusCallbackEvent: ['completed'],
            statusCallback: `/call-status-webhook?employeeId=${employeeId}`,
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
            // تحسينات جودة الصوت وتقليل التأخير
            timeout: 30,
            answerOnBridge: true  // تقليل latency - يبدأ التسجيل لما العميل يرد فعلاً
        });
        dial.number(toNumber);
    } else {
        twiml.say({ voice: 'Polly.Zeina', language: 'ar-AE' }, 'لم يتم تحديد رقم للاتصال');
    }
    
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
    const data = await getEmployeesData();
    res.json(data);
});

// إضافة مدير جديد
app.post('/employees', async (req, res) => {
    try {
        const { username, password, fullname, phone, department } = req.body;
        
        const data = await getEmployeesData();
        
        // التحقق من عدم وجود مدير بنفس اسم المستخدم
        const exists = data.employees.find(emp => emp.username === username);
        if (exists) {
            return res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
        }
        
        const newEmployee = {
            id: data.employees.length + 1,
            username,
            password,
            fullname,
            phone,
            department,
            departmentArabic: data.departments[department]?.name || 'غير محدد',
            role: 'employee'
        };
        
        data.employees.push(newEmployee);
        
        // إضافة المدير لقسمه
        if (data.departments[department]) {
            if (!data.departments[department].employees.includes(phone)) {
                data.departments[department].employees.push(phone);
            }
        }
        
        // حفظ البيانات
        await saveEmployeesData(data);
        
        res.json({ success: true, employee: newEmployee });
    } catch (error) {
        console.error('خطأ في إضافة مدير:', error);
        res.status(500).json({ error: error.message });
    }
});

// تسجيل دخول المدير
// تهيئة KV من الملف (للمطور فقط)
app.get('/init-kv', async (req, res) => {
    if (!kv || !process.env.VERCEL) {
        return res.json({ error: 'KV غير متاح (تشغيل محلي)', data: employeesData });
    }
    
    try {
        console.log('🔄 تهيئة Vercel KV بالبيانات الافتراضية...');
        console.log('📊 عدد المديرين المراد حفظهم:', employeesData.employees.length);
        
        // حفظ مباشر في KV
        await kv.set('employees_data', employeesData);
        console.log('✅ تم الحفظ في KV');
        
        // التحقق من الحفظ
        const saved = await kv.get('employees_data');
        console.log('✅ تم التحقق: عدد المديرين المحفوظين:', saved?.employees?.length || 0);
        
        return res.json({
            success: true,
            message: 'تم تهيئة KV بنجاح',
            employeesCount: saved?.employees?.length || 0,
            employees: saved?.employees || []
        });
    } catch (error) {
        console.error('❌ خطأ في تهيئة KV:', error);
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

// إضافة أو تعديل مدير
app.post('/employees', async (req, res) => {
    try {
        const { id, name, username, password, department, phone, permissions } = req.body;
        
        console.log('👤 حفظ مدير:', { name, username, department, permissions });
        
        const data = await getEmployeesData();
        
        // التحقق من عدم تكرار اسم المستخدم
        if (!id) {
            const existingUser = data.employees.find(emp => emp.username === username);
            if (existingUser) {
                console.log('❌ اسم المستخدم موجود مسبقاً:', username);
                return res.status(400).json({ error: 'اسم المستخدم موجود مسبقاً' });
            }
        }
        
        if (id) {
            // تعديل مدير موجود
            const employeeIndex = data.employees.findIndex(emp => emp.id === id);
            
            if (employeeIndex === -1) {
                return res.status(404).json({ error: 'المدير غير موجود' });
            }
            
            // تحديث البيانات
            data.employees[employeeIndex] = {
                ...data.employees[employeeIndex],
                name,
                username,
                password: password || data.employees[employeeIndex].password,
                department,
                phone,
                permissions: permissions || {},
                updatedAt: new Date().toISOString()
            };
            
            console.log('✅ تم تحديث المدير:', name);
        } else {
            // إضافة مدير جديد
            const newId = data.employees.length > 0 
                ? Math.max(...data.employees.map(e => e.id)) + 1 
                : 1;
            
            const newEmployee = {
                id: newId,
                name,
                username,
                password,
                department,
                phone: phone || '',
                permissions: permissions || {
                    viewOwnRecordings: false,
                    viewAllRecordings: false,
                    deleteRecordings: false,
                    editProfile: false
                },
                createdAt: new Date().toISOString()
            };
            
            data.employees.push(newEmployee);
            
            // إضافة للقسم
            if (data.departments[department]) {
                if (!data.departments[department].employees) {
                    data.departments[department].employees = [];
                }
                if (phone) {
                    data.departments[department].employees.push(phone);
                }
            }
            
            console.log('✅ تم إضافة مدير جديد:', name, 'بمعرف:', newId);
        }
        
        // حفظ البيانات
        const saved = await saveEmployeesData(data);
        
        if (!saved) {
            throw new Error('فشل في حفظ البيانات في قاعدة البيانات');
        }
        
        console.log('💾 تم حفظ البيانات بنجاح');
        
        res.json({ success: true, message: 'تم حفظ المدير بنجاح' });
    } catch (error) {
        console.error('❌ خطأ في حفظ المدير:', error);
        res.status(500).json({ error: error.message });
    }
});

// جلب قائمة المديرين
app.get('/employees', async (req, res) => {
    try {
        const data = await getEmployeesData();
        
        // إرسال المديرين مع أسماء الأقسام
        const employeesWithDepts = data.employees.map(emp => ({
            ...emp,
            departmentName: data.departments[emp.department]?.name || ''
        }));
        
        res.json({
            employees: employeesWithDepts,
            departments: data.departments
        });
    } catch (error) {
        console.error('❌ خطأ في جلب المديرين:', error);
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

// Export for Vercel serverless
module.exports = app;

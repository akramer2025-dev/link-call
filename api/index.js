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

// قراءة بيانات الموظفين (للتشغيل المحلي فقط)
let employeesData = {
    employees: [],
    departments: {
        "1": { name: "حجز وحدات الضيافة والفنادق", employees: [] },
        "2": { name: "تأجير السيارات", employees: [] },
        "3": { name: "البرامج والجولات السياحية", employees: [] },
        "0": { name: "خدمة العملاء", employees: [] },
        "9": { name: "الشكاوى", employees: [] }
    }
};

// محاولة تحميل من الملف (للتشغيل المحلي)
try {
    const data = fs.readFileSync(path.join(__dirname, 'employees.json'), 'utf8');
    employeesData = JSON.parse(data);
    console.log('✅ تم تحميل بيانات الموظفين من الملف');
} catch (error) {
    console.log('⚠️ سيتم استخدام KV للتخزين');
}

// دوال مساعدة للتعامل مع KV أو الملف
async function getEmployeesData() {
    if (kv && process.env.VERCEL) {
        try {
            const data = await kv.get('employees_data');
            return data || employeesData;
        } catch (error) {
            console.error('خطأ في قراءة KV:', error);
            return employeesData;
        }
    }
    return employeesData;
}

async function saveEmployeesData(data) {
    if (kv && process.env.VERCEL) {
        try {
            await kv.set('employees_data', data);
            return true;
        } catch (error) {
            console.error('خطأ في حفظ KV:', error);
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
            return true;
        } catch (error) {
            console.error('خطأ في حفظ الملف:', error);
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
        
        // استخدام API Key الموجود في المتغيرات
        const apiKey = process.env.TWILIO_API_KEY || process.env.TWILIO_ACCOUNT_SID;
        const apiSecret = process.env.TWILIO_API_SECRET || process.env.TWILIO_AUTH_TOKEN;
        
        console.log('🔑 استخدام API Key:', apiKey);
        
        const AccessToken = twilio.jwt.AccessToken;
        const VoiceGrant = AccessToken.VoiceGrant;
        
        const token = new AccessToken(
            TWILIO_ACCOUNT_SID,
            apiKey,
            apiSecret,
            { 
                identity: identity,
                ttl: 14400 // 4 ساعات
            }
        );

        const voiceGrant = new VoiceGrant({
            outgoingApplicationSid: TWILIO_TWIML_APP_SID,
            incomingAllow: true
        });

        token.addGrant(voiceGrant);
        
        console.log('✅ Token تم إنشاؤه للموظف:', identity);

        res.json({
            token: token.toJwt(),
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
// حفظ معرفات الموظفين للمكالمات (في الذاكرة مؤقتاً)
const callEmployeeMap = new Map();

app.post('/outgoing-call', (req, res) => {
    const toNumber = req.body.To;
    const employeeId = req.body.employeeId || 'unknown';
    
    console.log('📞 اتصال صادر من المتصفح إلى:', toNumber);
    console.log('👤 معرف الموظف:', employeeId);
    
    const twiml = new twilio.twiml.VoiceResponse();
    
    if (toNumber) {
        const dial = twiml.dial({
            callerId: TWILIO_PHONE_NUMBER,
            record: 'record-from-answer',
            recordingStatusCallback: '/recording-status',
            recordingStatusCallbackEvent: ['completed']
        });
        dial.number(toNumber);
        
        // حفظ معرف الموظف مع رقم الهاتف
        callEmployeeMap.set(toNumber, employeeId);
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
    
    // الحصول على بيانات الموظفين
    const data = await getEmployeesData();
    const department = data.departments[digit];
    
    if (department && department.employees.length > 0) {
        // اختيار موظف عشوائي (أو أول موظف متاح)
        const employeePhone = department.employees[0];
        
        twiml.say({
            voice: 'Polly.Zeina',
            language: 'ar-AE'
        }, `جاري تحويلك إلى قسم ${department.name}. الرجاء الانتظار.`);
        
        // تحويل المكالمة للموظف
        const dial = twiml.dial({
            timeout: 30,
            callerId: TWILIO_PHONE_NUMBER
        });
        dial.number(employeePhone);
        
        // إذا لم يرد الموظف
        twiml.say({
            voice: 'Polly.Zeina',
            language: 'ar-AE'
        }, 'عذراً، جميع موظفينا مشغولون حالياً. يرجى المحاولة لاحقاً. شكراً لاتصالك بنا.');
    } else {
        // لا يوجد موظفين متاحين في هذا القسم
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
app.post('/recording-status', (req, res) => {
    console.log('تم إكمال التسجيل:', req.body.RecordingSid);
    console.log('مدة التسجيل:', req.body.RecordingDuration);
    console.log('رابط التسجيل:', req.body.RecordingUrl);
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
        const recordings = await twilioClient.recordings.list({ limit: 50 });
        
        // جلب معلومات المكالمات لكل تسجيل
        const recordingsData = await Promise.all(recordings.map(async (recording) => {
            try {
                // جلب معلومات المكالمة
                const call = await twilioClient.calls(recording.callSid).fetch();
                
                // البحث عن معرف الموظف
                const employeeId = callEmployeeMap.get(call.to) || callEmployeeMap.get(call.from);
                
                return {
                    sid: recording.sid,
                    callSid: recording.callSid,
                    duration: recording.duration,
                    dateCreated: recording.dateCreated,
                    uri: recording.uri,
                    // معلومات المكالمة
                    from: call.from,
                    to: call.to,
                    direction: call.direction,
                    employeeId: employeeId  // إضافة معرف الموظف
                };
            } catch (error) {
                // إذا فشل جلب معلومات المكالمة، نرجع البيانات الأساسية فقط
                return {
                    sid: recording.sid,
                    callSid: recording.callSid,
                    duration: recording.duration,
                    dateCreated: recording.dateCreated,
                    uri: recording.uri,
                    from: 'غير معروف',
                    to: 'غير معروف',
                    direction: 'outbound-api',
                    employeeId: null  // لا يوجد معرف موظف
                };
            }
        }));
        
        res.json({ recordings: recordingsData });
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

// ========== إدارة الموظفين ==========

// جلب قائمة الموظفين
app.get('/employees', async (req, res) => {
    const data = await getEmployeesData();
    res.json(data);
});

// إضافة موظف جديد
app.post('/employees', async (req, res) => {
    try {
        const { username, password, fullname, phone, department } = req.body;
        
        const data = await getEmployeesData();
        
        // التحقق من عدم وجود موظف بنفس اسم المستخدم
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
        
        // إضافة الموظف لقسمه
        if (data.departments[department]) {
            if (!data.departments[department].employees.includes(phone)) {
                data.departments[department].employees.push(phone);
            }
        }
        
        // حفظ البيانات
        await saveEmployeesData(data);
        
        res.json({ success: true, employee: newEmployee });
    } catch (error) {
        console.error('خطأ في إضافة موظف:', error);
        res.status(500).json({ error: error.message });
    }
});

// حذف موظف
app.delete('/employees/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const data = await getEmployeesData();
        
        const employeeIndex = data.employees.findIndex(emp => emp.id === id);
        
        if (employeeIndex === -1) {
            return res.status(404).json({ error: 'الموظف غير موجود' });
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
        console.error('خطأ في حذف موظف:', error);
        res.status(500).json({ error: error.message });
    }
});

// Export for Vercel serverless
module.exports = app;

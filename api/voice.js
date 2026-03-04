const twilio = require('twilio');

// ⏱️ زيادة timeout الـ function لـ 30 ثانية (Vercel config)
module.exports.config = { maxDuration: 30 };

// 🗄️ Cache بسيط للـ credentials (5 دقائق) — يمنع Firestore read في كل مكالمة
const _credsCache = new Map();
async function getCachedCredentials(companyId) {
    const getTwilioCredentials = require('../utils/getTwilioCredentials');
    const cacheKey = companyId || '__default__';
    const cached   = _credsCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < 5 * 60 * 1000) {
        console.log('⚡ voice.js: credentials من cache');
        return cached.data;
    }
    const data = await getTwilioCredentials(companyId);
    _credsCache.set(cacheKey, { data, ts: Date.now() });
    return data;
}

// 🔥 دالة لتنسيق الأرقام المصرية والسعودية تلقائياً
function formatPhoneNumber(phoneNumber) {
    // تنظيف الرقم من المسافات والأحرف الخاصة
    let cleanNumber = phoneNumber
        .replace(/[\u200E\u200F\u202A\u202B\u202C\u202D\u202E\uFEFF]/g, '') // حذف Right-to-Left و Left-to-Right marks
        .replace(/[\s\-\(\)]/g, ''); // حذف المسافات والشرطات والأقواس
    
    console.log('🔍 API - الرقم قبل التنسيق:', phoneNumber);
    console.log('🔍 API - الرقم بعد التنظيف:', cleanNumber);
    
    // إذا كان الرقم يبدأ بـ + أو 00، نعيده بعد التنسيق
    if (cleanNumber.startsWith('+')) {
        console.log('✅ API - رقم دولي كامل:', cleanNumber);
        return cleanNumber;
    }
    
    if (cleanNumber.startsWith('00')) {
        cleanNumber = '+' + cleanNumber.substring(2);
        console.log('✅ API - تم تحويل 00 إلى +:', cleanNumber);
        return cleanNumber;
    }
    
    // ========== التعرف على الأرقام السعودية ==========
    
    // رقم سعودي كامل بدون + أو 00 (مثل: 966501234567)
    if (cleanNumber.startsWith('966') && cleanNumber.length === 12) {
        cleanNumber = '+' + cleanNumber;
        console.log('✅ API - رقم سعودي - تم إضافة +:', cleanNumber);
        return cleanNumber;
    }
    
    // رقم سعودي محلي مع صفر (مثل: 0501234567 - 10 أرقام)
    if (cleanNumber.startsWith('05') && cleanNumber.length === 10) {
        cleanNumber = '+966' + cleanNumber.substring(1);
        console.log('✅ API - رقم سعودي محلي - تم إضافة +966:', cleanNumber);
        return cleanNumber;
    }
    
    // رقم سعودي بدون صفر (مثل: 501234567 - 9 أرقام يبدأ بـ 5)
    if (cleanNumber.startsWith('5') && cleanNumber.length === 9) {
        cleanNumber = '+966' + cleanNumber;
        console.log('✅ API - رقم سعودي بدون صفر - تم إضافة +966:', cleanNumber);
        return cleanNumber;
    }
    
    // رقم سعودي أرضي محلي مع صفر (مثل: 0112345678 - 10 أرقام يبدأ بـ 01)
    if (cleanNumber.startsWith('01') && cleanNumber.length === 10) {
        // تحقق: هل هو رقم سعودي أرضي؟ (011, 012, 013, 014, 016, 017)
        const secondDigit = cleanNumber.charAt(2);
        if (['1', '2', '3', '4', '6', '7'].includes(secondDigit)) {
            cleanNumber = '+966' + cleanNumber.substring(1);
            console.log('✅ API - رقم سعودي أرضي - تم إضافة +966:', cleanNumber);
            return cleanNumber;
        }
    }
    
    // ========== التعرف على الأرقام المصرية ==========
    
    // رقم مصري كامل بدون + أو 00 (مثل: 201234567890)
    if (cleanNumber.startsWith('20') && cleanNumber.length >= 12) {
        cleanNumber = '+' + cleanNumber;
        console.log('✅ API - رقم مصري - تم إضافة +:', cleanNumber);
        return cleanNumber;
    }
    
    // رقم مصري محلي مع صفر (مثل: 01234567890 - 11 رقم)
    if (cleanNumber.startsWith('0') && cleanNumber.length === 11) {
        cleanNumber = '+20' + cleanNumber.substring(1);
        console.log('✅ API - رقم مصري محلي - تم إضافة +20:', cleanNumber);
        return cleanNumber;
    }
    
    // رقم مصري بدون صفر (مثل: 1234567890 - 10 أرقام يبدأ بـ 1 أو 2)
    if ((cleanNumber.startsWith('1') || cleanNumber.startsWith('2')) && cleanNumber.length === 10) {
        cleanNumber = '+20' + cleanNumber;
        console.log('✅ API - رقم مصري بدون صفر - تم إضافة +20:', cleanNumber);
        return cleanNumber;
    }
    
    // الحالة الافتراضية: نفترض أنه رقم مصري ونضيف +20
    cleanNumber = '+20' + cleanNumber;
    console.log('⚠️ API - افتراض رقم مصري - تم إضافة +20:', cleanNumber);
    return cleanNumber;
}

module.exports = async (req, res) => {
    // إعدادات CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // ── Body parsing fallback: Twilio يرسل application/x-www-form-urlencoded ──
        if (typeof req.body === 'string') {
            try {
                const qs = require('querystring');
                req.body = qs.parse(req.body);
            } catch(e) { req.body = {}; }
        }
        if (!req.body || typeof req.body !== 'object') {
            req.body = {};
        }

        const callTo     = req.body.To;
        const employeeId = req.body.employeeId || 'unknown';
        const companyId  = req.body.companyId  || null;
        const callSid    = req.body.CallSid;

        console.log('📥 voice.js body:', { callTo, employeeId, companyId, callSid });

        if (!callTo) {
            console.error('❌ voice.js: لا يوجد رقم To في الطلب!');
            const twimlErr = new twilio.twiml.VoiceResponse();
            twimlErr.say({ language: 'ar-SA' }, 'خطأ: لم يتم تحديد رقم الهاتف.');
            res.setHeader('Content-Type', 'text/xml');
            return res.status(200).send(twimlErr.toString());
        }

        const formattedCallTo = formatPhoneNumber(callTo);

        // ── 🚀 تشغيل Firestore بالتوازي لتسريع الرد ──────────────────────
        const { getDb } = require('../utils/firebase');
        const { doc, getDoc, setDoc } = require('firebase/firestore');
        const db = getDb();

        // الطلبين المهمين معاً في نفس الوقت (credentials محملة من cache)
        const [creds, disableRecordingSnap] = await Promise.all([
            getCachedCredentials(companyId),
            companyId
                ? getDoc(doc(db, 'companies', companyId)).catch(() => null)
                : Promise.resolve(null)
        ]);

        const callerPhoneNumber = creds.phoneNumber;

        if (!callerPhoneNumber) {
            console.error(`❌ voice.js: callerPhoneNumber غير محدد! companyId=${companyId}`);
            const twimlErr = new twilio.twiml.VoiceResponse();
            twimlErr.say({ language: 'ar-SA' }, 'خطأ في الإعداد: رقم المتصل غير محدد. يرجى مراجعة المسؤول.');
            res.setHeader('Content-Type', 'text/xml');
            return res.status(200).send(twimlErr.toString());
        }

        console.log(`✅ voice.js: callerPhone=${callerPhoneNumber} | شركة=${companyId}`);

        // ── حفظ active_calls بدون انتظار (fire-and-forget) ───────────────
        if (callSid && companyId) {
            setDoc(doc(db, 'active_calls', callSid), {
                companyId, employeeId,
                callerPhone: callerPhoneNumber,
                startedAt: new Date().toISOString()
            }).catch(e => console.error('⚠️ حفظ active_calls فشل:', e.message));
        }

        // ── التحقق من حالة التسجيل ───────────────────────────────────────
        let recordingEnabled = true;
        if (disableRecordingSnap && disableRecordingSnap.exists && disableRecordingSnap.exists()) {
            if (disableRecordingSnap.data().disableRecording === true) {
                recordingEnabled = false;
                console.log(`🔇 التسجيل معطّل لشركة: ${companyId}`);
            }
        }

        // ── بناء TwiML ────────────────────────────────────────────────────
        const baseCallbackUrl = 'https://linkcall.akrammostafa.com';
        const recordingCbUrl = companyId
            ? `${baseCallbackUrl}/api/recording-status?companyId=${encodeURIComponent(companyId)}&employeeId=${encodeURIComponent(employeeId)}`
            : `${baseCallbackUrl}/api/recording-status`;

        const twiml = new twilio.twiml.VoiceResponse();
        const dial = twiml.dial({
            callerId: callerPhoneNumber,
            ...(recordingEnabled ? {
                record: 'record-from-answer-dual',
                recordingStatusCallback: recordingCbUrl,
                recordingStatusCallbackEvent: 'completed'
            } : {})
        });

        dial.number(formattedCallTo);

        res.setHeader('Content-Type', 'text/xml');
        res.status(200).send(twiml.toString());

    } catch (error) {
        console.error('خطأ في voice:', error);
        res.status(500).json({ error: error.message });
    }
};

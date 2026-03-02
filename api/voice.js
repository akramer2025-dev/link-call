const twilio = require('twilio');

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
        const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
        const callTo = req.body.To;
        const employeeId = req.body.employeeId || 'unknown';
        const companyId  = req.body.companyId  || null;
        const callSid = req.body.CallSid;
        
        // تنسيق رقم الهاتف لإضافة كود مصر تلقائياً
        const formattedCallTo = formatPhoneNumber(callTo);
        
        console.log('📞 مكالمة جديدة:', { callSid, to: callTo, formattedTo: formattedCallTo, employeeId, companyId });

        // ── جلب بيانات Twilio الخاصة بالشركة من Firestore ──
        let callerPhoneNumber = TWILIO_PHONE_NUMBER; // fallback للرقم الافتراضي
        let companyTwilio = null; // credentials خاصة بالشركة
        if (companyId) {
            try {
                const { getDb } = require('../utils/firebase');
                const { doc, getDoc } = require('firebase/firestore');
                const companySnap = await getDoc(doc(getDb(), 'companies', companyId));
                if (companySnap.exists()) {
                    const companyData = companySnap.data();
                    // إذا كان للشركة prefix بيئي → استخدام credentials خاصة
                    if (companyData.twilioEnvPrefix) {
                        const prefix = companyData.twilioEnvPrefix;
                        const sid   = process.env[`${prefix}_TWILIO_ACCOUNT_SID`];
                        const token = process.env[`${prefix}_TWILIO_AUTH_TOKEN`];
                        if (sid && token) {
                            companyTwilio = { accountSid: sid, authToken: token };
                            // استخدم رقم الشركة فقط إذا توفّرت credentials الشركة
                            if (companyData.twilioPhone) {
                                callerPhoneNumber = companyData.twilioPhone;
                            }
                            console.log(`✅ Twilio credentials لشركة ${companyData.companyName} (${prefix}): ${callerPhoneNumber}`);
                        } else {
                            // المتغيرات البيئية غير موجودة → استخدم الحساب الافتراضي ورقمه
                            console.warn(`⚠️ ${prefix}_TWILIO_ACCOUNT_SID/AUTH_TOKEN غير موجودة في ENV → يستخدم الحساب الافتراضي (${TWILIO_PHONE_NUMBER || 'unknown'})`);
                        }
                    } else if (companyData.twilioPhone) {
                        // لا يوجد prefix → رقم الشركة مع الحساب الافتراضي
                        callerPhoneNumber = companyData.twilioPhone;
                    }
                    console.log('✅ Twilio للشركة:', callerPhoneNumber, '| شركة:', companyData.companyName);
                }
            } catch (e) {
                console.error('⚠️ جلب بيانات الشركة فشل - سيُستخدم الإعداد الافتراضي:', e.message);
            }
        }

        // حفظ callSid → companyId في Firestore للخصم لاحقاً
        if (callSid && companyId) {
            try {
                const { getDb } = require('../utils/firebase');
                const { doc, setDoc } = require('firebase/firestore');
                await setDoc(doc(getDb(), 'active_calls', callSid), {
                    companyId,
                    employeeId,
                    callerPhone: callerPhoneNumber,
                    startedAt: new Date().toISOString()
                });
            } catch (e) { console.error('⚠️ حفظ active_calls فشل:', e.message); }
        }
        
        const twiml = new twilio.twiml.VoiceResponse();
        
        // التحقق هل التسجيل معطّل لهذه الشركة (لتخفيض التكلفة)
        let recordingEnabled = true;
        if (companyId) {
            try {
                const { getDb } = require('../utils/firebase');
                const { doc, getDoc } = require('firebase/firestore');
                const snap = await getDoc(doc(getDb(), 'companies', companyId));
                if (snap.exists() && snap.data().disableRecording === true) {
                    recordingEnabled = false;
                    console.log(`🔇 التسجيل معطّل لشركة: ${companyId}`);
                }
            } catch (e) { /* fallback: تسجيل مفعّل */ }
        }

        const dial = twiml.dial({
            callerId: callerPhoneNumber,
            ...(recordingEnabled ? {
                record: 'record-from-answer-dual',
                recordingStatusCallback: '/api/recording-status',
                recordingStatusCallbackEvent: 'completed'
            } : {})
        });
        
        if (formattedCallTo) {
            dial.number(formattedCallTo);
        } else {
            dial.client('default_client');
        }

        res.setHeader('Content-Type', 'text/xml');
        res.status(200).send(twiml.toString());
    } catch (error) {
        console.error('خطأ في voice:', error);
        res.status(500).json({ error: error.message });
    }
};

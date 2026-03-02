const twilio = require('twilio');

module.exports = async (req, res) => {
    // إعدادات CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const companyId = req.query.companyId || null;

        let TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
        let TWILIO_AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;
        let TWILIO_API_KEY     = process.env.TWILIO_API_KEY;
        let TWILIO_API_SECRET  = process.env.TWILIO_API_SECRET;
        let TWILIO_TWIML_APP_SID = process.env.TWILIO_TWIML_APP_SID;

        // استخدام credentials خاصة بالشركة إذا وُجدت
        if (companyId) {
            try {
                const { getDb } = require('../utils/firebase');
                const { doc, getDoc } = require('firebase/firestore');
                const snap = await getDoc(doc(getDb(), 'companies', companyId));
                if (snap.exists()) {
                    const cData = snap.data();
                    const prefix = cData.twilioEnvPrefix;
                    if (prefix) {
                        const sid    = process.env[`${prefix}_TWILIO_ACCOUNT_SID`];
                        const token  = process.env[`${prefix}_TWILIO_AUTH_TOKEN`];
                        const apiKey = process.env[`${prefix}_TWILIO_API_KEY`];
                        const apiSec = process.env[`${prefix}_TWILIO_API_SECRET`];
                        const appSid = process.env[`${prefix}_TWILIO_TWIML_APP_SID`];
                        if (sid && token && apiKey && apiSec && appSid) {
                            TWILIO_ACCOUNT_SID   = sid;
                            TWILIO_AUTH_TOKEN    = token;
                            TWILIO_API_KEY       = apiKey;
                            TWILIO_API_SECRET    = apiSec;
                            TWILIO_TWIML_APP_SID = appSid;
                            console.log(`✅ token.js: credentials شركة ${cData.companyName || companyId} (${prefix})`);
                        }
                    }
                }
            } catch (e) {
                console.warn('⚠️ token.js: فشل جلب credentials الشركة، fallback للإعدادات الافتراضية:', e.message);
            }
        }

        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_TWIML_APP_SID) {
            return res.status(500).json({ error: 'Missing credentials' });
        }

        // استخدام identity من query parameter أو إنشاء واحد جديد
        const identity = req.query.identity || 'link_call_user_' + Date.now();
        
        const AccessToken = twilio.jwt.AccessToken;
        const VoiceGrant = AccessToken.VoiceGrant;

        if (!TWILIO_API_KEY || !TWILIO_API_SECRET) {
            return res.status(500).json({ 
                error: 'Missing API Key credentials',
                hint: 'Add TWILIO_API_KEY and TWILIO_API_SECRET in Vercel Environment Variables'
            });
        }

        const token = new AccessToken(
            TWILIO_ACCOUNT_SID,
            TWILIO_API_KEY,
            TWILIO_API_SECRET,
            { 
                identity: identity,
                ttl: 3600
            }
        );

        const voiceGrant = new VoiceGrant({
            outgoingApplicationSid: TWILIO_TWIML_APP_SID,
            incomingAllow: true
        });

        token.addGrant(voiceGrant);
        
        const jwt = token.toJwt();
        
        console.log('Token generated for:', identity);
        console.log('Token (first 50 chars):', jwt.substring(0, 50));

        res.status(200).json({
            token: jwt,
            identity: identity
        });
    } catch (error) {
        console.error('خطأ في توليد Token:', error);
        res.status(500).json({ 
            error: 'فشل في توليد Token',
            details: error.message 
        });
    }
};

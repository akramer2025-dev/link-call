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

        // جلب credentials الشركة (Firestore أولاً ← ENV prefix ← default ENV)
        const getTwilioCredentials   = require('../utils/getTwilioCredentials');
        const creds                  = await getTwilioCredentials(companyId);
        const TWILIO_ACCOUNT_SID     = creds.accountSid;
        const TWILIO_AUTH_TOKEN      = creds.authToken;
        const TWILIO_API_KEY         = creds.apiKey;
        const TWILIO_API_SECRET      = creds.apiSecret;
        const TWILIO_TWIML_APP_SID   = creds.twimlAppSid;

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

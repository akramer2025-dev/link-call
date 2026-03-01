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
        const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
        const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
        const TWILIO_TWIML_APP_SID = process.env.TWILIO_TWIML_APP_SID;

        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_TWIML_APP_SID) {
            return res.status(500).json({ error: 'Missing credentials' });
        }

        // استخدام identity من query parameter أو إنشاء واحد جديد
        const identity = req.query.identity || 'link_call_user_' + Date.now();
        
        const AccessToken = twilio.jwt.AccessToken;
        const VoiceGrant = AccessToken.VoiceGrant;

        // يجب استخدام API Key + API Secret (وليس Account SID + Auth Token)
        const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
        const TWILIO_API_SECRET = process.env.TWILIO_API_SECRET;

        if (!TWILIO_API_KEY || !TWILIO_API_SECRET) {
            console.error('❌ مطلوب TWILIO_API_KEY و TWILIO_API_SECRET');
            console.error('   أنشئهم من: console.twilio.com > Account > API Keys');
            return res.status(500).json({ 
                error: 'Missing API Key credentials',
                hint: 'Create API Key at console.twilio.com > Account > API Keys & Tokens'
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

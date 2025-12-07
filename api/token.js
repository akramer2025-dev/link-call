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

        const identity = 'link_call_user_' + Date.now();
        
        const AccessToken = twilio.jwt.AccessToken;
        const VoiceGrant = AccessToken.VoiceGrant;
        
        // استخدام Account SID و Auth Token مباشرة (بدون API Keys)
        const token = new AccessToken(
            TWILIO_ACCOUNT_SID,
            TWILIO_ACCOUNT_SID,
            TWILIO_AUTH_TOKEN,
            { 
                identity: identity,
                ttl: 14400  // 4 hours
            }
        );

        const voiceGrant = new VoiceGrant({
            outgoingApplicationSid: TWILIO_TWIML_APP_SID,
            incomingAllow: true,
        });

        token.addGrant(voiceGrant);

        res.status(200).json({
            token: token.toJwt(),
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

// API endpoint for getting account balance
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

        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
            return res.status(500).json({ 
                error: 'Missing Twilio credentials',
                balance: 0,
                currency: 'USD'
            });
        }

        const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        const account = await client.api.accounts(TWILIO_ACCOUNT_SID).fetch();
        
        console.log('✅ تم جلب رصيد الحساب:', account.balance);

        res.status(200).json({
            success: true,
            balance: parseFloat(account.balance),
            currency: account.currency || 'USD',
            status: account.status
        });
    } catch (error) {
        console.error('❌ خطأ في جلب الرصيد:', error);
        res.status(500).json({ 
            error: 'فشل جلب الرصيد',
            details: error.message,
            balance: 0,
            currency: 'USD'
        });
    }
};

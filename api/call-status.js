const twilio = require('twilio');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const callSid   = req.query.callSid;
        const companyId = req.query.companyId || null;

        if (!callSid || !callSid.startsWith('CA')) {
            return res.status(400).json({ error: 'callSid مطلوب' });
        }

        const getTwilioCredentials = require('../utils/getTwilioCredentials');
        const creds = await getTwilioCredentials(companyId);

        if (!creds.accountSid || !creds.authToken) {
            return res.status(400).json({ error: 'credentials غير مضبوطة' });
        }

        const client = twilio(creds.accountSid, creds.authToken);
        const call   = await client.calls(callSid).fetch();

        res.status(200).json({
            callSid:   call.sid,
            status:    call.status,       // initiated | ringing | in-progress | completed | busy | no-answer | canceled | failed
            duration:  parseInt(call.duration) || 0,
            direction: call.direction,
            startTime: call.startTime,
            endTime:   call.endTime
        });
    } catch (err) {
        console.error('call-status error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

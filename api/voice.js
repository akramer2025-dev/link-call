const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

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
        const callSid = req.body.CallSid;
        
        console.log('📞 مكالمة جديدة:', { callSid, to: callTo, employeeId });
        
        // حفظ معلومات المكالمة
        const metadataPath = path.join(process.cwd(), 'call-metadata.json');
        let metadata = { calls: {} };
        
        if (fs.existsSync(metadataPath)) {
            const data = fs.readFileSync(metadataPath, 'utf8');
            metadata = JSON.parse(data);
        }
        
        metadata.calls[callSid] = {
            to: callTo,
            employeeId: employeeId,
            timestamp: new Date().toISOString()
        };
        
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        console.log('✅ تم حفظ معلومات المكالمة');
        
        const twiml = new twilio.twiml.VoiceResponse();
        
        const dial = twiml.dial({
            callerId: TWILIO_PHONE_NUMBER,
            record: 'record-from-answer-dual',
            recordingStatusCallback: '/api/recording-status',
            recordingStatusCallbackEvent: 'completed'
        });
        
        if (callTo) {
            dial.number(callTo);
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

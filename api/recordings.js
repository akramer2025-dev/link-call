const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
        const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
        
        console.log('Recordings - Checking credentials:');
        console.log('TWILIO_ACCOUNT_SID:', TWILIO_ACCOUNT_SID ? `Set (${TWILIO_ACCOUNT_SID.substring(0, 10)}...)` : 'MISSING');
        console.log('TWILIO_AUTH_TOKEN:', TWILIO_AUTH_TOKEN ? `Set (length: ${TWILIO_AUTH_TOKEN.length})` : 'MISSING');
        
        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
            console.error('Missing Twilio credentials for recordings');
            return res.status(500).json({ 
                error: 'Server configuration error',
                details: 'Missing authentication credentials'
            });
        }
        
        const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        const recordings = await twilioClient.recordings.list({ limit: 50 });
        
        // قراءة معلومات المكالمات
        const metadataPath = path.join(process.cwd(), 'call-metadata.json');
        let metadata = { calls: {} };
        
        if (fs.existsSync(metadataPath)) {
            const data = fs.readFileSync(metadataPath, 'utf8');
            metadata = JSON.parse(data);
        }
        
        console.log('📊 عدد المكالمات المحفوظة:', Object.keys(metadata.calls).length);
        
        // دمج معلومات التسجيلات مع معلومات المكالمات
        const recordingsData = recordings.map(recording => {
            const callInfo = metadata.calls[recording.callSid] || {};
            
            return {
                sid: recording.sid,
                callSid: recording.callSid,
                duration: recording.duration,
                dateCreated: recording.dateCreated,
                uri: recording.uri,
                to: callInfo.to || null,
                employeeId: callInfo.employeeId || null
            };
        });
        
        console.log('✅ تم إرجاع', recordingsData.length, 'تسجيل مع معلومات المكالمات');
        
        res.status(200).json({ recordings: recordingsData });
    } catch (error) {
        console.error('خطأ في جلب التسجيلات:', error);
        res.status(500).json({ error: error.message });
    }
};

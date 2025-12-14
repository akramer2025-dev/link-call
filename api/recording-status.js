const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const recordingSid = req.body.RecordingSid;
        const callSid = req.body.CallSid;
        const duration = req.body.RecordingDuration;
        
        console.log('📼 تم إكمال التسجيل:', recordingSid);
        console.log('📞 CallSid:', callSid);
        console.log('⏱️ مدة التسجيل:', duration);
        
        // ربط التسجيل بمعلومات المكالمة
        const metadataPath = path.join(process.cwd(), 'call-metadata.json');
        
        if (fs.existsSync(metadataPath)) {
            const data = fs.readFileSync(metadataPath, 'utf8');
            const metadata = JSON.parse(data);
            
            if (metadata.calls[callSid]) {
                metadata.calls[callSid].recordingSid = recordingSid;
                metadata.calls[callSid].recordingDuration = duration;
                fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
                console.log('✅ تم ربط التسجيل بمعلومات المكالمة');
            }
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('خطأ في recording-status:', error);
        res.status(500).json({ error: error.message });
    }
};

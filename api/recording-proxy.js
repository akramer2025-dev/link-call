// recording-proxy.js — بروكسي لتشغيل تسجيلات Twilio مع المصادقة
// GET /api/recording-proxy?url={encodedTwilioUrl}&companyId={id}
// أو GET /api/recording-proxy?sid={recordingSid}&companyId={id}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const companyId    = req.query.companyId || null;
        let   recordingUrl = req.query.url       || null;
        const recordingSid = req.query.sid       || null;

        // ─── جلب credentials الشركة ───────────────────────────────────
        let accountSid = process.env.TWILIO_ACCOUNT_SID;
        let authToken  = process.env.TWILIO_AUTH_TOKEN;

        if (companyId) {
            try {
                const { getDb }        = require('../utils/firebase');
                const { doc, getDoc }  = require('firebase/firestore');
                const snap = await getDoc(doc(getDb(), 'companies', companyId));
                if (snap.exists()) {
                    const prefix = snap.data().twilioEnvPrefix;
                    if (prefix) {
                        const sid   = process.env[`${prefix}_TWILIO_ACCOUNT_SID`];
                        const token = process.env[`${prefix}_TWILIO_AUTH_TOKEN`];
                        if (sid && token) {
                            accountSid = sid;
                            authToken  = token;
                            console.log(`✅ recording-proxy: credentials شركة ${companyId} (${prefix})`);
                        }
                    }
                }
            } catch (e) {
                console.warn('⚠️ recording-proxy: fallback للإعدادات الافتراضية:', e.message);
            }
        }

        if (!accountSid || !authToken) {
            return res.status(500).json({ error: 'Missing Twilio credentials' });
        }

        // ─── بناء URL السجل ──────────────────────────────────────────
        if (!recordingUrl && recordingSid) {
            recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.mp3`;
        }

        if (!recordingUrl) {
            return res.status(400).json({ error: 'يجب توفير url أو sid' });
        }

        // إذا انتهى بـ .mp3 نأخذه كما هو، وإلا نضيف .mp3
        if (!recordingUrl.endsWith('.mp3') && !recordingUrl.includes('.mp3?')) {
            recordingUrl = recordingUrl + '.mp3';
        }

        console.log(`🎵 recording-proxy: جلب ${recordingUrl}`);

        // ─── جلب التسجيل من Twilio مع Basic Auth ──────────────────────
        const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

        // استخدام node-fetch أو https المدمج
        const https = require('https');
        const url   = new URL(recordingUrl);

        const twilioReq = https.request(
            {
                hostname: url.hostname,
                path:     url.pathname + (url.search || ''),
                method:   'GET',
                headers:  { Authorization: authHeader }
            },
            (twilioRes) => {
                const status = twilioRes.statusCode;

                if (status === 301 || status === 302 || status === 303) {
                    // إعادة توجيه — اتبع الـ redirect
                    const location = twilioRes.headers.location;
                    res.redirect(location);
                    return;
                }

                if (status !== 200) {
                    res.status(status).json({ error: `Twilio returned ${status}` });
                    return;
                }

                res.setHeader('Content-Type', twilioRes.headers['content-type'] || 'audio/mpeg');
                res.setHeader('Accept-Ranges', 'bytes');
                if (twilioRes.headers['content-length']) {
                    res.setHeader('Content-Length', twilioRes.headers['content-length']);
                }
                // تمكين التخزين المؤقت لمدة ساعة
                res.setHeader('Cache-Control', 'public, max-age=3600');

                twilioRes.pipe(res);
            }
        );

        twilioReq.on('error', (err) => {
            console.error('❌ recording-proxy error:', err.message);
            if (!res.headersSent) {
                res.status(500).json({ error: err.message });
            }
        });

        twilioReq.end();

    } catch (error) {
        console.error('❌ recording-proxy exception:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        }
    }
};

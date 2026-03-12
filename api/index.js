const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
const path = require('path');
const https = require('https');
const fs = require('fs');

// ===================== Plivo Integration =====================
let plivoClient = null;
const PLIVO_AUTH_ID = process.env.PLIVO_AUTH_ID;
const PLIVO_AUTH_TOKEN = process.env.PLIVO_AUTH_TOKEN;
const PLIVO_PHONE_NUMBER = process.env.PLIVO_PHONE_NUMBER; // —ﬁ„ Plivo („’—Ì √Ê ”⁄ÊœÌ)

if (PLIVO_AUTH_ID && PLIVO_AUTH_TOKEN) {
    try {
        const plivo = require('plivo');
        plivoClient = new plivo.Client(PLIVO_AUTH_ID, PLIVO_AUTH_TOKEN);
        console.log('? Plivo „ ’· - —ﬁ„:', PLIVO_PHONE_NUMBER);
    } catch (error) {
        console.log('?? Plivo €Ì— „ «Õ:', error.message);
    }
} else {
    console.log('?? Plivo €Ì— „ı⁄œ - ·≈÷«› Â √÷› PLIVO_AUTH_ID Ê PLIVO_AUTH_TOKEN');
}
// ===================== ‰Â«Ì… Plivo =====================

// ===================== Zadarma Integration (√—ﬁ«„ „’—Ì…!) =====================
const ZADARMA_KEY = process.env.ZADARMA_KEY;
const ZADARMA_SECRET = process.env.ZADARMA_SECRET;
const ZADARMA_SIP = process.env.ZADARMA_SIP; // SIP ID «·Œ«’ »ﬂ
const ZADARMA_PHONE = process.env.ZADARMA_PHONE; // «·—ﬁ„ «·„’—Ì „‰ Zadarma

if (ZADARMA_KEY && ZADARMA_SECRET) {
    console.log('? Zadarma „⁄œ - —ﬁ„ „’—Ì:', ZADARMA_PHONE);
} else {
    console.log('?? Zadarma €Ì— „ı⁄œ - ··√—ﬁ«„ «·„’—Ì… √÷› ZADARMA_KEY Ê ZADARMA_SECRET');
    console.log('   ?? https://zadarma.com/');
}
// ===================== ‰Â«Ì… Zadarma =====================

// Upstash Redis ·· Œ“Ì‰ «·”Õ«»Ì
let redis;
try {
    const { Redis } = require('@upstash/redis');
    redis = new Redis({
        url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('? Upstash Redis „ ’·');
} catch (error) {
    console.log('?? Upstash Redis €Ì— „ «Õ ( ‘€Ì· „Õ·Ì)');
}

const app = express();
const PORT = 3000;

// ﬁ—«¡… »Ì«‰«  «·„œÌ—Ì‰ (·· ‘€Ì· «·„Õ·Ì ›ﬁÿ)
let employeesData = {
    employees: [
        {
            id: 1,
            name: "√„Ì—…",
            username: "amira",
            password: "Aa123456",
            department: "1",
            phone: "",
            permissions: {
                viewOwnRecordings: true,
                viewAllRecordings: true,
                deleteRecordings: false,
                editProfile: true
            },
            createdAt: "2025-12-08T00:00:00.000Z"
        },
        {
            id: 3,
            name: "‘«ﬂ—",
            username: "shaker",
            password: "Aa123456",
            department: "3",
            phone: "",
            permissions: {
                viewOwnRecordings: true,
                viewAllRecordings: true,
                deleteRecordings: false,
                editProfile: true
            },
            createdAt: "2025-12-08T00:00:00.000Z"
        },
        {
            id: 5,
            name: "≈”·«„",
            username: "eslam",
            password: "Aa123456",
            department: "5",
            phone: "",
            permissions: {
                viewOwnRecordings: true,
                viewAllRecordings: false,
                deleteRecordings: false,
                editProfile: true
            },
            createdAt: "2025-12-08T00:00:00.000Z"
        },
        {
            id: 6,
            name: "‰Ê—Â",
            username: "Noura",
            password: "Aa123456",
            department: "1",
            phone: "",
            permissions: {
                viewOwnRecordings: true,
                viewAllRecordings: false,
                deleteRecordings: false,
                editProfile: true
            },
            createdAt: "2025-12-16T00:00:00.000Z"
        },
        {
            id: 7,
            name: "”„—",
            username: "samar",
            password: "Aa123456",
            department: "1",
            phone: "",
            permissions: {
                viewOwnRecordings: true,
                viewAllRecordings: false,
                deleteRecordings: false,
                editProfile: true
            },
            createdAt: "2025-12-16T00:00:00.000Z"
        },
        {
            id: 8,
            name: "„Õ„œ",
            username: "mohamed",
            password: "Aa123456",
            department: "1",
            phone: "",
            permissions: {
                viewOwnRecordings: true,
                viewAllRecordings: false,
                deleteRecordings: false,
                editProfile: true
            },
            createdAt: "2026-02-03T00:00:00.000Z"
        }
    ],
    departments: {
        "1": { name: "«·ÕÃÊ“« ", employees: [] },
        "2": { name: "«·„»Ì⁄« ", employees: [] },
        "3": { name: "Œœ„… «·⁄„·«¡", employees: [] },
        "4": { name: "«·Õ”«»« ", employees: [] },
        "5": { name: "«·œ⁄„ «·›‰Ï", employees: [] },
        "6": { name: "«·‘ﬂ«ÊÏ Ê«·«ﬁ —«Õ« ", employees: [] }
    }
};

// „Õ«Ê·…  Õ„Ì· „‰ «·„·› (·· ‘€Ì· «·„Õ·Ì)
try {
    const data = fs.readFileSync(path.join(__dirname, '..', 'employees.json'), 'utf8');
    employeesData = JSON.parse(data);
    console.log('?  „  Õ„Ì· »Ì«‰«  «·„œÌ—Ì‰ „‰ «·„·›');
} catch (error) {
    console.log('?? ”Ì „ «” Œœ«„ Redis ·· Œ“Ì‰');
}

// œÊ«· „”«⁄œ… ·· ⁄«„· „⁄ Redis √Ê «·„·›
async function getEmployeesData() {
    // ⁄·Ï Vercel ‰Õ«Ê· Redis √Ê·«
    if (process.env.VERCEL && redis) {
        try {
            const data = await redis.get('employees_data');
            if (data && data.employees && data.employees.length > 0) {
                console.log('?  „ Ã·» «·»Ì«‰«  „‰ Redis:', data.employees.length, '„ÊŸ›');
                return data;
            }
            console.log('?? Redis ›«—€° «” Œœ«„ employees.json');
        } catch (error) {
            console.error('? Œÿ√ ›Ì ﬁ—«¡… Redis:', error);
        }
    }
    // ﬁ—«¡… „‰ «·„·› œ«Ì„« ﬂ‹ fallback
    try {
        const raw = fs.readFileSync(path.join(__dirname, '..', 'employees.json'), 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.employees) {
            console.log('?  „ ﬁ—«¡… employees.json:', parsed.employees.length, '„ÊŸ›');
            return parsed;
        }
    } catch (e) {
        console.log('??  ⁄–—  ﬁ—«¡… employees.json° «” Œœ«„ «·»Ì«‰«  «·«› —«÷Ì…');
    }
    return employeesData;
}

async function saveEmployeesData(data) {
    console.log('?? „Õ«Ê·… Õ›Ÿ «·»Ì«‰« ...', {
        employeesCount: data.employees.length,
        isVercel: !!process.env.VERCEL,
        hasRedis: !!redis
    });
    
    if (redis && process.env.VERCEL) {
        try {
            await redis.set('employees_data', data);
            console.log('?  „ Õ›Ÿ «·»Ì«‰«  ›Ì Upstash Redis »‰Ã«Õ');
            
            // «· Õﬁﬁ „‰ «·Õ›Ÿ
            const saved = await redis.get('employees_data');
            console.log('?  „ «· Õﬁﬁ: ⁄œœ «·„œÌ—Ì‰ «·„Õ›ÊŸÌ‰:', saved?.employees?.length || 0);
            
            return true;
        } catch (error) {
            console.error('? Œÿ√ ›Ì Õ›Ÿ Redis:', error);
            return false;
        }
    } else {
        // Õ›Ÿ ›Ì „·› ·· ‘€Ì· «·„Õ·Ì
        try {
            fs.writeFileSync(
                path.join(__dirname, '..', 'employees.json'),
                JSON.stringify(data, null, 2)
            );
            employeesData = data;
            console.log('?  „ Õ›Ÿ «·»Ì«‰«  ›Ì «·„·› «·„Õ·Ì');
            return true;
        } catch (error) {
            console.error('? Œÿ√ ›Ì Õ›Ÿ «·„·›:', error);
            return false;
        }
    }
}

// ≈⁄œ«œ«  Twilio - ÌÃ»  ⁄ÌÌ‰Â« ›Ì .env √Ê Vercel Environment Variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_TWIML_APP_SID = process.env.TWILIO_TWIML_APP_SID;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER; // «·—ﬁ„ «·√„—ÌﬂÌ «·„‘ —Ï (Twilio Phone Number)
const TWILIO_PHONE_NUMBER_EGYPT = process.env.TWILIO_PHONE_NUMBER_EGYPT || '+201555512778'; // «·—ﬁ„ «·„’—Ì (Verified)
const TWILIO_PHONE_NUMBER_SAUDI = process.env.TWILIO_PHONE_NUMBER_SAUDI || '+966555254915'; // «·—ﬁ„ «·”⁄ÊœÌ (Verified)
const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
const TWILIO_API_SECRET = process.env.TWILIO_API_SECRET;

// œ«·… ··Õ’Ê· ⁄·Ï —ﬁ„ «·„ ’· «·„‰«”»
function getCallerIdNumber(callerId) {
    if (callerId === 'egypt') {
        console.log('?? «” Œœ«„ «·—ﬁ„ «·„’—Ì (Verified):', TWILIO_PHONE_NUMBER_EGYPT);
        return TWILIO_PHONE_NUMBER_EGYPT;
    }
    if (callerId === 'saudi') {
        console.log('?? «” Œœ«„ «·—ﬁ„ «·”⁄ÊœÌ (Verified):', TWILIO_PHONE_NUMBER_SAUDI);
        return TWILIO_PHONE_NUMBER_SAUDI;
    }
    // «·«› —«÷Ì: «·—ﬁ„ «·√„—ÌﬂÌ «·„‘ —Ï „‰ Twilio
    console.log('?? «” Œœ«„ «·—ﬁ„ «·√„—ÌﬂÌ (Twilio Number):', TWILIO_PHONE_NUMBER);
    return TWILIO_PHONE_NUMBER;
}

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error('? Œÿ√: ÌÃ»  ⁄ÌÌ‰ „ €Ì—«  Twilio ›Ì „·› .env');
    console.error('√‰‘∆ „·› .env Ê√÷›:');
    console.error('TWILIO_ACCOUNT_SID=your_account_sid');
    console.error('TWILIO_AUTH_TOKEN=your_auth_token');
    console.error('TWILIO_TWIML_APP_SID=your_twiml_app_sid');
    console.error('TWILIO_PHONE_NUMBER=your_twilio_number');
}

//  ÂÌ∆… ⁄„Ì· Twilio
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes ··’›Õ«  «·—∆Ì”Ì…
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'login.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'login.html'));
});

// Routes ··„·›«  «·À«» … (CSS, JS, Images)
app.get('/style.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, '..', 'style.css'));
});

app.get('/login-style.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, '..', 'login-style.css'));
});

app.get('/app.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, '..', 'app.js'));
});

app.get('/logo.jpg', (req, res) => {
    res.setHeader('Content-Type', 'image/jpeg');
    res.sendFile(path.join(__dirname, '..', 'logo.jpg'));
});

app.get('/icon-512.png', (req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(path.join(__dirname, '..', 'icon-512.png'));
});

app.get('/icon-192.png', (req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(path.join(__dirname, '..', 'icon-192.png'));
});

app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(path.join(__dirname, '..', 'manifest.json'));
});

app.get('/service-worker.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, '..', 'service-worker.js'));
});

// „⁄«·Ã   »⁄ «·⁄„·
app.all('/work-tracking', async (req, res) => {
    try {
        console.log('?? Work tracking request:', req.method, req.body);
        
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
        
        const { action, employeeId, employeeName, data } = req.body || {};

        if (!action || !employeeId) {
            console.log('? Missing action or employeeId');
            return res.status(400).json({ 
                error: 'ÌÃ»  ÕœÌœ action Ê employeeId' 
            });
        }
        
        console.log(`? Processing action: ${action} for employee: ${employeeId}`);

        const timestamp = new Date().toISOString();
        const date = new Date().toISOString().split('T')[0];

        switch (action) {
            case 'login':
                const loginKey = `work:${employeeId}:${date}`;
                let workSession = await kv.get(loginKey) || {
                    employeeId,
                    employeeName,
                    date,
                    loginTime: timestamp,
                    logoutTime: null,
                    totalMinutes: 0,
                    calls: [],
                    activities: []
                };

                if (!workSession.logoutTime && workSession.loginTime !== timestamp) {
                    workSession.activities.push({ type: 'login', time: timestamp });
                } else {
                    workSession.loginTime = timestamp;
                }

                await kv.set(loginKey, workSession);
                return res.status(200).json({ success: true, message: ' „  ”ÃÌ· «·œŒÊ·', session: workSession });

            case 'logout':
                const logoutKey = `work:${employeeId}:${date}`;
                let session = await kv.get(logoutKey);
                if (!session) return res.status(404).json({ error: '·„ Ì „ «·⁄ÀÊ— ⁄·Ï Ã·”…' });

                session.logoutTime = timestamp;
                const minutes = Math.floor((new Date(timestamp) - new Date(session.loginTime)) / 1000 / 60);
                session.totalMinutes = minutes;
                session.activities.push({ type: 'logout', time: timestamp });

                await kv.set(logoutKey, session);
                return res.status(200).json({ success: true, session });

            case 'activity':
                const activityKey = `work:${employeeId}:${date}`;
                let activitySession = await kv.get(activityKey);
                if (!activitySession) return res.status(404).json({ error: '·„ Ì „ «·⁄ÀÊ— ⁄·Ï Ã·”…' });

                const activity = { type: data?.type, time: timestamp, details: data?.details || {} };
                activitySession.activities.push(activity);

                if (data?.type === 'call') {
                    activitySession.calls.push({
                        time: timestamp,
                        phoneNumber: data.details?.phoneNumber,
                        duration: data.details?.duration,
                        status: data.details?.status
                    });
                }

                await kv.set(activityKey, activitySession);
                return res.status(200).json({ success: true, activity });

            case 'heartbeat':
                // ‰»÷ «·ﬁ·» ··„” Œœ„ «·„ ’·
                const heartbeatKey = `online:${employeeId}`;
                await kv.set(heartbeatKey, { employeeId, employeeName, lastSeen: timestamp }, { ex: 60 });
                return res.status(200).json({ success: true });

            default:
                return res.status(400).json({ error: 'Action €Ì— ’ÕÌÕ' });
        }

    } catch (error) {
        console.error('? Œÿ√ ›Ì   »⁄ «·⁄„·:', error);
        return res.status(500).json({ error: '›‘· ›Ì   »⁄ «·⁄„·', details: error.message });
    }
});

//  Ê·Ìœ Token ··⁄„Ì· (··„ﬂ«·„«  „‰ «·„ ’›Õ „»«‘—…)
app.get('/token', async (req, res) => {
    try {
        const identity = req.query.identity || 'employee_' + Date.now();
        
        console.log('??  Ê·Ìœ Token ··„œÌ—:', identity);
        console.log('?? Account SID:', TWILIO_ACCOUNT_SID);
        console.log('?? API Key exists:', !!TWILIO_API_KEY);
        console.log('?? TwiML App SID:', TWILIO_TWIML_APP_SID);
        
        // ≈‰‘«¡ API Key ÃœÌœ ≈–« ·„ Ìﬂ‰ „ÊÃÊœ
        let apiKey = TWILIO_API_KEY;
        let apiSecret = TWILIO_API_SECRET;
        
        if (!apiKey || !apiSecret) {
            console.log('?? ≈‰‘«¡ API Key ÃœÌœ...');
            try {
                const newKey = await twilioClient.newKeys.create({
                    friendlyName: 'Link Call Auto Key'
                });
                apiKey = newKey.sid;
                apiSecret = newKey.secret;
                console.log('? API Key ÃœÌœ  „ ≈‰‘«ƒÂ:', apiKey);
            } catch (error) {
                console.error('? ›‘· ≈‰‘«¡ API Key:', error.message);
                return res.status(500).json({ 
                    error: '›‘· ›Ì ≈‰‘«¡ API Key',
                    details: 'Ì—ÃÏ ≈‰‘«¡ API Key ÌœÊÌ« „‰ Twilio Console'
                });
            }
        }
        
        const AccessToken = twilio.jwt.AccessToken;
        const VoiceGrant = AccessToken.VoiceGrant;
        
        // «” Œœ«„ API Key «·’ÕÌÕ
        const token = new AccessToken(
            TWILIO_ACCOUNT_SID,
            apiKey,
            apiSecret,
            { 
                identity: identity,
                ttl: 3600 // ”«⁄… Ê«Õœ…
            }
        );

        const voiceGrant = new VoiceGrant({
            outgoingApplicationSid: TWILIO_TWIML_APP_SID,
            incomingAllow: true
        });

        token.addGrant(voiceGrant);
        
        const jwt = token.toJwt();
        console.log('? Token  „ ≈‰‘«ƒÂ »‰Ã«Õ');

        res.json({
            token: jwt,
            identity: identity
        });
    } catch (error) {
        console.error('? Œÿ√ ›Ì  Ê·Ìœ Token:', error);
        res.status(500).json({ 
            error: '›‘· ›Ì  Ê·Ìœ Token',
            details: error.message 
        });
    }
});

//  „ ‰ﬁ· /voice endpoint ··√”›· (··„ﬂ«·„«  «·Ê«—œ… „⁄ IVR)

// ≈Ã—«¡ „ﬂ«·„… »«” Œœ«„ Conference (··’Ê  «·À‰«∆Ì)
app.post('/make-direct-call', async (req, res) => {
    try {
        const { to } = req.body;
        
        console.log('?? »œ¡ Conference call ≈·Ï:', to);
        
        // —ﬁ„ «·„” Œœ„ «·«› —«÷Ì („Ê»«Ì·ﬂ)
        const userPhone = '+966559902557';
        
        // ≈‰‘«¡ conference ›—Ìœ
        const conferenceName = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const baseUrl = process.env.NGROK_URL || 'https://unacetic-nearly-tawanna.ngrok-free.dev';
        
        console.log('?? Conference:', conferenceName);
        console.log('?? „Ê»«Ì·ﬂ:', userPhone);
        console.log('?? «·—ﬁ„ «·„ÿ·Ê»:', to);
        
        // «·„ﬂ«·„… «·√Ê·Ï: «·« ’«· »„Ê»«Ì·ﬂ „⁄ —œ  ·ﬁ«∆Ì
        const call1 = await twilioClient.calls.create({
            url: `${baseUrl}/join-conference?conference=${encodeURIComponent(conferenceName)}&participant=user&to=${encodeURIComponent(to)}`,
            to: userPhone,
            from: TWILIO_PHONE_NUMBER,
            machineDetection: 'Enable', // ﬂ‘› «·—œ «·¬·Ì
            asyncAmd: 'true'
        });
        
        console.log('? « ’«· »„Ê»«Ì·ﬂ:', call1.sid);
        
        // «·«‰ Ÿ«— 1 À«‰Ì… ›ﬁÿ À„ «·« ’«· »«·ÿ—› «·¬Œ—
        setTimeout(async () => {
            try {
                const call2 = await twilioClient.calls.create({
                    url: `${baseUrl}/join-conference?conference=${encodeURIComponent(conferenceName)}&participant=other`,
                    to: to,
                    from: TWILIO_PHONE_NUMBER
                });
                
                console.log('? « ’«· »«·—ﬁ„ «·¬Œ—:', call2.sid);
            } catch (error) {
                console.error('? Œÿ√ ›Ì «·« ’«· »«·—ﬁ„ «·¬Œ—:', error);
            }
        }, 1000);
        
        res.json({
            success: true,
            callSid: call1.sid,
            conferenceName: conferenceName,
            status: call1.status
        });
    } catch (error) {
        console.error('? Œÿ√ ›Ì ≈Ã—«¡ «·„ﬂ«·„…:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// ==================== « ’«· „⁄ Verified Caller ID ====================
// Â–« «·‹ endpoint Ìœ⁄„ «·√—ﬁ«„ «·„Õﬁﬁ… («·”⁄ÊœÌ…/«·„’—Ì…) ⁄»— Conference

// «·ŒÿÊ… 1: «·„ ’›Õ Ì ’· »Â–« «·‹ endpoint ÊÌœŒ· Conference
app.post('/verified-outgoing-call', async (req, res) => {
    let toNumber = req.body.To;
    const employeeId = req.body.employeeId || 'unknown';
    const callerIdChoice = req.body.callerId || 'default';
    
    console.log('?? ================ „ﬂ«·„… Verified Caller ID ================');
    console.log('?? «·—ﬁ„ «·„ÿ·Ê»:', toNumber);
    console.log('?? „⁄—› «·„ÊŸ›:', employeeId);
    console.log('?? —ﬁ„ «·„ ’· «·„Œ «—:', callerIdChoice);
    
    //  ‰ŸÌ› «·—ﬁ„
    if (toNumber) {
        toNumber = toNumber.replace(/[\u200E\u200F\u202A\u202B\u202C\u202D\u202E\uFEFF\s\-\(\)]/g, '');
    }
    
    const twiml = new twilio.twiml.VoiceResponse();
    
    // ≈–« ﬂ«‰ «·—ﬁ„ «·„Œ «— ÂÊ «·√„—ÌﬂÌ (default)° «” Œœ„ «·ÿ—Ìﬁ… «·⁄«œÌ…
    if (callerIdChoice === 'default' || !toNumber) {
        console.log('?? «” Œœ«„ «·ÿ—Ìﬁ… «·⁄«œÌ… («·—ﬁ„ «·√„—ÌﬂÌ)');
        if (toNumber) {
            const dial = twiml.dial({
                callerId: TWILIO_PHONE_NUMBER,
                record: 'record-from-answer',
                recordingStatusCallback: `/recording-status?employeeId=${employeeId}&to=${encodeURIComponent(toNumber)}`,
                recordingStatusCallbackEvent: ['completed'],
                timeout: 30,
                answerOnBridge: true
            });
            dial.number(toNumber);
        } else {
            twiml.say({ voice: 'Polly.Zeina', language: 'ar-AE' }, '·„ Ì „  ÕœÌœ —ﬁ„ ··« ’«·');
        }
        res.type('text/xml');
        return res.send(twiml.toString());
    }
    
    // ··√—ﬁ«„ «·„Õﬁﬁ… («·”⁄ÊœÌ…/«·„’—Ì…) - «” Œœ«„ Conference
    const conferenceName = `verified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const selectedCallerNumber = getCallerIdNumber(callerIdChoice);
    
    console.log('??? «·—ﬁ„ «·„Õﬁﬁ:', selectedCallerNumber);
    console.log('?? Conference:', conferenceName);
    
    // ≈÷«›… «·„ ’›Õ ··‹ Conference
    const dial = twiml.dial({
        timeout: 60
    });
    dial.conference({
        startConferenceOnEnter: true,
        endConferenceOnExit: true,
        beep: false,
        waitUrl: 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical',
        statusCallback: `/conference-status?employeeId=${employeeId}&to=${encodeURIComponent(toNumber)}`,
        statusCallbackEvent: ['start', 'end', 'join', 'leave']
    }, conferenceName);
    
    // ≈—”«· TwiML ··„ ’›Õ ›Ê—«
    res.type('text/xml');
    res.send(twiml.toString());
    
    // «·¬‰ ‰ ’· »«·⁄„Ì· ⁄»— REST API „‰ «·—ﬁ„ «·„Õﬁﬁ
    const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : (process.env.NGROK_URL || 'https://link-call-jade.vercel.app');
    
    setTimeout(async () => {
        try {
            console.log('?? Ã«—Ì «·« ’«· »«·⁄„Ì· „‰ «·—ﬁ„ «·„Õﬁﬁ...');
            const call = await twilioClient.calls.create({
                url: `${baseUrl}/join-verified-conference?conference=${encodeURIComponent(conferenceName)}&employeeId=${employeeId}`,
                to: toNumber,
                from: selectedCallerNumber, // «·—ﬁ„ «·„Õﬁﬁ («·”⁄ÊœÌ √Ê «·„’—Ì)
                statusCallback: `${baseUrl}/call-status-webhook?employeeId=${employeeId}`,
                statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
                record: true,
                recordingStatusCallback: `${baseUrl}/recording-status?employeeId=${employeeId}&to=${encodeURIComponent(toNumber)}`,
                recordingStatusCallbackEvent: ['completed']
            });
            console.log('?  „ ≈‰‘«¡ «·„ﬂ«·„… ··⁄„Ì·:', call.sid);
            
            // Õ›Ÿ ⁄·«ﬁ… «·„ﬂ«·„…
            await saveCallEmployeeMapping(call.sid, employeeId, toNumber);
        } catch (error) {
            console.error('? Œÿ√ ›Ì «·« ’«· »«·⁄„Ì·:', error.message);
        }
    }, 1000); // «‰ Ÿ«— À«‰Ì… ·ÌœŒ· «·„ ’›Õ √Ê·«
});

// TwiML ·≈÷«›… «·⁄„Ì· ··‹ Conference
app.all('/join-verified-conference', (req, res) => {
    const conferenceName = req.query.conference || req.body.conference;
    const employeeId = req.query.employeeId || 'unknown';
    
    console.log('?? ≈÷«›… «·⁄„Ì· ··‹ Conference:', conferenceName);
    
    const twiml = new twilio.twiml.VoiceResponse();
    
    // —”«·…  —ÕÌ» ··⁄„Ì·
    twiml.say({ 
        voice: 'Polly.Zeina', 
        language: 'ar-AE' 
    }, 'Ã«—Ì  Ê’Ì·ﬂ° «·—Ã«¡ «·«‰ Ÿ«—');
    
    const dial = twiml.dial();
    dial.conference({
        startConferenceOnEnter: true,
        endConferenceOnExit: false,
        beep: false
    }, conferenceName);
    
    res.type('text/xml');
    res.send(twiml.toString());
});

// Õ«·… Conference
app.post('/conference-status', (req, res) => {
    console.log('?? Conference Status:', {
        conferenceSid: req.body.ConferenceSid,
        statusCallbackEvent: req.body.StatusCallbackEvent,
        friendlyName: req.body.FriendlyName
    });
    res.sendStatus(200);
});

// ==================== ‰Â«Ì… Verified Caller ID ====================

// ==================== Plivo Calling (»œÌ· „Õ·Ì √—Œ’) ====================

// «·« ’«· ⁄»— Plivo (··√—ﬁ«„ «·„Õ·Ì… «·„’—Ì…/«·”⁄ÊœÌ…)
app.post('/plivo-call', async (req, res) => {
    if (!plivoClient) {
        return res.status(400).json({ 
            error: 'Plivo €Ì— „ı⁄œ. √÷› PLIVO_AUTH_ID Ê PLIVO_AUTH_TOKEN ›Ì Vercel',
            setupUrl: 'https://console.plivo.com/dashboard/'
        });
    }
    
    const { to, from, employeeId } = req.body;
    
    console.log('?? ================ Plivo Call ================');
    console.log('?? ≈·Ï:', to);
    console.log('?? „‰:', from || PLIVO_PHONE_NUMBER);
    console.log('?? «·„ÊŸ›:', employeeId);
    
    try {
        const baseUrl = 'https://link-call-jade.vercel.app';
        
        const call = await plivoClient.calls.create(
            from || PLIVO_PHONE_NUMBER, // «·—ﬁ„ «·„’—Ì/«·”⁄ÊœÌ „‰ Plivo
            to,
            `${baseUrl}/plivo-answer?employeeId=${employeeId}`,
            {
                answerMethod: 'POST',
                hangupUrl: `${baseUrl}/plivo-hangup?employeeId=${employeeId}`,
                hangupMethod: 'POST',
                record: true,
                recordingCallbackUrl: `${baseUrl}/plivo-recording?employeeId=${employeeId}`,
                recordingCallbackMethod: 'POST'
            }
        );
        
        console.log('? Plivo Call created:', call.requestUuid);
        res.json({ 
            success: true, 
            callId: call.requestUuid,
            message: 'Ã«—Ì «·« ’«· ⁄»— Plivo'
        });
    } catch (error) {
        console.error('? Plivo Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Plivo Answer XML
app.all('/plivo-answer', (req, res) => {
    const employeeId = req.query.employeeId;
    console.log('?? Plivo Answer - Employee:', employeeId);
    
    // Plivo XML („‘«»Â ·‹ TwiML)
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
        <Speak language="ar">Ã«—Ì  Ê’Ì·ﬂ »«·Œœ„…</Speak>
        <Record maxLength="3600" recordSession="true" redirect="false"/>
    </Response>`;
    
    res.type('application/xml');
    res.send(xml);
});

// Plivo Hangup
app.post('/plivo-hangup', (req, res) => {
    console.log('?? Plivo Hangup:', req.body);
    res.sendStatus(200);
});

// Plivo Recording Callback
app.post('/plivo-recording', async (req, res) => {
    console.log('??? Plivo Recording:', req.body);
    
    const recordingUrl = req.body.RecordingUrl;
    const callUuid = req.body.CallUUID;
    const employeeId = req.query.employeeId;
    
    if (recordingUrl && redis) {
        try {
            // Õ›Ÿ «· ”ÃÌ·
            const recording = {
                sid: callUuid,
                recordingUrl: recordingUrl,
                duration: req.body.RecordingDuration,
                employeeId: employeeId,
                provider: 'plivo',
                createdAt: new Date().toISOString()
            };
            
            await redis.lpush('recordings', JSON.stringify(recording));
            console.log('? Plivo recording saved');
        } catch (error) {
            console.error('? Error saving Plivo recording:', error);
        }
    }
    
    res.sendStatus(200);
});

// Ã·» √—ﬁ«„ Plivo «·„ «Õ…
app.get('/plivo-numbers', async (req, res) => {
    if (!plivoClient) {
        return res.json({ 
            available: false,
            message: 'Plivo €Ì— „ı⁄œ',
            numbers: []
        });
    }
    
    try {
        const numbers = await plivoClient.numbers.list();
        res.json({ 
            available: true,
            numbers: numbers.map(n => ({
                number: n.number,
                country: n.country,
                type: n.type
            }))
        });
    } catch (error) {
        res.json({ 
            available: true,
            error: error.message,
            numbers: PLIVO_PHONE_NUMBER ? [{ number: PLIVO_PHONE_NUMBER }] : []
        });
    }
});

// Õ«·… Plivo
app.get('/plivo-status', (req, res) => {
    res.json({
        configured: !!plivoClient,
        phoneNumber: PLIVO_PHONE_NUMBER || null,
        setupUrl: 'https://console.plivo.com/dashboard/'
    });
});

// ==================== ‰Â«Ì… Plivo ====================

// ==================== Zadarma Integration (√—ﬁ«„ „’—Ì…!) ====================
const crypto = require('crypto');

// œ«·…  ÊﬁÌ⁄ ÿ·»«  Zadarma
function signZadarmaRequest(method, params) {
    const sortedParams = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('');
    const signStr = method + sortedParams + ZADARMA_SECRET;
    return crypto.createHash('md5').update(signStr).digest('hex');
}

// «·« ’«· ⁄»— Zadarma (··—ﬁ„ «·„’—Ì)
app.post('/zadarma-call', async (req, res) => {
    if (!ZADARMA_KEY || !ZADARMA_SECRET) {
        return res.status(400).json({ 
            error: 'Zadarma €Ì— „ı⁄œ',
            setupSteps: [
                '1. ”Ã· ›Ì https://zadarma.com/',
                '2. «‘ —Ì —ﬁ„ „’—Ì „‰ Virtual Numbers',
                '3. «–Â» ≈·Ï Settings ? API Ê«‰”Œ Key Ê Secret',
                '4. √÷›Â„ ›Ì Vercel: ZADARMA_KEY, ZADARMA_SECRET, ZADARMA_SIP, ZADARMA_PHONE'
            ]
        });
    }
    
    const { to, employeeId } = req.body;
    
    console.log('?? ================ Zadarma Call („’—) ================');
    console.log('?? ≈·Ï:', to);
    console.log('?? „‰ («·—ﬁ„ «·„’—Ì):', ZADARMA_PHONE);
    console.log('?? «·„ÊŸ›:', employeeId);
    
    try {
        // Zadarma API - ≈Ã—«¡ „ﬂ«·„…
        const params = {
            from: ZADARMA_SIP, // SIP «·œ«Œ·Ì
            to: to,
            predicted_dst: to,
            caller_id: ZADARMA_PHONE // «·—ﬁ„ «·„’—Ì «·–Ì ”ÌŸÂ— ··⁄„Ì·
        };
        
        const signature = signZadarmaRequest('/v1/request/callback/', params);
        
        const response = await fetch('https://api.zadarma.com/v1/request/callback/', {
            method: 'POST',
            headers: {
                'Authorization': `${ZADARMA_KEY}:${signature}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams(params).toString()
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            console.log('? Zadarma Call created');
            res.json({ 
                success: true, 
                message: 'Ã«—Ì «·« ’«· „‰ «·—ﬁ„ «·„’—Ì ⁄»— Zadarma',
                callerId: ZADARMA_PHONE
            });
        } else {
            console.error('? Zadarma Error:', result);
            res.status(400).json({ error: result.message || '›‘· «·« ’«·' });
        }
    } catch (error) {
        console.error('? Zadarma Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Õ«·… Zadarma
app.get('/zadarma-status', (req, res) => {
    res.json({
        configured: !!(ZADARMA_KEY && ZADARMA_SECRET),
        phoneNumber: ZADARMA_PHONE || null,
        sipId: ZADARMA_SIP || null,
        setupUrl: 'https://zadarma.com/',
        pricing: 'https://zadarma.com/en/tariffs/calls/'
    });
});

// ==================== ‰Â«Ì… Zadarma ====================

// TwiML »”Ìÿ ··« ’«· «·„»«‘—
app.all('/simple-dial', (req, res) => {
    const toNumber = req.query.to || req.body.to;
    
    console.log('?? TwiML ··« ’«· »‹:', toNumber);
    
    const twiml = new twilio.twiml.VoiceResponse();
    
    if (toNumber) {
        twiml.dial(toNumber);
    } else {
        twiml.say('No number provided');
    }
    
    res.type('text/xml');
    res.send(twiml.toString());
});

// TwiML ··„ﬂ«·„«  «·’«œ—… „‰ «·„ ’›Õ (Voice URL ·‹ TwiML App)
// Õ›Ÿ „⁄—›«  «·„œÌ—Ì‰ ··„ﬂ«·„«  (›Ì «·–«ﬂ—… „ƒﬁ «)
//  Œ“Ì‰ ⁄·«ﬁ… «·„ﬂ«·„«  »«·„œÌ—Ì‰ ›Ì Redis
async function saveCallEmployeeMapping(callSid, employeeId, toNumber = null) {
    try {
        if (redis) {
            const data = { employeeId };
            if (toNumber) {
                data.to = toNumber;
            }
            await redis.set(`call:${callSid}`, JSON.stringify(data), { ex: 604800 }); // Õ›Ÿ ·„œ… 7 √Ì«„
            console.log(`? Õ›Ÿ ⁄·«ﬁ… «·„ﬂ«·„… ${callSid} »«·„œÌ— ${employeeId}${toNumber ? ' Ê—ﬁ„ ' + toNumber : ''}`);
        }
    } catch (error) {
        console.error('Œÿ√ ›Ì Õ›Ÿ ⁄·«ﬁ… «·„ﬂ«·„…:', error);
    }
}

async function getCallEmployeeId(callSid) {
    try {
        if (redis) {
            const data = await redis.get(`call:${callSid}`);
            if (data) {
                // «· ⁄«„· „⁄ «·»Ì«‰«  «·ﬁœÌ„… (‰’ ›ﬁÿ) Ê«·ÃœÌœ… (JSON)
                try {
                    const parsed = JSON.parse(data);
                    return parsed;
                } catch {
                    // »Ì«‰«  ﬁœÌ„… - „Ã—œ employeeId
                    return { employeeId: data, to: null };
                }
            }
        }
    } catch (error) {
        console.error('Œÿ√ ›Ì Ã·» „⁄—› «·„œÌ—:', error);
    }
    return null;
}

app.post('/outgoing-call', async (req, res) => {
    let toNumber = req.body.To;
    const employeeId = req.body.employeeId || 'unknown';
    const callerIdChoice = req.body.callerId || 'default';
    
    console.log('?? ================ „ﬂ«·„… ’«œ—… ÃœÌœ… ================');
    console.log('?? «·—ﬁ„ «·√’·Ì:', toNumber);
    console.log('?? „⁄—› «·„œÌ—:', employeeId);
    console.log('?? —ﬁ„ «·„ ’· «·„Œ «—:', callerIdChoice);
    
    //  ‰ŸÌ› «·—ﬁ„
    if (toNumber) {
        toNumber = toNumber.replace(/[\u200E\u200F\u202A\u202B\u202C\u202D\u202E\uFEFF\s\-\(\)]/g, '');
        
        if (toNumber.match(/^\+9660[1-9]\d{7,8}$/)) {
            toNumber = toNumber.replace(/^\+9660/, '+966');
        } else if (toNumber.match(/^\+200\d+$/)) {
            toNumber = toNumber.replace(/^\+200/, '+20');
        }
    }
    
    console.log('?? «·—ﬁ„ «·‰Â«∆Ì:', toNumber);
    
    const twiml = new twilio.twiml.VoiceResponse();
    
    // ========== «Œ Ì«— «·ÿ—Ìﬁ… Õ”» —ﬁ„ «·„ ’· ==========
    
    // «·ÿ—Ìﬁ… 1: «·—ﬁ„ «·√„—ÌﬂÌ («·«› —«÷Ì) - «·ÿ—Ìﬁ… «·⁄«œÌ…
    if (callerIdChoice === 'default' || !toNumber) {
        console.log('?? «” Œœ«„ «·—ﬁ„ «·√„—ÌﬂÌ (ÿ—Ìﬁ… ⁄«œÌ…)');
        if (toNumber) {
            const dial = twiml.dial({
                callerId: TWILIO_PHONE_NUMBER,
                record: 'record-from-answer',
                recordingStatusCallback: `/recording-status?employeeId=${employeeId}&to=${encodeURIComponent(toNumber)}`,
                recordingStatusCallbackEvent: ['completed'],
                statusCallback: `/call-status-webhook?employeeId=${employeeId}`,
                statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
                timeout: 30,
                answerOnBridge: true
            });
            dial.number(toNumber);
        } else {
            twiml.say({ voice: 'Polly.Zeina', language: 'ar-AE' }, '·„ Ì „  ÕœÌœ —ﬁ„ ··« ’«·');
        }
        res.type('text/xml');
        return res.send(twiml.toString());
    }
    
    // «·ÿ—Ìﬁ… 2: «·√—ﬁ«„ «·„Õﬁﬁ… («·”⁄ÊœÌ…/«·„’—Ì…) - «” Œœ«„ Conference + REST API
    console.log('?? «” Œœ«„ —ﬁ„ „Õﬁﬁ (Verified) - ÿ—Ìﬁ… Conference');
    
    const selectedCallerNumber = getCallerIdNumber(callerIdChoice);
    const conferenceName = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('??? «·—ﬁ„ «·„Õﬁﬁ:', selectedCallerNumber);
    console.log('?? Conference:', conferenceName);
    
    // ≈÷«›… «·„ ’›Õ ··‹ Conference
    const dial = twiml.dial({ timeout: 60 });
    dial.conference({
        startConferenceOnEnter: true,
        endConferenceOnExit: true,
        beep: false,
        waitUrl: 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical'
    }, conferenceName);
    
    // ≈—”«· TwiML ··„ ’›Õ
    res.type('text/xml');
    res.send(twiml.toString());
    
    // «·¬‰ «·« ’«· »«·⁄„Ì· „‰ «·—ﬁ„ «·„Õﬁﬁ ⁄»— REST API
    const baseUrl = 'https://link-call-jade.vercel.app';
    
    setTimeout(async () => {
        try {
            console.log('?? Ã«—Ì «·« ’«· »«·⁄„Ì· „‰ «·—ﬁ„ «·„Õﬁﬁ...');
            const call = await twilioClient.calls.create({
                url: `${baseUrl}/join-conference-twiml?conference=${encodeURIComponent(conferenceName)}`,
                to: toNumber,
                from: selectedCallerNumber,
                statusCallback: `${baseUrl}/call-status-webhook?employeeId=${employeeId}`,
                statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
                record: true,
                recordingStatusCallback: `${baseUrl}/recording-status?employeeId=${employeeId}&to=${encodeURIComponent(toNumber)}`,
                recordingStatusCallbackEvent: ['completed']
            });
            console.log('?  „ «·« ’«· »«·⁄„Ì·:', call.sid);
            await saveCallEmployeeMapping(call.sid, employeeId, toNumber);
        } catch (error) {
            console.error('? Œÿ√ ›Ì «·« ’«· »«·⁄„Ì·:', error.message);
        }
    }, 1500);
});

// TwiML ·≈÷«›… «·⁄„Ì· ··‹ Conference
app.all('/join-conference-twiml', (req, res) => {
    const conferenceName = req.query.conference;
    console.log('?? ≈÷«›… «·⁄„Ì· ··‹ Conference:', conferenceName);
    
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say({ voice: 'Polly.Zeina', language: 'ar-AE' }, 'Ã«—Ì  Ê’Ì·ﬂ');
    
    const dial = twiml.dial();
    dial.conference({
        startConferenceOnEnter: true,
        endConferenceOnExit: false,
        beep: false
    }, conferenceName);
    
    res.type('text/xml');
    res.send(twiml.toString());
});

// «·Õ’Ê· ⁄·Ï Õ«·… «·„ﬂ«·„…
app.get('/call-status/:callSid', async (req, res) => {
    try {
        const call = await twilioClient.calls(req.params.callSid).fetch();
        console.log(`?? Õ«·… «·„ﬂ«·„… ${req.params.callSid}: ${call.status}`);
        res.json({
            status: call.status,
            duration: call.duration,
            direction: call.direction,
            startTime: call.startTime,
            endTime: call.endTime
        });
    } catch (error) {
        console.error('Œÿ√ ›Ì Ã·» Õ«·… «·„ﬂ«·„…:', error);
        res.status(500).json({ error: error.message });
    }
});

// ≈‰Â«¡ „ﬂ«·„…
app.post('/end-call', async (req, res) => {
    try {
        const { callSid } = req.body;
        await twilioClient.calls(callSid).update({ status: 'completed' });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Œÿ√ ›Ì ≈‰Â«¡ «·„ﬂ«·„…:', error);
        res.status(500).json({ error: error.message });
    }
});

// TwiML ··«‰÷„«„ ≈·Ï Conference
app.post('/join-conference', (req, res) => {
    const conferenceName = req.query.conference;
    const participant = req.query.participant;
    const toNumber = req.query.to;
    const twiml = new twilio.twiml.VoiceResponse();
    
    console.log('?? «‰÷„«„ ≈·Ï Conference:', conferenceName, '- œÊ—:', participant);
    
    if (participant === 'user') {
        // «·„” Œœ„ („Ê»«Ì·ﬂ) - —”«·…  Ê÷ÌÕÌ…
        if (toNumber) {
            twiml.say({ 
                voice: 'Polly.Zeina', 
                language: 'ar-AE' 
            }, `Ã«—Ì «·« ’«· »«·—ﬁ„ ${toNumber.replace(/\+966/, '').replace(/\+20/, '')}`);
        } else {
            twiml.say({ voice: 'Polly.Zeina', language: 'ar-AE' }, 'Ã«—Ì  Ê’Ì· «·„ﬂ«·„…');
        }
    }
    
    // ≈÷«›… «·„‘«—ﬂ ≈·Ï Conference
    const dial = twiml.dial();
    dial.conference({
        startConferenceOnEnter: true,  // »œ¡ Conference ›Ê—«
        endConferenceOnExit: participant === 'user', // ≈‰Â«¡ ·„«  ﬁ›· «‰ 
        waitUrl: 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical',
        beep: false,
        record: 'record-from-start',
        recordingStatusCallback: `${process.env.NGROK_URL || 'https://unacetic-nearly-tawanna.ngrok-free.dev'}/recording-status`
    }, conferenceName);
    
    res.type('text/xml');
    res.send(twiml.toString());
});

// ==================== «” ﬁ»«· «·„ﬂ«·„«  ›Ì «·„ ’›Õ ====================

// «” ﬁ»«· „ﬂ«·„… Ê«—œ… Ê ÕÊÌ·Â« ··„ ’›Õ „»«‘—…
app.post('/incoming-to-browser', async (req, res) => {
    const fromNumber = req.body.From || 'Unknown';
    const toNumber = req.body.To || '';
    const callSid = req.body.CallSid;
    
    console.log('?? ================ „ﬂ«·„… Ê«—œ… ··„ ’›Õ ================');
    console.log('?? „‰:', fromNumber);
    console.log('?? ≈·Ï:', toNumber);
    console.log('?? Call SID:', callSid);
    
    const twiml = new twilio.twiml.VoiceResponse();
    
    // «·»ÕÀ ⁄‰ «·„ÿÊ— «·„ ’· («·„ «Õ ›Ì «·„ ’›Õ)
    // «” Œœ«„ identity «·„ÿÊ— «·—∆Ì”Ì
    const defaultIdentity = 'client_admin'; // «·„ÿÊ— «·—∆Ì”Ì
    
    console.log('??  ÊÃÌÂ «·„ﬂ«·„… ··‹ Client:', defaultIdentity);
    
    // —”«·… ··„ ’· √À‰«¡ «·«‰ Ÿ«—
    twiml.say({
        voice: 'Polly.Zeina',
        language: 'ar-AE'
    }, 'Ã«—Ì  Ê’Ì·ﬂ° «·—Ã«¡ «·«‰ Ÿ«—');
    
    //  ÕÊÌ· «·„ﬂ«·„… ··„ ’›Õ
    const dial = twiml.dial({
        callerId: fromNumber,
        timeout: 30,
        record: 'record-from-answer',
        recordingStatusCallback: '/recording-status?employeeId=admin',
        recordingStatusCallbackEvent: ['completed'],
        action: '/incoming-call-status',
        method: 'POST'
    });
    
    // «·« ’«· »«·‹ Client ›Ì «·„ ’›Õ
    // ”Ì „  ÊÃÌÂ «·„ﬂ«·„… ·ﬂ· «·‹ clients «·„”Ã·Ì‰ »Â–« «·‹ identity
    dial.client({
        statusCallback: '/client-call-status',
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
    }, defaultIdentity);
    
    // ≈–« ·„ Ì—œ √Õœ
    twiml.say({
        voice: 'Polly.Zeina',
        language: 'ar-AE'
    }, '⁄–—«° ·« ÌÊÃœ √Õœ „ «Õ Õ«·Ì«. Ì—ÃÏ «·„Õ«Ê·… ·«Õﬁ«.');
    
    res.type('text/xml');
    res.send(twiml.toString());
});

// „⁄«·Ã… Õ«·… «·„ﬂ«·„… «·Ê«—œ…
app.post('/incoming-call-status', (req, res) => {
    console.log('?? Õ«·… «·„ﬂ«·„… «·Ê«—œ…:', {
        callSid: req.body.CallSid,
        dialCallStatus: req.body.DialCallStatus,
        dialCallDuration: req.body.DialCallDuration
    });
    
    const twiml = new twilio.twiml.VoiceResponse();
    
    // ≈–« ·„ Ì „ «·—œ
    if (req.body.DialCallStatus !== 'completed') {
        twiml.say({
            voice: 'Polly.Zeina',
            language: 'ar-AE'
        }, '⁄–—«° ·„ Ì „ «·—œ. ‘ﬂ—« ·« ’«·ﬂ.');
    }
    
    res.type('text/xml');
    res.send(twiml.toString());
});

// Õ«·… «·‹ Client call
app.post('/client-call-status', (req, res) => {
    console.log('?? Õ«·… Client Call:', {
        callSid: req.body.CallSid,
        callStatus: req.body.CallStatus
    });
    res.sendStatus(200);
});

// ==================== ‰Â«Ì… «” ﬁ»«· «·„ﬂ«·„«  ====================

// TwiML ··„ﬂ«·„«  «·Ê«—œ… - ‰Ÿ«„ IVR
app.post('/voice', (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();
    
    console.log('?? „ﬂ«·„… Ê«—œ… „‰:', req.body.From);
    
    // «·—”«·… «· —ÕÌ»Ì… „⁄ «·ﬁ«∆„…
    const gather = twiml.gather({
        numDigits: 1,
        action: '/ivr-response',
        method: 'POST',
        timeout: 10
    });
    
    gather.say({
        voice: 'Polly.Zeina',
        language: 'ar-AE'
    }, '„—Õ»« »ﬂ ›Ì ‘—ﬂ… «·„”«— «·”«Œ‰ ··”›— Ê«·”Ì«Õ…. ' +
       '·ÕÃ“ ÊÕœ«  «·÷Ì«›… Ê«·›‰«œﬁ «÷€ÿ Ê«Õœ. ' +
       '· √ÃÌ— «·”Ì«—«  «÷€ÿ «À‰Ì‰. ' +
       '··»—«„Ã Ê«·ÃÊ·«  «·”Ì«ÕÌ… «÷€ÿ À·«À…. ' +
       '·· ÕœÀ „⁄ Œœ„… «·⁄„·«¡ «÷€ÿ ’›—. ' +
       '· ﬁœÌ„ ‘ﬂÊÏ «÷€ÿ  ”⁄….');
    
    // ≈–« ·„ ÌŒ — «·⁄„Ì· ‘Ì¡
    twiml.say({
        voice: 'Polly.Zeina',
        language: 'ar-AE'
    }, '·„ ‰ ·ﬁ √Ì «Œ Ì«—. ‘ﬂ—« ·« ’«·ﬂ »‰«.');
    
    res.type('text/xml');
    res.send(twiml.toString());
});

// „⁄«·Ã… «Œ Ì«— «·⁄„Ì· „‰ IVR
app.post('/ivr-response', async (req, res) => {
    const digit = req.body.Digits;
    const twiml = new twilio.twiml.VoiceResponse();
    
    console.log('?? «·⁄„Ì· «Œ «—:', digit);
    
    // «·Õ’Ê· ⁄·Ï »Ì«‰«  «·„œÌ—Ì‰
    const data = await getEmployeesData();
    const department = data.departments[digit];
    
    if (department && department.employees.length > 0) {
        // «Œ Ì«— „œÌ— ⁄‘Ê«∆Ì (√Ê √Ê· „œÌ— „ «Õ)
        const employeePhone = department.employees[0];
        
        twiml.say({
            voice: 'Polly.Zeina',
            language: 'ar-AE'
        }, `Ã«—Ì  ÕÊÌ·ﬂ ≈·Ï ﬁ”„ ${department.name}. «·—Ã«¡ «·«‰ Ÿ«—.`);
        
        //  ÕÊÌ· «·„ﬂ«·„… ··„œÌ—
        const dial = twiml.dial({
            timeout: 30,
            callerId: TWILIO_PHONE_NUMBER
        });
        dial.number(employeePhone);
        
        // ≈–« ·„ Ì—œ «·„œÌ—
        twiml.say({
            voice: 'Polly.Zeina',
            language: 'ar-AE'
        }, '⁄–—«° Ã„Ì⁄ „œÌ—Ì‰« „‘€Ê·Ê‰ Õ«·Ì«. Ì—ÃÏ «·„Õ«Ê·… ·«Õﬁ«. ‘ﬂ—« ·« ’«·ﬂ »‰«.');
    } else {
        // ·« ÌÊÃœ „œÌ—Ì‰ „ «ÕÌ‰ ›Ì Â–« «·ﬁ”„
        twiml.say({
            voice: 'Polly.Zeina',
            language: 'ar-AE'
        }, '⁄–—«° Â–« «·ﬁ”„ €Ì— „ «Õ Õ«·Ì«. Ì—ÃÏ «·„Õ«Ê·… ·«Õﬁ«. ‘ﬂ—« ·« ’«·ﬂ »‰«.');
    }
    
    res.type('text/xml');
    res.send(twiml.toString());
});

// webhook ·„ «»⁄… √Õœ«À «·„ﬂ«·„…
app.post('/call-events', (req, res) => {
    console.log('?? ÕœÀ „ﬂ«·„…:', {
        CallSid: req.body.CallSid,
        CallStatus: req.body.CallStatus,
        Duration: req.body.CallDuration
    });
    res.sendStatus(200);
});

// „⁄«·Ã… Õ«·… «· ”ÃÌ·
// webhook ·Õ«·… «·„ﬂ«·„…
app.post('/call-status-webhook', async (req, res) => {
    const callSid = req.body.CallSid;
    const employeeId = req.query.employeeId || req.body.employeeId;
    const callStatus = req.body.CallStatus;
    const toNumber = req.body.To || req.body.Called;
    
    console.log(`?? Õ«·… «·„ﬂ«·„… ${callSid}: ${callStatus}, „œÌ—: ${employeeId}, ≈·Ï: ${toNumber}`);
    
    // Õ›Ÿ ⁄·«ﬁ… «·„ﬂ«·„… »«·„œÌ— Ê—ﬁ„ «·Â« › ›Ì Ã„Ì⁄ «·Õ«·« 
    if (callSid && employeeId) {
        await saveCallEmployeeMapping(callSid, employeeId, toNumber);
        console.log(`?  „ —»ÿ «·„ﬂ«·„… ${callSid} »«·„œÌ— ${employeeId}`);
    }
    
    res.sendStatus(200);
});

app.post('/recording-status', async (req, res) => {
    const recordingSid = req.body.RecordingSid;
    const callSid = req.body.CallSid;
    const employeeId = req.query.employeeId || req.body.employeeId;
    const toNumber = req.query.to || req.body.To || req.body.Called;
    
    console.log('?  „ ≈ﬂ„«· «· ”ÃÌ·:', recordingSid);
    console.log('?? „ﬂ«·„…:', callSid);
    console.log('?? „œÌ—:', employeeId);
    console.log('?? ≈·Ï:', toNumber);
    console.log('?? „œ…:', req.body.RecordingDuration);
    
    // Õ›Ÿ ⁄·«ﬁ… «· ”ÃÌ· »«·„œÌ— Ê—ﬁ„ «·Â« › (backup)
    if (callSid && employeeId) {
        await saveCallEmployeeMapping(callSid, employeeId, toNumber);
        console.log(`?  „  √ﬂÌœ —»ÿ «· ”ÃÌ· ${callSid} »«·„œÌ— ${employeeId}`);
    }
    
    res.sendStatus(200);
});

// »œ¡  ”ÃÌ· „ﬂ«·„… ‰‘ÿ…
app.post('/start-recording', async (req, res) => {
    try {
        const { callSid } = req.body;
        
        const recording = await twilioClient.calls(callSid)
            .recordings
            .create({
                recordingChannels: 'dual',
                recordingStatusCallback: '/recording-status',
                recordingStatusCallbackEvent: ['completed']
            });
        
        res.json({
            success: true,
            recordingSid: recording.sid
        });
    } catch (error) {
        console.error('Œÿ√ ›Ì »œ¡ «· ”ÃÌ·:', error);
        res.status(500).json({ error: '›‘· ›Ì »œ¡ «· ”ÃÌ·' });
    }
});

// Ã·» ﬁ«∆„… «· ”ÃÌ·« 
app.get('/recordings', async (req, res) => {
    try {
        const { employeeId, viewAll } = req.query;
        console.log('?? Ã·» «· ”ÃÌ·«  - employeeId:', employeeId, 'viewAll:', viewAll);
        
        const recordings = await twilioClient.recordings.list({ limit: 50 });
        
        // Ã·» „⁄·Ê„«  «·„ﬂ«·„«  ·ﬂ·  ”ÃÌ·
        const recordingsData = await Promise.all(recordings.map(async (recording) => {
            try {
                // «·»ÕÀ ⁄‰ „⁄—› «·„œÌ— Ê—ﬁ„ «·Â« › „‰ KV √Ê·«
                const callData = await getCallEmployeeId(recording.callSid);
                let recordingEmployeeId = callData?.employeeId || null;
                let savedToNumber = callData?.to || null;
                
                // Ã·» „⁄·Ê„«  «·„ﬂ«·„…
                const call = await twilioClient.calls(recording.callSid).fetch();
                
                // ≈–« ·„ ‰Ãœ ›Ì KV° ‰Õ«Ê· «” Œ—«ÃÂ „‰ StatusCallback URL
                if (!recordingEmployeeId && recording.uri) {
                    const match = recording.uri.match(/employeeId=([^&]+)/);
                    if (match) {
                        recordingEmployeeId = match[1];
                    }
                }
                
                // «” Œœ«„ «·—ﬁ„ «·„Õ›ÊŸ √Ê „‰ «·„ﬂ«·„…
                const toNumber = savedToNumber || call.to;
                
                return {
                    sid: recording.sid,
                    callSid: recording.callSid,
                    duration: recording.duration,
                    dateCreated: recording.dateCreated,
                    uri: recording.uri,
                    // „⁄·Ê„«  «·„ﬂ«·„…
                    from: call.from,
                    to: toNumber || '€Ì— „Õœœ',
                    direction: call.direction,
                    employeeId: recordingEmployeeId || 'unknown'  // ≈÷«›… „⁄—› «·„œÌ—
                };
            } catch (error) {
                // ≈–« ›‘· Ã·» „⁄·Ê„«  «·„ﬂ«·„…° ‰Õ«Ê· „‰ KV
                console.error('Œÿ√ ›Ì Ã·» „⁄·Ê„«   ”ÃÌ·:', error);
                const callData = await getCallEmployeeId(recording.callSid);
                return {
                    sid: recording.sid,
                    callSid: recording.callSid,
                    duration: recording.duration,
                    dateCreated: recording.dateCreated,
                    uri: recording.uri,
                    from: '€Ì— „⁄—Ê›',
                    to: callData?.to || '€Ì— „Õœœ',
                    direction: 'outbound-api',
                    employeeId: callData?.employeeId || 'unknown'  // ·« ÌÊÃœ „⁄—› „œÌ—
                };
            }
        }));
        
        // ›· —… «· ”ÃÌ·«  Õ”» «·’·«ÕÌ« 
        let filteredRecordings = recordingsData;
        
        console.log('?? ›· —… «· ”ÃÌ·« :', {
            employeeId,
            viewAll,
            totalRecordings: recordingsData.length,
            shouldFilter: employeeId && viewAll !== 'true'
        });
        
        if (employeeId && viewAll !== 'true') {
            // ≈–« ﬂ«‰ „œÌ— Ê·Ì” ·œÌÂ ’·«ÕÌ… —ƒÌ… «·ﬂ·° ‰⁄—÷  ”ÃÌ·« Â ›ﬁÿ
            filteredRecordings = recordingsData.filter(rec => {
                //  Ã«Â· «· ”ÃÌ·«  »œÊ‰ employeeId (ﬁœÌ„…)
                if (!rec.employeeId || rec.employeeId === 'unknown') {
                    return false;
                }
                
                const match = rec.employeeId === employeeId || 
                             rec.employeeId === String(employeeId) ||
                             rec.employeeId === parseInt(employeeId);
                console.log(`?? „ﬁ«—‰…: rec.employeeId="${rec.employeeId}" „⁄ employeeId="${employeeId}" = ${match}`);
                return match;
            });
            console.log(`?  „ ›· —…: ${filteredRecordings.length} „‰ ≈Ã„«·Ì ${recordingsData.length} ( „  Ã«Â· «· ”ÃÌ·«  «·ﬁœÌ„…)`);
        } else {
            console.log('?? ⁄—÷ Ã„Ì⁄ «· ”ÃÌ·«  (admin √Ê viewAll)');
        }
        
        res.json({ recordings: filteredRecordings });
    } catch (error) {
        console.error('Œÿ√ ›Ì Ã·» «· ”ÃÌ·« :', error);
        res.json({ recordings: [] }); // ≈—Ã«⁄ ﬁ«∆„… ›«—€… »œ·« „‰ Œÿ√
    }
});

// Ã·» —«»ÿ  ”ÃÌ· „Õœœ
app.get('/recording/:sid', async (req, res) => {
    try {
        const { sid } = req.params;
        const recording = await twilioClient.recordings(sid).fetch();
        
        // —«»ÿ «· ”ÃÌ· «·ﬂ«„·
        const recordingUrl = `https://api.twilio.com${recording.uri.replace('.json', '.mp3')}`;
        
        res.json({
            url: recordingUrl,
            duration: recording.duration,
            dateCreated: recording.dateCreated
        });
    } catch (error) {
        console.error('Œÿ√ ›Ì Ã·» «· ”ÃÌ·:', error);
        res.status(500).json({ error: '›‘· ›Ì Ã·» «· ”ÃÌ·' });
    }
});

// Õ–›  ”ÃÌ·
app.delete('/recording/:sid', async (req, res) => {
    try {
        const { sid } = req.params;
        await twilioClient.recordings(sid).remove();
        
        res.json({ success: true, message: ' „ Õ–› «· ”ÃÌ· »‰Ã«Õ' });
    } catch (error) {
        console.error('Œÿ√ ›Ì Õ–› «· ”ÃÌ·:', error);
        res.status(500).json({ error: '›‘· ›Ì Õ–› «· ”ÃÌ·' });
    }
});

// Õ–›  ”ÃÌ· (endpoint »œÌ·)
app.delete('/delete-recording/:sid', async (req, res) => {
    try {
        const { sid } = req.params;
        console.log('??? Ã«—Ì Õ–› «· ”ÃÌ·:', sid);
        await twilioClient.recordings(sid).remove();
        
        res.json({ success: true, message: ' „ Õ–› «· ”ÃÌ· »‰Ã«Õ' });
    } catch (error) {
        console.error('Œÿ√ ›Ì Õ–› «· ”ÃÌ·:', error);
        res.status(500).json({ error: '›‘· ›Ì Õ–› «· ”ÃÌ·', details: error.message });
    }
});

// ≈Ìﬁ«› «· ”ÃÌ· √À‰«¡ «·„ﬂ«·„…
app.post('/stop-recording', async (req, res) => {
    try {
        const { callSid } = req.body;
        console.log('?? ≈Ìﬁ«› «· ”ÃÌ· ··„ﬂ«·„…:', callSid);
        
        // «·Õ’Ê· ⁄·Ï ﬂ· «· ”ÃÌ·«  «·‰‘ÿ… ·Â–Â «·„ﬂ«·„…
        const recordings = await twilioClient.recordings.list({
            callSid: callSid,
            status: 'in-progress'
        });
        
        if (recordings.length > 0) {
            // ≈Ìﬁ«› ¬Œ—  ”ÃÌ· ‰‘ÿ
            const recording = recordings[0];
            await twilioClient.recordings(recording.sid).update({ status: 'stopped' });
            console.log('?  „ ≈Ìﬁ«› «· ”ÃÌ·:', recording.sid);
            res.json({ success: true, recordingSid: recording.sid });
        } else {
            res.json({ success: false, message: '·« ÌÊÃœ  ”ÃÌ· ‰‘ÿ' });
        }
    } catch (error) {
        console.error('Œÿ√ ›Ì ≈Ìﬁ«› «· ”ÃÌ·:', error);
        res.status(500).json({ error: '›‘· ›Ì ≈Ìﬁ«› «· ”ÃÌ·', details: error.message });
    }
});

//  ‘€Ì· «· ”ÃÌ· „»«‘—… (proxy »œÊ‰ authentication)
app.get('/play-recording/:sid', async (req, res) => {
    try {
        const { sid } = req.params;
        const recording = await twilioClient.recordings(sid).fetch();
        
        // ≈⁄«œ…  ÊÃÌÂ ·· ”ÃÌ· „⁄ credentials
        const recordingPath = recording.uri.replace('.json', '.mp3');
        const authHeader = 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
        
        const options = {
            hostname: 'api.twilio.com',
            path: recordingPath,
            headers: {
                'Authorization': authHeader
            }
        };
        
        https.get(options, (twilioRes) => {
            res.setHeader('Content-Type', 'audio/mpeg');
            twilioRes.pipe(res);
        }).on('error', (err) => {
            console.error('Œÿ√ ›Ì Ã·» «· ”ÃÌ·:', err);
            res.status(500).json({ error: '›‘· ›Ì Ã·» «· ”ÃÌ·' });
        });
    } catch (error) {
        console.error('Œÿ√ ›Ì  ‘€Ì· «· ”ÃÌ·:', error);
        res.status(500).json({ error: '›‘· ›Ì  ‘€Ì· «· ”ÃÌ·' });
    }
});

//  Õ„Ì· «· ”ÃÌ· „»«‘—… (»œÊ‰  ”ÃÌ· œŒÊ·)
app.get('/download-recording/:sid', async (req, res) => {
    try {
        const { sid } = req.params;
        console.log('?? ÿ·»  Õ„Ì·  ”ÃÌ·:', sid);
        
        const recording = await twilioClient.recordings(sid).fetch();
        
        // ≈⁄«œ…  ÊÃÌÂ ·· ”ÃÌ· „⁄ credentials
        const recordingPath = recording.uri.replace('.json', '.mp3');
        const authHeader = 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
        
        const options = {
            hostname: 'api.twilio.com',
            path: recordingPath,
            headers: {
                'Authorization': authHeader
            }
        };
        
        https.get(options, (twilioRes) => {
            //  ⁄ÌÌ‰ headers ·· Õ„Ì·
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Disposition', `attachment; filename="recording_${sid}.mp3"`);
            twilioRes.pipe(res);
            console.log('? Ã«—Ì  Õ„Ì· «· ”ÃÌ·');
        }).on('error', (err) => {
            console.error('? Œÿ√ ›Ì  Õ„Ì· «· ”ÃÌ·:', err);
            res.status(500).json({ error: '›‘· ›Ì  Õ„Ì· «· ”ÃÌ·' });
        });
    } catch (error) {
        console.error('? Œÿ√ ›Ì  Õ„Ì· «· ”ÃÌ·:', error);
        res.status(500).json({ error: '›‘· ›Ì  Õ„Ì· «· ”ÃÌ·' });
    }
});

// Ã·» ”Ã· «·„ﬂ«·„« 
app.get('/call-history', async (req, res) => {
    try {
        const calls = await twilioClient.calls.list({ limit: 50 });
        
        const callsData = calls.map(call => ({
            sid: call.sid,
            from: call.from,
            to: call.to,
            status: call.status,
            duration: call.duration,
            startTime: call.startTime,
            endTime: call.endTime,
            direction: call.direction
        }));
        
        res.json({ calls: callsData });
    } catch (error) {
        console.error('Œÿ√ ›Ì Ã·» ”Ã· «·„ﬂ«·„« :', error);
        res.json({ calls: [] }); // ≈—Ã«⁄ ﬁ«∆„… ›«—€… »œ·« „‰ Œÿ√
    }
});

// ========== ≈œ«—… «·„œÌ—Ì‰ ==========

// Ã·» ﬁ«∆„… «·„œÌ—Ì‰
app.get('/employees', async (req, res) => {
    try {
        const data = await getEmployeesData();
        
        // ≈—”«· «·„œÌ—Ì‰ „⁄ √”„«¡ «·√ﬁ”«„
        const employeesWithDepts = data.employees.map(emp => ({
            ...emp,
            departmentName: data.departments && data.departments[emp.department] ? data.departments[emp.department].name : ''
        }));
        
        res.json({
            employees: employeesWithDepts,
            departments: data.departments || {}
        });
    } catch (error) {
        console.error('? Œÿ√ ›Ì Ã·» «·„œÌ—Ì‰:', error);
        res.status(500).json({ error: error.message });
    }
});

// ≈÷«›… „œÌ— ÃœÌœ
app.post('/employees', async (req, res) => {
    try {
        const { username, password, fullname, name, phone, department, permissions } = req.body;
        const employeeName = fullname || name; // ﬁ»Ê· ﬂ·« «·«”„Ì‰
        
        console.log('?? ≈÷«›… „œÌ— ÃœÌœ:', { username, employeeName, department });
        
        const data = await getEmployeesData();
        
        // «· Õﬁﬁ „‰ ⁄œ„ ÊÃÊœ „œÌ— »‰›” «”„ «·„” Œœ„
        const exists = data.employees.find(emp => emp.username === username);
        if (exists) {
            return res.status(400).json({ error: '«”„ «·„” Œœ„ „ÊÃÊœ »«·›⁄·' });
        }
        
        // ≈‰‘«¡ ID ÃœÌœ »‘ﬂ· ’ÕÌÕ (√⁄·Ï ID „ÊÃÊœ + 1)
        const maxId = data.employees.reduce((max, emp) => Math.max(max, emp.id || 0), 0);
        
        const newEmployee = {
            id: maxId + 1,
            username,
            password,
            fullname: employeeName,
            name: employeeName,
            phone: phone || '',
            department,
            departmentArabic: data.departments[department]?.name || '€Ì— „Õœœ',
            role: 'employee',
            permissions: permissions || {
                viewOwnRecordings: false,
                viewAllRecordings: false,
                deleteRecordings: false,
                editProfile: false
            },
            createdAt: new Date().toISOString()
        };
        
        data.employees.push(newEmployee);
        
        // ≈÷«›… «·„œÌ— ·ﬁ”„Â («· Õﬁﬁ „‰ ÊÃÊœ «·‹ array)
        if (data.departments && data.departments[department]) {
            if (!data.departments[department].employees) {
                data.departments[department].employees = [];
            }
            if (phone && !data.departments[department].employees.includes(phone)) {
                data.departments[department].employees.push(phone);
            }
        }
        
        // Õ›Ÿ «·»Ì«‰« 
        const saved = await saveEmployeesData(data);
        
        if (!saved) {
            console.error('? ›‘· ›Ì Õ›Ÿ «·»Ì«‰«  ··„œÌ—:', username);
            return res.status(500).json({ error: '›‘· ›Ì Õ›Ÿ «·»Ì«‰« ' });
        }
        
        console.log('?  „  ≈÷«›… «·„œÌ— »‰Ã«Õ:', newEmployee.username, 'ID:', newEmployee.id);
        res.json({ success: true, employee: newEmployee });
    } catch (error) {
        console.error('Œÿ√ ›Ì ≈÷«›… „œÌ—:', error);
        res.status(500).json({ error: error.message });
    }
});

//  ”ÃÌ· œŒÊ· «·„œÌ—
//  ÂÌ∆… Redis »«·»Ì«‰«  «·«› —«÷Ì… (··„ÿÊ— ›ﬁÿ)
app.get('/init-kv', async (req, res) => {
    if (!redis || !process.env.VERCEL) {
        return res.json({ error: 'Redis €Ì— „ «Õ ( ‘€Ì· „Õ·Ì)', data: employeesData });
    }
    
    try {
        console.log('??  ÂÌ∆… Upstash Redis »«·»Ì«‰«  «·«› —«÷Ì…...');
        console.log('?? ⁄œœ «·„œÌ—Ì‰ «·„—«œ Õ›ŸÂ„:', employeesData.employees.length);
        
        // Õ›Ÿ „»«‘— ›Ì Redis
        await redis.set('employees_data', employeesData);
        console.log('?  „ «·Õ›Ÿ ›Ì Redis');
        
        // «· Õﬁﬁ „‰ «·Õ›Ÿ
        const saved = await redis.get('employees_data');
        console.log('?  „ «· Õﬁﬁ: ⁄œœ «·„œÌ—Ì‰ «·„Õ›ÊŸÌ‰:', saved?.employees?.length || 0);
        
        return res.json({
            success: true,
            message: ' „  ÂÌ∆… Redis »‰Ã«Õ',
            employeesCount: saved?.employees?.length || 0,
            employees: saved?.employees || []
        });
    } catch (error) {
        console.error('? Œÿ√ ›Ì  ÂÌ∆… Redis:', error);
        res.status(500).json({ 
            error: error.message,
            stack: error.stack,
            defaultData: employeesData
        });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('?? „Õ«Ê·…  ”ÃÌ· œŒÊ·:', username);
        
        const data = await getEmployeesData();
        console.log('?? ⁄œœ «·„œÌ—Ì‰ ›Ì «·ﬁ«⁄œ…:', data.employees.length);
        
        // «·»ÕÀ ⁄‰ «·„œÌ—
        const employee = data.employees.find(emp => 
            emp.username === username && emp.password === password
        );
        
        if (!employee) {
            console.log('? ›‘·  ”ÃÌ· «·œŒÊ·: »Ì«‰«  Œ«ÿ∆…');
            return res.status(401).json({ error: '«”„ «·„” Œœ„ √Ê ﬂ·„… «·„—Ê— €Ì— ’ÕÌÕ…' });
        }
        
        console.log('?  „  ”ÃÌ· «·œŒÊ·:', employee.name);
        
        res.json({
            success: true,
            employee: {
                id: employee.id,
                name: employee.name,
                username: employee.username,
                department: employee.department,
                departmentName: data.departments[employee.department]?.name || '',
                permissions: employee.permissions || {
                    viewOwnRecordings: false,
                    viewAllRecordings: false,
                    deleteRecordings: false,
                    editProfile: false
                },
                phone: employee.phone
            }
        });
    } catch (error) {
        console.error('? Œÿ√ ›Ì  ”ÃÌ· «·œŒÊ·:', error);
        res.status(500).json({ error: error.message });
    }
});

//  ÕœÌÀ «·„·› «·‘Œ’Ì ··„œÌ—
app.post('/update-profile', async (req, res) => {
    try {
        const { employeeId, username, currentPassword, newName, newPhone, newPassword } = req.body;
        
        console.log('??  ÕœÌÀ „·› ‘Œ’Ì:', employeeId);
        
        const data = await getEmployeesData();
        
        // «·»ÕÀ ⁄‰ «·„œÌ—
        const employee = data.employees.find(emp => emp.id === employeeId);
        
        if (!employee) {
            return res.status(404).json({ error: '«·„œÌ— €Ì— „ÊÃÊœ' });
        }
        
        // «· Õﬁﬁ „‰ ﬂ·„… «·„—Ê— «·Õ«·Ì…
        if (employee.password !== currentPassword) {
            return res.status(401).json({ error: 'ﬂ·„… «·„—Ê— «·Õ«·Ì… €Ì— ’ÕÌÕ…' });
        }
        
        //  ÕœÌÀ «·»Ì«‰« 
        employee.name = newName;
        if (newPhone) employee.phone = newPhone;
        if (newPassword) employee.password = newPassword;
        
        await saveEmployeesData(data);
        
        console.log('?  „  ÕœÌÀ «·„·› «·‘Œ’Ì:', employee.name);
        
        res.json({
            success: true,
            message: ' „  ÕœÌÀ «·„·› «·‘Œ’Ì »‰Ã«Õ',
            employee: {
                id: employee.id,
                name: employee.name,
                phone: employee.phone
            }
        });
    } catch (error) {
        console.error('? Œÿ√ ›Ì  ÕœÌÀ «·„·›:', error);
        res.status(500).json({ error: error.message });
    }
});

// Õ–› „œÌ—
app.delete('/employees/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const data = await getEmployeesData();
        
        const employeeIndex = data.employees.findIndex(emp => emp.id === id);
        
        if (employeeIndex === -1) {
            return res.status(404).json({ error: '«·„œÌ— €Ì— „ÊÃÊœ' });
        }
        
        const employee = data.employees[employeeIndex];
        
        // ≈“«·… „‰ «·ﬁ”„
        if (data.departments[employee.department]) {
            const phoneIndex = data.departments[employee.department].employees.indexOf(employee.phone);
            if (phoneIndex > -1) {
                data.departments[employee.department].employees.splice(phoneIndex, 1);
            }
        }
        
        // ≈“«·… „‰ «·ﬁ«∆„…
        data.employees.splice(employeeIndex, 1);
        
        // Õ›Ÿ «·»Ì«‰« 
        await saveEmployeesData(data);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Œÿ√ ›Ì Õ–› „œÌ—:', error);
        res.status(500).json({ error: error.message });
    }
});

//  ÕœÌÀ »Ì«‰«  „œÌ— (PUT)
app.put('/employees/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, fullname, phone, password, role, department, permissions } = req.body;
        const employeeName = name || fullname; // ﬁ»Ê· ﬂ·« «·„ €Ì—Ì‰
        
        console.log('??  ÕœÌÀ „œÌ— ID:', id, req.body);
        
        const data = await getEmployeesData();
        
        const employeeIndex = data.employees.findIndex(emp => emp.id === id);
        
        if (employeeIndex === -1) {
            return res.status(404).json({ error: '«·„œÌ— €Ì— „ÊÃÊœ' });
        }
        
        const employee = data.employees[employeeIndex];
        const oldDepartment = employee.department;
        const oldPhone = employee.phone;
        
        //  ÕœÌÀ «·»Ì«‰« 
        if (employeeName) employee.name = employeeName;
        if (phone) employee.phone = phone;
        if (password) employee.password = password;
        if (role) employee.role = role;
        if (department) employee.department = department;
        if (permissions) employee.permissions = permissions;
        
        // ≈–«  €Ì— «·ﬁ”„°  ÕœÌÀ «·√ﬁ”«„
        if (department && department !== oldDepartment) {
            // ≈“«·… „‰ «·ﬁ”„ «·ﬁœÌ„
            if (data.departments[oldDepartment]) {
                const idx = data.departments[oldDepartment].employees.indexOf(oldPhone);
                if (idx > -1) {
                    data.departments[oldDepartment].employees.splice(idx, 1);
                }
            }
            // ≈÷«›… ··ﬁ”„ «·ÃœÌœ
            if (data.departments[department]) {
                if (!data.departments[department].employees.includes(employee.phone)) {
                    data.departments[department].employees.push(employee.phone);
                }
            }
        }
        
        // ≈–«  €Ì— «·Â« ›°  ÕœÌÀ ›Ì «·ﬁ”„
        if (phone && phone !== oldPhone && data.departments[employee.department]) {
            const idx = data.departments[employee.department].employees.indexOf(oldPhone);
            if (idx > -1) {
                data.departments[employee.department].employees[idx] = phone;
            }
        }
        
        // Õ›Ÿ «·»Ì«‰« 
        await saveEmployeesData(data);
        
        console.log('?  „  ÕœÌÀ «·„œÌ—:', employee.name);
        
        res.json({
            success: true,
            message: ' „  ÕœÌÀ »Ì«‰«  «·„œÌ— »‰Ã«Õ',
            employee: employee
        });
    } catch (error) {
        console.error('? Œÿ√ ›Ì  ÕœÌÀ «·„œÌ—:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== ≈œ«—… ÃÂ«  «·« ’«· ==========

// »Ì«‰«  ÃÂ«  «·« ’«· «·«› —«÷Ì…
let contactsData = { contacts: [] };

// „Õ«Ê·…  Õ„Ì· „‰ «·„·› (·· ‘€Ì· «·„Õ·Ì ›ﬁÿ)
if (!process.env.VERCEL) {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'contacts.json'), 'utf8');
        contactsData = JSON.parse(data);
        console.log('?  „  Õ„Ì· ÃÂ«  «·« ’«· „‰ «·„·›');
    } catch (error) {
        console.log('?? ”Ì „ ≈‰‘«¡ „·› ÃÂ«  « ’«· ÃœÌœ');
    }
}

// œÊ«· „”«⁄œ… ·ﬁ—«¡… ÊÕ›Ÿ ÃÂ«  «·« ’«·
async function getContactsData() {
    if (process.env.VERCEL) {
        // ⁄·Ï Vercel ‰Õ«Ê· Redis √Ê·«
        if (redis) {
            try {
                const data = await redis.get('contacts_data');
                if (data) {
                    console.log('?  „  Õ„Ì· ÃÂ«  «·« ’«· „‰ Redis');
                    return data;
                }
            } catch (error) {
                console.error('Œÿ√ ›Ì ﬁ—«¡… ÃÂ«  «·« ’«· „‰ Redis:', error);
            }
        }
        // ≈—Ã«⁄ «·»Ì«‰«  «·›«—€… ≈–« ·„  ÊÃœ
        return { contacts: [] };
    }
    return contactsData;
}

async function saveContactsData(data) {
    if (process.env.VERCEL) {
        // ⁄·Ï Vercel «” Œœ„ Redis ›ﬁÿ
        if (!redis) {
            throw new Error('Redis €Ì— „ «Õ');
        }
        try {
            await redis.set('contacts_data', data);
            console.log('?  „ Õ›Ÿ ÃÂ«  «·« ’«· ›Ì Redis');
            return true;
        } catch (error) {
            console.error('Œÿ√ ›Ì Õ›Ÿ ÃÂ«  «·« ’«· ›Ì Redis:', error);
            throw error;
        }
    } else {
        // ·· ‘€Ì· «·„Õ·Ì «Õ›Ÿ ›Ì „·›
        try {
            fs.writeFileSync(
                path.join(__dirname, 'contacts.json'),
                JSON.stringify(data, null, 2)
            );
            contactsData = data;
            console.log('?  „ Õ›Ÿ ÃÂ«  «·« ’«· ›Ì «·„·›');
            return true;
        } catch (error) {
            console.error('Œÿ√ ›Ì Õ›Ÿ „·› ÃÂ«  «·« ’«·:', error);
            throw error;
        }
    }
}

// Ã·» Ã„Ì⁄ ÃÂ«  «·« ’«·
app.get('/api/contacts', async (req, res) => {
    try {
        const data = await getContactsData();
        res.json(data);
    } catch (error) {
        console.error('Œÿ√ ›Ì Ã·» ÃÂ«  «·« ’«·:', error);
        res.status(500).json({ error: error.message });
    }
});

// ≈÷«›… ÃÂ… « ’«· ÃœÌœ…
app.post('/api/contacts', async (req, res) => {
    try {
        const { name, phone } = req.body;
        
        if (!name || !phone) {
            return res.status(400).json({ error: '«·«”„ Ê—ﬁ„ «·Â« › „ÿ·Ê»«‰' });
        }
        
        const data = await getContactsData();
        
        // «· Õﬁﬁ „‰ ⁄œ„  ﬂ—«— «·—ﬁ„
        const exists = data.contacts.find(c => c.phone === phone);
        if (exists) {
            return res.status(400).json({ error: '—ﬁ„ «·Â« › „ÊÃÊœ »«·›⁄·' });
        }
        
        const newContact = {
            id: Date.now(),
            name,
            phone,
            createdAt: new Date().toISOString(),
            createdBy: req.body.createdBy || 'unknown'
        };
        
        data.contacts.push(newContact);
        await saveContactsData(data);
        
        console.log('?  „  ≈÷«›… ÃÂ… « ’«·:', name, phone);
        res.json({ success: true, contact: newContact });
    } catch (error) {
        console.error('Œÿ√ ›Ì ≈÷«›… ÃÂ… « ’«·:', error);
        res.status(500).json({ error: error.message });
    }
});

// Õ–› ÃÂ… « ’«·
app.delete('/api/contacts', async (req, res) => {
    try {
        const id = parseInt(req.query.id);
        
        if (!id) {
            return res.status(400).json({ error: '„⁄—› ÃÂ… «·« ’«· „ÿ·Ê»' });
        }
        
        const data = await getContactsData();
        const contactIndex = data.contacts.findIndex(c => c.id === id);
        
        if (contactIndex === -1) {
            return res.status(404).json({ error: 'ÃÂ… «·« ’«· €Ì— „ÊÃÊœ…' });
        }
        
        const contact = data.contacts[contactIndex];
        data.contacts.splice(contactIndex, 1);
        await saveContactsData(data);
        
        console.log('?  „ Õ–› ÃÂ… « ’«·:', contact.name);
        res.json({ success: true });
    } catch (error) {
        console.error('Œÿ√ ›Ì Õ–› ÃÂ… « ’«·:', error);
        res.status(500).json({ error: error.message });
    }
});

// endpoint ·⁄—÷ Õ«·… «·»Ì«‰«  (·· ‘ŒÌ’)
app.get('/debug/data-status', async (req, res) => {
    try {
        const data = await getEmployeesData();
        res.json({
            totalEmployees: data.employees.length,
            employees: data.employees.map(emp => ({
                id: emp.id,
                name: emp.name,
                username: emp.username,
                department: emp.department
            })),
            departments: data.departments,
            isVercel: !!process.env.VERCEL,
            hasKV: !!kv
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== API —’Ìœ Twilio ==========

// Ã·» —’Ìœ «·Õ”«»
app.get('/account/balance', async (req, res) => {
    try {
        if (!twilioClient) {
            return res.status(500).json({ error: 'Œœ„… Twilio €Ì— „ «Õ…' });
        }
        
        // Ã·» „⁄·Ê„«  «·Õ”«» „‰ Twilio
        const account = await twilioClient.api.accounts(TWILIO_ACCOUNT_SID).fetch();
        
        // Ã·» «·—’Ìœ „‰ Balance API
        const balanceUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Balance.json`;
        const authHeader = 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
        
        const balanceResponse = await fetch(balanceUrl, {
            headers: { 'Authorization': authHeader }
        });
        
        let balance = 0;
        let currency = 'USD';
        
        if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            balance = parseFloat(balanceData.balance) || 0;
            currency = balanceData.currency || 'USD';
        }
        
        res.json({
            success: true,
            balance: balance,
            currency: currency,
            accountName: account.friendlyName,
            accountStatus: account.status,
            // —«»ÿ ·≈⁄«œ… «·‘Õ‰
            rechargeUrl: 'https://console.twilio.com/us1/billing/manage-billing/billing-overview'
        });
        
    } catch (error) {
        console.error('Œÿ√ ›Ì Ã·» «·—’Ìœ:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== Admin Dashboard APIs ==========

// ≈Õ’«∆Ì«  ·ÊÕ… «· Õﬂ„
app.get('/admin/dashboard-stats', async (req, res) => {
    try {
        // Ã·» «·„ﬂ«·„«  „‰ Twilio
        const recordings = await getRecordingsFromTwilio();
        const employees = await getEmployeesData();
        
        const completed = recordings.filter(r => r.status === 'completed').length;
        const missed = recordings.filter(r => r.status === 'no-answer' || r.status === 'missed' || r.status === 'failed').length;
        const totalDuration = recordings.reduce((sum, r) => sum + (parseInt(r.duration) || 0), 0);
        
        res.json({
            totalCalls: recordings.length,
            answeredCalls: completed,
            missedCalls: missed,
            activeEmployees: employees.employees.length,
            totalDuration: totalDuration,
            totalRecordings: recordings.filter(r => r.recordingUrl).length
        });
    } catch (error) {
        console.error('Œÿ√ ›Ì ≈Õ’«∆Ì«  ·ÊÕ… «· Õﬂ„:', error);
        res.json({
            totalCalls: 0,
            answeredCalls: 0,
            missedCalls: 0,
            activeEmployees: 0,
            totalDuration: 0,
            totalRecordings: 0
        });
    }
});

// Ã„Ì⁄ «·„ﬂ«·„« 
app.get('/admin/all-calls', async (req, res) => {
    try {
        const calls = await getRecordingsFromTwilio();
        res.json(calls);
    } catch (error) {
        console.error('Œÿ√ ›Ì Ã·» «·„ﬂ«·„« :', error);
        res.status(500).json({ error: error.message });
    }
});

// Ã·» «·„ﬂ«·„«  „‰ Twilio
async function getRecordingsFromTwilio() {
    if (!twilioClient) return [];
    
    try {
        const calls = await twilioClient.calls.list({ limit: 500 });
        const recordings = await twilioClient.recordings.list({ limit: 500 });
        
        // œ„Ã »Ì«‰«  «· ”ÃÌ·«  „⁄ «·„ﬂ«·„« 
        const recordingsMap = new Map();
        for (const rec of recordings) {
            const callSid = rec.callSid;
            if (!recordingsMap.has(callSid)) {
                recordingsMap.set(callSid, []);
            }
            recordingsMap.get(callSid).push(rec);
        }
        
        return calls.map(call => {
            const callRecordings = recordingsMap.get(call.sid) || [];
            const latestRecording = callRecordings[0];
            
            return {
                sid: call.sid,
                to: call.to,
                from: call.from,
                status: call.status,
                duration: call.duration,
                dateCreated: call.dateCreated,
                direction: call.direction,
                recordingSid: latestRecording?.sid,
                recordingUrl: latestRecording ? `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Recordings/${latestRecording.sid}.mp3` : null,
                employeeId: call.fromFormatted,
                employeeName: null
            };
        });
    } catch (error) {
        console.error('Œÿ√ ›Ì Ã·» «·„ﬂ«·„«  „‰ Twilio:', error);
        return [];
    }
}

// Õ–› „ﬂ«·„…
app.delete('/admin/delete-call', async (req, res) => {
    try {
        const { callSid } = req.body;
        
        if (!callSid || !twilioClient) {
            return res.status(400).json({ error: '„⁄—› «·„ﬂ«·„… „ÿ·Ê»' });
        }
        
        // Õ–› «· ”ÃÌ·«  «·„— »ÿ… »«·„ﬂ«·„…
        const recordings = await twilioClient.recordings.list({ callSid });
        for (const rec of recordings) {
            await twilioClient.recordings(rec.sid).remove();
        }
        
        console.log('?  „ Õ–› «·„ﬂ«·„…:', callSid);
        res.json({ success: true });
    } catch (error) {
        console.error('Œÿ√ ›Ì Õ–› «·„ﬂ«·„…:', error);
        res.status(500).json({ error: error.message });
    }
});

// OpenAI API Key ·· ÕÊÌ· «·’Ê Ì
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

//  ÕÊÌ· «·’Ê  ≈·Ï ‰’ »«” Œœ«„ OpenAI Whisper
app.post('/admin/transcribe', async (req, res) => {
    try {
        const { recordingSid } = req.body;
        
        if (!recordingSid) {
            return res.status(400).json({ error: '„⁄—› «· ”ÃÌ· „ÿ·Ê»' });
        }
        
        // «· Õﬁﬁ „‰ ÊÃÊœ Twilio client
        if (!twilioClient) {
            return res.status(500).json({ error: 'Œœ„… Twilio €Ì— „ «Õ…' });
        }
        
        // «· Õﬁﬁ „‰ OpenAI API Key
        if (!OPENAI_API_KEY) {
            return res.json({
                success: true,
                transcript: '?? Œœ„…  ÕÊÌ· «·’Ê  ≈·Ï ‰’ €Ì— „›⁄¯·…. √÷› OPENAI_API_KEY ›Ì „ €Ì—«  «·»Ì∆….',
                note: '«Õ’· ⁄·Ï API Key „‰ https://platform.openai.com/api-keys'
            });
        }
        
        console.log('??? »œ¡  ÕÊÌ· «· ”ÃÌ·:', recordingSid);
        
        // Ã·» „·› «· ”ÃÌ· „‰ Twilio
        const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Recordings/${recordingSid}.mp3`;
        const authHeader = 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
        
        //  Õ„Ì· „·› «·’Ê 
        const audioResponse = await fetch(recordingUrl, {
            headers: { 'Authorization': authHeader }
        });
        
        if (!audioResponse.ok) {
            throw new Error('›‘· ›Ì  Õ„Ì· „·› «· ”ÃÌ·');
        }
        
        const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
        console.log('??  „  Õ„Ì· «·„·›° «·ÕÃ„:', audioBuffer.byteLength, 'bytes');
        
        // ≈‰‘«¡ boundary ··‹ multipart form
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
        
        // »‰«¡ «·‹ multipart ÌœÊÌ«
        const parts = [];
        
        // ≈÷«›… «·„·›
        parts.push(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="file"; filename="${recordingSid}.mp3"\r\n` +
            `Content-Type: audio/mpeg\r\n\r\n`
        );
        parts.push(audioBuffer);
        parts.push('\r\n');
        
        // ≈÷«›… model
        parts.push(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="model"\r\n\r\n` +
            `whisper-1\r\n`
        );
        
        // ≈÷«›… language
        parts.push(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="language"\r\n\r\n` +
            `ar\r\n`
        );
        
        // ≈‰Â«¡ «·‹ form
        parts.push(`--${boundary}--\r\n`);
        
        // œ„Ã «·√Ã“«¡
        const bodyParts = parts.map(part => 
            typeof part === 'string' ? Buffer.from(part) : part
        );
        const body = Buffer.concat(bodyParts);
        
        const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`
            },
            body: body
        });
        
        if (!whisperResponse.ok) {
            const error = await whisperResponse.json().catch(() => ({}));
            console.error('? Œÿ√ Whisper:', error);
            throw new Error(error.error?.message || '›‘· ›Ì  ÕÊÌ· «·’Ê ');
        }
        
        const result = await whisperResponse.json();
        console.log('?  „  ÕÊÌ· «· ”ÃÌ· »‰Ã«Õ');
        
        return res.json({
            success: true,
            transcript: result.text || '·„ Ì „ «· ⁄—› ⁄·Ï ‰’'
        });
        
    } catch (error) {
        console.error('? Œÿ√ ›Ì  ÕÊÌ· «·’Ê  ≈·Ï ‰’:', error);
        res.status(500).json({ error: error.message });
    }
});

// Œœ„… „·›«  Admin Dashboard
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin.html'));
});

app.get('/admin-style.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, '..', 'admin-style.css'));
});

app.get('/admin.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, '..', 'admin.js'));
});

// =====   »⁄ «·„” Œœ„Ì‰ «·√Ê‰·«Ì‰ =====
let onlineUsers = new Map(); // { odUserId: { name, lastSeen, loginTime } }
let lastLoggedInUser = null;

// Heartbeat - ≈—”«· ‰»÷… „‰ «·„” Œœ„ ·· √ﬂÌœ ⁄·Ï √‰Â √Ê‰·«Ì‰
app.post('/heartbeat', (req, res) => {
    const { userId, userName } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: 'userId „ÿ·Ê»' });
    }
    
    const now = new Date();
    const existingUser = onlineUsers.get(userId);
    
    onlineUsers.set(userId, {
        name: userName || '„” Œœ„',
        lastSeen: now,
        loginTime: existingUser?.loginTime || now
    });
    
    console.log(`?? Heartbeat „‰: ${userName} (${userId})`);
    res.json({ success: true, time: now });
});

//  ”ÃÌ· «·œŒÊ· -   »⁄ ¬Œ— „” Œœ„
app.post('/track-login', (req, res) => {
    const { userId, userName } = req.body;
    
    const now = new Date();
    
    // Õ›Ÿ ¬Œ— „” Œœ„ ”Ã· œŒÊ·
    lastLoggedInUser = {
        userId,
        name: userName,
        loginTime: now
    };
    
    // ≈÷«›… ··„” Œœ„Ì‰ «·√Ê‰·«Ì‰
    onlineUsers.set(userId, {
        name: userName,
        lastSeen: now,
        loginTime: now
    });
    
    console.log(`??  ”ÃÌ· œŒÊ·: ${userName} (${userId}) ›Ì ${now.toLocaleTimeString('ar-EG')}`);
    res.json({ success: true });
});

//  ”ÃÌ· «·Œ—ÊÃ
app.post('/track-logout', (req, res) => {
    const { userId } = req.body;
    
    if (userId) {
        const user = onlineUsers.get(userId);
        console.log(`??  ”ÃÌ· Œ—ÊÃ: ${user?.name || userId}`);
        onlineUsers.delete(userId);
    }
    
    res.json({ success: true });
});

// «·Õ’Ê· ⁄·Ï «·„” Œœ„Ì‰ «·√Ê‰·«Ì‰
app.get('/online-users', (req, res) => {
    const now = new Date();
    const TIMEOUT = 30000; // 30 À«‰Ì… - ≈–« ·„ Ì—”· heartbeat Ì⁄ »— √Ê›·«Ì‰
    
    //  ‰ŸÌ› «·„” Œœ„Ì‰ €Ì— «·‰‘ÿÌ‰
    for (const [userId, userData] of onlineUsers.entries()) {
        if (now - userData.lastSeen > TIMEOUT) {
            console.log(`?? «·„” Œœ„ ${userData.name} √’»Õ √Ê›·«Ì‰ («‰ Â  «·„Â·…)`);
            onlineUsers.delete(userId);
        }
    }
    
    //  ÕÊÌ· Map ·‹ Array
    const users = Array.from(onlineUsers.entries()).map(([userId, data]) => ({
        userId,
        name: data.name,
        loginTime: data.loginTime,
        lastSeen: data.lastSeen,
        onlineDuration: Math.floor((now - data.loginTime) / 1000 / 60) // »«·œﬁ«∆ﬁ
    }));
    
    res.json({
        count: users.length,
        users,
        lastLoggedIn: lastLoggedInUser
    });
});

// ===== ‰Ÿ«„ «·‘—ﬂ«  «·„ ⁄œœ… (Multi-Tenant) =====
console.log('??  ÂÌ∆… ‰Ÿ«„ «·‘—ﬂ«  «·„ ⁄œœ…...');

// »‰Ì… »Ì«‰«  «·‘—ﬂ« 
let companiesData = {
    companies: [
        {
            id: 'default',
            name: 'Link Call',
            adminUsername: 'akram',
            createdAt: '2025-01-01T00:00:00.000Z',
            subscription: 'unlimited',
            isActive: true,
            settings: {
                maxEmployees: 100,
                maxCallMinutes: -1, // €Ì— „ÕœÊœ
                canRecordCalls: true,
                twilioAccountSid: '', // ≈–« ﬂ«‰ ··‘—ﬂ… Õ”«» Twilio Œ«’
                twilioAuthToken: ''
            }
        }
    ]
};

// œÊ«· „”«⁄œ… ··‘—ﬂ« 
async function getCompaniesData() {
    if (process.env.VERCEL && redis) {
        try {
            const data = await redis.get('companies_data');
            if (data && data.companies) {
                return data;
            }
        } catch (error) {
            console.error('? Œÿ√ ›Ì ﬁ—«¡… »Ì«‰«  «·‘—ﬂ« :', error);
        }
    }
    return companiesData;
}

async function saveCompaniesData(data) {
    if (redis && process.env.VERCEL) {
        try {
            await redis.set('companies_data', data);
            console.log('?  „ Õ›Ÿ »Ì«‰«  «·‘—ﬂ« ');
            return true;
        } catch (error) {
            console.error('? Œÿ√ ›Ì Õ›Ÿ »Ì«‰«  «·‘—ﬂ« :', error);
            return false;
        }
    }
    companiesData = data;
    return true;
}

// «·Õ’Ê· ⁄·Ï ﬁ«∆„… «·‘—ﬂ«  (··„ÿÊ— «·—∆Ì”Ì ›ﬁÿ)
app.get('/companies', async (req, res) => {
    try {
        const data = await getCompaniesData();
        res.json({
            success: true,
            count: data.companies.length,
            companies: data.companies.map(c => ({
                id: c.id,
                name: c.name,
                adminUsername: c.adminUsername,
                isActive: c.isActive,
                subscription: c.subscription,
                createdAt: c.createdAt,
                employeesCount: 0 // ”Ì „ Õ”«»Â ·«Õﬁ«
            }))
        });
    } catch (error) {
        console.error('Œÿ√ ›Ì Ã·» «·‘—ﬂ« :', error);
        res.status(500).json({ error: error.message });
    }
});

// ≈‰‘«¡ ‘—ﬂ… ÃœÌœ…
app.post('/companies', async (req, res) => {
    try {
        const { name, adminUsername, adminPassword, adminName, subscription = 'basic' } = req.body;
        
        if (!name || !adminUsername || !adminPassword) {
            return res.status(400).json({ error: '«”„ «·‘—ﬂ… Ê«”„ «·„” Œœ„ Êﬂ·„… «·„—Ê— „ÿ·Ê»Ì‰' });
        }
        
        const companiesDataObj = await getCompaniesData();
        const employeesDataObj = await getEmployeesData();
        
        // «· Õﬁﬁ „‰ ⁄œ„ ÊÃÊœ ‘—ﬂ… »‰›” «·«”„
        if (companiesDataObj.companies.find(c => c.name === name)) {
            return res.status(400).json({ error: '«”„ «·‘—ﬂ… „ÊÃÊœ »«·›⁄·' });
        }
        
        // «· Õﬁﬁ „‰ ⁄œ„ ÊÃÊœ „” Œœ„ »‰›” «·«”„
        const existingUser = employeesDataObj.employees.find(e => e.username === adminUsername);
        if (existingUser || adminUsername === 'akram') {
            return res.status(400).json({ error: '«”„ «·„” Œœ„ „ÊÃÊœ »«·›⁄·' });
        }
        
        // ≈‰‘«¡ ID ›—Ìœ ··‘—ﬂ…
        const companyId = 'company_' + Date.now();
        
        // ≈‰‘«¡ «·‘—ﬂ…
        const newCompany = {
            id: companyId,
            name,
            adminUsername,
            createdAt: new Date().toISOString(),
            subscription,
            isActive: true,
            settings: {
                maxEmployees: subscription === 'basic' ? 5 : subscription === 'pro' ? 20 : 100,
                maxCallMinutes: subscription === 'basic' ? 500 : subscription === 'pro' ? 2000 : -1,
                canRecordCalls: subscription !== 'basic'
            }
        };
        
        // ≈‰‘«¡ „œÌ— «·‘—ﬂ…
        const maxId = employeesDataObj.employees.reduce((max, emp) => Math.max(max, emp.id || 0), 0);
        const newAdmin = {
            id: maxId + 1,
            username: adminUsername,
            password: adminPassword,
            name: adminName || name + ' - „œÌ—',
            fullname: adminName || name + ' - „œÌ—',
            companyId: companyId,
            role: 'company_admin',
            department: '1',
            phone: '',
            permissions: {
                viewOwnRecordings: true,
                viewAllRecordings: true,
                deleteRecordings: true,
                editProfile: true,
                manageEmployees: true,
                viewReports: true,
                callFromUSA: true,
                callFromEgypt: false,
                callFromSaudi: false
            },
            createdAt: new Date().toISOString()
        };
        
        companiesDataObj.companies.push(newCompany);
        employeesDataObj.employees.push(newAdmin);
        
        await saveCompaniesData(companiesDataObj);
        await saveEmployeesData(employeesDataObj);
        
        console.log('?  „ ≈‰‘«¡ ‘—ﬂ… ÃœÌœ…:', name);
        res.json({
            success: true,
            company: newCompany,
            admin: {
                id: newAdmin.id,
                username: newAdmin.username,
                name: newAdmin.name
            }
        });
    } catch (error) {
        console.error('Œÿ√ ›Ì ≈‰‘«¡ ‘—ﬂ…:', error);
        res.status(500).json({ error: error.message });
    }
});

//  ⁄œÌ· ‘—ﬂ…
app.put('/companies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, isActive, subscription, settings } = req.body;
        
        const data = await getCompaniesData();
        const companyIndex = data.companies.findIndex(c => c.id === id);
        
        if (companyIndex === -1) {
            return res.status(404).json({ error: '«·‘—ﬂ… €Ì— „ÊÃÊœ…' });
        }
        
        //  ÕœÌÀ «·»Ì«‰« 
        if (name) data.companies[companyIndex].name = name;
        if (isActive !== undefined) data.companies[companyIndex].isActive = isActive;
        if (subscription) data.companies[companyIndex].subscription = subscription;
        if (settings) {
            data.companies[companyIndex].settings = {
                ...data.companies[companyIndex].settings,
                ...settings
            };
        }
        
        await saveCompaniesData(data);
        
        res.json({ success: true, company: data.companies[companyIndex] });
    } catch (error) {
        console.error('Œÿ√ ›Ì  ⁄œÌ· ‘—ﬂ…:', error);
        res.status(500).json({ error: error.message });
    }
});

// Õ–› ‘—ﬂ… (≈Ìﬁ«› ›ﬁÿ)
app.delete('/companies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (id === 'default') {
            return res.status(400).json({ error: '·« Ì„ﬂ‰ Õ–› «·‘—ﬂ… «·«› —«÷Ì…' });
        }
        
        const data = await getCompaniesData();
        const companyIndex = data.companies.findIndex(c => c.id === id);
        
        if (companyIndex === -1) {
            return res.status(404).json({ error: '«·‘—ﬂ… €Ì— „ÊÃÊœ…' });
        }
        
        // ≈Ìﬁ«› «·‘—ﬂ… »œ·« „‰ Õ–›Â«
        data.companies[companyIndex].isActive = false;
        await saveCompaniesData(data);
        
        console.log('?  „ ≈Ìﬁ«› ‘—ﬂ…:', data.companies[companyIndex].name);
        res.json({ success: true, message: ' „ ≈Ìﬁ«› «·‘—ﬂ…' });
    } catch (error) {
        console.error('Œÿ√ ›Ì Õ–› ‘—ﬂ…:', error);
        res.status(500).json({ error: error.message });
    }
});

// «·Õ’Ê· ⁄·Ï „ÊŸ›Ì ‘—ﬂ… „⁄Ì‰…
app.get('/companies/:id/employees', async (req, res) => {
    try {
        const { id } = req.params;
        const data = await getEmployeesData();
        
        // ≈–« ﬂ«‰  «·‘—ﬂ… «·«› —«÷Ì…° ‰—Ã⁄ «·„ÊŸ›Ì‰ »œÊ‰ companyId √Ê companyId = default
        const employees = data.employees.filter(e => 
            id === 'default' 
                ? (!e.companyId || e.companyId === 'default')
                : e.companyId === id
        );
        
        res.json({
            success: true,
            count: employees.length,
            employees: employees.map(e => ({
                id: e.id,
                name: e.name,
                username: e.username,
                department: e.department,
                role: e.role,
                createdAt: e.createdAt
            }))
        });
    } catch (error) {
        console.error('Œÿ√ ›Ì Ã·» „ÊŸ›Ì «·‘—ﬂ…:', error);
        res.status(500).json({ error: error.message });
    }
});

// ≈Õ’«∆Ì«  ‘—ﬂ…
app.get('/companies/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;
        const employeesDataObj = await getEmployeesData();
        
        // ⁄œ «·„ÊŸ›Ì‰
        const employees = employeesDataObj.employees.filter(e => 
            id === 'default' 
                ? (!e.companyId || e.companyId === 'default')
                : e.companyId === id
        );
        
        // Ì„ﬂ‰ ≈÷«›… ≈Õ’«∆Ì«  «·„ﬂ«·„«  ·«Õﬁ«
        res.json({
            success: true,
            stats: {
                employeesCount: employees.length,
                onlineNow: 0, // ”Ì „ Õ”«»Â
                totalCalls: 0,
                totalDuration: 0
            }
        });
    } catch (error) {
        console.error('Œÿ√ ›Ì Ã·» ≈Õ’«∆Ì«  «·‘—ﬂ…:', error);
        res.status(500).json({ error: error.message });
    }
});

// «·Õ’Ê· ⁄·Ï »Ì«‰«  ‘—ﬂ… «·„” Œœ„ «·Õ«·Ì
app.get('/my-company', async (req, res) => {
    try {
        const { userId } = req.query;
        
        if (!userId) {
            return res.status(400).json({ error: 'userId „ÿ·Ê»' });
        }
        
        const employeesDataObj = await getEmployeesData();
        const user = employeesDataObj.employees.find(e => e.id.toString() === userId);
        
        if (!user) {
            return res.status(404).json({ error: '«·„” Œœ„ €Ì— „ÊÃÊœ' });
        }
        
        const companiesDataObj = await getCompaniesData();
        const company = companiesDataObj.companies.find(c => c.id === (user.companyId || 'default'));
        
        if (!company) {
            return res.json({
                success: true,
                company: {
                    id: 'default',
                    name: 'Link Call',
                    isDefault: true
                }
            });
        }
        
        res.json({
            success: true,
            company: {
                id: company.id,
                name: company.name,
                subscription: company.subscription,
                isActive: company.isActive,
                settings: company.settings
            },
            userRole: user.role
        });
    } catch (error) {
        console.error('Œÿ√ ›Ì Ã·» »Ì«‰«  «·‘—ﬂ…:', error);
        res.status(500).json({ error: error.message });
    }
});

console.log('? ‰Ÿ«„ «·‘—ﬂ«  «·„ ⁄œœ… Ã«Â“');

// Export for Vercel serverless
module.exports = app;

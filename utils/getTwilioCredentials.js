/**
 * getTwilioCredentials(companyId)
 * ─────────────────────────────────────────────────────────────────────────
 * Priority lookup for Twilio credentials:
 *   1. Firestore  companies/{id}.twilioCredentials  (new self-service system)
 *   2. Firestore  companies/{id}.twilioEnvPrefix    (legacy ENV-prefix system)
 *   3. Default ENV vars (TWILIO_*)
 *
 * Returns an object:
 *   { accountSid, authToken, apiKey, apiSecret, twimlAppSid, phoneNumber }
 */
module.exports = async function getTwilioCredentials(companyId) {
    // ── defaults from ENV ────────────────────────────────────────────────
    let creds = {
        accountSid:  process.env.TWILIO_ACCOUNT_SID,
        authToken:   process.env.TWILIO_AUTH_TOKEN,
        apiKey:      process.env.TWILIO_API_KEY,
        apiSecret:   process.env.TWILIO_API_SECRET,
        twimlAppSid: process.env.TWILIO_TWIML_APP_SID,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    };

    if (!companyId) return creds;

    try {
        const { getDb }       = require('./firebase');
        const { doc, getDoc } = require('firebase/firestore');
        const snap = await getDoc(doc(getDb(), 'companies', companyId));

        if (!snap.exists()) return creds;
        const data = snap.data();

        // ── Priority 1: Firestore-stored credentials (new system) ────────
        if (data.twilioCredentials && data.twilioCredentials.accountSid) {
            const tc = data.twilioCredentials;
            console.log(`✅ getTwilioCredentials: Firestore credentials للشركة ${data.companyName || companyId}`);
            return {
                accountSid:  tc.accountSid  || creds.accountSid,
                authToken:   tc.authToken   || creds.authToken,
                apiKey:      tc.apiKey      || creds.apiKey,
                apiSecret:   tc.apiSecret   || creds.apiSecret,
                twimlAppSid: tc.twimlAppSid || creds.twimlAppSid,
                phoneNumber: tc.phoneNumber  || creds.phoneNumber,
            };
        }

        // ── Priority 2: ENV-prefix system (legacy) ───────────────────────
        if (data.twilioEnvPrefix) {
            const p   = data.twilioEnvPrefix;
            const sid = process.env[`${p}_TWILIO_ACCOUNT_SID`];
            const tok = process.env[`${p}_TWILIO_AUTH_TOKEN`];
            if (sid && tok) {
                console.log(`✅ getTwilioCredentials: ENV-prefix credentials للشركة ${data.companyName || companyId} (${p})`);
                return {
                    accountSid:  sid,
                    authToken:   tok,
                    apiKey:      process.env[`${p}_TWILIO_API_KEY`]      || creds.apiKey,
                    apiSecret:   process.env[`${p}_TWILIO_API_SECRET`]   || creds.apiSecret,
                    twimlAppSid: process.env[`${p}_TWILIO_TWIML_APP_SID`]|| creds.twimlAppSid,
                    phoneNumber: data.twilioPhone || creds.phoneNumber,
                };
            }
            console.warn(`⚠️ getTwilioCredentials: ${p}_TWILIO_* غير موجودة في ENV — fallback للإعداد الافتراضي`);
        }

        // ── Priority 3: twilioPhone only (no separate account) ───────────
        if (data.twilioPhone) {
            creds.phoneNumber = data.twilioPhone;
        }
    } catch (e) {
        console.warn('⚠️ getTwilioCredentials fallback:', e.message);
    }

    return creds;
};

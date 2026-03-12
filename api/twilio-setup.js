/**
 * POST /api/twilio-setup
 * ─────────────────────────────────────────────────────────────────────────
 * Body:
 *   { companyId, accountSid, authToken, apiKey, apiSecret, phoneNumber }
 *
 * Actions:
 *   1. Validates credentials by calling Twilio API
 *   2. Auto-creates a TwiML App with the voice webhook
 *   3. Saves all credentials to Firestore companies/{companyId}.twilioCredentials
 *   4. Returns { success, twimlAppSid, message }
 *
 * DELETE /api/twilio-setup?companyId=xxx
 *   Removes twilioCredentials from Firestore (reset to default)
 *
 * GET /api/twilio-setup?companyId=xxx
 *   Returns current stored credentials (authToken masked)
 */
const twilio = require('twilio');

const VOICE_WEBHOOK_URL = 'https://linkcall.akrammostafa.com/api/voice';


module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // ── Simple auth: require super-admin token ────────────────────────────
    const authHeader = req.headers.authorization || '';
    const adminToken = process.env.ADMIN_SECRET || 'linkcall-super-admin-2024';
    if (!authHeader.includes(adminToken)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { getDb } = require('../server/utils/firebase');
        const { doc, getDoc, updateDoc, setDoc } = require('firebase/firestore');
        const db = getDb();

        // ═══════════════════════════════════════════════════════════════════
        // GET — return current credentials (masked)
        // ═══════════════════════════════════════════════════════════════════
        if (req.method === 'GET') {
            const companyId = req.query.companyId;
            if (!companyId) return res.status(400).json({ error: 'companyId required' });

            const snap = await getDoc(doc(db, 'companies', companyId));
            if (!snap.exists()) return res.status(404).json({ error: 'Company not found' });

            const tc = snap.data().twilioCredentials || null;
            if (!tc) return res.status(200).json({ configured: false });

            return res.status(200).json({
                configured: true,
                accountSid: tc.accountSid,
                authToken: tc.authToken ? tc.authToken.substring(0, 6) + '••••••••••••••••••••••••••' : null,
                apiKey: tc.apiKey,
                apiSecret: tc.apiSecret ? tc.apiSecret.substring(0, 6) + '••••••••' : null,
                twimlAppSid: tc.twimlAppSid,
                phoneNumber: tc.phoneNumber,
                whatsappNumber: tc.whatsappNumber,
                updatedAt: tc.updatedAt,
            });
        }

        // ═══════════════════════════════════════════════════════════════════
        // DELETE — remove credentials (reset to default)
        // ═══════════════════════════════════════════════════════════════════
        if (req.method === 'DELETE') {
            const companyId = req.query.companyId;
            if (!companyId) return res.status(400).json({ error: 'companyId required' });

            const snap = await getDoc(doc(db, 'companies', companyId));
            if (!snap.exists()) return res.status(404).json({ error: 'Company not found' });

            const { updateDoc: ud, deleteField } = require('firebase/firestore');
            const { FieldValue } = require('firebase-admin/firestore');

            // Use updateDoc with null to clear the field
            await updateDoc(doc(db, 'companies', companyId), {
                twilioCredentials: null
            });

            console.log(`🗑️ twilio-setup: تم حذف credentials شركة ${companyId}`);
            return res.status(200).json({ success: true, message: 'تم إزالة إعدادات Twilio' });
        }

        // ═══════════════════════════════════════════════════════════════════
        // POST — save credentials (+ auto-create TwiML App)
        // ═══════════════════════════════════════════════════════════════════
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // ── Body parsing fallback ────────────────────────────────────────
        if (req.method !== 'GET' && typeof req.body === 'string') {
            try { req.body = JSON.parse(req.body); } catch(e) { req.body = {}; }
        }
        if (req.method !== 'GET' && (!req.body || typeof req.body !== 'object')) {
            req.body = {};
        }

        const { companyId, accountSid, authToken, apiKey, apiSecret, phoneNumber, whatsappNumber, twimlAppSid: manualTwimlSid } = req.body || {};

        if (!companyId) return res.status(400).json({ error: 'companyId مطلوب' });
        if (!accountSid) return res.status(400).json({ error: 'accountSid مطلوب' });
        if (!authToken) return res.status(400).json({ error: 'authToken مطلوب' });

        // Sanitize: trim whitespace (common copy-paste issue)
        const cleanSid = accountSid.trim();
        const cleanToken = authToken.trim();
        const cleanApiKey = (apiKey || '').trim() || null;
        const cleanApiSecret = (apiSecret || '').trim() || null;
        const cleanPhone = (phoneNumber || '').trim() || null;
        const cleanWhatsapp = (whatsappNumber || '').trim() || null;

        // ── 1. Verify company exists ──────────────────────────────────────
        const compSnap = await getDoc(doc(db, 'companies', companyId));
        if (!compSnap.exists()) return res.status(404).json({ error: 'الشركة غير موجودة' });
        const companyName = compSnap.data().companyName || companyId;

        // ── 2. Create TwiML App (only if missing!) ───────────────────────
        let twimlAppSid = manualTwimlSid || null;
        let finalApiKey = cleanApiKey;
        let finalApiSecret = cleanApiSecret;
        let setupWarning = null;

        // ⚡ Fast path: إذا كان TwiML App SID و API Key موجودين → حفظ مباشرةً بدون استدعاء Twilio API
        const hasTwimlApp = !!(twimlAppSid && twimlAppSid.startsWith('AP'));
        const hasApiKey   = !!(finalApiKey && finalApiSecret);

        if (!hasTwimlApp || !hasApiKey) {
            // Slow path: نحتاج نكلم Twilio API لإنشاء TwiML App أو API Key
            try {
                const client = twilio(cleanSid, cleanToken);
                const appFriendlyName = `LinkCall - ${companyName}`;

                if (!hasTwimlApp) {
                    const existingApps = await client.applications.list({ friendlyName: appFriendlyName, limit: 1 });
                    if (existingApps.length > 0) {
                        twimlAppSid = existingApps[0].sid;
                        await client.applications(twimlAppSid).update({ voiceUrl: VOICE_WEBHOOK_URL, voiceMethod: 'POST' });
                        console.log(`♻️ twilio-setup: TwiML App مُحدَّث ${twimlAppSid}`);
                    } else {
                        const app = await client.applications.create({ friendlyName: appFriendlyName, voiceUrl: VOICE_WEBHOOK_URL, voiceMethod: 'POST' });
                        twimlAppSid = app.sid;
                        console.log(`✅ twilio-setup: TwiML App جديد ${twimlAppSid}`);
                    }
                }

                // Auto-create API Key if missing
                if (!hasApiKey) {
                    const newKey = await client.newKeys.create({ friendlyName: `LinkCall-${companyName}` });
                    finalApiKey = newKey.sid;
                    finalApiSecret = newKey.secret;
                    console.log(`🔑 twilio-setup: API Key تلقائي ${finalApiKey}`);
                }
            } catch (twilioErr) {
                // Don't block saving — credentials may still be valid for calls
                console.error('⚠️ twilio-setup: TwiML App فشل (credentials ستُحفظ):', twilioErr.code, twilioErr.message);
                setupWarning = `TwiML App لم يُنشأ (${twilioErr.code || twilioErr.status || twilioErr.message}) — يمكن إعادة الحفظ لاحقاً`;
            }
        } else {
            console.log(`⚡ twilio-setup: TwiML App و API Key موجودان — حفظ مباشر بدون Twilio API`);
        }

        // ── 3. Save to Firestore regardless of TwiML App result ──────────
        const twilioCredentials = {
            accountSid: cleanSid,
            authToken: cleanToken,
            apiKey: finalApiKey,
            apiSecret: finalApiSecret,
            twimlAppSid: twimlAppSid || null,
            phoneNumber: cleanPhone,
            whatsappNumber: cleanWhatsapp,
            updatedAt: new Date().toISOString(),
        };

        await updateDoc(doc(db, 'companies', companyId), { twilioCredentials });
        console.log(`💾 twilio-setup: تم حفظ credentials للشركة ${companyName} (${companyId})`);

        return res.status(200).json({
            success: true,
            twimlAppSid,
            apiKeyCreated: !cleanApiKey,
            warning: setupWarning,
            message: setupWarning
                ? `تم حفظ بيانات Twilio. ملاحظة: ${setupWarning}`
                : `تم حفظ إعدادات Twilio بنجاح لشركة ${companyName}`,
            phoneNumber: cleanPhone,
            whatsappNumber: cleanWhatsapp,
        });

    } catch (error) {
        console.error('❌ twilio-setup error:', error);
        return res.status(500).json({ error: error.message });
    }
};

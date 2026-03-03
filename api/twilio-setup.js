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
        const { getDb }                      = require('../utils/firebase');
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
                configured:  true,
                accountSid:  tc.accountSid,
                authToken:   tc.authToken ? tc.authToken.substring(0, 6) + '••••••••••••••••••••••••••' : null,
                apiKey:      tc.apiKey,
                apiSecret:   tc.apiSecret ? tc.apiSecret.substring(0, 6) + '••••••••' : null,
                twimlAppSid: tc.twimlAppSid,
                phoneNumber: tc.phoneNumber,
                updatedAt:   tc.updatedAt,
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

        const { companyId, accountSid, authToken, apiKey, apiSecret, phoneNumber } = req.body || {};

        if (!companyId)  return res.status(400).json({ error: 'companyId مطلوب' });
        if (!accountSid) return res.status(400).json({ error: 'accountSid مطلوب' });
        if (!authToken)  return res.status(400).json({ error: 'authToken مطلوب' });

        // ── 1. Verify company exists ──────────────────────────────────────
        const compSnap = await getDoc(doc(db, 'companies', companyId));
        if (!compSnap.exists()) return res.status(404).json({ error: 'الشركة غير موجودة' });
        const companyName = compSnap.data().companyName || companyId;

        // ── 2. Validate credentials + auto-create TwiML App ──────────────
        let twimlAppSid = null;
        let finalApiKey    = apiKey    || null;
        let finalApiSecret = apiSecret || null;
        try {
            const client = twilio(accountSid, authToken);

            // Validate credentials — use incomingPhoneNumbers (works for all account types incl. sub-accounts & trial)
            await client.incomingPhoneNumbers.list({ limit: 1 });
            console.log(`✅ twilio-setup: credentials صحيحة لـ ${accountSid}`);

            // ── Auto-create API Key if not provided ──
            // API Keys MUST belong to the same account — cannot borrow from default ENV
            if (!finalApiKey || !finalApiSecret) {
                const newKey = await client.newKeys.create({
                    friendlyName: `LinkCall-${companyName}`
                });
                finalApiKey    = newKey.sid;    // SK...
                finalApiSecret = newKey.secret; // only available at creation!
                console.log(`🔑 twilio-setup: تم إنشاء API Key تلقائياً ${finalApiKey}`);
            }

            // Look for existing TwiML App named "LinkCall - {companyName}"
            const appFriendlyName = `LinkCall - ${companyName}`;
            const existingApps = await client.applications.list({ friendlyName: appFriendlyName, limit: 1 });

            if (existingApps.length > 0) {
                twimlAppSid = existingApps[0].sid;
                // Update webhook URL in case it changed
                await client.applications(twimlAppSid).update({
                    voiceUrl:    VOICE_WEBHOOK_URL,
                    voiceMethod: 'POST',
                });
                console.log(`♻️ twilio-setup: تم تحديث TwiML App موجود ${twimlAppSid}`);
            } else {
                const app = await client.applications.create({
                    friendlyName: appFriendlyName,
                    voiceUrl:     VOICE_WEBHOOK_URL,
                    voiceMethod:  'POST',
                });
                twimlAppSid = app.sid;
                console.log(`✅ twilio-setup: تم إنشاء TwiML App ${twimlAppSid}`);
            }
        } catch (twilioErr) {
            console.error('❌ twilio-setup: فشل التحقق من credentials:', twilioErr.message);
            const isAuthError = twilioErr.status === 401 || twilioErr.code === 20003 || /authenticate/i.test(twilioErr.message);
            return res.status(400).json({
                error:   'فشل التحقق من بيانات Twilio',
                details: isAuthError
                    ? 'بيانات تسجيل الدخول غير صحيحة — تأكد من Account SID و Auth Token من لوحة Twilio Console'
                    : twilioErr.message,
            });
        }

        // ── 3. Save to Firestore ──────────────────────────────────────────
        const twilioCredentials = {
            accountSid,
            authToken,
            apiKey:      finalApiKey,
            apiSecret:   finalApiSecret,
            twimlAppSid: twimlAppSid || null,
            phoneNumber: phoneNumber || null,
            updatedAt:   new Date().toISOString(),
        };

        await updateDoc(doc(db, 'companies', companyId), { twilioCredentials });
        console.log(`💾 twilio-setup: تم حفظ credentials للشركة ${companyName} (${companyId})`);

        return res.status(200).json({
            success:     true,
            twimlAppSid,
            apiKeyCreated: !apiKey,  // inform admin that a new API Key was auto-created
            message:     `تم حفظ إعدادات Twilio بنجاح لشركة ${companyName}`,
            phoneNumber: phoneNumber || null,
        });

    } catch (error) {
        console.error('❌ twilio-setup error:', error);
        return res.status(500).json({ error: error.message });
    }
};

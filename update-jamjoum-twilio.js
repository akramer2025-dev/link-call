// Script: set JAMJOUM_TWIML_APP_SID env var, then run: node update-jamjoum-twilio.js
require('dotenv').config();
const JAMJOUM_COMPANY_ID = 'COMP-1772387540280-N0XTXR4DW';
const TWIML_APP_SID = process.env.JAMJOUM_TWIML_APP_SID || '';
async function run() {
    if (!TWIML_APP_SID) { console.error('Set JAMJOUM_TWIML_APP_SID first'); process.exit(1); }
    const { getDb } = require('./utils/firebase');
    const { doc, updateDoc, getDoc } = require('firebase/firestore');
    const db = getDb();
    const ref = doc(db, 'companies', JAMJOUM_COMPANY_ID);
    const snap = await getDoc(ref);
    if (!snap.exists()) { console.error('Company not found'); process.exit(1); }
    await updateDoc(ref, { twilioPhone: '+18154860356', twilioEnvPrefix: 'JAMJOUM', updatedAt: new Date().toISOString() });
    console.log('Done! Add JAMJOUM_ prefixed vars to Vercel: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_API_KEY, TWILIO_API_SECRET, TWILIO_TWIML_APP_SID');
    process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
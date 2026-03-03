// Script: patch twimlAppSid directly in Firestore twilioCredentials
// Run: node update-jamjoum-twilio.js
require('dotenv').config();

const JAMJOUM_COMPANY_ID = 'COMP-1772387540280-N0XTXR4DW';
const TWIML_APP_SID      = 'AP3b0f46949db7a10dea5416bc0733f7c5';

async function run() {
    const { getDb }               = require('./utils/firebase');
    const { doc, getDoc, updateDoc } = require('firebase/firestore');
    const db  = getDb();
    const ref = doc(db, 'companies', JAMJOUM_COMPANY_ID);

    const snap = await getDoc(ref);
    if (!snap.exists()) { console.error('Company not found'); process.exit(1); }

    const data = snap.data();
    const existing = data.twilioCredentials || {};

    if (!existing.accountSid) {
        console.error('No twilioCredentials found! Please save credentials from admin panel first.');
        process.exit(1);
    }

    // Merge: only update twimlAppSid, keep everything else
    const updated = {
        ...existing,
        twimlAppSid: TWIML_APP_SID,
        updatedAt:   new Date().toISOString()
    };

    await updateDoc(ref, { twilioCredentials: updated });
    console.log('✅ Done! twimlAppSid saved:', TWIML_APP_SID);
    console.log('   accountSid:', updated.accountSid);
    console.log('   apiKey:    ', updated.apiKey || '(none)');
    process.exit(0);
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
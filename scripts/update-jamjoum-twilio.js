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

    console.log('\n📋 Current twilioCredentials in Firestore:');
    console.log('   accountSid: ', existing.accountSid  || '(empty)');
    console.log('   authToken:  ', existing.authToken   ? existing.authToken.substring(0,6)+'...' : '(empty)');
    console.log('   apiKey:     ', existing.apiKey      || '(empty)');
    console.log('   apiSecret:  ', existing.apiSecret   ? existing.apiSecret.substring(0,6)+'...' : '(empty)');
    console.log('   twimlAppSid:', existing.twimlAppSid || '(empty)');
    console.log('   phoneNumber:', existing.phoneNumber || '(empty)');

    const accountSidLooksWrong = existing.accountSid && !existing.accountSid.startsWith('AC');
    if (accountSidLooksWrong) {
        console.log('\n⚠️  WARNING: accountSid does NOT start with "AC" — looks like wrong value!');
        console.log('   Expected: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
        console.log('   Got:     ', existing.accountSid);
        console.log('\n   → Go to admin panel → Companies → ⚙️ Twilio Setup → re-enter correct Account SID\n');
    }

    // Still patch twimlAppSid regardless
    const updated = { ...existing, twimlAppSid: TWIML_APP_SID, updatedAt: new Date().toISOString() };
    await updateDoc(ref, { twilioCredentials: updated });
    console.log('✅ twimlAppSid patched to:', TWIML_APP_SID);
    process.exit(0);
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
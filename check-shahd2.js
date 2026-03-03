require('dotenv').config();
const { getDb } = require('./utils/firebase');
const { doc, getDoc } = require('firebase/firestore');

async function run() {
    const db = getDb();
    const snap = await getDoc(doc(db, 'companies', 'COMP-1772387540280-N0XTXR4DW'));
    const data = snap.data();
    const shahd = (data.employees||[]).find(e => e.username === 'SHAHD');
    if (shahd) {
        console.log('اسم:', shahd.name);
        console.log('username:', shahd.username);
        console.log('password:', shahd.password);
        console.log('role:', shahd.role);
        console.log('active:', shahd.active);
    }
    process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });

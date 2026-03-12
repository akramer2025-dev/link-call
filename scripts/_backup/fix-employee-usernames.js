require('dotenv').config();
const { getDb } = require('./utils/firebase');
const { doc, getDoc, updateDoc } = require('firebase/firestore');

// خريطة التحديثات: username القديم → username الجديد
// نغير shahd فقط لأن دي المشكلة المؤكدة
const USERNAME_UPDATES = {
    'SHAHD': 'shahd@jamjoumgroup.com',
};

async function run() {
    const db = getDb();
    const ref = doc(db, 'companies', 'COMP-1772387540280-N0XTXR4DW');
    const snap = await getDoc(ref);
    if (!snap.exists()) { console.error('Company not found'); process.exit(1); }

    const data = snap.data();
    const employees = data.employees || [];
    let changed = 0;

    const updated = employees.map(e => {
        const newUsername = USERNAME_UPDATES[e.username];
        if (newUsername) {
            console.log(`✅ ${e.name}: "${e.username}" → "${newUsername}"`);
            changed++;
            return { ...e, username: newUsername };
        }
        return e;
    });

    if (changed === 0) {
        console.log('لا توجد تغييرات مطلوبة');
        process.exit(0);
    }

    await updateDoc(ref, { employees: updated });
    console.log(`\n✅ تم تحديث ${changed} موظف بنجاح`);
    process.exit(0);
}
run().catch(e => { console.error('❌', e.message); process.exit(1); });

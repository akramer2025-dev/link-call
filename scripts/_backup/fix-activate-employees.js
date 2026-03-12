/**
 * fix-activate-employees.js
 * يفعّل جميع الموظفين غير المحذوفين في كل الشركات
 * التشغيل: node fix-activate-employees.js
 */
require('dotenv').config();
const { getDb } = require('./utils/firebase');
const { collection, getDocs, doc, updateDoc } = require('firebase/firestore');

async function run() {
    const db = getDb();
    const snapshot = await getDocs(collection(db, 'companies'));

    if (snapshot.empty) {
        console.log('لا توجد شركات في Firestore');
        process.exit(0);
    }

    let totalActivated = 0;
    let totalAlready   = 0;
    let totalDeleted   = 0;

    for (const docSnap of snapshot.docs) {
        const data      = docSnap.data();
        const companyId = docSnap.id;
        const employees = data.employees || [];

        if (employees.length === 0) continue;

        let changed = false;
        const updated = employees.map(e => {
            if (e._deleted) {
                totalDeleted++;
                return e; // لا نلمس المحذوفين
            }
            if (e.active === false) {
                console.log(`  ✅ تفعيل: ${e.name} (${e.username}) في شركة ${data.companyName || companyId}`);
                totalActivated++;
                changed = true;
                return { ...e, active: true };
            }
            totalAlready++;
            return e;
        });

        if (changed) {
            await updateDoc(doc(db, 'companies', companyId), { employees: updated });
            console.log(`💾 حُفظت شركة: ${data.companyName || companyId}`);
        }
    }

    console.log('\n=== الملخص ===');
    console.log(`✅ تم تفعيل  : ${totalActivated} موظف`);
    console.log(`ℹ️  كانوا نشطين بالفعل: ${totalAlready} موظف`);
    console.log(`🗑️  محذوفين (لم يُمسّوا): ${totalDeleted} موظف`);
    process.exit(0);
}

run().catch(e => {
    console.error('❌ خطأ:', e.message);
    process.exit(1);
});

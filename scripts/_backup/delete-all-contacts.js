// delete-all-contacts.js
// Run: node delete-all-contacts.js

async function main() {
    const { initializeApp, getApps } = require('firebase/app');
    const { getFirestore, collection, getDocs, doc, updateDoc, writeBatch } = require('firebase/firestore');

    const app = getApps().length ? getApps()[0] : require('firebase/app').initializeApp({
        apiKey: "AIzaSyB9rVI5Fn96Mhm6x6aVcKrf8_epQ_c9H4s",
        projectId: "akramplatform-2c6be",
        appId: "1:132959399686:web:7f1db74b25bebe27a8f887"
    });

    const db = getFirestore(app);
    const companyId = 'COMP-1772387540280-N0XTXR4DW';

    console.log('جاري جلب جهات الاتصال من Firestore...');
    const snap = await getDocs(collection(db, 'companies', companyId, 'contacts'));
    const all = [];
    snap.forEach(d => { if (!d.data()._deleted) all.push(d.id); });
    console.log(`وُجد ${all.length} جهة اتصال نشطة`);

    if (all.length === 0) { console.log('لا يوجد شيء للحذف'); process.exit(0); }

    // soft delete in batches of 400
    let done = 0;
    const now = new Date().toISOString();
    for (let i = 0; i < all.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = all.slice(i, i + 400);
        for (const id of chunk) {
            batch.update(doc(db, 'companies', companyId, 'contacts', id), {
                _deleted: true,
                _deletedAt: now,
                _deletedBy: 'admin-cleanup'
            });
        }
        await batch.commit();
        done += chunk.length;
        console.log(`تم وضع علامة حذف على ${done}/${all.length}...`);
    }

    console.log(`✅ تم مسح ${done} جهة اتصال بنجاح`);
    process.exit(0);
}

main().catch(e => { console.error('خطأ:', e.message); process.exit(1); });

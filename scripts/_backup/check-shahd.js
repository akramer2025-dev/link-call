require('dotenv').config();
const { getDb } = require('./utils/firebase');
const { doc, getDoc } = require('firebase/firestore');
const crypto = require('crypto');

async function run() {
    const db = getDb();
    const snap = await getDoc(doc(db, 'companies', 'COMP-1772387540280-N0XTXR4DW'));
    const data = snap.data();
    const employees = data.employees || [];
    console.log('\n=== موظفي Jamjoum ===');
    console.log('عدد الموظفين:', employees.length);
    employees.forEach((e, i) => {
        console.log(`\n[${i+1}] اسم: ${e.name}`);
        console.log(`     username: ${e.username}`);
        console.log(`     active: ${e.active}`);
        console.log(`     _deleted: ${e._deleted}`);
        console.log(`     role: ${e.role}`);
    });
    
    // بحث shahd
    const shahd = employees.find(e => (e.username||'').toLowerCase() === 'shahd@jamjoumgroup.com');
    console.log('\n=== بحث shahd@jamjoumgroup.com ===');
    if (shahd) {
        console.log('موجودة:', JSON.stringify(shahd, null, 2));
    } else {
        console.log('غير موجودة في قائمة الموظفين!');
        // بحث جزئي
        const partial = employees.filter(e => (e.username||'').toLowerCase().includes('shahd'));
        if (partial.length > 0) {
            console.log('نتائج بحث جزئي:', partial.map(e => e.username));
        }
    }
    process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });

// استيراد جهات الاتصال من Excel إلى Firestore
const fs = require('fs');
const https = require('https');

const API_URL = 'https://linkcall.akrammostafa.com/api/contacts';
const COMPANY_ID = 'COMP-1772387540280-N0XTXR4DW'; // Jamjoum Group

// قراءة البيانات من الملف
const data = fs.readFileSync('contacts-data.txt', 'utf8');
const lines = data.trim().split('\n');
const contacts = lines.map(line => {
  const parts = line.split('\t');
  return {
    email: parts[0],
    name: parts[1],
    lastName: parts[2],
    phone: parts[3],
    country: parts[4],
    balance: parts[5]
  };
});

let successCount = 0;
let errorCount = 0;
let duplicateCount = 0;

async function addContact(contact) {
  return new Promise((resolve, reject) => {
    const fullName = `${contact.name} ${contact.lastName}`.trim();
    const data = JSON.stringify({
      companyId: COMPANY_ID,
      name: fullName,
      phone: contact.phone,
      email: contact.email || null,
      notes: `Country: ${contact.country} | Balance: ${contact.balance}`,
      tags: [contact.country, 'Excel Import'],
      addedBy: 'Excel Import Script',
      device: 'Server Script'
    });

    const options = {
      hostname: 'linkcall.akrammostafa.com',
      port: 443,
      path: '/api/contacts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.success) {
            console.log(`✅ ${fullName} - ${contact.phone}`);
            successCount++;
            resolve(result);
          } else {
            if (result.error && result.error.includes('already exists')) {
              console.log(`⚠️  ${fullName} - ${contact.phone} (مضاف مسبقاً)`);
              duplicateCount++;
            } else {
              console.log(`❌ ${fullName} - ${result.error || 'Unknown error'}`);
              errorCount++;
            }
            resolve(result);
          }
        } catch (e) {
          console.log(`❌ ${fullName} - Parse error: ${e.message}`);
          errorCount++;
          resolve({ success: false, error: e.message });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${contact.name} - ${error.message}`);
      errorCount++;
      resolve({ success: false, error: error.message });
    });

    req.write(data);
    req.end();
  });
}

async function importAll() {
  console.log(`\n🚀 بداية الاستيراد: ${contacts.length} جهة اتصال\n`);
  console.log(`🏢 الشركة: Jamjoum Group (${COMPANY_ID})\n`);
  
  for (let i = 0; i < contacts.length; i++) {
    await addContact(contacts[i]);
    // انتظار قصير جداً بين كل طلب
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 النتيجة النهائية:`);
  console.log(`   ✅ نجح: ${successCount}`);
  console.log(`   ⚠️  مكرر: ${duplicateCount}`);
  console.log(`   ❌ فشل: ${errorCount}`);
  console.log(`   📝 الإجمالي: ${contacts.length}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

importAll().catch(err => {
  console.error('❌ خطأ في الاستيراد:', err);
  process.exit(1);
});

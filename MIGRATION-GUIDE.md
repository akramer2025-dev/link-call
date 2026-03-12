# 🚀 دليل الهجرة من Firebase إلى MySQL

هذا الدليل الشامل لنقل قاعدة بيانات Link Call من Firebase Firestore إلى MySQL.

---

## 📋 جدول المحتويات

1. [المتطلبات](#المتطلبات)
2. [الإعداد الأولي](#الإعداد-الأولي)
3. [تنفيذ الهجرة](#تنفيذ-الهجرة)
4. [تحديث ملفات API](#تحديث-ملفات-api)
5. [الاختبار](#الاختبار)
6. [الخطوات النهائية](#الخطوات-النهائية)

---

## 1️⃣ المتطلبات

### أ. MySQL Server
- تثبيت MySQL Server 8.0 أو أحدث
- أو استخدام خدمة MySQL سحابية (مثل: AWS RDS, Firebase Cloud SQL)

### ب. Node.js Packages
```bash
npm install mysql2
```

---

## 2️⃣ الإعداد الأولي

### الخطوة 1: إنشاء قاعدة البيانات

قم بتنفيذ ملف `database_schema.sql` في MySQL:

```bash
mysql -u root -p < database_schema.sql
```

أو من MySQL Workbench:
1. افتح MySQL Workbench
2. اتصل بسيرفر MySQL
3. File → Open SQL Script → اختر `database_schema.sql`
4. اضغط Execute (⚡ أو Ctrl+Shift+Enter)

### الخطوة 2: إعداد ملف البيئة (.env)

أنشئ ملف `.env` في جذر المشروع:

```env
# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=link_call_system

# Twilio Credentials (Default)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_API_KEY=your_api_key
TWILIO_API_SECRET=your_api_secret
TWILIO_PHONE_NUMBER=+1234567890

# Server Configuration
PORT=3000
NODE_ENV=development
```

**⚠️ مهم:** لا ترفع ملف `.env` إلى Git!

### الخطوة 3: اختبار الاتصال بـ MySQL

```javascript
// test-mysql-connection.js
const { testConnection } = require('./utils/mysql');

testConnection().then(connected => {
    if (connected) {
        console.log('✅ MySQL متصل بنجاح!');
    } else {
        console.log('❌ فشل الاتصال بـ MySQL');
    }
});
```

تشغيل:
```bash
node test-mysql-connection.js
```

---

## 3️⃣ تنفيذ الهجرة

### الخطوة 1: نقل البيانات من Firebase إلى MySQL

```bash
node migrate-firebase-to-mysql.js
```

هذا السكريبت سينقل:
- ✅ جميع الشركات (Companies)
- ✅ جميع الموظفين (Employees) مع صلاحياتهم
- ✅ جميع جهات الاتصال (Contacts)
- ✅ جميع التسجيلات (Recordings)

### الخطوة 2: التحقق من البيانات

بعد الهجرة، تحقق من البيانات في MySQL:

```sql
-- عدد الشركات
SELECT COUNT(*) AS total_companies FROM companies;

-- عدد الموظفين
SELECT COUNT(*) AS total_employees FROM employees;

-- عدد جهات الاتصال
SELECT COUNT(*) AS total_contacts FROM contacts;

-- عدد التسجيلات
SELECT COUNT(*) AS total_recordings FROM recordings;

-- أول 10 شركات
SELECT id, company_name, username, balance, created_at FROM companies LIMIT 10;
```

---

## 4️⃣ تحديث ملفات API

### الملفات التي تحتاج تحديث:

#### ✅ تم إنشاؤها:
1. `utils/mysql.js` - اتصال MySQL
2. `utils/company-mysql.js` - وظائف الشركات
3. `utils/employee-mysql.js` - وظائف الموظفين
4. `utils/contact-mysql.js` - وظائف جهات الاتصال

#### 🔄 تحتاج تحديث:
1. `api/companies.js` - استبدال Firebase بـ MySQL
2. `api/contacts.js` - استبدال Firebase بـ MySQL
3. `api/recordings.js` - استبدال Firebase بـ MySQL
4. `api/token.js` - تحديث جلب بيانات الشركة
5. `api/voice.js` - تحديث جلب بيانات الشركة

### مثال: تحديث api/companies.js

**قبل (Firebase):**
```javascript
const { getDb } = require('../utils/firebase');
const { collection, getDocs } = require('firebase/firestore');

async function getCompaniesData() {
    const db = getDb();
    const snapshot = await getDocs(collection(db, 'companies'));
    const companies = [];
    snapshot.forEach(docSnap => companies.push(docSnap.data()));
    return { companies };
}
```

**بعد (MySQL):**
```javascript
const { getAllCompanies } = require('../utils/company-mysql');

async function getCompaniesData() {
    const companies = await getAllCompanies();
    return { companies };
}
```

---

## 5️⃣ خطة تحديث API مفصلة

### api/companies.js

#### الوظائف المطلوب تحديثها:

1. **GET /api/companies/init**
```javascript
// قبل
const companiesData = await getCompaniesData(); // Firebase

// بعد
const { getAllCompanies } = require('../utils/company-mysql');
const companies = await getAllCompanies();
```

2. **POST /api/companies/register**
```javascript
const { createCompany } = require('../utils/company-mysql');

const newCompany = await createCompany({
    commercial_number: commercialNumber,
    company_name: companyName,
    admin_name: adminName,
    username: username,
    password: password,
    // ... باقي البيانات
});
```

3. **POST /api/companies/login**
```javascript
const { verifyLogin } = require('../utils/company-mysql');

const company = await verifyLogin(username, password);
if (!company) {
    return res.status(401).json({ success: false, error: 'بيانات دخول خاطئة' });
}
```

4. **PUT /api/companies/:id**
```javascript
const { updateCompany } = require('../utils/company-mysql');

await updateCompany(companyId, {
    company_name: companyName,
    balance: newBalance,
    // ... باقي التحديثات
});
```

### api/contacts.js

#### الوظائف المطلوب تحديثها:

1. **GET /api/contacts**
```javascript
const { getCompanyContacts } = require('../utils/contact-mysql');

const contacts = await getCompanyContacts(companyId);
res.json({ success: true, contacts });
```

2. **POST /api/contacts**
```javascript
const { createContact } = require('../utils/contact-mysql');

const contact = await createContact(companyId, {
    name: name,
    phone: phone,
    email: email,
    // ... باقي البيانات
});
```

3. **PUT /api/contacts/:id**
```javascript
const { updateContact } = require('../utils/contact-mysql');

await updateContact(contactId, {
    name: updatedName,
    phone: updatedPhone,
    // ... باقي التحديثات
});
```

4. **POST /api/contacts/bulk**
```javascript
const { bulkCreateContacts } = require('../utils/contact-mysql');

const results = await bulkCreateContacts(companyId, contactsArray, addedBy);
res.json({ 
    success: true, 
    imported: results.success,
    duplicates: results.duplicates,
    failed: results.failed
});
```

### api/recordings.js

إنشاء ملف `utils/recording-mysql.js`:

```javascript
const { query, queryOne } = require('./mysql');

async function getCompanyRecordings(companyId, limit = 100) {
    const sql = `
        SELECT * FROM recordings 
        WHERE company_id = ? AND is_deleted = FALSE 
        ORDER BY created_at DESC 
        LIMIT ?
    `;
    return await query(sql, [companyId, limit]);
}

async function createRecording(recordingData) {
    const sql = `
        INSERT INTO recordings (
            sid, call_sid, company_id, url, duration, status, to_number
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await query(sql, [
        recordingData.sid,
        recordingData.call_sid,
        recordingData.company_id,
        recordingData.url,
        recordingData.duration,
        recordingData.status,
        recordingData.to_number
    ]);
}

module.exports = { getCompanyRecordings, createRecording };
```

---

## 6️⃣ الاختبار

### اختبار تسجيل شركة جديدة

```bash
curl -X POST http://localhost:3000/api/companies/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "شركة اختبار",
    "commercialNumber": "123456",
    "adminName": "أحمد محمد",
    "username": "testcompany",
    "password": "Test@123",
    "selectedPlan": "free"
  }'
```

### اختبار تسجيل الدخول

```bash
curl -X POST http://localhost:3000/api/companies/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testcompany",
    "password": "Test@123"
  }'
```

### اختبار جلب جهات الاتصال

```bash
curl http://localhost:3000/api/contacts?companyId=COMP-xxxxx
```

---

## 7️⃣ الخطوات النهائية

### بعد التأكد من نجاح الهجرة:

1. **عمل نسخة احتياطية من Firebase**
```bash
# يمكنك تصدير البيانات من Firebase Console
# Tools → Data Export
```

2. **تعطيل Firebase (اختياري)**
- يمكنك الإبقاء على Firebase كنسخة احتياطية لفترة
- أو حذف بيانات الاعتماد من الكود

3. **تحديث إعدادات الإنتاج**
- رفع متغيرات البيئة على سيرفر الإنتاج (Vercel/Heroku/etc)
- التأكد من اتصال MySQL في الإنتاج

4. **مراقبة الأداء**
- MySQL عادة أسرع من Firestore للاستعلامات المعقدة
- راقب أوقات الاستجابة

---

## 🎯 ملخص الملفات

### ملفات جديدة:
- ✅ `utils/mysql.js` - اتصال MySQL
- ✅ `utils/company-mysql.js` - وظائف الشركات
- ✅ `utils/employee-mysql.js` - وظائف الموظفين
- ✅ `utils/contact-mysql.js` - وظائف جهات الاتصال
- ✅ `migrate-firebase-to-mysql.js` - سكريبت الهجرة
- ✅ `.env.example` - مثال على ملف البيئة

### ملفات محدثة:
- ✅ `package.json` - إضافة mysql2

### ملفات تحتاج تحديث:
- ⏳ `api/companies.js`
- ⏳ `api/contacts.js`
- ⏳ `api/recordings.js`
- ⏳ `api/token.js`
- ⏳ `api/voice.js`

---

## 🆘 حل المشاكل الشائعة

### خطأ: Cannot connect to MySQL
```bash
# تحقق من تشغيل MySQL
sudo service mysql status  # Linux
# أو
Get-Service MySQL  # Windows PowerShell

# تحقق من بيانات الاتصال في .env
```

### خطأ: Table doesn't exist
```bash
# أعد تشغيل schema
mysql -u root -p link_call_system < database_schema.sql
```

### خطأ: Duplicate entry
```bash
# نظف الجداول وأعد الهجرة
mysql -u root -p
> USE link_call_system;
> TRUNCATE TABLE contacts;
> TRUNCATE TABLE employees;
> TRUNCATE TABLE companies;
> EXIT;

node migrate-firebase-to-mysql.js
```

---

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من ملف الأخطاء (logs)
2. تأكد من بيانات الاتصال صحيحة
3. راجع هذا الدليل

---

## ✅ Checklist

- [ ] تثبيت MySQL Server
- [ ] تشغيل `database_schema.sql`
- [ ] إنشاء ملف `.env`
- [ ] تثبيت `npm install mysql2`
- [ ] اختبار الاتصال بـ MySQL
- [ ] تشغيل `node migrate-firebase-to-mysql.js`
- [ ] التحقق من البيانات في MySQL
- [ ] تحديث ملفات API
- [ ] اختبار جميع الوظائف
- [ ] نشر التحديثات

---

**آخر تحديث:** مارس 2026  
**الإصدار:** 1.0

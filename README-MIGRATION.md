# 🚀 الخطوات السريعة للهجرة إلى MySQL

## 📝 الخطوة 1: تثبيت MySQL
قم بتثبيت MySQL Server على جهازك:
- **Windows**: حمل من [mysql.com/downloads](https://dev.mysql.com/downloads/installer/)
- **Linux**: `sudo apt-get install mysql-server`
- **Mac**: `brew install mysql`

## 📝 الخطوة 2: إنشاء قاعدة البيانات
```bash
mysql -u root -p < database_schema.sql
```

## 📝 الخطوة 3: إعداد ملف البيئة
أنشئ ملف `.env`:
```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=كلمة_المرور_الخاصة_بك
MYSQL_DATABASE=link_call_system
```

## 📝 الخطوة 4: تثبيت المكتبات
```bash
npm install
```

## 📝 الخطوة 5: اختبار الاتصال
```bash
node test-mysql-connection.js
```

## 📝 الخطوة 6: تنفيذ الهجرة
```bash
node migrate-firebase-to-mysql.js
```

---

## 📚 للمزيد من التفاصيل
اقرأ الدليل الكامل في [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)

## ✅ الملفات التي تم إنشاؤها

### وظائف MySQL:
- `utils/mysql.js` - اتصال قاعدة البيانات
- `utils/company-mysql.js` - وظائف الشركات
- `utils/employee-mysql.js` - وظائف الموظفين
- `utils/contact-mysql.js` - وظائف جهات الاتصال

### سكريبتات:
- `migrate-firebase-to-mysql.js` - نقل البيانات
- `test-mysql-connection.js` - اختبار الاتصال

### دليل:
- `MIGRATION-GUIDE.md` - الدليل الشامل
- `README-MIGRATION.md` - هذا الملف

---

## ⚠️ مهم!
- **لا تحذف** بيانات Firebase قبل التأكد من نجاح الهجرة
- **احتفظ بنسخة احتياطية** من بياناتك
- **اختبر جميع الوظائف** بعد الهجرة

---

## 🎯 الخطوات التالية

بعد الهجرة، ستحتاج لتحديث:
1. ✅ `api/companies.js`
2. ✅ `api/contacts.js`
3. ✅ `api/recordings.js`
4. ✅ `api/token.js`
5. ✅ `api/voice.js`

راجع [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) للتفاصيل.

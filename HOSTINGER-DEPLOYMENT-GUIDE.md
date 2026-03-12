# 🚀 دليل نقل التطبيق إلى Hostinger

## 📋 المعلومات الحالية

- **الموقع**: linkcall.elosool.com
- **قاعدة البيانات**: u878468059_linkcall
- **المستخدم**: u878468059_linkcall
- **كلمة المرور**: Osool2026@

---

## خطوة 1️⃣: استيراد قاعدة البيانات

### الطريقة الأولى: استخدام phpMyAdmin (موصى به) ✅

1. **افتح phpMyAdmin** من لوحة تحكم Hostinger
2. **اختر قاعدة البيانات**: `u878468059_linkcall`
3. **اضغط على تبويب "Import" أو "استيراد"**
4. **اختر الملف**: `hostinger-import.sql`
5. **اضغط "Go" أو "تنفيذ"**
6. **انتظر حتى يكتمل** (قد يستغرق 1-2 دقيقة)

### التحقق من النجاح:
- يجب أن ترى: ✅ Import has been successfully finished
- عدد الجداول: 9 جداول

---

## خطوة 2️⃣: نقل البيانات من Firebase إلى MySQL

بعد إنشاء الجداول، شغّل سكريبت الهجرة:

```bash
node migrate-firebase-to-mysql.js
```

هذا سينقل:
- ✅ جميع الشركات
- ✅ جميع الموظفين
- ✅ جميع جهات الاتصال
- ✅ جميع التسجيلات

---

## خطوة 3️⃣: رفع الملفات إلى Hostinger

### الملفات المطلوبة:

```
linkcall.elosool.com/
├── index.html
├── login.html
├── register-company.html
├── platform.html
├── company-crm.html
├── manage-employees.html
├── admin.html
├── app.js
├── manifest.json
├── service-worker.js
├── api/
│   ├── companies.js
│   ├── contacts.js
│   ├── recordings.js
│   ├── token.js
│   ├── voice.js
│   └── ... (باقي ملفات API)
├── utils/
│   ├── mysql.js
│   ├── company-mysql.js
│   ├── employee-mysql.js
│   ├── contact-mysql.js
│   └── recording-mysql.js
├── server.js
├── package.json
├── .env
└── node_modules/ (سيتم تثبيتها على السيرفر)
```

### طرق الرفع:

#### أ. عبر File Manager في Hostinger:
1. افتح **File Manager** من لوحة التحكم
2. اذهب إلى مجلد: `public_html/`
3. احذف ملف `index.html` القديم
4. ارفع جميع الملفات

#### ب. عبر FTP:
1. استخدم FileZilla أو WinSCP
2. اتصل بـ:
   - Host: ftp.elosool.com
   - Username: (من لوحة التحكم)
   - Password: (من لوحة التحكم)
3. ارفع الملفات إلى `public_html/`

#### ج. عبر Git (موصى به للمطورين):
```bash
# في Hostinger Terminal
cd public_html
git clone [repository-url] .
```

---

## خطوة 4️⃣: تثبيت Dependencies على السيرفر

### من Hostinger Terminal:

```bash
cd public_html
npm install
```

أو عبر **SSH**:

```bash
ssh username@linkcall.elosool.com
cd public_html
npm install
```

---

## خطوة 5️⃣: تشغيل التطبيق

### الطريقة الأولى: Node.js Application

1. افتح لوحة التحكم → **Advanced** → **Node.js**
2. اضغط **Create Application**
3. املأ البيانات:
   - **Node.js version**: 18.x أو أحدث
   - **Application mode**: Production
   - **Application root**: public_html
   - **Application startup file**: server.js
   - **Application URL**: linkcall.elosool.com
4. اضغط **Create**

### الطريقة الثانية: PM2 (موصى به)

```bash
# تثبيت PM2
npm install -g pm2

# تشغيل التطبيق
pm2 start server.js --name linkcall

# حفظ التكوين
pm2 save
pm2 startup
```

---

## خطوة 6️⃣: إعداد متغيرات البيئة (.env)

### من File Manager:
1. افتح ملف `.env`
2. تأكد من:
```env
MYSQL_HOST=localhost
MYSQL_USER=u878468059_linkcall
MYSQL_PASSWORD=Osool2026@
MYSQL_DATABASE=u878468059_linkcall

NODE_ENV=production
PORT=3000
```

⚠️ **مهم**: لا ترفع ملف `.env` عبر Git! استخدم File Manager مباشرة.

---

## خطوة 7️⃣: إعداد SSL Certificate

Hostinger يوفر SSL مجاني:

1. اذهب إلى **SSL** في لوحة التحكم
2. اختر **Install SSL Certificate** لـ `linkcall.elosool.com`
3. اختر **Let's Encrypt** (مجاني)
4. انتظر التفعيل (5-10 دقائق)

---

## خطوة 8️⃣: اختبار التطبيق

### اختبار قاعدة البيانات:
```bash
node test-mysql-connection.js
```

### اختبار التطبيق:
افتح المتصفح:
- https://linkcall.elosool.com

### اختبار API:
```bash
curl https://linkcall.elosool.com/api/companies/init
```

---

## 🔧 Troubleshooting

### مشكلة: لا يعمل التطبيق
```bash
# تحقق من الـ logs
pm2 logs linkcall

# أو
tail -f /path/to/error.log
```

### مشكلة: خطأ في الاتصال بقاعدة البيانات
- تأكد من ملف `.env` موجود
- تأكد من بيانات الاتصال صحيحة
- تأكد أن MySQL يعمل

### مشكلة: 404 Not Found
- تأكد أن الملفات في `public_html/`
- تأكد من `.htaccess` موجود

---

## 📝 ملاحظات مهمة

1. **Backups**: Hostinger يعمل backup تلقائي، لكن احتفظ بنسخة محلية
2. **Security**: غيّر كلمات المرور بانتظام
3. **Updates**: حدّث المكتبات بانتظام: `npm update`
4. **Monitoring**: راقب استهلاك الموارد من لوحة التحكم

---

## ✅ Checklist

- [ ] استيراد قاعدة البيانات عبر phpMyAdmin
- [ ] تشغيل سكريبت الهجرة من Firebase
- [ ] رفع جميع الملفات إلى Hostinger
- [ ] تثبيت Node.js dependencies
- [ ] إعداد ملف .env
- [ ] تشغيل التطبيق (Node.js App أو PM2)
- [ ] تفعيل SSL Certificate
- [ ] اختبار جميع الوظائف
- [ ] إزالة بيانات الاعتماد من Firebase (اختياري)

---

## 🆘 الدعم

إذا واجهت مشاكل:
1. تحقق من error logs
2. راجع هذا الدليل
3. اتصل بدعم Hostinger

---

**آخر تحديث**: مارس 2026  
**الإصدار**: 1.0

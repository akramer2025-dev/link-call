# 🚀 دليل النشر البسيط - خطوة بخطوة

## 📍 الهدف
رفع التطبيق على: **www.akrammostafa.com/linkcall**

---

## ⚡ الطريقة الأسهل: cPanel

### الخطوة 1️⃣: تسجيل الدخول
```
1. افتح متصفح الإنترنت
2. اذهب إلى: www.akrammostafa.com/cpanel
3. أدخل اسم المستخدم وكلمة المرور
4. اضغط "Log in"
```

### الخطوة 2️⃣: فتح File Manager
```
1. ابحث عن "File Manager" في cPanel
2. اضغط عليه
3. ستفتح نافذة جديدة
```

### الخطوة 3️⃣: إنشاء مجلد linkcall
```
1. اضغط على "public_html" من القائمة اليمنى
2. اضغط زر "+ Folder" من الأعلى
3. اكتب اسم المجلد: linkcall
4. اضغط "Create New Folder"
```

### الخطوة 4️⃣: رفع الملفات
```
1. اضغط على مجلد "linkcall" اللي أنشأته
2. اضغط زر "Upload" من الأعلى
3. اضغط "Select File"
4. حدد جميع الملفات التالية من جهازك:

   ✅ الملفات الأساسية:
   - index.html
   - login.html
   - admin.html
   - admin.js
   - app.js
   - style.css
   - login-style.css
   - admin-style.css
   - protection.js
   - linkCallService.js
   - manifest.json
   - service-worker.js
   
   ✅ الصور:
   - icon-192.png
   - icon-512.png
   - logo.png (إن وجد)
   
   ✅ الملفات الجديدة:
   - register-company.html
   - super-admin.html
   - platform.html
   
   ✅ ملفات JSON:
   - contacts.json
   - employees.json
   - companies.json
   - call-metadata.json
   
   ✅ مجلد api (بالكامل):
   - api/index.js
   - api/voice.js
   - api/token.js
   - api/contacts.js
   - api/call-history.js
   - api/recordings.js
   - api/companies.js
   - ... (جميع ملفات مجلد api)

5. انتظر حتى يكتمل الرفع (100%)
6. اضغط "Go Back to ..."
```

### الخطوة 5️⃣: إعداد Node.js (مهم!)
```
1. ارجع لـ cPanel الرئيسي
2. ابحث عن "Setup Node.js App" أو "Node.js Selector"
3. اضغط عليه
4. املأ البيانات:
   - Node.js version: 14.x أو أعلى
   - Application mode: Production
   - Application root: public_html/linkcall
   - Application URL: linkcall
   - Application startup file: server.js
   
5. اضغط "Create"
6. انتظر... سيظهر لك أمر npm install
7. انسخ الأمر واضغط "Run NPM Install"
```

### الخطوة 6️⃣: رفع server.js و package.json
```
1. ارجع لـ File Manager
2. ارفع الملفات:
   - server.js
   - package.json

3. في cPanel، افتح Terminal
4. اكتب:
   cd public_html/linkcall
   npm install
   
5. بعد انتهاء التثبيت، اكتب:
   node server.js
   
6. إذا ظهرت رسالة "Server running"، يبقى تمام ✅
```

### الخطوة 7️⃣: رفع .htaccess
```
1. في File Manager
2. ارفع ملف .htaccess داخل مجلد linkcall
   (الملف موجود في المشروع)
3. إذا لم تشاهده، فعّل "Show Hidden Files" من Settings
```

### الخطوة 8️⃣: اختبار التطبيق
```
1. افتح متصفح جديد
2. اكتب: www.akrammostafa.com/linkcall
3. يجب أن تفتح صفحة تسجيل الدخول ✅
```

---

## 🔄 الطريقة البديلة: FTP

### الخطوة 1️⃣: تحميل FileZilla
```
1. اذهب إلى: https://filezilla-project.org
2. حمّل FileZilla Client (مجاني)
3. ثبته على جهازك
```

### الخطوة 2️⃣: الاتصال بالموقع
```
1. افتح FileZilla
2. في الأعلى، املأ:
   - Host: ftp.akrammostafa.com أو akrammostafa.com
   - Username: اسم مستخدم cPanel
   - Password: كلمة مرور cPanel
   - Port: 21
3. اضغط "Quickconnect"
```

### الخطوة 3️⃣: إنشاء المجلد
```
1. في الجهة اليمنى (السيرفر)، اذهب لـ public_html
2. كليك يمين → Create directory
3. اكتب: linkcall
4. اضغط OK
```

### الخطوة 4️⃣: رفع الملفات
```
1. في الجهة اليسرى (جهازك)، اذهب لمجلد المشروع:
   D:\link call
   
2. حدد جميع الملفات والمجلدات
3. اسحبها للجهة اليمنى (داخل مجلد linkcall)
4. انتظر حتى ينتهي الرفع
```

### الخطوة 5️⃣: إعداد الصلاحيات
```
1. كليك يمين على مجلد linkcall
2. اختر "File permissions"
3. اضبط على: 755
4. اضغط OK
```

### الخطوة 6️⃣: استكمال الإعداد
```
اتبع الخطوات 5 و 6 و 7 من طريقة cPanel أعلاه
```

---

## ✅ التحقق من النجاح

بعد انتهاء الرفع، اختبر الروابط التالية:

```
✅ www.akrammostafa.com/linkcall
   يجب أن تفتح صفحة تسجيل الدخول

✅ www.akrammostafa.com/linkcall/login.html
   صفحة تسجيل الدخول

✅ www.akrammostafa.com/linkcall/platform.html
   الصفحة الرئيسية للمنصة

✅ www.akrammostafa.com/linkcall/admin.html
   لوحة الإدارة (بعد تسجيل الدخول)

✅ www.akrammostafa.com/linkcall/register-company.html
   تسجيل شركة جديدة

✅ www.akrammostafa.com/linkcall/super-admin.html
   لوحة Super Admin
```

---

## 🔗 إضافة رابط في موقعك الرسمي

### في الصفحة الرئيسية www.akrammostafa.com

أضف زر أو رابط:

```html
<!-- في الـ Navigation -->
<a href="/linkcall" class="btn">📞 Link Call</a>

<!-- أو كبطاقة في الصفحة -->
<div class="service-card">
  <h3>📞 Link Call</h3>
  <p>منصة إدارة المكالمات السحابية</p>
  <a href="/linkcall" class="btn">استخدم الآن</a>
</div>
```

---

## 🔧 حل المشاكل الشائعة

### ❌ المشكلة: "404 Not Found"
```
الحل:
1. تأكد أن المجلد اسمه "linkcall" بالضبط
2. تأكد أن الملفات داخل المجلد
3. تأكد من رفع .htaccess
```

### ❌ المشكلة: "500 Internal Server Error"
```
الحل:
1. تأكد من تثبيت Node.js في cPanel
2. تأكد من تشغيل npm install
3. راجع error logs في cPanel
```

### ❌ المشكلة: صفحة الدخول تفتح لكن لا أستطيع تسجيل الدخول
```
الحل:
1. تأكد من رفع server.js
2. تأكد من تشغيل السيرفر: node server.js
3. تأكد من رفع ملفات API
```

### ❌ المشكلة: الصور لا تظهر
```
الحل:
1. تأكد من رفع icon-192.png و icon-512.png
2. تأكد من الصلاحيات (755)
```

---

## 📱 اختبار من الموبايل

```
1. افتح متصفح الموبايل
2. اكتب: www.akrammostafa.com/linkcall
3. يجب أن يعمل بشكل مثالي ✅
```

---

## 🎉 تهانينا!

التطبيق الآن متاح على:
**www.akrammostafa.com/linkcall** 🚀

---

## 📞 محتاج مساعدة؟

اتصل بشركة الاستضافة أو:
- اطلب منهم إعداد Node.js App
- أعطهم الخطوات أعلاه

---

## 📊 الخطوة التالية

بعد التأكد من عمل التطبيق:
1. ✅ سجّل دخول تجريبي
2. ✅ اختبر المكالمات
3. ✅ شارك الرابط
4. ✅ ابدأ استقبال الشركات!

---

**الآن لما حد يكتب:**
**www.akrammostafa.com/linkcall**
**راح يفتحله صفحة تسجيل الدخول!** ✅

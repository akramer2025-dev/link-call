# 🚀 رفع التطبيق على موقعك الرسمي

## 📍 الوضع الحالي

- ✅ عندك موقع رسمي على: **www.akrammostafa.com**
- 🎯 عايز ترفع التطبيق على: **www.akrammostafa.com/linkcall**

## 📂 الهيكل المطلوب

```
www.akrammostafa.com/
├── index.html                    → موقعك الرسمي (موجود)
├── about.html                    → صفحات موقعك
├── contact.html
└── linkcall/                     → مجلد التطبيق (جديد)
    ├── index.html                → صفحة التطبيق الرئيسية
    ├── login.html                → تسجيل الدخول
    ├── admin.html                → لوحة الإدارة
    ├── register-company.html     → تسجيل الشركات
    ├── super-admin.html          → Super Admin
    ├── api/                      → مجلد الـ API
    ├── protection.js
    ├── app.js
    └── ... (باقي الملفات)
```

## 🎯 الروابط بعد الرفع

```
www.akrammostafa.com              → موقعك الرسمي
www.akrammostafa.com/linkcall     → التطبيق الرئيسي
www.akrammostafa.com/linkcall/login → تسجيل الدخول
www.akrammostafa.com/linkcall/admin → لوحة الإدارة
```

## 📋 خطوات الرفع

### الطريقة 1: رفع يدوي (FTP)

#### 1. إنشاء مجلد linkcall
```
- افتح FTP Client (FileZilla مثلاً)
- اتصل بموقعك www.akrammostafa.com
- روح على المجلد الرئيسي (public_html أو htdocs)
- انشئ مجلد جديد اسمه "linkcall"
```

#### 2. رفع ملفات التطبيق
```
- حدد جميع ملفات التطبيق من جهازك
- ارفعها داخل مجلد linkcall
- تأكد من رفع:
  ✅ index.html
  ✅ login.html
  ✅ admin.html
  ✅ register-company.html
  ✅ super-admin.html
  ✅ app.js
  ✅ protection.js
  ✅ style.css
  ✅ مجلد api/
  ✅ مجلد النسخة النهائية/
  ✅ جميع الملفات الأخرى
```

#### 3. رفع ملفات الـ Backend
```
- ارفع server.js
- ارفع package.json
- في Terminal على السيرفر، نفذ:
  npm install
  node server.js
```

### الطريقة 2: Git Deploy (أوتوماتيكي)

#### 1. إنشاء repo منفصل
```bash
cd "D:\link call"
git init
git add .
git commit -m "Link Call App"
git remote add origin YOUR_REPO_URL
git push -u origin main
```

#### 2. ربط مع السيرفر
```bash
# على السيرفر
cd /path/to/www.akrammostafa.com
mkdir linkcall
cd linkcall
git clone YOUR_REPO_URL .
npm install
```

#### 3. Auto Deploy (اختياري)
```bash
# إنشاء webhook في GitHub
# عند push جديد، السيرفر يسحب التحديثات تلقائياً
```

### الطريقة 3: cPanel (سهلة)

#### 1. تسجيل دخول cPanel
```
- ادخل على لوحة تحكم cPanel
- افتح File Manager
```

#### 2. إنشاء المجلد
```
- روح على public_html
- اضغط "+ Folder" 
- اسم المجلد: linkcall
- اضغط Create
```

#### 3. رفع الملفات
```
- ادخل على مجلد linkcall
- اضغط Upload
- اختر جميع ملفات التطبيق
- انتظر انتهاء الرفع
```

#### 4. إعداد Node.js
```
- في cPanel، افتح "Setup Node.js App"
- اضغط "Create Application"
- اختر Node.js version (14.x أو أعلى)
- Application root: /public_html/linkcall
- Application URL: linkcall
- اضغط Create
```

## 🔧 تعديلات مطلوبة

### 1. تحديث الروابط في login.html

في ملف login.html، غيّر السطر:
```javascript
// قبل
window.location.href = 'index.html';

// بعد  
window.location.href = '/linkcall/index.html';
```

### 2. تحديث base URL في app.js

في ملف app.js، غيّر:
```javascript
// قبل
const baseUrl = '';

// بعد
const baseUrl = '/linkcall';
```

### 3. إضافة .htaccess (للسيرفرات Apache)

أنشئ ملف `.htaccess` داخل مجلد linkcall:
```apache
RewriteEngine On

# إعادة توجيه من /linkcall إلى /linkcall/login.html
RewriteRule ^$ login.html [L]

# API routes
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/$1 [L,QSA]
```

## 🌐 إضافة رابط من موقعك الرسمي

في الموقع الرسمي www.akrammostafa.com، أضف:

### في الـ Navigation Menu:
```html
<nav>
  <a href="/">الرئيسية</a>
  <a href="/about">من نحن</a>
  <a href="/services">الخدمات</a>
  <a href="/linkcall">Link Call 📞</a>  <!-- رابط التطبيق -->
  <a href="/contact">تواصل معنا</a>
</nav>
```

### أو بطاقة في الصفحة الرئيسية:
```html
<div class="service-card">
  <h3>📞 Link Call</h3>
  <p>منصة إدارة المكالمات السحابية</p>
  <a href="/linkcall" class="btn">ابدأ الآن</a>
</div>
```

## 🔐 إعداد قاعدة البيانات

### SQLite (سهل):
```bash
# الموقع يستخدم ملفات JSON بالفعل
# لا حاجة لتعديل
```

### MySQL (متقدم):
```javascript
// في server.js
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'linkcall_db'
});
```

## 🚀 اختبار بعد الرفع

### 1. اختبر الروابط:
```
✅ www.akrammostafa.com/linkcall
✅ www.akrammostafa.com/linkcall/login
✅ www.akrammostafa.com/linkcall/admin
✅ www.akrammostafa.com/linkcall/register-company
```

### 2. اختبر الوظائف:
```
✅ تسجيل الدخول
✅ إجراء مكالمة
✅ عرض التقارير
✅ إضافة موظف
```

### 3. اختبر من أجهزة مختلفة:
```
✅ كمبيوتر
✅ موبايل
✅ تابلت
```

## 📊 مراقبة الأداء

### Google Analytics
```html
<!-- في كل صفحة HTML -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🔒 SSL/HTTPS

تأكد من تفعيل HTTPS:
```
https://www.akrammostafa.com/linkcall
```

### إذا لم يكن مفعّل:
```
1. في cPanel → SSL/TLS Status
2. فعّل Let's Encrypt SSL
3. أو استخدم Cloudflare (مجاناً)
```

## 📞 الدعم الفني

إذا واجهت مشكلة اتصل بـ:
- مزود الاستضافة (Hosting Provider)
- أو دعمنا الفني

## ✅ Checklist نهائي

قبل إطلاق التطبيق:

```
□ رفع جميع الملفات في مجلد /linkcall
□ تحديث الروابط في الملفات
□ اختبار تسجيل الدخول
□ اختبار المكالمات
□ تفعيل HTTPS
□ إضافة رابط في الموقع الرسمي
□ اختبار من أجهزة مختلفة
□ إضافة Google Analytics
□ backup قاعدة البيانات
```

## 🎉 بعد الإطلاق

```
✅ شارك الرابط: www.akrammostafa.com/linkcall
✅ روّج على السوشيال ميديا
✅ اجمع feedback من المستخدمين
✅ حدّث التطبيق باستمرار
```

---

**الآن التطبيق متاح على:**
**www.akrammostafa.com/linkcall** 🚀

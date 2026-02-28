# 🏢 دليل إعداد المنصة السريع

## الخطوة 1: التشغيل المحلي

```bash
# بدء الخادم
node server.js
```

يجب أن ترى:
```
✅ الخادم يعمل على http://localhost:3000
📱 رقم Twilio: +1234567890
📊 المنصة: www.akrammostafa.com
```

## الخطوة 2: الوصول إلى الصفحات

### 🌟 الصفحة الرئيسية للمنصة
```
http://localhost:3000/platform.html
```

### 📝 تسجيل شركة جديدة
```
http://localhost:3000/register-company.html
```

### 🔐 تسجيل الدخول
```
http://localhost:3000/login.html
```

### 👨‍💼 لوحة تحكم المنصة (Super Admin)
```
http://localhost:3000/super-admin.html
```

### 📱 لوحة تحكم الشركة
```
http://localhost:3000/index.html
```

## الخطوة 3: اختبار التسجيل

### تسجيل شركة تجريبية:

1. اذهب إلى `register-company.html`
2. املأ البيانات:
   ```
   اسم الشركة: شركة التقنية المتقدمة
   رقم السجل: 1234567890
   نوع النشاط: تقنية المعلومات
   البلد: السعودية
   المدينة: الرياض
   
   اسم المسؤول: أحمد محمد
   المسمى الوظيفي: مدير عام
   الجوال: +966501234567
   البريد: ahmed@tech.com
   اسم المستخدم: admin
   كلمة المرور: password123
   
   الخطة: الأساسية (مجاناً)
   ```
3. اضغط "تأكيد التسجيل"

## الخطوة 4: تسجيل الدخول

1. اذهب إلى `login.html`
2. أدخل:
   ```
   اسم المستخدم: admin
   كلمة المرور: password123
   ```
3. تسجيل الدخول

## الخطوة 5: استكشاف لوحة Super Admin

في `super-admin.html` يمكنك:
- ✅ عرض جميع الشركات المسجلة
- ✅ إضافة شركات جديدة
- ✅ تعديل حالة الشركات (نشط / موقوف)
- ✅ تغيير الخطط
- ✅ عرض الإحصائيات

## الخطوة 6: النشر على الإنترنت

### إعداد Domain

1. سجل Domain: www.akrammostafa.com
2. اربطه مع Vercel أو Heroku

### Vercel (الأسرع)

```bash
# تثبيت
npm install -g vercel

# تسجيل دخول
vercel login

# نشر
vercel --prod

# في Vercel Dashboard:
# Settings → Domains → Add: www.akrammostafa.com
```

### ضبط DNS

في إعدادات الـ DNS للدومين:

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## الخطوة 7: تخصيص المنصة

### تغيير الشعار

استبدل `icon-512.png` بشعارك

### تغيير الألوان

في `platform.html`:
```css
:root {
  --primary: #6c5ce7;     /* اللون الأساسي */
  --secondary: #a29bfe;   /* اللون الثانوي */
  --accent: #fd79a8;      /* لون التمييز */
}
```

### تغيير معلومات التواصل

في `platform.html`:
```html
<li>📧 info@akrammostafa.com</li>
<li>📞 +966 50 000 0000</li>
<li>🌐 www.akrammostafa.com</li>
```

## الخطوة 8: إعداد البريد الإلكتروني

### باستخدام SendGrid (مجاناً حتى 100 بريد/يوم)

```bash
npm install @sendgrid/mail
```

```javascript
// في server.js
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey('YOUR_SENDGRID_API_KEY');

function sendWelcomeEmail(email, companyName) {
  const msg = {
    to: email,
    from: 'noreply@akrammostafa.com',
    subject: 'مرحباً بك في Link Call',
    html: `
      <h1>مرحباً بك في Link Call</h1>
      <p>تم تسجيل ${companyName} بنجاح!</p>
    `
  };
  return sgMail.send(msg);
}
```

## الخطوة 9: تأمين المنصة

### إضافة HTTPS

Vercel تقوم بذلك تلقائياً ✅

### حماية Super Admin

أضف في `super-admin.html`:
```javascript
// في بداية الصفحة
const SUPER_ADMIN_PASSWORD = 'your-super-secure-password';
const enteredPassword = prompt('أدخل كلمة مرور المدير:');
if (enteredPassword !== SUPER_ADMIN_PASSWORD) {
  alert('غير مصرح!');
  window.location.href = 'platform.html';
}
```

## الخطوة 10: المراقبة والصيانة

### مراقبة الأداء

```bash
# Uptime monitoring (مجاناً)
# سجل في: https://uptimerobot.com
# أضف: https://www.akrammostafa.com
```

### Backup تلقائي

```javascript
// في server.js - يعمل يومياً
const cron = require('node-cron');

cron.schedule('0 0 * * *', () => {
  // Backup companies.json
  const backup = fs.readFileSync('companies.json', 'utf8');
  fs.writeFileSync(`backups/companies-${Date.now()}.json`, backup);
  console.log('✅ تم حفظ نسخة احتياطية');
});
```

## 🎉 تهانينا!

منصتك جاهزة الآن على www.akrammostafa.com

## 📞 الدعم

إذا واجهت أي مشكلة:
- 📧 info@akrammostafa.com
- 📱 +966 50 000 0000

---

**طُوّر بواسطة م. أكرم مصطفى 🇸🇦**

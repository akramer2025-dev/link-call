# 🚀 منصة Link Call - www.akrammostafa.com

## نظرة عامة

منصة **Link Call** هي أول منصة سحابية عربية متكاملة لإدارة المكالمات ومراكز الاتصال. تم تطويرها بواسطة **م. أكرم مصطفى** لتوفير حل احترافي وسهل الاستخدام للشركات والمؤسسات.

## 🌟 المميزات الرئيسية

### للشركات
- ✅ تسجيل سريع وسهل
- ✅ لوحة تحكم احترافية
- ✅ إدارة الموظفين بشكل كامل
- ✅ تسجيل وتحليل المكالمات
- ✅ تقارير مفصلة ودقيقة
- ✅ نظام أمان متقدم (7 طبقات)
- ✅ يعمل على جميع الأجهزة

### للمدير (Super Admin)
- ✅ إدارة مركزية لجميع الشركات
- ✅ لوحة تحكم متقدمة
- ✅ إحصائيات وتقارير شاملة
- ✅ إدارة الخطط والأسعار
- ✅ مراقبة الأداء والجودة

## 📂 هيكل المنصة

```
platform.html              → الصفحة الرئيسية للمنصة
register-company.html      → تسجيل الشركات الجديدة
super-admin.html           → لوحة تحكم المدير
api/companies.js           → API إدارة الشركات
companies.json             → قاعدة بيانات الشركات
activity-log.json          → سجل النشاطات
```

## 🎯 خطط الاشتراك

### 1. الخطة الأساسية (مجاناً)
- 5 موظفين
- 500 دقيقة شهرياً
- تسجيل المكالمات
- تقارير أساسية
- دعم فني

### 2. الخطة الاحترافية ($99/شهر)
- 20 موظف
- 2000 دقيقة شهرياً
- تسجيل غير محدود
- تقارير متقدمة
- API متكاملة
- دعم أولوية

### 3. خطة المؤسسات (مخصص)
- موظفين غير محدود
- دقائق غير محدودة
- جميع المميزات
- تخصيص كامل
- مدير حساب مخصص
- SLA 99.9%

## 🚀 البدء السريع

### 1. للشركات الجديدة

```bash
1. زيارة: http://localhost:3000/platform.html
2. اضغط على "ابدأ الآن مجاناً"
3. املأ نموذج التسجيل (4 خطوات)
4. اختر الخطة المناسبة
5. ابدأ العمل فوراً!
```

### 2. للشركات المسجلة

```bash
1. زيارة: http://localhost:3000/login.html
2. أدخل اسم المستخدم وكلمة المرور
3. الوصول إلى لوحة التحكم
```

### 3. للمدير (Super Admin)

```bash
1. زيارة: http://localhost:3000/super-admin.html
2. عرض جميع الشركات المسجلة
3. إدارة الخطط والصلاحيات
4. مراقبة الأداء والإحصائيات
```

## 📊 API Endpoints

### تسجيل شركة جديدة
```javascript
POST /api/companies/register
Body: {
  companyName, commercialNumber, businessType,
  country, city, address, companyPhone, companyEmail,
  adminName, adminTitle, adminPhone, adminEmail,
  username, password, selectedPlan
}
```

### تسجيل الدخول
```javascript
POST /api/companies/login
Body: { username, password }
```

### الحصول على جميع الشركات
```javascript
GET /api/companies
```

### الحصول على شركة محددة
```javascript
GET /api/companies/:id
```

### تحديث بيانات شركة
```javascript
PUT /api/companies/:id
Body: { /* بيانات التحديث */ }
```

### تحديث حالة شركة
```javascript
PUT /api/companies/:id/status
Body: { status: 'active' | 'pending' | 'suspended' }
```

### تحديث خطة شركة
```javascript
PUT /api/companies/:id/plan
Body: { plan: 'free' | 'pro' | 'enterprise' }
```

### حذف شركة
```javascript
DELETE /api/companies/:id
```

## 🔒 نظام الأمان

المنصة محمية بـ **7 طبقات أمان** متقدمة:

1. ✅ حماية من DevTools
2. ✅ تشفير كلمات المرور (SHA-256)
3. ✅ Rate Limiting للحماية من الهجمات
4. ✅ IP Blocking للزوار المشبوهين
5. ✅ Security Headers متقدمة
6. ✅ Bot Detection
7. ✅ Session Management آمن

## 📱 نظام Multi-Tenancy

كل شركة لها:
- ✅ معرف فريد (COMP-XXXXX)
- ✅ قاعدة بيانات منفصلة
- ✅ إعدادات مخصصة
- ✅ موظفين وصلاحيات خاصة
- ✅ تقارير مستقلة

## 🎨 التخصيص

### إضافة شعار الشركة
```javascript
// في platform.html
<img src="your-logo.png" alt="Company Logo">
```

### تخصيص الألوان
```css
:root {
  --primary: #6c5ce7;
  --secondary: #a29bfe;
  /* يمكن تغييرها حسب هوية الشركة */
}
```

## 📈 الإحصائيات والتقارير

### للشركات
- إجمالي المكالمات
- مدة المكالمات
- أداء الموظفين
- معدلات النجاح

### للمدير
- إجمالي الشركات
- الشركات النشطة
- إجمالي المستخدمين
- الإيرادات الشهرية

## 🔧 التكامل مع CRM

```javascript
// مثال على التكامل
fetch('/api/companies/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    // حفظ بيانات الشركة
    localStorage.setItem('companyData', JSON.stringify(data.company));
    // الانتقال إلى لوحة التحكم
    window.location.href = 'index.html';
  }
});
```

## 🌐 النشر على الإنترنت

### باستخدام Vercel

```bash
# 1. تثبيت Vercel CLI
npm install -g vercel

# 2. تسجيل الدخول
vercel login

# 3. النشر
vercel deploy

# 4. ربط Domain (اختياري)
# في Vercel Dashboard:
# Settings → Domains → Add www.akrammostafa.com
```

### باستخدام Heroku

```bash
# 1. إنشاء تطبيق
heroku create link-call-platform

# 2. رفع الكود
git push heroku master

# 3. ربط Domain
heroku domains:add www.akrammostafa.com
```

## 📞 الدعم الفني

- 📧 البريد الإلكتروني: info@akrammostafa.com
- 📱 الهاتف: +966 50 000 0000
- 🌐 الموقع: www.akrammostafa.com
- 💬 واتساب: متاح 24/7

## 🎓 التدريب والتعليم

نوفر:
- ✅ دورات تدريبية مجانية
- ✅ فيديوهات تعليمية
- ✅ دليل المستخدم الشامل
- ✅ دعم فني احترافي

## 📝 رخصة الاستخدام

© 2024-2026 Link Call by **Eng. Akram Mostafa**. All Rights Reserved.

هذا المشروع محمي بحقوق الملكية الفكرية. الاستخدام التجاري يتطلب ترخيص مدفوع.

## 🚀 خارطة الطريق

### النسخة 2.0 (قريباً)
- [ ] تطبيق موبايل (iOS & Android)
- [ ] واجهة برمجة متقدمة (Advanced API)
- [ ] تكامل مع WhatsApp Business
- [ ] Chatbot ذكي بالذكاء الاصطناعي
- [ ] تحليلات متقدمة بـ AI

### النسخة 3.0
- [ ] Video Calling
- [ ] CRM متكامل
- [ ] نظام تذاكر الدعم
- [ ] تطبيق Desktop

## 🤝 المساهمة

نرحب بمساهماتكم! لتقديم اقتراحات أو تحسينات:

1. Fork المشروع
2. إنشاء Branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للـ Branch (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## 🙏 شكر وتقدير

شكراً لاستخدام منصة Link Call!

نحن ملتزمون بتقديم أفضل الحلول التقنية للشركات العربية.

---

**طُوّر بواسطة م. أكرم مصطفى 🇸🇦**

www.akrammostafa.com

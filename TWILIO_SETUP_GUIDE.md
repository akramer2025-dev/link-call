# 📞 دليل إعداد رقم Twilio جديد للعميل

## ⚡ الإعداد السريع (5 دقائق)

### 1️⃣ شراء الرقم من Twilio

```bash
🌐 الرابط المباشر: https://console.twilio.com/us1/develop/phone-numbers/manage/search

الخطوات:
1. سجل دخول على حساب Twilio
2. اذهب إلى Phone Numbers → Buy a Number
3. اختر:
   - Country: United States
   - Number Type: Local أو Toll-Free
   - Capabilities: ✅ Voice, ✅ SMS
4. اضغط "Search"
5. اختر رقم واضغط "Buy"
6. أكد الشراء
```

---

### 2️⃣ إعداد الرقم للمكالمات الصوتية

```bash
🌐 الرابط: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming

الخطوات:
1. اضغط على الرقم الذي اشتريته
2. في قسم "Voice & Fax":
   
   Configure With: TwiML App
   TwiML App: [اختر التطبيق الحالي]
   
   ⭐ ملاحظة: إذا لم يكن لديك TwiML App:
   - اذهب إلى: Voice → TwiML Apps → Create new TwiML App
   - Voice Request URL: https://linkcall.akrammostafa.com/api/voice
   - Voice Status Callback URL: https://linkcall.akrammostafa.com/api/voice/status
   
3. اضغط "Save"
```

---

### 3️⃣ إعداد الرقم للرسائل النصية (SMS)

```bash
في نفس صفحة إعدادات الرقم:

Messaging Configuration:

Configure With: Webhooks

A Message Comes In:
  🔗 Webhook URL: https://linkcall.akrammostafa.com/api/sms/incoming
  🔧 HTTP Method: POST
  
Primary Handler Fails:
  🔗 Fallback URL: https://linkcall.akrammostafa.com/api/sms/fallback
  🔧 HTTP Method: POST

Status Callback URL:
  🔗 URL: https://linkcall.akrammostafa.com/api/sms/status
  
اضغط "Save"
```

---

### 4️⃣ ربط الرقم بالشركة في النظام

#### الطريقة الأولى: من لوحة Super Admin (الأسهل)

```bash
1. افتح: https://linkcall.akrammostafa.com/super-admin.html
2. سجل دخول بحساب Super Admin
3. ابحث عن الشركة في الجدول
4. اضغط "✏️ تعديل"
5. في حقل "Twilio Phone Number" اكتب الرقم:
   مثال: +12025551234
6. اضغط "حفظ"
```

#### الطريقة الثانية: تعديل companies.json مباشرة

```json
{
  "companies": [
    {
      "id": "com_1234567890",
      "companyInfo": {
        "name": "شركة العميل",
        "twilioPhone": "+12025551234"  // ⭐ أضف الرقم هنا
      },
      // ... باقي البيانات
    }
  ]
}
```

---

### 5️⃣ اختبار الإعداد

```bash
اختبار المكالمات الواردة:
📞 اتصل على الرقم الجديد من هاتفك
✅ يجب أن تسمع رسالة ترحيب من النظام

اختبار المكالمات الصادرة:
1. سجل دخول كموظف في الشركة
2. اذهب للوحة المكالمات
3. اختر جهة اتصال واتصل
4. يجب أن تتم المكالمة بنجاح

اختبار الرسائل النصية:
📱 أرسل رسالة SMS للرقم الجديد
✅ يجب أن تصل للنظام وتُسجل في قاعدة البيانات
```

---

## 🎯 إنشاء حساب كامل لعميل جديد

### سيناريو: عميل اشترى البرنامج

```bash
معلومات العميل:
- اسم الشركة: شركة المستقبل المشرق
- رقم السجل التجاري: 1010123456
- الباقة: Pro (20 موظف، 10000 دقيقة/شهر)
- رقم Twilio الجديد: +12025559999
```

### الخطوات الكاملة:

#### 1. شراء وإعداد رقم Twilio (كما في الأعلى)
```
✅ شراء الرقم +12025559999
✅ ربطه بـ TwiML App
✅ إعداد Webhooks للـ SMS
```

#### 2. تسجيل الشركة

```bash
افتح: https://linkcall.akrammostafa.com/register-company.html

الخطوة 1 - معلومات الشركة:
- اسم الشركة: شركة المستقبل المشرق
- رقم السجل التجاري: 1010123456
- الرقم الضريبي: 310123456789003
- نوع النشاط: خدمات
- المدينة: الرياض
- البريد الإلكتروني: info@futurebright.sa
- الهاتف: +966501234567
- العنوان: الرياض، حي الملك فهد
- رقم Twilio: +12025559999 ⭐

الخطوة 2 - بيانات المدير:
- الاسم: أحمد محمد العلي
- المسمى الوظيفي: المدير التنفيذي
- الهاتف: +966501234567
- البريد: ahmed@futurebright.sa
- اسم المستخدم: ahmed_admin
- كلمة المرور: SecurePass123!@#

الخطوة 3 - اختيار الباقة:
- اختر: 💼 Pro

الخطوة 4 - مراجعة:
- تأكد من البيانات
- اضغط "✅ تسجيل الشركة"
```

#### 3. تسجيل دخول الأدمن

```bash
1. بعد التسجيل، سيظهر اسم المستخدم وكلمة المرور
2. سجل دخول على: https://linkcall.akrammostafa.com
   - Username: ahmed_admin
   - Password: SecurePass123!@#
3. سيتم توجيهك للوحة التحكم
```

#### 4. إضافة الموظفين

```bash
افتح: https://linkcall.akrammostafa.com/manage-employees.html

إضافة موظف 1 (مشرف):
-------------------------------
الاسم الكامل: سارة أحمد
اسم المستخدم: sara
كلمة المرور: sara123
البريد: sara@futurebright.sa
الهاتف: +966501234568
المسمى الوظيفي: مشرفة الفريق
عدد الدقائق: 2000 دقيقة ⭐
الدور: 👔 مشرف
الحالة: ✅ نشط

إضافة موظف 2 (موظف عادي):
-------------------------------
الاسم الكامل: محمد علي
اسم المستخدم: mohammed
كلمة المرور: mohammed123
البريد: mohammed@futurebright.sa
الهاتف: +966501234569
المسمى الوظيفي: موظف مبيعات
عدد الدقائق: 1000 دقيقة ⭐
الدور: 👤 موظف
الحالة: ✅ نشط

إضافة موظف 3 (مراقب):
-------------------------------
الاسم الكامل: فاطمة حسن
اسم المستخدم: fatima
كلمة المرور: fatima123
البريد: fatima@futurebright.sa
الهاتف: +966501234570
المسمى الوظيفي: مراقبة جودة
عدد الدقائق: 500 دقيقة ⭐
الدور: 👁️ مراقب
الحالة: ✅ نشط
```

#### 5. اختبار النظام

```bash
اختبار 1: تسجيل دخول موظف
- افتح نافذة خفية أو متصفح آخر
- سجل دخول بحساب sara
- تأكد من ظهور لوحة التحكم

اختبار 2: إجراء مكالمة
- من حساب sara، اضغط "اتصال جديد"
- أدخل رقم هاتفك
- اتصل وتأكد من نجاح المكالمة
- تحقق من خصم الدقائق من رصيد sara

اختبار 3: الصلاحيات
- سجل دخول بحساب fatima (مراقب)
- حاول إجراء مكالمة → يجب أن يُمنع
- يمكنها فقط عرض المكالمات والاستماع للتسجيلات

اختبار 4: انتهاء الدقائق
- من لوحة الأدمن، غيّر دقائق mohammed إلى 0
- حاول تسجيل دخول mohammed
- سيُمنع من إجراء المكالمات
```

---

## 📋 Checklist - إعداد عميل جديد

```
□ شراء رقم Twilio
□ إعداد Voice Configuration (TwiML App)
□ إعداد Messaging Configuration (Webhooks)
□ تسجيل الشركة في النظام
□ ربط رقم Twilio بالشركة
□ تسجيل دخول الأدمن
□ إضافة الموظفين (مع تحديد الدقائق المخصصة)
□ اختبار المكالمات الواردة
□ اختبار المكالمات الصادرة
□ اختبار الرسائل النصية
□ اختبار الصلاحيات
□ اختبار نظام الدقائق
□ تسليم بيانات الدخول للعميل
```

---

## 🔄 إعدادات Twilio الكاملة

### TwiML App Configuration

```
اسم التطبيق: Link Call Voice App

Voice Request URL:
https://linkcall.akrammostafa.com/api/voice
Method: POST

Voice Status Callback URL:
https://linkcall.akrammostafa.com/api/voice/status
Method: POST

Friendly Name: Link Call Voice
```

### Phone Number Configuration

```bash
رقم الهاتف: +12025559999

Voice Configuration:
--------------------
Configure With: TwiML App
TwiML App: Link Call Voice App
Status Callback URL: https://linkcall.akrammostafa.com/api/voice/status

Messaging Configuration:
------------------------
Configure With: Webhooks

A Message Comes In:
  URL: https://linkcall.akrammostafa.com/api/sms/incoming
  Method: POST

Primary Handler Fails:
  URL: https://linkcall.akrammostafa.com/api/sms/fallback
  Method: POST

Status Callback:
  URL: https://linkcall.akrammostafa.com/api/sms/status
  Method: POST
```

---

## 💰 التسعير

### تكلفة رقم Twilio:
- **رقم محلي (Local)**: $1.15/شهر
- **رقم مجاني (Toll-Free)**: $2.00/شهر

### تكلفة المكالمات:
- **صادرة**: $0.013/دقيقة
- **واردة**: $0.0085/دقيقة

### تكلفة الرسائل:
- **صادرة**: $0.0079/رسالة
- **واردة**: $0.0079/رسالة

### مثال حسابي:
```
عميل باقة Pro (10,000 دقيقة/شهر):

التكلفة الشهرية:
- رقم الهاتف: $1.15
- 5,000 دقيقة صادرة: $65
- 5,000 دقيقة واردة: $42.50
- 1,000 رسالة: $7.90
────────────────────────
الإجمالي: $116.55/شهر

سعر البيع للعميل: $299/شهر
الربح الصافي: $182.45/شهر
```

---

## 🛠️ استكشاف الأخطاء

### خطأ: "Failed to load resource: net::ERR_NAME_NOT_RESOLVED"
```
السبب: الرقم غير مربوط بـ TwiML App
الحل: تأكد من Voice Configuration → TwiML App
```

### خطأ: "Call not allowed"
```
السبب: رصيد الموظف انتهى
الحل: افتح manage-employees.html وزد الدقائق
```

### خطأ: "SMS not received"
```
السبب: Webhook غير مُعد بشكل صحيح
الحل: تأكد من Messaging URL في إعدادات الرقم
```

---

## 📞 الدعم الفني

إذا واجهت أي مشاكل:

**Twilio Support:**
- 📧 Email: help@twilio.com
- 💬 Chat: console.twilio.com (أسفل اليمين)
- 📚 Docs: https://www.twilio.com/docs

**Link Call Support:**
- 📧 Email: support@linkcall.sa
- 📱 WhatsApp: +966501234567

---

## ✅ تم بنجاح!

الآن لديك:
- ✅ رقم Twilio مُعد ومُفعّل
- ✅ شركة جديدة مُسجلة
- ✅ موظفين بصلاحيات ودقائق
- ✅ نظام جاهز للعمل بشكل كامل

**جاهز لاستقبال المكالمات! 🎉**

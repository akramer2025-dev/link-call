# خطوات إعداد الموقع على Hostinger - Link Call
# ======================================================

## 🔴 المشكلة الحالية: 500 Internal Server Error

السبب: Hostinger يحتاج إعدادات خاصة لـ Node.js

---

## ✅ الحل: خيارين

### **الخيار 1: Node.js Application (موصى به)**

#### 1️⃣ تفعيل Node.js App من hPanel

1. اذهب إلى: https://hpanel.hostinger.com
2. اختر نطاقك: `linkcall.elosool.com`
3. من القائمة الجانبية: **Advanced** → **Node.js**
4. اضغط **Create Application**:
   ```
   Application Mode: Production
   Application Root: domains/linkcall.elosool.com/public_html
   Application URL: https://linkcall.elosool.com
   Application Startup File: server/server.js
   Node.js Version: 18.x أو أعلى
   ```
5. اضغط **Create**

#### 2️⃣ ضبط Environment Variables

في صفحة Node.js App، أضف هذه المتغيرات:
```
NODE_ENV=production
PORT=3000

DB_HOST=localhost
DB_USER=u878468059_linkcall
DB_PASSWORD=Osool2026@
DB_NAME=u878468059_linkcall
DB_PORT=3306

TWILIO_ACCOUNT_SID=<من حسابك في Twilio>
TWILIO_AUTH_TOKEN=<من حسابك في Twilio>
TWILIO_PHONE_NUMBER=<رقم Twilio>
TWILIO_TWIML_APP_SID=<من Twilio>
```

#### 3️⃣ تثبيت Dependencies

من **Terminal/SSH** في hPanel:
```bash
cd ~/domains/linkcall.elosool.com/public_html
npm install
```

#### 4️⃣ إعادة تشغيل التطبيق

من صفحة Node.js App اضغط: **Restart Application**

---

### **الخيار 2: Static HTML فقط (مؤقت)**

إذا كنت عايز تشوف الموقع بسرعة بدون Node.js:

#### 1️⃣ احذف .htaccess الحالي
```bash
rm ~/domains/linkcall.elosool.com/public_html/.htaccess
```

#### 2️⃣ أنشئ .htaccess جديد بسيط
(الملف الجديد اللي عملناه تواً)

#### 3️⃣ انقل ملفات public للجذر
```bash
cd ~/domains/linkcall.elosool.com/public_html
cp -r public/* .
```

⚠️ **ملاحظة:** هذا الحل المؤقت **لن تشتغل المكالمات أو APIs**

---

## 🔍 فحص المشكلة

### تحقق من الـ Logs:

1. من hPanel → **Advanced** → **Error Logs**
2. أو من SSH:
   ```bash
   tail -f ~/logs/linkcall.elosool.com/error.log
   ```

### اختبار الملفات:

```bash
# التأكد من وجود server.js
ls -la ~/domains/linkcall.elosool.com/public_html/server/server.js

# التأكد من وجود node_modules
ls -la ~/domains/linkcall.elosool.com/public_html/node_modules

# التأكد من .env
cat ~/domains/linkcall.elosool.com/public_html/.env
```

---

## 📋 Checklist للإعداد الصحيح

- [ ] رفع كل الملفات على Hostinger
- [ ] إنشاء Node.js Application من hPanel
- [ ] ضبط Environment Variables
- [ ] تشغيل `npm install` من Terminal
- [ ] إعادة تشغيل Node.js App
- [ ] التحقق من Error Logs
- [ ] اختبار الموقع

---

## 🆘 إذا ما زالت المشكلة:

### تحقق من:

1. **هل Node.js متاح في باقتك؟**
   - بعض باقات Hostinger المشتركة لا تدعم Node.js
   - تحتاج Business أو أعلى

2. **هل الملفات في المكان الصحيح؟**
   ```
   public_html/
   ├── public/
   ├── server/
   ├── database/
   ├── package.json
   └── .env
   ```

3. **هل البورت صحيح؟**
   - Hostinger قد يطلب بورت معين
   - غالباً 3000 أو يتم تعيينه تلقائياً

---

## 📞 الدعم

إذا استمرت المشكلة:
1. افتح ticket في Hostinger Support
2. قل لهم: "أريد تشغيل Node.js application"
3. أعطهم: Application Root و Startup File

---

**الحل الأسرع:** استخدم **الخيار 1** (Node.js Application) ✅

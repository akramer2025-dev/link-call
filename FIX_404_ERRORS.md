# إصلاح مشكلة 404 في Vercel Deployment

## المشكلة
كان التطبيق يعطي أخطاء 404 لجميع API endpoints:
- `/token` - 404
- `/employees` - 404
- `/balance` - 404  
- `/heartbeat` - 404
- `/track-login` - 404
- `/account/balance` - 404

## الحلول المطبقة

### 1. تبسيط `vercel.json`
- إزالة `builds` section (Vercel يكتشف الملفات تلقائياً)
- الاحتفاظ بـ `routes` فقط لتوجيه الطلبات

### 2. إنشاء API endpoints منفصلة
تم إنشاء الملفات التالية لمعالجة الطلبات بشكل مباشر:

- **`/api/balance.js`** - جلب رصيد Twilio
- **`/api/heartbeat.js`** - تتبع حالة المستخدم  
- **`/api/track-login.js`** - تسجيل دخول المستخدم

### 3. تحديث routing في `vercel.json`
```json
{
  "src": "/balance",
  "dest": "/api/balance.js"
},
{
  "src": "/account/balance",
  "dest": "/api/balance.js"
},
{
  "src": "/heartbeat",
  "dest": "/api/heartbeat.js"
},
{
  "src": "/track-login",
  "dest": "/api/track-login.js"
}
```

### 4. تحديث handler في `/api/companies.js`
إضافة main handler لتوجيه الطلبات إلى الدوال المناسبة.

## خطوات النشر على Vercel

### 1. تحديث المتغيرات البيئية (Environment Variables)
تأكد من إضافة المتغيرات التالية في Vercel Dashboard:

```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_TWIML_APP_SID=your_twiml_app_sid
TWILIO_PHONE_NUMBER=your_twilio_number

# Upstash Redis (optional)
KV_REST_API_URL=your_upstash_redis_url
KV_REST_API_TOKEN=your_upstash_redis_token
```

### 2. رفع التغييرات إلى Git
```bash
git add .
git commit -m "Fix: إصلاح مشكلة 404 في API endpoints"
git push origin main
```

### 3. نشر على Vercel
```bash
vercel --prod
```

أو من خلال Vercel Dashboard:
1. اذهب إلى [vercel.com/dashboard](https://vercel.com/dashboard)
2. اختر المشروع
3. اضغط على "Redeploy"

## التحقق من النشر

بعد النشر، اختبر الـ endpoints التالية:

```bash
# Test token endpoint
curl https://linkcall.akrammostafa.com/token?identity=test_user

# Test balance endpoint  
curl https://linkcall.akrammostafa.com/balance

# Test employees endpoint
curl https://linkcall.akrammostafa.com/employees
```

## الملفات المعدلة

- ✅ `vercel.json` - تبسيط التكوين
- ✅ `api/index.js` - تحديث export  
- ✅ `api/companies.js` - إضافة main handler
- ✅ `api/balance.js` - **جديد**
- ✅ `api/heartbeat.js` - **جديد**
- ✅ `api/track-login.js` - **جديد**

## ملاحظات مهمة

1. **Express App**: ملف `/api/index.js` يستخدم Express ويُصدّر بشكل مباشر `module.exports = app;` - هذا صحيح في Vercel
2. **CORS**: جميع API endpoints تدعم CORS
3. **Error Handling**: جميع endpoints تحتوي على error handling  
4. **Redis**: إذا لم يكن Redis متاحاً، التطبيق يعمل بدون مشاكل

## استكشاف الأخطاء

إذا استمرت المشكلة:

1. **تحقق من Logs في Vercel**:
   ```bash
   vercel logs
   ```

2. **تحقق من Environment Variables**:
   - اذهب إلى Project Settings > Environment Variables
   - تأكد من إضافة جميع المتغيرات المطلوبة

3. **تحقق من Build Logs**:
   - في Vercel Dashboard > Deployments > اختر Deployment > Build Logs

4. **اختبر محلياً**:
   ```bash
   vercel dev
   ```

## تاريخ الإصلاح

- **التاريخ**: 1 مارس 2026
- **المشكلة**: جميع API endpoints تعطي 404
- **الحل**: تبسيط vercel.json وإنشاء endpoints منفصلة
- **الحالة**: ✅ تم الإصلاح

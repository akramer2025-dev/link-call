# 🚀 دليل رفع Link Call على Vercel

## الخطوات:

### 1. تسجيل الدخول على Vercel
افتح: https://vercel.com
سجل دخول بحساب GitHub

### 2. ربط المشروع
1. اضغط "Add New Project"
2. اختر Repository: `link-call`
3. اضغط "Import"

### 3. تعيين Environment Variables
في صفحة المشروع، اضغط "Environment Variables" وأضف القيم من ملف `.env`:

```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_TWIML_APP_SID=your_twiml_app_sid
TWILIO_PHONE_NUMBER=your_phone_number
```

**احصل على القيم من**: https://console.twilio.com

### 4. Deploy
اضغط "Deploy" وانتظر الانتهاء

### 5. تحديث Twilio URLs
بعد النشر، احصل على رابط المشروع (مثلاً: https://link-call.vercel.app)

ثم افتح: https://console.twilio.com/us1/develop/phone-numbers/manage/active
- اختر رقمك: +13204336644
- في Voice Configuration:
  - A Call Comes In: `https://link-call.vercel.app/voice`
- احفظ

افتح TwiML App: https://console.twilio.com/us1/develop/voice/manage/twiml-apps
- اختر App: `Link Call`
- Voice Request URL: `https://link-call.vercel.app/outgoing-call`
- احفظ

## ✅ انتهى!
افتح: https://link-call.vercel.app

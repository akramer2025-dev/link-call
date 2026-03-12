# نشر Backend على Vercel - أوامر سريعة
# =========================================

## 🚀 الأوامر (نفذها بالترتيب):

### 1. ثبت Vercel CLI:
npm install -g vercel

### 2. Deploy المشروع:
cd "D:\link call"
vercel --prod

### 3. أضف Environment Variables:

vercel env add DB_HOST production
# القيمة: localhost (أو IP الـ MySQL من Hostinger)

vercel env add DB_USER production
# القيمة: u878468059_linkcall

vercel env add DB_PASSWORD production
# القيمة: Osool2026@

vercel env add DB_NAME production
# القيمة: u878468059_linkcall

vercel env add NODE_ENV production
# القيمة: production

### 4. تفعيل Remote MySQL على Hostinger:

من hPanel:
- Databases → Remote MySQL
- Add: 0.0.0.0/0
- Save

### 5. Redeploy بعد إضافة المتغيرات:
vercel --prod

---

## ✅ بعد Deploy:

هتحصل على رابط زي:
https://link-call-backend.vercel.app

استخدمه في Frontend!

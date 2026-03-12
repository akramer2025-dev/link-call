# 📝 تعليمات استيراد قاعدة البيانات في phpMyAdmin

## ⚠️ خطأ شائع:
❌ **لا تكتب أوامر في Import**
❌ لا تنسخ: `node migrate-firebase-to-mysql.js`
❌ هذا أمر Terminal وليس SQL

## ✅ الطريقة الصحيحة:

### الخطوة 1: احفظ ملف hostinger-import.sql على جهازك
الملف موجود في: `d:\link call\hostinger-import.sql`

### الخطوة 2: افتح phpMyAdmin
1. اذهب إلى لوحة تحكم Hostinger
2. افتح phpMyAdmin
3. اختر قاعدة البيانات: **u878468059_linkcall**

### الخطوة 3: استيراد الملف
1. اضغط على تبويب **"Import"** أو **"استيراد"** في الأعلى
2. اضغط **"Choose File"** أو **"اختر ملف"**
3. اختر الملف: **hostinger-import.sql** من جهازك
4. تأكد أن Format هو **SQL**
5. اضغط **"Go"** أو **"تنفيذ"** في الأسفل

### الخطوة 4: انتظر النتيجة
- إذا نجح: سترى ✅ "Import has been successfully finished"
- يجب أن ترى 9 جداول جديدة على اليسار

---

## 🎯 بعد الاستيراد الناجح:

**بعدها فقط** نرجع لجهازك ونشغل في Terminal (PowerShell):
```bash
cd "d:\link call"
node migrate-firebase-to-mysql.js
```

هذا الأمر سينقل البيانات من Firebase إلى MySQL.

---

## 📸 شكل الشاشة الصحيح:
في Import يجب أن ترى:
- File to import: [Choose File] ← هنا تختار hostinger-import.sql
- Format: SQL
- ثم Go في الأسفل

---

**جرب تاني وأخبرني بالنتيجة!** ✅

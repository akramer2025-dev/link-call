# 🔄 تحديثات الروابط المطلوبة

## بعد رفع التطبيق على /linkcall، غيّر الروابط التالية:

---

## 📄 في ملف: login.html

### ✏️ التعديل 1:
```javascript
// ابحث عن السطر (حوالي سطر 245):
window.location.href = 'index.html';

// غيّره إلى:
window.location.href = '/linkcall/index.html';
```

---

## 📄 في ملف: app.js

### ✏️ التعديل 1:
```javascript
// ابحث عن السطر في بداية الملف:
const baseUrl = '';

// غيّره إلى:
const baseUrl = '/linkcall';
```

---

## 📄 في ملف: admin.js

### ✏️ التعديل 1:
```javascript
// ابحث عن:
const baseUrl = '';

// غيّره إلى:
const baseUrl = '/linkcall';
```

---

## 📄 في ملف: register-company.html

### ✏️ التعديل 1:
```javascript
// ابحث عن السطر (حوالي سطر 800):
const response = await fetch('/api/companies/register', {

// غيّره إلى:
const response = await fetch('/linkcall/api/companies/register', {
```

### ✏️ التعديل 2:
```javascript
// ابحث عن:
<a href="login.html" class="btn btn-primary"

// غيّره إلى:
<a href="/linkcall/login.html" class="btn btn-primary"
```

---

## 📄 في ملف: super-admin.html

### ✏️ التعديل 1:
```javascript
// ابحث عن:
const response = await fetch(`${baseUrl}/api/companies/add`,

// غيّره إلى:
const response = await fetch('/linkcall/api/companies/add',
```

---

## 📄 في ملف: platform.html

### ✏️ التعديل 1:
```html
<!-- ابحث عن (حوالي سطر 500): -->
<a href="register-company.html" class="btn btn-primary">

<!-- غيّره إلى: -->
<a href="/linkcall/register-company.html" class="btn btn-primary">
```

### ✏️ التعديل 2:
```html
<!-- ابحث عن: -->
<a href="login.html" class="btn btn-secondary">

<!-- غيّره إلى: -->
<a href="/linkcall/login.html" class="btn btn-secondary">
```

### ✏️ التعديل 3:
```html
<!-- ابحث عن: -->
<a href="login.html" class="btn-login">

<!-- غيّره إلى: -->
<a href="/linkcall/login.html" class="btn-login">
```

---

## 📄 في ملف: index.html

### ✏️ التعديل 1:
```javascript
// ابحث عن:
fetch('/api/token')

// غيّره إلى (في جميع المواضع):
fetch('/linkcall/api/token')
```

---

## 📄 في ملف: service-worker.js

### ✏️ التعديل 1:
```javascript
// ابحث عن:
const urlsToCache = [
    '/',
    '/index.html',
    ...

// غيّره إلى:
const urlsToCache = [
    '/linkcall/',
    '/linkcall/index.html',
    '/linkcall/login.html',
    ...
```

---

## ⚡ طريقة سريعة للتعديل

### باستخدام VS Code:

1. افتح VS Code
2. اضغط `Ctrl + Shift + H` (Find and Replace في جميع الملفات)

### استبدال 1:
```
Find: href="login.html"
Replace: href="/linkcall/login.html"
```

### استبدال 2:
```
Find: href="index.html"
Replace: href="/linkcall/index.html"
```

### استبدال 3:
```
Find: href="admin.html"
Replace: href="/linkcall/admin.html"
```

### استبدال 4:
```
Find: href="register-company.html"
Replace: href="/linkcall/register-company.html"
```

### استبدال 5:
```
Find: '/api/
Replace: '/linkcall/api/
```

### استبدال 6:
```
Find: const baseUrl = '';
Replace: const baseUrl = '/linkcall';
```

---

## ✅ بعد التعديلات

احفظ جميع الملفات وارفعها مرة أخرى على السيرفر في مجلد `/linkcall`

أو استخدم Git:
```bash
git add .
git commit -m "تحديث الروابط لتعمل مع /linkcall"
git push
```

---

## 🎯 ملاحظة مهمة

إذا كنت ستستخدم **Subdomain** بدلاً من مجلد:

مثل: **linkcall.akrammostafa.com**

فلا تحتاج لهذه التعديلات! استخدم الملفات كما هي.

---

**الآن التطبيق جاهز للعمل على:**
**www.akrammostafa.com/linkcall** ✅

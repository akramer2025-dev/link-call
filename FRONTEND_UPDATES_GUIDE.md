# 🔄 دليل تحديث الواجهة (Frontend Updates)

## 📋 نظرة عامة

بعد تحديث النظام إلى قواعد بيانات منفصلة لكل شركة، يجب تحديث جميع استدعاءات API في الواجهة لتمرير معرف الشركة `companyId`.

---

## 🎯 الملفات التي تحتاج تحديث

| الملف | الحالة | الأولوية | التحديثات المطلوبة |
|------|--------|----------|---------------------|
| ⏹️ manage-employees.html | يحتاج تحديث | عالية | إضافة companyId لجميع استدعاءات API |
| ⏹️ app.js | يحتاج تحديث | عالية | إضافة companyId لاستدعاءات الدقائق |
| ⏹️ admin.html | يحتاج تحديث | متوسطة | إضافة companyId لاستدعاءات جهات الاتصال |
| ⏹️ index.html | يحتاج تحديث | متوسطة | إضافة companyId عند التسجيل/Login |

---

## 🔑 الحصول على companyId

### من localStorage:

```javascript
// الحصول على بيانات المستخدم
const userData = JSON.parse(localStorage.getItem('userData'));
const companyId = userData?.companyId;

// التحقق من وجود companyId
if (!companyId) {
    console.error('❌ Company ID not found!');
    alert('خطأ: معرف الشركة غير موجود. الرجاء تسجيل الدخول مرة أخرى.');
    window.location.href = 'login.html';
    return;
}
```

### من القيم المُرسلة:

```javascript
// عند تسجيل الدخول، تأكد من حفظ companyId
async function login(username, password) {
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
        // حفظ بيانات المستخدم بما في ذلك companyId
        const userData = {
            employeeId: data.employee.id,
            username: data.employee.username,
            name: data.employee.name,
            role: data.employee.role,
            companyId: data.employee.companyId, // ⚠️ مهم جداً!
            permissions: data.employee.permissions
        };
        
        localStorage.setItem('userData', JSON.stringify(userData));
    }
}
```

---

## 📝 تحديث manage-employees.html

### 1. دالة جلب الموظفين (getAllEmployees):

**قبل التحديث:**
```javascript
async function loadEmployees() {
    const response = await fetch('/api/employees-management');
    const data = await response.json();
    // ...
}
```

**بعد التحديث:**
```javascript
async function loadEmployees() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const companyId = userData?.companyId;
    
    if (!companyId) {
        alert('خطأ: معرف الشركة غير موجود');
        window.location.href = 'login.html';
        return;
    }
    
    const response = await fetch(`/api/employees-management?companyId=${companyId}`);
    const data = await response.json();
    // ...
}
```

### 2. دالة إضافة موظف (addEmployee):

**قبل التحديث:**
```javascript
async function addEmployee(employeeData) {
    const response = await fetch('/api/employees-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: employeeData.name,
            username: employeeData.username,
            // ...
        })
    });
}
```

**بعد التحديث:**
```javascript
async function addEmployee(employeeData) {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const companyId = userData?.companyId;
    
    if (!companyId) {
        alert('خطأ: معرف الشركة غير موجود');
        return;
    }
    
    const response = await fetch('/api/employees-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            companyId, // ⚠️ إضافة companyId
            name: employeeData.name,
            username: employeeData.username,
            // ...
        })
    });
}
```

### 3. دالة تحديث موظف (updateEmployee):

**قبل التحديث:**
```javascript
async function updateEmployee(employeeId, updates) {
    const response = await fetch('/api/employees-management', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            employeeId,
            ...updates
        })
    });
}
```

**بعد التحديث:**
```javascript
async function updateEmployee(employeeId, updates) {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const companyId = userData?.companyId;
    
    if (!companyId) {
        alert('خطأ: معرف الشركة غير موجود');
        return;
    }
    
    const response = await fetch('/api/employees-management', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            companyId, // ⚠️ إضافة companyId
            employeeId,
            ...updates
        })
    });
}
```

### 4. دالة حذف موظف (deleteEmployee):

**قبل التحديث:**
```javascript
async function deleteEmployee(employeeId) {
    const response = await fetch(`/api/employees-management?employeeId=${employeeId}`, {
        method: 'DELETE'
    });
}
```

**بعد التحديث:**
```javascript
async function deleteEmployee(employeeId) {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const companyId = userData?.companyId;
    
    if (!companyId) {
        alert('خطأ: معرف الشركة غير موجود');
        return;
    }
    
    const response = await fetch(`/api/employees-management?companyId=${companyId}&employeeId=${employeeId}`, {
        method: 'DELETE'
    });
}
```

### 5. دالة تسجيل استخدام الدقائق (recordMinutesUsage):

**قبل التحديث:**
```javascript
async function recordMinutesUsage(employeeId, minutes) {
    const response = await fetch('/api/employees-management/minutes-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, minutes })
    });
}
```

**بعد التحديث:**
```javascript
async function recordMinutesUsage(employeeId, minutes) {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const companyId = userData?.companyId;
    
    if (!companyId) {
        alert('خطأ: معرف الشركة غير موجود');
        return;
    }
    
    const response = await fetch('/api/employees-management/minutes-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            companyId, // ⚠️ إضافة companyId
            employeeId, 
            minutes 
        })
    });
}
```

---

## 📱 تحديث app.js

### 1. فحص الدقائق المتاحة قبل المكالمة:

**قبل التحديث:**
```javascript
async function checkMinutesBeforeCall() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const employeeId = userData?.employeeId;
    
    const response = await fetch(`/api/employees-management/check-minutes?employeeId=${employeeId}`);
    const data = await response.json();
    
    if (!data.hasMinutes) {
        alert('لا يوجد لديك دقائق كافية');
        return false;
    }
    
    return true;
}
```

**بعد التحديث:**
```javascript
async function checkMinutesBeforeCall() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const employeeId = userData?.employeeId;
    const companyId = userData?.companyId; // ⚠️ إضافة companyId
    
    if (!companyId || !employeeId) {
        alert('خطأ: بيانات المستخدم غير مكتملة');
        window.location.href = 'login.html';
        return false;
    }
    
    const response = await fetch(`/api/employees-management/check-minutes?companyId=${companyId}&employeeId=${employeeId}`);
    const data = await response.json();
    
    if (!data.hasMinutes) {
        alert(`❌ لا يوجد لديك دقائق كافية!\n\nالمتبقي: ${data.minutesRemaining} دقيقة\nالمطلوب: 1 دقيقة على الأقل`);
        return false;
    }
    
    return true;
}
```

### 2. تسجيل الدقائق بعد المكالمة:

**قبل التحديث (في دالة stopCallTimer):**
```javascript
async function stopCallTimer() {
    // ... حساب المدة
    const durationMinutes = Math.ceil(durationSeconds / 60);
    
    const userData = JSON.parse(localStorage.getItem('userData'));
    const employeeId = userData?.employeeId;
    
    // تسجيل الدقائق
    await fetch('/api/employees-management/minutes-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            employeeId,
            minutes: durationMinutes,
            callSid: currentCallSid
        })
    });
}
```

**بعد التحديث:**
```javascript
async function stopCallTimer() {
    // ... حساب المدة
    const durationMinutes = Math.ceil(durationSeconds / 60);
    
    const userData = JSON.parse(localStorage.getItem('userData'));
    const employeeId = userData?.employeeId;
    const companyId = userData?.companyId; // ⚠️ إضافة companyId
    
    if (!companyId || !employeeId) {
        console.error('❌ خطأ: بيانات المستخدم غير مكتملة');
        return;
    }
    
    // تسجيل الدقائق
    await fetch('/api/employees-management/minutes-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            companyId, // ⚠️ إضافة companyId
            employeeId,
            minutes: durationMinutes,
            callSid: currentCallSid
        })
    });
}
```

---

## 🗂️ تحديث admin.html

### جلب جهات الاتصال:

**قبل التحديث:**
```javascript
async function loadContacts() {
    const response = await fetch('/api/contacts');
    const data = await response.json();
    displayContacts(data.contacts);
}
```

**بعد التحديث:**
```javascript
async function loadContacts() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const companyId = userData?.companyId;
    
    if (!companyId) {
        alert('خطأ: معرف الشركة غير موجود');
        window.location.href = 'login.html';
        return;
    }
    
    const response = await fetch(`/api/contacts?companyId=${companyId}`);
    const data = await response.json();
    displayContacts(data.contacts);
}
```

### إضافة جهة اتصال:

**قبل التحديث:**
```javascript
async function addContact(name, phone) {
    const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone })
    });
}
```

**بعد التحديث:**
```javascript
async function addContact(name, phone) {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const companyId = userData?.companyId;
    
    if (!companyId) {
        alert('خطأ: معرف الشركة غير موجود');
        return;
    }
    
    const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            companyId, // ⚠️ إضافة companyId
            name, 
            phone 
        })
    });
}
```

### حذف جهة اتصال:

**قبل التحديث:**
```javascript
async function deleteContact(contactId) {
    const response = await fetch(`/api/contacts?id=${contactId}`, {
        method: 'DELETE'
    });
}
```

**بعد التحديث:**
```javascript
async function deleteContact(contactId) {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const companyId = userData?.companyId;
    
    if (!companyId) {
        alert('خطأ: معرف الشركة غير موجود');
        return;
    }
    
    const response = await fetch(`/api/contacts?companyId=${companyId}&contactId=${contactId}`, {
        method: 'DELETE'
    });
}
```

---

## 🔐 تحديث نظام تسجيل الدخول

### في login.html أو app.js:

يجب التأكد من أن نظام تسجيل الدخول يُرجع `companyId` ويحفظه في localStorage:

```javascript
async function login(username, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success && data.employee) {
            // التحقق من وجود companyId
            if (!data.employee.companyId) {
                alert('⚠️ خطأ: معرف الشركة غير موجود في بيانات المستخدم');
                console.error('Employee data:', data.employee);
                return false;
            }
            
            // حفظ بيانات المستخدم
            const userData = {
                employeeId: data.employee.id,
                username: data.employee.username,
                name: data.employee.name,
                role: data.employee.role,
                companyId: data.employee.companyId, // ⚠️ مهم جداً!
                permissions: data.employee.permissions || [],
                minutesAllocated: data.employee.minutesAllocated || 0,
                active: data.employee.active !== false
            };
            
            localStorage.setItem('userData', JSON.stringify(userData));
            
            console.log('✅ تم تسجيل الدخول بنجاح:', {
                employee: userData.name,
                company: userData.companyId,
                role: userData.role
            });
            
            // التوجيه للصفحة الرئيسية
            window.location.href = 'index.html';
            return true;
        } else {
            alert('❌ فشل تسجيل الدخول: ' + (data.message || 'خطأ غير معروف'));
            return false;
        }
    } catch (error) {
        console.error('❌ خطأ في تسجيل الدخول:', error);
        alert('❌ خطأ في الاتصال بالخادم');
        return false;
    }
}
```

---

## ✅ قائمة فحص (Checklist)

استخدم هذه القائمة لتتبع التحديثات:

### manage-employees.html:
- [ ] ✅ loadEmployees() - إضافة companyId
- [ ] ✅ addEmployee() - إضافة companyId
- [ ] ✅ updateEmployee() - إضافة companyId
- [ ] ✅ deleteEmployee() - إضافة companyId
- [ ] ✅ getEmployee() - إضافة companyId
- [ ] ✅ recordMinutesUsage() - إضافة companyId
- [ ] ✅ getMinutesUsage() - إضافة companyId
- [ ] ✅ checkMinutesAvailability() - إضافة companyId

### app.js:
- [ ] ✅ checkMinutesBeforeCall() - إضافة companyId
- [ ] ✅ stopCallTimer() / recordMinutesUsage() - إضافة companyId
- [ ] ✅ saveCallToHistory() - إضافة companyId (إذا كانت موجودة)

### admin.html:
- [ ] ✅ loadContacts() - إضافة companyId
- [ ] ✅ addContact() - إضافة companyId  
- [ ] ✅ updateContact() - إضافة companyId (إذا كانت موجودة)
- [ ] ✅ deleteContact() - إضافة companyId

### login (login.html أو app.js):
- [ ] ✅ حفظ companyId في localStorage عند تسجيل الدخول
- [ ] ✅ التحقق من وجود companyId في بيانات المستخدم

---

## 🧪 الاختبار

### اختبار أساسي:

1. **تسجيل الدخول:**
   ```javascript
   // افتح Console في المتصفح
   const userData = JSON.parse(localStorage.getItem('userData'));
   console.log('Company ID:', userData?.companyId);
   // يجب أن يظهر: com_1234567890 (مثال)
   ```

2. **اختبار إضافة موظف:**
   - افتح manage-employees.html
   - أضف موظف جديد
   - تحقق من Console:
     ```
     ✅ [com_1234567890] تم إضافة موظف: أحمد محمد
     ```

3. **اختبار المكالمات:**
   - قم بمكالمة تجريبية
   - تحقق من تسجيل الدقائق
   - Console يجب أن يظهر:
     ```
     ✅ [com_1234567890] تم تسجيل استخدام 1 دقيقة
     ```

4. **اختبار جهات الاتصال:**
   - افتح admin.html
   - أضف جهة اتصال
   - تحقق من Console:
     ```
     ✅ [com_1234567890] تم إضافة جهة اتصال: عميل 1
     ```

### اختبار العزل بين الشركات:

1. قم بتسجيل الدخول كموظف من شركة 1
2. أضف موظف/جهة اتصال
3. سجل خروج
4. سجل دخول كموظف من شركة 2
5. تأكد من أن البيانات منفصلة (لا ترى بيانات شركة 1)

---

## 🚨 أخطاء شائعة وحلولها

### 1. "Company ID is required"

**السبب:** لم يتم تمرير companyId في الطلب

**الحل:**
```javascript
// تحقق من وجود companyId في userData
const userData = JSON.parse(localStorage.getItem('userData'));
console.log('userData:', userData);
// إذا كان companyId = null أو undefined، المشكلة في تسجيل الدخول
```

### 2. "Company database not found"

**السبب:** قاعدة بيانات الشركة غير موجودة أو لم يتم إنشاؤها

**الحل:**
```javascript
// استدعاء initializeCompanyDatabase من الخادم
// أو تأكد من أن الشركة مسجلة بشكل صحيح
```

### 3. بيانات المستخدم لا تُحفظ بعد تسجيل الدخول

**السبب:** API تسجيل الدخول لا يُرجع companyId

**الحل:**
```javascript
// تأكد من أن API تسجيل الدخول يُرجع:
{
  success: true,
  employee: {
    id: "emp_123",
    companyId: "com_1234567890", // ⚠️ مهم!
    name: "أحمد",
    // ...
  }
}
```

### 4. localStorage فارغ بعد refresh

**السبب:** بيانات localStorage تُحذف أو لا تُحفظ

**الحل:**
```javascript
// تحقق من حفظ البيانات بشكل صحيح:
console.log('Before save:', localStorage.getItem('userData'));
localStorage.setItem('userData', JSON.stringify(userData));
console.log('After save:', localStorage.getItem('userData'));
```

---

## 📚 مراجع إضافية

- [دليل نظام قواعد البيانات المنفصلة](SEPARATE_DATABASES_GUIDE.md)
- [دليل إدارة الموظفين](EMPLOYEE_MANAGEMENT_GUIDE.md)
- [دليل نظام الصلاحيات والدقائق](PERMISSIONS_MINUTES_SYSTEM.md)

---

**آخر تحديث:** 28 فبراير 2026  
**الإصدار:** 2.0

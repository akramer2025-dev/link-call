# دليل ربط تطبيق CRM مع Link Call

## 📞 كيفية الاتصال المباشر من CRM بدون تسجيل دخول

### الطريقة 1: استخدام صفحة direct-call.html (موصى بها)

هذه هي الطريقة الأسهل والأكثر أماناً:

```javascript
// في تطبيق Hotel CRM React
const makeDirectCall = (phoneNumber, hotelData) => {
    const linkCallUrl = 'http://localhost:3000/direct-call.html'; // أو رابط التطبيق على الخادم
    
    // بناء URL مع المعاملات
    const params = new URLSearchParams({
        phone: phoneNumber,
        employeeId: localStorage.getItem('userId') || 'unknown',
        employeeName: localStorage.getItem('userName') || 'مستخدم CRM'
    });
    
    const fullUrl = `${linkCallUrl}?${params.toString()}`;
    
    // فتح في نافذة جديدة
    window.open(fullUrl, 'LinkCallWindow', 'width=400,height=700');
};

// مثال على الاستخدام
<button onClick={() => makeDirectCall(hotel.phone, hotel)}>
    📞 اتصال
</button>
```

### الطريقة 2: استخدام index.html مباشرة

```javascript
const makeDirectCall = (phoneNumber, employeeData) => {
    const linkCallUrl = 'http://localhost:3000/index.html';
    
    const params = new URLSearchParams({
        autoLogin: 'true',
        number: phoneNumber,
        employeeId: employeeData?.id || '',
        employeeName: employeeData?.name || ''
    });
    
    const fullUrl = `${linkCallUrl}?${params.toString()}`;
    window.open(fullUrl, 'LinkCallWindow', 'width=400,height=700');
};
```

---

## 🎯 أمثلة عملية للاستخدام في React

### 1. Component بسيط للاتصال

```jsx
import React from 'react';

const CallButton = ({ phoneNumber, employeeId, employeeName }) => {
    const handleCall = () => {
        const linkCallUrl = process.env.REACT_APP_LINK_CALL_URL || 'http://localhost:3000';
        
        const params = new URLSearchParams({
            phone: phoneNumber,
            employeeId: employeeId || localStorage.getItem('userId'),
            employeeName: employeeName || localStorage.getItem('userName')
        });
        
        const url = `${linkCallUrl}/direct-call.html?${params.toString()}`;
        
        // فتح نافذة منبثقة
        const callWindow = window.open(
            url,
            'LinkCall',
            'width=400,height=700,resizable=yes,scrollbars=yes'
        );
        
        if (!callWindow) {
            alert('يرجى السماح بالنوافذ المنبثقة لإجراء المكالمات');
        }
    };
    
    return (
        <button 
            onClick={handleCall}
            className="call-button"
            title={`اتصال بـ ${phoneNumber}`}
        >
            📞 اتصال
        </button>
    );
};

export default CallButton;
```

### 2. استخدام في صفحة الفنادق

```jsx
// في ملف Hotels.jsx أو HotelsList.jsx

import CallButton from './components/CallButton';

const HotelsList = ({ hotels }) => {
    return (
        <div className="hotels-list">
            {hotels.map(hotel => (
                <div key={hotel.id} className="hotel-card">
                    <h3>{hotel.name}</h3>
                    <p>📍 {hotel.location}</p>
                    <p>📞 {hotel.phone}</p>
                    
                    <div className="actions">
                        <CallButton 
                            phoneNumber={hotel.phone}
                            employeeId={hotel.managerId}
                            employeeName={hotel.managerName}
                        />
                        {/* أزرار أخرى */}
                    </div>
                </div>
            ))}
        </div>
    );
};
```

### 3. Custom Hook لإدارة المكالمات

```jsx
// hooks/useLinkCall.js

import { useCallback } from 'react';

export const useLinkCall = () => {
    const makeCall = useCallback((phoneNumber, options = {}) => {
        const {
            employeeId = localStorage.getItem('userId'),
            employeeName = localStorage.getItem('userName'),
            linkCallUrl = process.env.REACT_APP_LINK_CALL_URL || 'http://localhost:3000'
        } = options;
        
        if (!phoneNumber) {
            console.error('رقم الهاتف مطلوب');
            return;
        }
        
        const params = new URLSearchParams({
            phone: phoneNumber,
            ...(employeeId && { employeeId }),
            ...(employeeName && { employeeName })
        });
        
        const url = `${linkCallUrl}/direct-call.html?${params.toString()}`;
        
        const windowFeatures = 'width=400,height=700,resizable=yes,scrollbars=yes';
        const callWindow = window.open(url, 'LinkCall', windowFeatures);
        
        if (!callWindow) {
            alert('يرجى السماح بالنوافذ المنبثقة');
            return false;
        }
        
        return true;
    }, []);
    
    return { makeCall };
};

// الاستخدام
import { useLinkCall } from './hooks/useLinkCall';

const MyComponent = () => {
    const { makeCall } = useLinkCall();
    
    return (
        <button onClick={() => makeCall('+966501234567')}>
            📞 اتصال
        </button>
    );
};
```

---

## ⚙️ الإعدادات المطلوبة

### 1. في تطبيق CRM (.env)

```env
# رابط تطبيق Link Call
REACT_APP_LINK_CALL_URL=http://localhost:3000

# أو في حالة النشر
REACT_APP_LINK_CALL_URL=https://your-linkcall-domain.com
```

### 2. في تطبيق Link Call

تأكد من تشغيل التطبيق على المنفذ المحدد:

```bash
# إذا كنت تستخدم Live Server في VS Code
# تأكد من تشغيله على المنفذ 3000

# أو استخدم http-server
npx http-server -p 3000
```

---

## 📋 معاملات URL المتاحة

| المعامل | مطلوب؟ | الوصف | مثال |
|---------|--------|-------|------|
| `phone` أو `number` | ✅ نعم | رقم الهاتف المراد الاتصال به | `+966501234567` |
| `employeeId` | ❌ لا | معرف الموظف من نظام CRM | `emp_123` |
| `employeeName` | ❌ لا | اسم الموظف | `أحمد محمد` |
| `autoLogin` | ❌ لا | تسجيل دخول تلقائي | `true` |

---

## 🔐 ملاحظات الأمان

1. **تسجيل الدخول التلقائي**: عند استخدام `direct-call.html` أو `autoLogin=true`، يتم إنشاء جلسة مؤقتة بصلاحيات محدودة
2. **الصلاحيات**: المستخدم الذي يدخل من CRM لن يتمكن من:
   - مشاهدة التسجيلات
   - الوصول إلى إعدادات النظام
   - مشاهدة بيانات موظفين آخرين
3. **الجلسة**: تنتهي الجلسة عند إغلاق نافذة/تبويب المتصفح

---

## 🚀 أمثلة متقدمة

### مع TypeScript

```typescript
// types/linkCall.ts
export interface CallOptions {
    phoneNumber: string;
    employeeId?: string;
    employeeName?: string;
    linkCallUrl?: string;
}

export interface LinkCallService {
    makeCall: (options: CallOptions) => boolean;
}

// services/linkCall.service.ts
export class LinkCallService implements LinkCallService {
    private readonly defaultUrl: string;
    
    constructor(baseUrl?: string) {
        this.defaultUrl = baseUrl || process.env.REACT_APP_LINK_CALL_URL || 'http://localhost:3000';
    }
    
    makeCall(options: CallOptions): boolean {
        const { phoneNumber, employeeId, employeeName, linkCallUrl } = options;
        
        if (!phoneNumber) {
            throw new Error('Phone number is required');
        }
        
        const params = new URLSearchParams({
            phone: phoneNumber,
            ...(employeeId && { employeeId }),
            ...(employeeName && { employeeName })
        });
        
        const url = `${linkCallUrl || this.defaultUrl}/direct-call.html?${params}`;
        const callWindow = window.open(url, 'LinkCall', 'width=400,height=700');
        
        return !!callWindow;
    }
}

// الاستخدام
const linkCallService = new LinkCallService();
linkCallService.makeCall({
    phoneNumber: '+966501234567',
    employeeId: 'emp_123',
    employeeName: 'أحمد محمد'
});
```

### مع Redux/Context API

```jsx
// context/CallContext.js
import React, { createContext, useContext, useCallback } from 'react';

const CallContext = createContext();

export const CallProvider = ({ children, linkCallUrl }) => {
    const initiateCall = useCallback((phoneNumber, employeeData) => {
        const params = new URLSearchParams({
            phone: phoneNumber,
            employeeId: employeeData?.id || '',
            employeeName: employeeData?.name || ''
        });
        
        const url = `${linkCallUrl}/direct-call.html?${params}`;
        window.open(url, 'LinkCall', 'width=400,height=700');
    }, [linkCallUrl]);
    
    return (
        <CallContext.Provider value={{ initiateCall }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) {
        throw new Error('useCall must be used within CallProvider');
    }
    return context;
};

// في App.js
import { CallProvider } from './context/CallContext';

function App() {
    return (
        <CallProvider linkCallUrl="http://localhost:3000">
            <YourApp />
        </CallProvider>
    );
}

// في أي component
import { useCall } from './context/CallContext';

function HotelCard({ hotel }) {
    const { initiateCall } = useCall();
    
    return (
        <button onClick={() => initiateCall(hotel.phone, hotel.manager)}>
            📞 اتصال
        </button>
    );
}
```

---

## 🧪 اختبار التكامل

```javascript
// في Console المتصفح أو أداة الاختبار

// اختبار 1: مكالمة بسيطة
window.open('http://localhost:3000/direct-call.html?phone=+966501234567', 'test', 'width=400,height=700');

// اختبار 2: مع بيانات الموظف
const params = new URLSearchParams({
    phone: '+966501234567',
    employeeId: 'emp_001',
    employeeName: 'أحمد محمد'
});
window.open(`http://localhost:3000/direct-call.html?${params}`, 'test', 'width=400,height=700');

// اختبار 3: استخدام index.html مباشرة
window.open('http://localhost:3000/index.html?autoLogin=true&number=+966501234567', 'test', 'width=400,height=700');
```

---

## ❓ الأسئلة الشائعة

**س: هل يمكن استخدام نفس النافذة لعدة مكالمات؟**
ج: نعم، باستخدام نفس الاسم في `window.open()` سيتم استخدام نفس النافذة.

**س: كيف أعرف إذا تمت المكالمة بنجاح؟**
ج: يمكنك استخدام `window.postMessage` للتواصل بين النافذتين.

**س: هل يعمل مع أرقام دولية؟**
ج: نعم، تأكد من إرسال الرقم بصيغة دولية (مثل: +966...)

---

## 📝 ملاحظات إضافية

1. تأكد من تشغيل كلا التطبيقين (CRM و Link Call) في نفس الوقت للاختبار المحلي
2. في حالة النشر، تأكد من تحديث `REACT_APP_LINK_CALL_URL` بالرابط الصحيح
3. يمكنك تخصيص حجم النافذة المنبثقة حسب احتياجاتك
4. للحصول على أفضل تجربة، استخدم المتصفحات الحديثة (Chrome, Edge, Firefox)

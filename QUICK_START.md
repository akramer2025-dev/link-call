# 🎯 دليل الربط السريع - CRM مع Link Call

## ⚡ البداية السريعة (5 دقائق)

### الخطوة 1: انسخ هذا الكود في تطبيق CRM الخاص بك

```javascript
// في أي component في تطبيق Hotel CRM
const callHotel = (phoneNumber) => {
    const url = `http://localhost:3000/direct-call.html?phone=${phoneNumber}`;
    window.open(url, 'LinkCall', 'width=400,height=700');
};

// الاستخدام
<button onClick={() => callHotel('+966501234567')}>
    📞 اتصال
</button>
```

---

## 🔥 أمثلة جاهزة للنسخ واللصق

### مثال 1: زر اتصال بسيط

```jsx
const CallButton = ({ phone }) => (
    <button 
        onClick={() => window.open(
            `http://localhost:3000/direct-call.html?phone=${phone}`,
            'LinkCall',
            'width=400,height=700'
        )}
        style={{
            padding: '8px 16px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
        }}
    >
        📞
    </button>
);
```

### مثال 2: في جدول الفنادق

```jsx
const HotelsTable = ({ hotels }) => (
    <table>
        <thead>
            <tr>
                <th>اسم الفندق</th>
                <th>الهاتف</th>
                <th>إجراءات</th>
            </tr>
        </thead>
        <tbody>
            {hotels.map(hotel => (
                <tr key={hotel.id}>
                    <td>{hotel.name}</td>
                    <td>{hotel.phone}</td>
                    <td>
                        <button onClick={() => window.open(
                            `http://localhost:3000/direct-call.html?phone=${hotel.phone}`,
                            'LinkCall',
                            'width=400,height=700'
                        )}>
                            📞 اتصال
                        </button>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>
);
```

### مثال 3: في بطاقة الفندق

```jsx
const HotelCard = ({ hotel }) => (
    <div className="hotel-card">
        <h3>{hotel.name}</h3>
        <p>📍 {hotel.location}</p>
        <p>📞 {hotel.phone}</p>
        
        <button 
            onClick={() => {
                const linkCallUrl = 'http://localhost:3000/direct-call.html';
                const params = new URLSearchParams({
                    phone: hotel.phone,
                    employeeId: hotel.managerId || '',
                    employeeName: hotel.managerName || ''
                });
                window.open(`${linkCallUrl}?${params}`, 'LinkCall', 'width=400,height=700');
            }}
            className="call-button"
        >
            📞 اتصال بالفندق
        </button>
    </div>
);
```

---

## 🎨 أيقونات جاهزة للاستخدام

يمكنك استخدام أي من هذه الأيقونات:

```jsx
// أيقونة 1: Emoji
<button onClick={handleCall}>📞 اتصال</button>

// أيقونة 2: Unicode
<button onClick={handleCall}>☎️ اتصال</button>

// أيقونة 3: مع React Icons
import { FaPhone } from 'react-icons/fa';
<button onClick={handleCall}>
    <FaPhone /> اتصال
</button>

// أيقونة 4: Material UI
import PhoneIcon from '@mui/icons-material/Phone';
<IconButton onClick={handleCall}>
    <PhoneIcon />
</IconButton>
```

---

## 🌐 تغيير الرابط حسب البيئة

```javascript
// في ملف .env
REACT_APP_LINK_CALL_URL=http://localhost:3000

// في الكود
const linkCallUrl = process.env.REACT_APP_LINK_CALL_URL || 'http://localhost:3000';
const url = `${linkCallUrl}/direct-call.html?phone=${phone}`;
```

---

## 📱 أمثلة لأرقام مختلفة

```javascript
// رقم سعودي مع كود الدولة
callHotel('+966501234567');

// رقم سعودي بدون كود الدولة
callHotel('0501234567');  // سيتم تحويله تلقائياً

// رقم مصري
callHotel('+201234567890');

// رقم محلي مصري
callHotel('01234567890');  // سيتم تحويله تلقائياً
```

---

## ⚙️ خيارات متقدمة

### إضافة معرف الموظف

```javascript
const callWithEmployee = (phone, employeeId, employeeName) => {
    const params = new URLSearchParams({
        phone: phone,
        employeeId: employeeId,
        employeeName: employeeName
    });
    
    const url = `http://localhost:3000/direct-call.html?${params}`;
    window.open(url, 'LinkCall', 'width=400,height=700');
};

// الاستخدام
callWithEmployee('+966501234567', 'emp_123', 'أحمد محمد');
```

### فتح في نفس النافذة (إعادة استخدام)

```javascript
// سيفتح دائماً في نفس النافذة المسماة 'LinkCallWindow'
const callInSameWindow = (phone) => {
    window.open(
        `http://localhost:3000/direct-call.html?phone=${phone}`,
        'LinkCallWindow',  // نفس الاسم = نفس النافذة
        'width=400,height=700'
    );
};
```

### التحقق من دعم النوافذ المنبثقة

```javascript
const safeCall = (phone) => {
    const newWindow = window.open(
        `http://localhost:3000/direct-call.html?phone=${phone}`,
        'LinkCall',
        'width=400,height=700'
    );
    
    if (!newWindow || newWindow.closed) {
        alert('⚠️ يرجى السماح بالنوافذ المنبثقة في المتصفح');
        return false;
    }
    
    return true;
};
```

---

## 🧪 اختبار سريع

افتح Console في المتصفح والصق هذا الكود:

```javascript
// اختبار 1: مكالمة بسيطة
window.open('http://localhost:3000/direct-call.html?phone=+966501234567', 'test', 'width=400,height=700');

// اختبار 2: مع بيانات كاملة
window.open('http://localhost:3000/direct-call.html?phone=+966501234567&employeeId=emp_001&employeeName=أحمد', 'test', 'width=400,height=700');
```

---

## 🎯 Checklist للتطبيق

- [ ] تأكد من تشغيل تطبيق Link Call على المنفذ 3000
- [ ] تأكد من تشغيل تطبيق CRM
- [ ] أضف زر الاتصال بجانب رقم الهاتف
- [ ] اختبر المكالمة من المتصفح
- [ ] تحقق من السماح بالنوافذ المنبثقة
- [ ] (اختياري) أضف معرف الموظف

---

## 📞 أسئلة شائعة

**س: أين أضع الكود؟**  
ج: في أي component يعرض قائمة الفنادق أو تفاصيل الفندق

**س: ماذا لو لم تفتح النافذة؟**  
ج: تحقق من إعدادات المتصفح وقم بالسماح بالنوافذ المنبثقة

**س: هل يمكن تخصيص حجم النافذة؟**  
ج: نعم، غير `width=400,height=700` حسب الحاجة

**س: هل يعمل مع جميع الأرقام؟**  
ج: نعم، يدعم الأرقام السعودية والمصرية والدولية

---

## 🚀 الخطوة التالية

بعد نسخ الكود ولصقه في تطبيق CRM:

1. شغّل تطبيق Link Call
2. شغّل تطبيق CRM
3. اضغط على زر الاتصال
4. استمتع بالمكالمات المباشرة! 🎉

---

**💡 نصيحة:** لمزيد من الخيارات المتقدمة، راجع ملف [CRM_INTEGRATION_GUIDE.md](./CRM_INTEGRATION_GUIDE.md)

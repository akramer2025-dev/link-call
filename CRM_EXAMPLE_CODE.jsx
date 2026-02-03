// ============================================
// مثال كامل لاستخدام Link Call في تطبيق Hotel CRM
// ============================================

import React, { useState } from 'react';

// ============================================
// 1. مكون زر الاتصال البسيط
// ============================================

const SimpleCallButton = ({ phoneNumber }) => {
    const handleCall = () => {
        // رابط تطبيق Link Call
        const linkCallUrl = 'http://localhost:3000/direct-call.html';
        
        // بناء URL مع رقم الهاتف
        const url = `${linkCallUrl}?phone=${encodeURIComponent(phoneNumber)}`;
        
        // فتح في نافذة جديدة
        window.open(url, 'LinkCall', 'width=400,height=700');
    };
    
    return (
        <button 
            onClick={handleCall}
            style={{
                padding: '8px 16px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
            }}
        >
            📞 اتصال
        </button>
    );
};

// ============================================
// 2. مكون متقدم مع تتبع حالة المكالمة
// ============================================

const AdvancedCallButton = ({ 
    phoneNumber, 
    hotelName,
    employeeId,
    employeeName 
}) => {
    const [isCallWindowOpen, setIsCallWindowOpen] = useState(false);
    const [callWindow, setCallWindow] = useState(null);
    
    const handleCall = () => {
        if (isCallWindowOpen && callWindow && !callWindow.closed) {
            // إذا كانت النافذة مفتوحة بالفعل، ركز عليها
            callWindow.focus();
            return;
        }
        
        const linkCallUrl = process.env.REACT_APP_LINK_CALL_URL || 'http://localhost:3000';
        
        const params = new URLSearchParams({
            phone: phoneNumber,
            employeeId: employeeId || localStorage.getItem('userId') || '',
            employeeName: employeeName || localStorage.getItem('userName') || ''
        });
        
        const url = `${linkCallUrl}/direct-call.html?${params}`;
        const newWindow = window.open(url, 'LinkCall', 'width=400,height=700');
        
        if (newWindow) {
            setCallWindow(newWindow);
            setIsCallWindowOpen(true);
            
            // تحقق من إغلاق النافذة
            const checkWindow = setInterval(() => {
                if (newWindow.closed) {
                    setIsCallWindowOpen(false);
                    setCallWindow(null);
                    clearInterval(checkWindow);
                }
            }, 1000);
        } else {
            alert('يرجى السماح بالنوافذ المنبثقة لإجراء المكالمات');
        }
    };
    
    return (
        <button 
            onClick={handleCall}
            disabled={isCallWindowOpen}
            style={{
                padding: '10px 20px',
                background: isCallWindowOpen ? '#95a5a6' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isCallWindowOpen ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}
        >
            <span>📞</span>
            <span>{isCallWindowOpen ? 'جاري الاتصال...' : 'اتصال'}</span>
        </button>
    );
};

// ============================================
// 3. مثال على صفحة الفنادق الكاملة
// ============================================

const HotelsPage = () => {
    // بيانات تجريبية للفنادق
    const hotels = [
        {
            id: 1,
            name: 'فندق الريتز',
            phone: '+966501234567',
            location: 'الرياض',
            managerId: 'emp_001',
            managerName: 'أحمد محمد'
        },
        {
            id: 2,
            name: 'فندق الهيلتون',
            phone: '+966509876543',
            location: 'جدة',
            managerId: 'emp_002',
            managerName: 'محمد أحمد'
        },
        {
            id: 3,
            name: 'فندق ماريوت',
            phone: '+966551234567',
            location: 'الدمام',
            managerId: 'emp_003',
            managerName: 'خالد علي'
        }
    ];
    
    return (
        <div style={{ padding: '20px' }}>
            <h1 style={{ marginBottom: '20px' }}>قائمة الفنادق</h1>
            
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '20px'
            }}>
                {hotels.map(hotel => (
                    <div 
                        key={hotel.id}
                        style={{
                            padding: '20px',
                            background: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            border: '1px solid #e0e0e0'
                        }}
                    >
                        <h3 style={{ marginBottom: '10px' }}>{hotel.name}</h3>
                        <p style={{ color: '#666', marginBottom: '5px' }}>
                            📍 {hotel.location}
                        </p>
                        <p style={{ color: '#666', marginBottom: '5px' }}>
                            📞 {hotel.phone}
                        </p>
                        <p style={{ color: '#666', marginBottom: '15px' }}>
                            👤 {hotel.managerName}
                        </p>
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {/* زر اتصال بسيط */}
                            <SimpleCallButton phoneNumber={hotel.phone} />
                            
                            {/* أو زر اتصال متقدم */}
                            {/* <AdvancedCallButton 
                                phoneNumber={hotel.phone}
                                hotelName={hotel.name}
                                employeeId={hotel.managerId}
                                employeeName={hotel.managerName}
                            /> */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================
// 4. Custom Hook لإدارة المكالمات
// ============================================

const useLinkCall = () => {
    const [callStatus, setCallStatus] = useState({
        isActive: false,
        phoneNumber: null,
        window: null
    });
    
    const makeCall = (phoneNumber, options = {}) => {
        if (!phoneNumber) {
            console.error('رقم الهاتف مطلوب');
            return false;
        }
        
        // إذا كانت هناك مكالمة نشطة
        if (callStatus.isActive && callStatus.window && !callStatus.window.closed) {
            callStatus.window.focus();
            return false;
        }
        
        const {
            employeeId = localStorage.getItem('userId'),
            employeeName = localStorage.getItem('userName'),
            linkCallUrl = process.env.REACT_APP_LINK_CALL_URL || 'http://localhost:3000'
        } = options;
        
        const params = new URLSearchParams({
            phone: phoneNumber,
            ...(employeeId && { employeeId }),
            ...(employeeName && { employeeName })
        });
        
        const url = `${linkCallUrl}/direct-call.html?${params}`;
        const newWindow = window.open(url, 'LinkCall', 'width=400,height=700');
        
        if (newWindow) {
            setCallStatus({
                isActive: true,
                phoneNumber,
                window: newWindow
            });
            
            // مراقبة إغلاق النافذة
            const checkInterval = setInterval(() => {
                if (newWindow.closed) {
                    setCallStatus({
                        isActive: false,
                        phoneNumber: null,
                        window: null
                    });
                    clearInterval(checkInterval);
                }
            }, 1000);
            
            return true;
        } else {
            alert('يرجى السماح بالنوافذ المنبثقة');
            return false;
        }
    };
    
    const endCall = () => {
        if (callStatus.window && !callStatus.window.closed) {
            callStatus.window.close();
        }
        setCallStatus({
            isActive: false,
            phoneNumber: null,
            window: null
        });
    };
    
    return {
        makeCall,
        endCall,
        callStatus
    };
};

// مثال على الاستخدام مع الـ Hook
const HotelCardWithHook = ({ hotel }) => {
    const { makeCall, callStatus } = useLinkCall();
    
    const handleCall = () => {
        makeCall(hotel.phone, {
            employeeId: hotel.managerId,
            employeeName: hotel.managerName
        });
    };
    
    return (
        <div style={{ padding: '20px', background: 'white', borderRadius: '12px' }}>
            <h3>{hotel.name}</h3>
            <p>📞 {hotel.phone}</p>
            
            <button 
                onClick={handleCall}
                disabled={callStatus.isActive}
                style={{
                    padding: '10px 20px',
                    background: callStatus.isActive ? '#95a5a6' : '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: callStatus.isActive ? 'not-allowed' : 'pointer'
                }}
            >
                {callStatus.isActive ? '🔊 مكالمة نشطة' : '📞 اتصال'}
            </button>
            
            {callStatus.isActive && (
                <p style={{ marginTop: '10px', color: '#667eea' }}>
                    جاري الاتصال بـ {callStatus.phoneNumber}
                </p>
            )}
        </div>
    );
};

// ============================================
// 5. Service Class للتكامل الكامل
// ============================================

class LinkCallService {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || process.env.REACT_APP_LINK_CALL_URL || 'http://localhost:3000';
        this.activeWindow = null;
        this.onCallStart = config.onCallStart || (() => {});
        this.onCallEnd = config.onCallEnd || (() => {});
    }
    
    initiateCall(phoneNumber, metadata = {}) {
        if (!phoneNumber) {
            throw new Error('Phone number is required');
        }
        
        // إذا كانت هناك نافذة مفتوحة
        if (this.activeWindow && !this.activeWindow.closed) {
            this.activeWindow.focus();
            return { success: false, reason: 'Call already in progress' };
        }
        
        const params = new URLSearchParams({
            phone: phoneNumber,
            ...(metadata.employeeId && { employeeId: metadata.employeeId }),
            ...(metadata.employeeName && { employeeName: metadata.employeeName })
        });
        
        const url = `${this.baseUrl}/direct-call.html?${params}`;
        
        try {
            this.activeWindow = window.open(
                url,
                'LinkCall',
                'width=400,height=700,resizable=yes,scrollbars=yes'
            );
            
            if (this.activeWindow) {
                this.onCallStart({ phoneNumber, metadata });
                
                // مراقبة إغلاق النافذة
                this.monitorCallWindow(phoneNumber);
                
                return { success: true, window: this.activeWindow };
            } else {
                return { success: false, reason: 'Popup blocked' };
            }
        } catch (error) {
            console.error('Error opening call window:', error);
            return { success: false, reason: error.message };
        }
    }
    
    monitorCallWindow(phoneNumber) {
        const checkInterval = setInterval(() => {
            if (!this.activeWindow || this.activeWindow.closed) {
                this.onCallEnd({ phoneNumber });
                this.activeWindow = null;
                clearInterval(checkInterval);
            }
        }, 1000);
    }
    
    endCall() {
        if (this.activeWindow && !this.activeWindow.closed) {
            this.activeWindow.close();
        }
        this.activeWindow = null;
    }
    
    isCallActive() {
        return this.activeWindow && !this.activeWindow.closed;
    }
}

// مثال على الاستخدام
const linkCallService = new LinkCallService({
    baseUrl: 'http://localhost:3000',
    onCallStart: (data) => {
        console.log('Call started:', data);
        // يمكنك تسجيل بداية المكالمة في قاعدة البيانات هنا
    },
    onCallEnd: (data) => {
        console.log('Call ended:', data);
        // يمكنك تسجيل نهاية المكالمة هنا
    }
});

// استخدام الـ Service
const makeCallWithService = (hotel) => {
    const result = linkCallService.initiateCall(hotel.phone, {
        employeeId: hotel.managerId,
        employeeName: hotel.managerName
    });
    
    if (!result.success) {
        if (result.reason === 'Popup blocked') {
            alert('يرجى السماح بالنوافذ المنبثقة في المتصفح');
        } else if (result.reason === 'Call already in progress') {
            alert('هناك مكالمة نشطة بالفعل');
        }
    }
};

// ============================================
// Export
// ============================================

export {
    SimpleCallButton,
    AdvancedCallButton,
    HotelsPage,
    useLinkCall,
    HotelCardWithHook,
    LinkCallService,
    linkCallService,
    makeCallWithService
};

// ============================================
// ملاحظات الاستخدام:
// ============================================

/*
1. تأكد من إضافة المتغير في .env:
   REACT_APP_LINK_CALL_URL=http://localhost:3000

2. استيراد المكون المناسب:
   import { SimpleCallButton } from './LinkCallIntegration';

3. استخدام في JSX:
   <SimpleCallButton phoneNumber="+966501234567" />

4. أو استخدام الـ Hook:
   const { makeCall } = useLinkCall();
   makeCall('+966501234567', { employeeId: '123' });

5. أو استخدام الـ Service:
   import { linkCallService } from './LinkCallIntegration';
   linkCallService.initiateCall('+966501234567', { employeeId: '123' });
*/

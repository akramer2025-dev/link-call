/**
 * ============================================
 * Link Call - خدمة الربط مع CRM
 * ============================================
 * 
 * ملف مساعد للاستخدام في تطبيق Hotel CRM
 * يمكنك نسخ هذا الملف مباشرة إلى مشروع CRM
 */

// ============================================
// الإعدادات
// ============================================

const LINK_CALL_CONFIG = {
    // رابط تطبيق Link Call (غيّره حسب بيئتك)
    baseUrl: process.env.REACT_APP_LINK_CALL_URL || 'http://localhost:3000',
    
    // إعدادات النافذة المنبثقة
    windowFeatures: 'width=400,height=700,resizable=yes,scrollbars=yes',
    
    // اسم النافذة (استخدم نفس الاسم لإعادة استخدام النافذة)
    windowName: 'LinkCallWindow'
};

// ============================================
// دالة الاتصال الرئيسية
// ============================================

/**
 * إجراء مكالمة مباشرة عبر Link Call
 * @param {string} phoneNumber - رقم الهاتف (مطلوب)
 * @param {object} options - خيارات إضافية
 * @param {string} options.employeeId - معرف الموظف
 * @param {string} options.employeeName - اسم الموظف
 * @param {string} options.linkCallUrl - رابط مخصص لـ Link Call
 * @returns {boolean} true إذا نجحت المكالمة، false إذا فشلت
 */
export function makeCall(phoneNumber, options = {}) {
    // التحقق من رقم الهاتف
    if (!phoneNumber) {
        console.error('[Link Call] رقم الهاتف مطلوب');
        return false;
    }
    
    // بناء URL مع المعاملات
    const params = new URLSearchParams({
        phone: phoneNumber,
        ...(options.employeeId && { employeeId: options.employeeId }),
        ...(options.employeeName && { employeeName: options.employeeName })
    });
    
    const baseUrl = options.linkCallUrl || LINK_CALL_CONFIG.baseUrl;
    const url = `${baseUrl}/direct-call.html?${params.toString()}`;
    
    // فتح نافذة المكالمة
    try {
        const callWindow = window.open(
            url,
            LINK_CALL_CONFIG.windowName,
            LINK_CALL_CONFIG.windowFeatures
        );
        
        if (!callWindow || callWindow.closed || typeof callWindow.closed === 'undefined') {
            console.error('[Link Call] فشل فتح النافذة - قد تكون النوافذ المنبثقة محظورة');
            alert('⚠️ يرجى السماح بالنوافذ المنبثقة في المتصفح لإجراء المكالمات');
            return false;
        }
        
        console.log('[Link Call] تم فتح نافذة المكالمة بنجاح:', phoneNumber);
        return true;
        
    } catch (error) {
        console.error('[Link Call] خطأ في فتح نافذة المكالمة:', error);
        return false;
    }
}

// ============================================
// دوال مساعدة
// ============================================

/**
 * إجراء مكالمة بسيطة (رقم فقط)
 */
export function quickCall(phoneNumber) {
    return makeCall(phoneNumber);
}

/**
 * إجراء مكالمة مع بيانات الموظف
 */
export function callWithEmployee(phoneNumber, employeeId, employeeName) {
    return makeCall(phoneNumber, { employeeId, employeeName });
}

/**
 * إجراء مكالمة من بيانات الفندق
 */
export function callHotel(hotel) {
    return makeCall(hotel.phone, {
        employeeId: hotel.managerId || hotel.contactId,
        employeeName: hotel.managerName || hotel.contactName
    });
}

/**
 * التحقق من صحة رقم الهاتف
 */
export function isValidPhoneNumber(phoneNumber) {
    if (!phoneNumber) return false;
    
    // إزالة المسافات والرموز
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // التحقق من طول الرقم
    return cleanNumber.length >= 9 && cleanNumber.length <= 15;
}

/**
 * تنسيق رقم الهاتف للعرض
 */
export function formatPhoneForDisplay(phoneNumber) {
    if (!phoneNumber) return '';
    
    // إزالة الرموز
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // تنسيق حسب البلد
    if (cleaned.startsWith('+966')) {
        // سعودي: +966 50 123 4567
        return cleaned.replace(/(\+966)(\d{2})(\d{3})(\d{4})/, '$1 $2 $3 $4');
    } else if (cleaned.startsWith('+20')) {
        // مصري: +20 12 3456 7890
        return cleaned.replace(/(\+20)(\d{2})(\d{4})(\d{4})/, '$1 $2 $3 $4');
    }
    
    return phoneNumber;
}

// ============================================
// React Hook للاستخدام في Components
// ============================================

/**
 * Hook للتعامل مع المكالمات في React Components
 * 
 * مثال الاستخدام:
 * ```jsx
 * const { call, isCallActive, lastCall } = useLinkCall();
 * 
 * <button onClick={() => call('+966501234567')}>
 *     اتصال
 * </button>
 * ```
 */
export function useLinkCall() {
    const [callState, setCallState] = useState({
        isActive: false,
        phoneNumber: null,
        window: null
    });
    
    const call = useCallback((phoneNumber, options = {}) => {
        const success = makeCall(phoneNumber, options);
        
        if (success) {
            setCallState({
                isActive: true,
                phoneNumber,
                window: window // reference to the call window
            });
        }
        
        return success;
    }, []);
    
    const endCall = useCallback(() => {
        setCallState({
            isActive: false,
            phoneNumber: null,
            window: null
        });
    }, []);
    
    return {
        call,
        endCall,
        isCallActive: callState.isActive,
        lastCall: callState.phoneNumber
    };
}

// ============================================
// React Component - زر الاتصال
// ============================================

/**
 * مكون زر الاتصال - جاهز للاستخدام
 * 
 * مثال:
 * ```jsx
 * <LinkCallButton 
 *     phoneNumber={hotel.phone} 
 *     employeeId={hotel.managerId}
 *     employeeName={hotel.managerName}
 * />
 * ```
 */
export function LinkCallButton({ 
    phoneNumber, 
    employeeId, 
    employeeName,
    children,
    className,
    style,
    ...props 
}) {
    const handleClick = () => {
        makeCall(phoneNumber, { employeeId, employeeName });
    };
    
    return (
        <button 
            onClick={handleClick}
            className={className}
            style={{
                padding: '8px 16px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.3s',
                ...style
            }}
            {...props}
        >
            {children || (
                <>
                    <span>📞</span>
                    <span>اتصال</span>
                </>
            )}
        </button>
    );
}

// ============================================
// Service Class - للتطبيقات الكبيرة
// ============================================

/**
 * خدمة المكالمات - للاستخدام في التطبيقات الكبيرة
 * 
 * مثال:
 * ```javascript
 * const callService = new LinkCallService({
 *     onCallStart: (data) => console.log('مكالمة بدأت', data),
 *     onCallEnd: (data) => console.log('مكالمة انتهت', data)
 * });
 * 
 * callService.call('+966501234567');
 * ```
 */
export class LinkCallService {
    constructor(config = {}) {
        this.config = {
            ...LINK_CALL_CONFIG,
            ...config
        };
        
        this.activeCall = null;
        this.callHistory = [];
        
        // Event handlers
        this.onCallStart = config.onCallStart || (() => {});
        this.onCallEnd = config.onCallEnd || (() => {});
    }
    
    call(phoneNumber, options = {}) {
        const callData = {
            phoneNumber,
            timestamp: new Date(),
            ...options
        };
        
        const success = makeCall(phoneNumber, {
            ...options,
            linkCallUrl: this.config.baseUrl
        });
        
        if (success) {
            this.activeCall = callData;
            this.callHistory.push(callData);
            this.onCallStart(callData);
        }
        
        return success;
    }
    
    endCall() {
        if (this.activeCall) {
            this.onCallEnd(this.activeCall);
            this.activeCall = null;
        }
    }
    
    isCallActive() {
        return this.activeCall !== null;
    }
    
    getCallHistory() {
        return [...this.callHistory];
    }
    
    clearHistory() {
        this.callHistory = [];
    }
}

// ============================================
// Export Default
// ============================================

export default {
    makeCall,
    quickCall,
    callWithEmployee,
    callHotel,
    isValidPhoneNumber,
    formatPhoneForDisplay,
    useLinkCall,
    LinkCallButton,
    LinkCallService
};

// ============================================
// TypeScript Types (للمشاريع التي تستخدم TypeScript)
// ============================================

/**
 * @typedef {Object} CallOptions
 * @property {string} [employeeId] - معرف الموظف
 * @property {string} [employeeName] - اسم الموظف
 * @property {string} [linkCallUrl] - رابط مخصص
 */

/**
 * @typedef {Object} Hotel
 * @property {string} phone - رقم الهاتف
 * @property {string} [managerId] - معرف المدير
 * @property {string} [managerName] - اسم المدير
 */

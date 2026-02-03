/**
 * ============================================
 * Link Call Service - TypeScript Version
 * ============================================
 * 
 * خدمة الربط مع تطبيق Link Call - نسخة TypeScript
 */

// ============================================
// Types & Interfaces
// ============================================

export interface CallOptions {
    employeeId?: string;
    employeeName?: string;
    linkCallUrl?: string;
}

export interface LinkCallConfig {
    baseUrl: string;
    windowFeatures: string;
    windowName: string;
    onCallStart?: (data: CallData) => void;
    onCallEnd?: (data: CallData) => void;
}

export interface CallData {
    phoneNumber: string;
    timestamp: Date;
    employeeId?: string;
    employeeName?: string;
}

export interface Hotel {
    phone: string;
    managerId?: string;
    managerName?: string;
    contactId?: string;
    contactName?: string;
}

// ============================================
// Configuration
// ============================================

const DEFAULT_CONFIG: LinkCallConfig = {
    baseUrl: process.env.REACT_APP_LINK_CALL_URL || 'http://localhost:3000',
    windowFeatures: 'width=400,height=700,resizable=yes,scrollbars=yes',
    windowName: 'LinkCallWindow'
};

// ============================================
// Main Functions
// ============================================

/**
 * إجراء مكالمة مباشرة عبر Link Call
 */
export function makeCall(
    phoneNumber: string, 
    options: CallOptions = {}
): boolean {
    if (!phoneNumber) {
        console.error('[Link Call] رقم الهاتف مطلوب');
        return false;
    }
    
    const params = new URLSearchParams({
        phone: phoneNumber,
        ...(options.employeeId && { employeeId: options.employeeId }),
        ...(options.employeeName && { employeeName: options.employeeName })
    });
    
    const baseUrl = options.linkCallUrl || DEFAULT_CONFIG.baseUrl;
    const url = `${baseUrl}/direct-call.html?${params.toString()}`;
    
    try {
        const callWindow = window.open(
            url,
            DEFAULT_CONFIG.windowName,
            DEFAULT_CONFIG.windowFeatures
        );
        
        if (!callWindow || callWindow.closed || typeof callWindow.closed === 'undefined') {
            console.error('[Link Call] فشل فتح النافذة');
            alert('⚠️ يرجى السماح بالنوافذ المنبثقة في المتصفح');
            return false;
        }
        
        console.log('[Link Call] نجاح:', phoneNumber);
        return true;
        
    } catch (error) {
        console.error('[Link Call] خطأ:', error);
        return false;
    }
}

/**
 * مكالمة سريعة (رقم فقط)
 */
export function quickCall(phoneNumber: string): boolean {
    return makeCall(phoneNumber);
}

/**
 * مكالمة مع بيانات الموظف
 */
export function callWithEmployee(
    phoneNumber: string,
    employeeId: string,
    employeeName: string
): boolean {
    return makeCall(phoneNumber, { employeeId, employeeName });
}

/**
 * مكالمة من بيانات الفندق
 */
export function callHotel(hotel: Hotel): boolean {
    return makeCall(hotel.phone, {
        employeeId: hotel.managerId || hotel.contactId,
        employeeName: hotel.managerName || hotel.contactName
    });
}

/**
 * التحقق من صحة رقم الهاتف
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
    if (!phoneNumber) return false;
    
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    return cleanNumber.length >= 9 && cleanNumber.length <= 15;
}

/**
 * تنسيق رقم الهاتف للعرض
 */
export function formatPhoneForDisplay(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    if (cleaned.startsWith('+966')) {
        return cleaned.replace(/(\+966)(\d{2})(\d{3})(\d{4})/, '$1 $2 $3 $4');
    } else if (cleaned.startsWith('+20')) {
        return cleaned.replace(/(\+20)(\d{2})(\d{4})(\d{4})/, '$1 $2 $3 $4');
    }
    
    return phoneNumber;
}

// ============================================
// React Hook
// ============================================

import { useState, useCallback } from 'react';

interface CallState {
    isActive: boolean;
    phoneNumber: string | null;
    window: Window | null;
}

interface UseLinkCallReturn {
    call: (phoneNumber: string, options?: CallOptions) => boolean;
    endCall: () => void;
    isCallActive: boolean;
    lastCall: string | null;
}

export function useLinkCall(): UseLinkCallReturn {
    const [callState, setCallState] = useState<CallState>({
        isActive: false,
        phoneNumber: null,
        window: null
    });
    
    const call = useCallback((phoneNumber: string, options: CallOptions = {}) => {
        const success = makeCall(phoneNumber, options);
        
        if (success) {
            setCallState({
                isActive: true,
                phoneNumber,
                window: window
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
// React Component
// ============================================

import React, { CSSProperties, ButtonHTMLAttributes } from 'react';

interface LinkCallButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    phoneNumber: string;
    employeeId?: string;
    employeeName?: string;
    children?: React.ReactNode;
    style?: CSSProperties;
}

export const LinkCallButton: React.FC<LinkCallButtonProps> = ({ 
    phoneNumber, 
    employeeId, 
    employeeName,
    children,
    className,
    style,
    ...props 
}) => {
    const handleClick = () => {
        makeCall(phoneNumber, { employeeId, employeeName });
    };
    
    const defaultStyle: CSSProperties = {
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
    };
    
    return (
        <button 
            onClick={handleClick}
            className={className}
            style={defaultStyle}
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
};

// ============================================
// Service Class
// ============================================

export class LinkCallService {
    private config: LinkCallConfig;
    private activeCall: CallData | null = null;
    private callHistory: CallData[] = [];
    private onCallStart: (data: CallData) => void;
    private onCallEnd: (data: CallData) => void;
    
    constructor(config: Partial<LinkCallConfig> = {}) {
        this.config = {
            ...DEFAULT_CONFIG,
            ...config
        };
        
        this.onCallStart = config.onCallStart || (() => {});
        this.onCallEnd = config.onCallEnd || (() => {});
    }
    
    call(phoneNumber: string, options: CallOptions = {}): boolean {
        const callData: CallData = {
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
    
    endCall(): void {
        if (this.activeCall) {
            this.onCallEnd(this.activeCall);
            this.activeCall = null;
        }
    }
    
    isCallActive(): boolean {
        return this.activeCall !== null;
    }
    
    getCallHistory(): CallData[] {
        return [...this.callHistory];
    }
    
    clearHistory(): void {
        this.callHistory = [];
    }
    
    getActiveCall(): CallData | null {
        return this.activeCall;
    }
}

// ============================================
// Default Export
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

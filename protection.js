// ========================================
// نظام حماية متقدم لتطبيق Link Call
// Copyright © 2024-2026 Link Call. All rights reserved.
// ========================================

(function() {
    'use strict';
    
    // ==================== تعطيل الحماية على localhost للتطوير ====================
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '';
    
    if (isLocalhost) {
        console.log('%c🔓 Protection Disabled (localhost)', 'color: orange; font-size: 14px; font-weight: bold;');
        return; // إيقاف تنفيذ نظام الحماية
    }
    
    // ==================== إعدادات الحماية ====================
    const PROTECTION_CONFIG = {
        disableDevTools: false,
        disableRightClick: false,
        disableTextSelection: false,
        disableConsole: false,
        detectDebugger: false,
        protectCode: false,
        watermark: true,
        antiCopy: false
    };

    // ==================== منع فتح DevTools ====================
    if (PROTECTION_CONFIG.disableDevTools) {
        // الطريقة 1: كشف DevTools من خلال الفرق في التوقيت
        const devtoolsDetector = {
            isOpen: false,
            orientation: null
        };

        const checkDevTools = () => {
            const widthThreshold = window.outerWidth - window.innerWidth > 160;
            const heightThreshold = window.outerHeight - window.innerHeight > 160;
            
            if (widthThreshold || heightThreshold) {
                devtoolsDetector.isOpen = true;
                blockDevTools();
            }
        };

        // الطريقة 2: استخدام console.log مع toString
        const element = new Image();
        Object.defineProperty(element, 'id', {
            get: function() {
                devtoolsDetector.isOpen = true;
                blockDevTools();
                throw new Error('DevTools detected');
            }
        });

        // الطريقة 3: debugger loop
        const antiDebugger = () => {
            if (PROTECTION_CONFIG.detectDebugger) {
                const before = new Date().getTime();
                debugger;
                const after = new Date().getTime();
                
                if (after - before > 100) {
                    blockDevTools();
                }
            }
        };

        // الطريقة 4: كشف من خلال Firebug
        const checkFirebug = () => {
            if (window.console && (window.console.firebug || window.console.table && /firebug/i.test(window.console.table()))) {
                blockDevTools();
            }
        };

        // دالة حظر DevTools
        function blockDevTools() {
            document.body.innerHTML = '';
            const div = document.createElement('div');
            div.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;font-family:Arial;font-size:24px;z-index:999999;flex-direction:column;';
            div.innerHTML = `
                <div style="text-align:center;padding:40px;">
                    <h1 style="color:#ff4757;font-size:48px;margin-bottom:20px;">⚠️ تحذير أمني</h1>
                    <p style="font-size:24px;margin-bottom:20px;">تم اكتشاف محاولة غير مصرح بها</p>
                    <p style="font-size:18px;color:#ddd;">هذا التطبيق محمي بحقوق الملكية</p>
                    <p style="font-size:16px;color:#999;margin-top:20px;">Developer tools are not allowed</p>
                    <p style="font-size:14px;color:#666;margin-top:40px;">تم تسجيل هذه المحاولة</p>
                </div>
            `;
            document.body.appendChild(div);
            
            // إرسال تنبيه للخادم
            try {
                fetch('/api/security-alert', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'devtools_detected',
                        timestamp: new Date().toISOString(),
                        userAgent: navigator.userAgent,
                        url: window.location.href
                    })
                });
            } catch(e) {}
            
            // منع أي تفاعل
            setInterval(() => {
                debugger;
            }, 50);
        }

        // تشغيل الفحوصات
        setInterval(checkDevTools, 1000);
        setInterval(antiDebugger, 1000);
        setInterval(checkFirebug, 1000);
        setInterval(() => console.log(element), 1000);
    }

    // ==================== منع النقر بالزر الأيمن ====================
    if (PROTECTION_CONFIG.disableRightClick) {
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showProtectionMessage('⛔ النقر بالزر الأيمن معطل لحماية المحتوى');
            return false;
        });
    }

    // ==================== منع تحديد النص ====================
    if (PROTECTION_CONFIG.disableTextSelection) {
        document.addEventListener('selectstart', (e) => {
            if (!e.target.matches('input, textarea')) {
                e.preventDefault();
                return false;
            }
        });

        // منع النسخ
        document.addEventListener('copy', (e) => {
            if (!e.target.matches('input, textarea')) {
                e.preventDefault();
                showProtectionMessage('⛔ النسخ معطل لحماية المحتوى');
                return false;
            }
        });
    }

    // ==================== تعطيل Console ====================
    if (PROTECTION_CONFIG.disableConsole) {
        // حفظ النسخة الأصلية
        const noop = () => {};
        const methods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace', 'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd', 'clear', 'count', 'countReset', 'assert', 'profile', 'profileEnd', 'time', 'timeLog', 'timeEnd', 'timeStamp', 'context', 'memory'];
        
        methods.forEach(method => {
            if (window.console[method]) {
                window.console[method] = noop;
            }
        });
    }

    // ==================== منع اختصارات لوحة المفاتيح الخطيرة ====================
    if (PROTECTION_CONFIG.disableDevTools) {
    document.addEventListener('keydown', (e) => {
        // منع F12
        if (e.keyCode === 123) {
            e.preventDefault();
            showProtectionMessage('⛔ هذا الاختصار معطل');
            return false;
        }
        
        // منع Ctrl+Shift+I / Cmd+Option+I
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            showProtectionMessage('⛔ هذا الاختصار معطل');
            return false;
        }
        
        // منع Ctrl+Shift+J / Cmd+Option+J
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            showProtectionMessage('⛔ هذا الاختصار معطل');
            return false;
        }
        
        // منع Ctrl+U / Cmd+U (عرض المصدر)
        if ((e.ctrlKey || e.metaKey) && e.keyCode === 85) {
            e.preventDefault();
            showProtectionMessage('⛔ هذا الاختصار معطل');
            return false;
        }
        
        // منع Ctrl+S / Cmd+S (حفظ الصفحة)
        if ((e.ctrlKey || e.metaKey) && e.keyCode === 83) {
            e.preventDefault();
            showProtectionMessage('⛔ حفظ الصفحة معطل');
            return false;
        }
        
        // منع Ctrl+Shift+C / Cmd+Option+C (Element Picker)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.keyCode === 67) {
            e.preventDefault();
            showProtectionMessage('⛔ هذا الاختصار معطل');
            return false;
        }
    });
    } // end disableDevTools

    // ==================== حماية الكود من المشاهدة ====================
    if (PROTECTION_CONFIG.protectCode) {
        // تشفير وإخفاء الكود
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            // إضافة headers للحماية
            if (args[1]) {
                args[1].headers = {
                    ...args[1].headers,
                    'X-Protection-Token': generateProtectionToken()
                };
            }
            return originalFetch.apply(this, args);
        };

        // منع تعديل DOM Inspector
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.classList && node.classList.contains('debug-panel')) {
                            node.remove();
                        }
                    });
                }
            });
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    // ==================== منع فتح الصفحة في إطار ====================
    if (window.top !== window.self) {
        window.top.location = window.self.location;
    }

    // ==================== إضافة علامة مائية ====================
    if (PROTECTION_CONFIG.watermark) {
        const watermark = document.createElement('div');
        watermark.id = 'security-watermark';
        watermark.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            color: rgba(255, 255, 255, 0.3);
            font-size: 10px;
            font-family: monospace;
            z-index: 999998;
            pointer-events: none;
            user-select: none;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
        `;
        watermark.textContent = `© Link Call ${new Date().getFullYear()} | Protected`;
        
        if (document.body) {
            document.body.appendChild(watermark);
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                document.body.appendChild(watermark);
            });
        }

        // حماية العلامة المائية من الحذف
        setInterval(() => {
            if (!document.getElementById('security-watermark')) {
                document.body.appendChild(watermark);
            }
        }, 3000);
    }

    // ==================== كشف وحظر الأدوات الآلية ====================
    (function detectAutomation() {
        // كشف Selenium
        if (navigator.webdriver) {
            blockAutomation();
        }

        // كشف Puppeteer/Playwright
        if (window.chrome && window.chrome.runtime === undefined && navigator.plugins.length === 0) {
            blockAutomation();
        }

        // كشف PhantomJS
        if (window.callPhantom || window._phantom) {
            blockAutomation();
        }

        function blockAutomation() {
            console.error('Automation detected');
            try {
                fetch('/api/security-alert', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'automation_detected',
                        timestamp: new Date().toISOString()
                    })
                });
            } catch(e) {}
        }
    })();

    // ==================== دوال مساعدة ====================
    function showProtectionMessage(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ff4757;
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            font-family: Arial;
            font-size: 14px;
            z-index: 999999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideDown 0.3s ease;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    function generateProtectionToken() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return btoa(`${timestamp}-${random}`);
    }

    // ==================== حماية من Scraping ====================
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) {
        this._protectionUrl = url;
        return originalOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function() {
        // أضف الـ header فقط للطلبات الداخلية وليس Twilio
        try {
            const url = this._protectionUrl || '';
            const isTwilio = typeof url === 'string' && (
                url.includes('twilio.com') || 
                url.includes('twil.io') ||
                url.includes('chunder.twilio') ||
                url.includes('media.')
            );
            if (!isTwilio && url) {
                this.setRequestHeader('X-Protection-Token', generateProtectionToken());
            }
        } catch(e) {}
        return originalSend.apply(this, arguments);
    };

    // ==================== منع Print Screen ====================
    document.addEventListener('keyup', (e) => {
        if (e.key === 'PrintScreen') {
            navigator.clipboard.writeText('');
            showProtectionMessage('⛔ لقطات الشاشة معطلة');
        }
    });

    // ==================== تسجيل محاولات الاختراق ====================
    window.addEventListener('error', (e) => {
        if (e.message.includes('DevTools') || e.message.includes('debugger')) {
            try {
                fetch('/api/security-alert', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'intrusion_attempt',
                        error: e.message,
                        timestamp: new Date().toISOString()
                    })
                });
            } catch(err) {}
        }
    });

    // ==================== حماية المتغيرات العامة ====================
    Object.freeze(PROTECTION_CONFIG);
    
    // منع تعديل دوال الحماية
    Object.freeze(Object.prototype);
    
    // حماية localStorage من التلاعب
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
        if (key.includes('protection') || key.includes('security')) {
            console.error('Unauthorized storage access');
            return;
        }
        return originalSetItem.apply(this, arguments);
    };


})();


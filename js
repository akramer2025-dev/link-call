/**
 * 🔒 ADVANCED SECURITY PROTECTION SYSTEM
 * نظام حماية متقدم ضد الاختراقات والهجمات
 * Created by: Akram Mostafa
 * Version: 2.0
 */

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // 1️⃣ منع فتح Developer Tools (F12, Ctrl+Shift+I, إلخ)
    // ═══════════════════════════════════════════════════════════
    
    // منع اختصارات لوحة المفاتيح
    document.addEventListener('keydown', function(e) {
        // F12
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+I (Inspector)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+J (Console)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+C (Element Inspector)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
            e.preventDefault();
            return false;
        }
        // Ctrl+U (View Source)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
        // Ctrl+S (Save Page)
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }
    });

    // كشف فتح DevTools
    let devtoolsOpen = false;
    const threshold = 160;
    
    setInterval(function() {
        if (window.outerWidth - window.innerWidth > threshold || 
            window.outerHeight - window.innerHeight > threshold) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#fff;font-family:Arial;text-align:center;"><div><h1>⚠️ تحذير أمني</h1><p>تم اكتشاف محاولة وصول غير مصرح بها</p></div></div>';
            }
        }
    }, 500);

    // ═══════════════════════════════════════════════════════════
    // 2️⃣ منع النقر بالزر الأيمن (Right Click)
    // ═══════════════════════════════════════════════════════════
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

    // ═══════════════════════════════════════════════════════════
    // 3️⃣ منع التحديد والنسخ (Selection & Copy)
    // ═══════════════════════════════════════════════════════════
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    });

    document.addEventListener('copy', function(e) {
        e.preventDefault();
        return false;
    });

    // منع السحب (Drag)
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });

    // ═══════════════════════════════════════════════════════════
    // 4️⃣ حماية الصور من التحميل
    // ═══════════════════════════════════════════════════════════
    document.querySelectorAll('img').forEach(function(img) {
        img.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            return false;
        });
        img.setAttribute('draggable', 'false');
        img.style.userSelect = 'none';
        img.style.webkitUserSelect = 'none';
        img.style.mozUserSelect = 'none';
        img.style.msUserSelect = 'none';
    });

    // ═══════════════════════════════════════════════════════════
    // 5️⃣ منع Console Commands (تعطيل الكونسول)
    // ═══════════════════════════════════════════════════════════
    const disableConsole = function() {
        const noop = function() {};
        ['assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
         'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
         'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
         'timeline', 'timelineEnd', 'timeStamp', 'trace', 'warn'].forEach(function(method) {
            window.console[method] = noop;
        });
    };
    
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        disableConsole();
    }

    // ═══════════════════════════════════════════════════════════
    // 6️⃣ حماية ضد XSS و Injection Attacks
    // ═══════════════════════════════════════════════════════════
    
    // تنظيف URL من محاولات الحقن
    if (window.location.search) {
        const params = new URLSearchParams(window.location.search);
        const dangerousPatterns = [
            /<script/i, /javascript:/i, /onerror=/i, /onload=/i, 
            /eval\(/i, /alert\(/i, /document\.cookie/i, /innerHTML/i
        ];
        
        for (let [key, value] of params.entries()) {
            for (let pattern of dangerousPatterns) {
                if (pattern.test(value)) {
                    window.location.href = window.location.pathname;
                    break;
                }
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
    // 7️⃣ منع Iframe Embedding (حماية من Clickjacking)
    // ═══════════════════════════════════════════════════════════
    if (window.top !== window.self) {
        window.top.location = window.self.location;
    }

    // ═══════════════════════════════════════════════════════════
    // 8️⃣ كشف والحماية من Bots و Scrapers
    // ═══════════════════════════════════════════════════════════
    const suspiciousBots = [
        /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i
    ];
    
    const userAgent = navigator.userAgent.toLowerCase();
    const isSuspicious = suspiciousBots.some(pattern => pattern.test(userAgent));
    
    if (isSuspicious && window.location.hostname !== 'localhost') {
        console.warn('Suspicious bot detected');
        // يمكن إضافة إجراءات إضافية هنا
    }

    // ═══════════════════════════════════════════════════════════
    // 9️⃣ حماية Session Storage و Local Storage
    // ═══════════════════════════════════════════════════════════
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
        // تشفير بسيط للبيانات الحساسة
        if (key.includes('token') || key.includes('password') || key.includes('session')) {
            value = btoa(value); // Base64 encoding
        }
        originalSetItem.call(this, key, value);
    };

    // ═══════════════════════════════════════════════════════════
    // 🔟 رصد التغييرات المشبوهة في DOM
    // ═══════════════════════════════════════════════════════════
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.tagName === 'SCRIPT' && !node.src.includes(window.location.hostname)) {
                    // اكتشاف سكريبت خارجي مشبوه
                    node.remove();
                    console.warn('External script blocked:', node.src);
                }
            });
        });
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    // ═══════════════════════════════════════════════════════════
    // ✅ رسالة تأكيد تفعيل الحماية
    // ═══════════════════════════════════════════════════════════
    const securityBadge = document.createElement('div');
    securityBadge.style.cssText = 'position:fixed;bottom:20px;left:20px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:10px 16px;border-radius:10px;font-size:12px;font-weight:700;z-index:999999;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;gap:8px;';
    securityBadge.innerHTML = '🔒 نظام الحماية مفعّل';
    document.body.appendChild(securityBadge);
    
    setTimeout(function() {
        securityBadge.style.opacity = '0';
        securityBadge.style.transition = 'opacity 0.5s';
        setTimeout(function() {
            securityBadge.remove();
        }, 500);
    }, 3000);

    // ═══════════════════════════════════════════════════════════
    // 🛡️ حماية إضافية - تجميد النوافذ المنبثقة الضارة
    // ═══════════════════════════════════════════════════════════
    window.open = function() {
        return null;
    };

})();

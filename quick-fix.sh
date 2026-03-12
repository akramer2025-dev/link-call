#!/bin/bash
# Quick Fix Script for Hostinger - Run with: bash quick-fix.sh

echo "🔧 جاري إصلاح الموقع..."

# 1. نسخ ملفات public للجذر (حل مؤقت)
echo "📁 نسخ الملفات..."
cp -r public/* .

# 2. إنشاء .htaccess بسيط
echo "⚙️ إعداد .htaccess..."
cat > .htaccess << 'EOF'
# Hostinger Simple Config
DirectoryIndex index.html login.html

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

Options -Indexes

<FilesMatch "^\.">
    Order allow,deny
    Deny from all
</FilesMatch>
EOF

# 3. ضبط الصلاحيات
echo "🔐 ضبط الصلاحيات..."
chmod 644 .htaccess
find . -type f -name "*.html" -exec chmod 644 {} \;
find . -type f -name "*.js" -exec chmod 644 {} \;
find . -type f -name "*.css" -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;

echo "✅ تم! افتح الموقع الآن: https://linkcall.elosool.com"
echo ""
echo "⚠️ ملاحظة: هذا حل مؤقت بدون Node.js"
echo "   للحل الكامل، راجع docs/HOSTINGER-TROUBLESHOOTING.md"

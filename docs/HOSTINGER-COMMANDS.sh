# أوامر Hostinger Terminal - لحل مشكلة 500 Error
# ====================================================

# 1. اتصل بـ SSH
ssh u878468059@yourhostip

# 2. اذهب لمجلد الموقع
cd ~/domains/linkcall.elosool.com/public_html

# 3. تحقق من الملفات الموجودة
ls -la

# 4. تأكد من وجود المجلدات المطلوبة
ls -la public server database

# 5. تثبيت Dependencies
npm install

# 6. تحقق من .env
cat .env

# 7. اختبار تشغيل Node.js يدوياً (للاختبار فقط)
node server/server.js

# 8. إذا اشتغل، اضغط Ctrl+C وشغّله من hPanel Node.js App

# 9. عرض Error Logs
tail -f ~/logs/linkcall.elosool.com/error.log

# 10. إذا مافيش Node.js متاح، حل مؤقت:
# انسخ ملفات public للجذر
cp -r public/* .

# 11. أنشئ .htaccess بسيط
cat > .htaccess << 'EOF'
DirectoryIndex index.html login.html
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
Options -Indexes
EOF

# 12. أعطي صلاحيات للملفات
chmod 644 .htaccess
find . -type f -name "*.html" -exec chmod 644 {} \;
find . -type f -name "*.js" -exec chmod 644 {} \;
find . -type f -name "*.css" -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;

# 13. افتح الموقع وجرب
# https://linkcall.elosool.com

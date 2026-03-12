#!/bin/bash
# Script to prepare files for Hostinger upload
# سكريبت لتحضير الملفات للرفع على Hostinger

echo "=================================="
echo "تحضير الملفات للرفع على Hostinger"
echo "=================================="

# Create deployment folder
echo "إنشاء مجلد النشر..."
mkdir -p ../link-call-deploy

# Copy essential files
echo "نسخ الملفات الأساسية..."

# HTML files
cp *.html ../link-call-deploy/ 2>/dev/null

# JavaScript and JSON
cp *.js ../link-call-deploy/ 2>/dev/null
cp *.json ../link-call-deploy/ 2>/dev/null

# Copy directories
cp -r api/ ../link-call-deploy/ 2>/dev/null
cp -r utils/ ../link-call-deploy/ 2>/dev/null
cp -r css/ ../link-call-deploy/ 2>/dev/null
cp -r js/ ../link-call-deploy/ 2>/dev/null
cp -r handlers/ ../link-call-deploy/ 2>/dev/null
cp -r scripts/ ../link-call-deploy/ 2>/dev/null

# Copy .env (important!)
cp .env ../link-call-deploy/ 2>/dev/null

echo ""
echo "✅ تم تحضير الملفات في: ../link-call-deploy"
echo ""
echo "الخطوات التالية:"
echo "1. افتح File Manager في Hostinger"
echo "2. اذهب إلى public_html/"
echo "3. ارفع جميع الملفات من link-call-deploy"
echo "4. شغل من Terminal: npm install"
echo "=================================="

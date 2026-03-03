# PowerShell Script لنشر التطبيق على Vercel بعد إصلاح مشكلة 404
# Deploy to Vercel Script

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "  نشر Link Call على Vercel" -ForegroundColor Cyan  
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# التحقق من وجود Vercel CLI
Write-Host "🔍 التحقق من Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI غير مثبت" -ForegroundColor Red
    Write-Host ""
    Write-Host "لتثبيته، قم بتشغيل:" -ForegroundColor Yellow
    Write-Host "npm install -g vercel" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Vercel CLI مثبت" -ForegroundColor Green
Write-Host ""

# التحقق من تسجيل الدخول
Write-Host "🔐 التحقق من تسجيل الدخول..." -ForegroundColor Yellow
$loginCheck = vercel whoami 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ لم تقم بتسجيل الدخول إلى Vercel" -ForegroundColor Red
    Write-Host ""
    Write-Host "قم بتسجيل الدخول باستخدام:" -ForegroundColor Yellow
    Write-Host "vercel login" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ تم تسجيل الدخول: $loginCheck" -ForegroundColor Green
Write-Host ""

# عرض الملفات المعدلة
Write-Host "📝 الملفات المعدلة:" -ForegroundColor Cyan
Write-Host "  - vercel.json (تبسيط التكوين)" -ForegroundColor White
Write-Host "  - api/index.js (تحديث export)" -ForegroundColor White  
Write-Host "  - api/companies.js (إضافة main handler)" -ForegroundColor White
Write-Host "  - api/balance.js (جديد)" -ForegroundColor Green
Write-Host "  - api/heartbeat.js (جديد)" -ForegroundColor Green
Write-Host "  - api/track-login.js (جديد)" -ForegroundColor Green
Write-Host ""

# سؤال المستخدم
$deploy = Read-Host "هل تريد نشر التطبيق الآن؟ (Y/N)"

if ($deploy -ne "Y" -and $deploy -ne "y") {
    Write-Host "❌ تم إلغاء النشر" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "  بدء عملية النشر" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# النشر
Write-Host "🚀 جاري النشر على Vercel..." -ForegroundColor Yellow
Write-Host ""

vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "===================================" -ForegroundColor Green
    Write-Host "  ✅ تم النشر بنجاح!" -ForegroundColor Green
    Write-Host "===================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "اختبر التطبيق على:" -ForegroundColor Cyan
    Write-Host "https://linkcall.akrammostafa.com" -ForegroundColor White
    Write-Host ""
    Write-Host "اختبر API endpoints:" -ForegroundColor Cyan
    Write-Host "  - https://linkcall.akrammostafa.com/token?identity=test" -ForegroundColor White
    Write-Host "  - https://linkcall.akrammostafa.com/balance" -ForegroundColor White
    Write-Host "  - https://linkcall.akrammostafa.com/employees" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "===================================" -ForegroundColor Red
    Write-Host "  ❌ فشل النشر" -ForegroundColor Red
    Write-Host "===================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "للتحقق من الأخطاء:" -ForegroundColor Yellow
    Write-Host "vercel logs" -ForegroundColor White
    Write-Host ""
}

Write-Host "لتشغيل التطبيق محلياً للاختبار:" -ForegroundColor Cyan
Write-Host "vercel dev" -ForegroundColor White
Write-Host ""

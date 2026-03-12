# تنظيم المجلد الأصلي D:\link call مباشرة
# =====================================================

$root = "D:\link call"
Write-Host "🔄 بدء تنظيم المجلد: $root" -ForegroundColor Cyan

# 1. إنشاء المجلدات الجديدة
Write-Host "`n📁 إنشاء البنية الجديدة..." -ForegroundColor Yellow
$folders = @(
    "public",
    "public\pages",
    "public\css",
    "public\js",
    "public\images",
    "server",
    "server\api",
    "server\utils",
    "server\handlers",
    "database",
    "_old_files"
)

foreach ($folder in $folders) {
    $path = Join-Path $root $folder
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Host "  ✅ $folder" -ForegroundColor Green
    }
}

# 2. نقل ملفات HTML (ماعدا index و login)
Write-Host "`n📄 نقل ملفات HTML..." -ForegroundColor Yellow
$htmlFiles = @(
    "accounts.html",
    "admin.html", 
    "company-crm.html",
    "company-reports.html",
    "crm.html",
    "customer-reports.html",
    "direct-call.html",
    "manage-employees.html",
    "platform.html",
    "register-company.html",
    "super-admin.html"
)

foreach ($file in $htmlFiles) {
    $source = Join-Path $root $file
    if (Test-Path $source) {
        Move-Item $source (Join-Path $root "public\pages\$file") -Force
        Write-Host "  ✅ $file → public\pages\" -ForegroundColor Green
    }
}

# index.html و login.html يروحوا public مباشرة
if (Test-Path "$root\index.html") {
    Move-Item "$root\index.html" "$root\public\index.html" -Force
    Write-Host "  ✅ index.html → public\" -ForegroundColor Green
}
if (Test-Path "$root\login.html") {
    Move-Item "$root\login.html" "$root\public\login.html" -Force
    Write-Host "  ✅ login.html → public\" -ForegroundColor Green
}

# 3. نقل ملفات CSS
Write-Host "`n🎨 نقل ملفات CSS..." -ForegroundColor Yellow
if (Test-Path "$root\css") {
    Get-ChildItem "$root\css\*.css" | ForEach-Object {
        Copy-Item $_.FullName "$root\public\css\" -Force
        Write-Host "  ✅ $($_.Name)" -ForegroundColor Green
    }
}

# 4. نقل ملفات JavaScript (ماعدا server code)
Write-Host "`n⚡ نقل ملفات JavaScript..." -ForegroundColor Yellow
$clientJsFiles = @("app.js", "admin.js")
foreach ($file in $clientJsFiles) {
    if (Test-Path "$root\$file") {
        Move-Item "$root\$file" "$root\public\$file" -Force
        Write-Host "  ✅ $file → public\" -ForegroundColor Green
    }
}

# نسخ باقي ملفات JS من مجلد js/
if (Test-Path "$root\js") {
    Get-ChildItem "$root\js\*.js" | ForEach-Object {
        Copy-Item $_.FullName "$root\public\js\" -Force
        Write-Host "  ✅ $($_.Name)" -ForegroundColor Green
    }
}

# 5. نقل الصور
Write-Host "`n🖼️ نقل الصور..." -ForegroundColor Yellow
$imageFiles = @("logo.jpg", "favicon.png", "icon-192.png", "icon-512.png")
foreach ($file in $imageFiles) {
    if (Test-Path "$root\$file") {
        Move-Item "$root\$file" "$root\public\images\$file" -Force
        Write-Host "  ✅ $file" -ForegroundColor Green
    }
}

# 6. نقل ملفات PWA
Write-Host "`n📱 نقل ملفات PWA..." -ForegroundColor Yellow
if (Test-Path "$root\manifest.json") {
    Move-Item "$root\manifest.json" "$root\public\manifest.json" -Force
    Write-Host "  ✅ manifest.json" -ForegroundColor Green
}
if (Test-Path "$root\service-worker.js") {
    Move-Item "$root\service-worker.js" "$root\public\service-worker.js" -Force
    Write-Host "  ✅ service-worker.js" -ForegroundColor Green
}

# 7. نقل server.js
Write-Host "`n🖥️ نقل Server..." -ForegroundColor Yellow
if (Test-Path "$root\server.js") {
    Move-Item "$root\server.js" "$root\server\server.js" -Force
    Write-Host "  ✅ server.js → server\" -ForegroundColor Green
}

# 8. نقل API files
Write-Host "`n🔌 نقل API files..." -ForegroundColor Yellow
if (Test-Path "$root\api") {
    Get-ChildItem "$root\api\*.js" | ForEach-Object {
        Copy-Item $_.FullName "$root\server\api\" -Force
        Write-Host "  ✅ $($_.Name)" -ForegroundColor Green
    }
}

# 9. نقل Utils
Write-Host "`n🛠️ نقل Utils..." -ForegroundColor Yellow
if (Test-Path "$root\utils") {
    Get-ChildItem "$root\utils\*.js" | ForEach-Object {
        Copy-Item $_.FullName "$root\server\utils\" -Force
        Write-Host "  ✅ $($_.Name)" -ForegroundColor Green
    }
}

# 10. نقل Handlers
Write-Host "`n📡 نقل Handlers..." -ForegroundColor Yellow
if (Test-Path "$root\handlers") {
    Get-ChildItem "$root\handlers\*.js" | ForEach-Object {
        Copy-Item $_.FullName "$root\server\handlers\" -Force
        Write-Host "  ✅ $($_.Name)" -ForegroundColor Green
    }
}

# 11. نقل Database files
Write-Host "`n🗄️ نقل Database files..." -ForegroundColor Yellow
$dbFiles = @(
    "database_schema.sql",
    "hostinger-import.sql",
    "migrate-firebase-to-mysql.js",
    "setup-hostinger-database.js",
    "test-mysql-connection.js"
)
foreach ($file in $dbFiles) {
    if (Test-Path "$root\$file") {
        Move-Item "$root\$file" "$root\database\$file" -Force
        Write-Host "  ✅ $file" -ForegroundColor Green
    }
}

# 12. نقل Scripts
Write-Host "`n📜 نقل Scripts..." -ForegroundColor Yellow
$scriptFiles = @(
    "check-shahd.js",
    "check-shahd2.js",
    "delete-all-contacts.js",
    "fix-activate-employees.js",
    "fix-employee-usernames.js",
    "update-jamjoum-twilio.js",
    "prepare-deployment.ps1",
    "prepare-deployment.sh",
    "organize-project.ps1"
)
foreach ($file in $scriptFiles) {
    if (Test-Path "$root\$file") {
        Move-Item "$root\$file" "$root\scripts\$file" -Force
        Write-Host "  ✅ $file" -ForegroundColor Green
    }
}

# 13. نقل Docs
Write-Host "`n📚 تنظيم Docs..." -ForegroundColor Yellow
$docFiles = @(
    "HOSTINGER-DEPLOYMENT-GUIDE.md",
    "IMPORT-INSTRUCTIONS.md",
    "MIGRATION-GUIDE.md",
    "README-MIGRATION.md"
)
foreach ($file in $docFiles) {
    if (Test-Path "$root\$file") {
        Move-Item "$root\$file" "$root\docs\$file" -Force
        Write-Host "  ✅ $file" -ForegroundColor Green
    }
}

# 14. نقل الملفات القديمة
Write-Host "`n🗑️ نقل ملفات قديمة/غير مستخدمة..." -ForegroundColor Yellow
$oldFiles = @(
    "login-result.txt",
    "lr.txt",
    "del.json",
    "index.html.backup",
    ".gitignore.new"
)
foreach ($file in $oldFiles) {
    if (Test-Path "$root\$file") {
        Move-Item "$root\$file" "$root\_old_files\$file" -Force
        Write-Host "  ✅ $file" -ForegroundColor Gray
    }
}

# 15. تنظيف المجلدات القديمة
Write-Host "`n🗑️ إزالة المجلدات القديمة الفارغة..." -ForegroundColor Yellow
$oldDirs = @("css", "js", "api", "utils", "handlers")
foreach ($dir in $oldDirs) {
    $dirPath = Join-Path $root $dir
    if (Test-Path $dirPath) {
        try {
            Remove-Item $dirPath -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  ✅ حذف $dir/" -ForegroundColor Gray
        } catch {
            Write-Host "  ⚠️ تعذر حذف $dir/" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n✅ اكتمل التنظيم!" -ForegroundColor Green
Write-Host "`n📊 البنية الجديدة:" -ForegroundColor Cyan
Write-Host "  D:\link call\" -ForegroundColor White
Write-Host "  - public/" -ForegroundColor Gray
Write-Host "  - server/" -ForegroundColor Gray
Write-Host "  - database/" -ForegroundColor Gray
Write-Host "  - scripts/" -ForegroundColor Gray
Write-Host "  - docs/" -ForegroundColor Gray
Write-Host "  - _old_files/" -ForegroundColor DarkGray



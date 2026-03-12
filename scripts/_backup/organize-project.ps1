# PowerShell Script: Organize Project Structure
# ترتيب بنية المشروع بشكل احترافي

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Organizing Link Call Project Structure" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$source = "d:\link call"
$dest = "d:\link-call-clean"

# Create clean project structure
Write-Host "Creating organized structure..." -ForegroundColor Yellow

if (Test-Path $dest) {
    Write-Host "  Removing old clean folder..." -ForegroundColor Gray
    Remove-Item $dest -Recurse -Force
}

# Create main directories
$dirs = @(
    "$dest",
    "$dest\public",
    "$dest\public\css",
    "$dest\public\js",
    "$dest\public\images",
    "$dest\public\pages",
    "$dest\server",
    "$dest\server\api",
    "$dest\server\handlers",
    "$dest\server\utils",
    "$dest\database",
    "$dest\scripts",
    "$dest\docs"
)

foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

Write-Host "  + Created folder structure" -ForegroundColor Green

# Copy PUBLIC files (HTML, CSS, JS, Images)
Write-Host "`nCopying PUBLIC files..." -ForegroundColor Yellow

# Main HTML files
$mainPages = @("index.html", "login.html", "platform.html")
foreach ($page in $mainPages) {
    if (Test-Path "$source\$page") {
        Copy-Item "$source\$page" "$dest\public\"
        Write-Host "  + $page" -ForegroundColor Green
    }
}

# Other HTML pages to pages folder
$otherPages = @(
    "admin.html",
    "company-crm.html",
    "company-reports.html",
    "customer-reports.html",
    "manage-employees.html",
    "register-company.html",
    "super-admin.html",
    "accounts.html",
    "crm.html",
    "direct-call.html"
)

foreach ($page in $otherPages) {
    if (Test-Path "$source\$page") {
        Copy-Item "$source\$page" "$dest\public\pages\"
        Write-Host "  + pages\$page" -ForegroundColor Green
    }
}

# CSS, JS folders
if (Test-Path "$source\css") {
    Copy-Item "$source\css\*" "$dest\public\css\" -Recurse -Force
    Write-Host "  + css folder" -ForegroundColor Green
}

if (Test-Path "$source\js") {
    Copy-Item "$source\js\*" "$dest\public\js\" -Recurse -Force
    Write-Host "  + js folder" -ForegroundColor Green
}

# Images
$images = @("favicon.png", "icon-192.png", "icon-512.png", "logo.jpg")
foreach ($img in $images) {
    if (Test-Path "$source\$img") {
        Copy-Item "$source\$img" "$dest\public\images\"
    }
}
Write-Host "  + images" -ForegroundColor Green

# Copy SERVER files
Write-Host "`nCopying SERVER files..." -ForegroundColor Yellow

Copy-Item "$source\server.js" "$dest\server\"
Write-Host "  + server.js" -ForegroundColor Green

if (Test-Path "$source\app.js") {
    Copy-Item "$source\app.js" "$dest\public\"
    Write-Host "  + app.js (client)" -ForegroundColor Green
}

if (Test-Path "$source\admin.js") {
    Copy-Item "$source\admin.js" "$dest\public\pages\"
    Write-Host "  + admin.js" -ForegroundColor Green
}

# API, handlers, utils folders
Copy-Item "$source\api\*" "$dest\server\api\" -Recurse -Force
Write-Host "  + api folder" -ForegroundColor Green

if (Test-Path "$source\handlers") {
    Copy-Item "$source\handlers\*" "$dest\server\handlers\" -Recurse -Force
    Write-Host "  + handlers folder" -ForegroundColor Green
}

Copy-Item "$source\utils\*" "$dest\server\utils\" -Recurse -Force
Write-Host "  + utils folder" -ForegroundColor Green

# Copy DATABASE files
Write-Host "`nCopying DATABASE files..." -ForegroundColor Yellow

$dbFiles = @(
    "database_schema.sql",
    "hostinger-import.sql",
    "migrate-firebase-to-mysql.js",
    "setup-hostinger-database.js",
    "test-mysql-connection.js"
)

foreach ($file in $dbFiles) {
    if (Test-Path "$source\$file") {
        Copy-Item "$source\$file" "$dest\database\"
        Write-Host "  + $file" -ForegroundColor Green
    }
}

# Copy SCRIPTS folder
Write-Host "`nCopying SCRIPTS..." -ForegroundColor Yellow

if (Test-Path "$source\scripts") {
    Copy-Item "$source\scripts\*" "$dest\scripts\" -Recurse -Force
    Write-Host "  + scripts folder" -ForegroundColor Green
}

# Copy utility scripts
$utilScripts = @(
    "delete-all-contacts.js",
    "update-jamjoum-twilio.js",
    "fix-activate-employees.js",
    "fix-employee-usernames.js"
)

foreach ($script in $utilScripts) {
    if (Test-Path "$source\$script") {
        Copy-Item "$source\$script" "$dest\scripts\"
    }
}

# Copy ROOT CONFIG files
Write-Host "`nCopying CONFIG files..." -ForegroundColor Yellow

$rootFiles = @(
    "package.json",
    "package-lock.json",
    "manifest.json",
    "service-worker.js",
    ".env",
    "vercel.json",
    ".gitignore",
    ".htaccess"
)

foreach ($file in $rootFiles) {
    if (Test-Path "$source\$file") {
        Copy-Item "$source\$file" "$dest\"
        Write-Host "  + $file" -ForegroundColor Green
    }
}

# Copy DOCS
Write-Host "`nCopying DOCUMENTATION..." -ForegroundColor Yellow

$docFiles = @(
    "HOSTINGER-DEPLOYMENT-GUIDE.md",
    "MIGRATION-GUIDE.md",
    "README-MIGRATION.md",
    "IMPORT-INSTRUCTIONS.md"
)

foreach ($doc in $docFiles) {
    if (Test-Path "$source\$doc") {
        Copy-Item "$source\$doc" "$dest\docs\"
    }
}
Write-Host "  + documentation files" -ForegroundColor Green

# Create README for new structure
$readmeContent = @"
# Link Call - Organized Project Structure

## Project Structure

\`\`\`
link-call-clean/
├── public/                 # Frontend files
│   ├── index.html         # Main page
│   ├── login.html         # Login page
│   ├── platform.html      # Platform page
│   ├── app.js             # Main client JS
│   ├── manifest.json      # PWA manifest
│   ├── service-worker.js  # PWA service worker
│   ├── css/               # Stylesheets
│   ├── js/                # Client JavaScript
│   ├── images/            # Images & icons
│   └── pages/             # Other HTML pages
│       ├── admin.html
│       ├── company-crm.html
│       └── ...
│
├── server/                 # Backend files
│   ├── server.js          # Express server
│   ├── api/               # API endpoints
│   │   ├── companies.js
│   │   ├── contacts.js
│   │   └── ...
│   ├── handlers/          # Request handlers
│   └── utils/             # Server utilities
│       ├── mysql.js
│       ├── company-mysql.js
│       └── ...
│
├── database/               # Database files
│   ├── database_schema.sql
│   ├── hostinger-import.sql
│   ├── migrate-firebase-to-mysql.js
│   └── ...
│
├── scripts/                # Utility scripts
│   └── ...
│
├── docs/                   # Documentation
│   ├── DEPLOYMENT-GUIDE.md
│   └── ...
│
├── package.json
├── .env
└── vercel.json
\`\`\`

## Key Changes

1. **Organized Frontend**: All HTML, CSS, JS, images in \`public/\`
2. **Clean Backend**: Server code in \`server/\` with clear separation
3. **Database Scripts**: All DB-related files in \`database/\`
4. **Documentation**: All guides in \`docs/\`
5. **No Clutter**: Test files, backups, and temporary files excluded

## Running the Application

\`\`\`bash
# Install dependencies
npm install

# Start server
node server/server.js
\`\`\`

## Deployment

Upload \`public/\` and \`server/\` folders to Hostinger.
Refer to \`docs/HOSTINGER-DEPLOYMENT-GUIDE.md\` for details.
"@

Set-Content -Path "$dest\README.md" -Value $readmeContent

# Update paths in server.js
Write-Host "`nUpdating file paths in server.js..." -ForegroundColor Yellow

$serverContent = Get-Content "$dest\server\server.js" -Raw
$serverContent = $serverContent -replace "require\('\.\/utils\/", "require('./utils/"
$serverContent = $serverContent -replace "require\('\.\/api\/", "require('./api/"
$serverContent = $serverContent -replace "express\.static\('\.'\)", "express.static('../public')"
Set-Content -Path "$dest\server\server.js" -Value $serverContent
Write-Host "  + Updated server.js paths" -ForegroundColor Green

# Statistics
$totalFiles = (Get-ChildItem -Path $dest -Recurse -File).Count
$totalSize = [math]::Round((Get-ChildItem -Path $dest -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB, 2)

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Project Organized Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Old Location: $source" -ForegroundColor Gray
Write-Host "New Location: $dest" -ForegroundColor Cyan
Write-Host "Total Files: $totalFiles" -ForegroundColor Cyan
Write-Host "Total Size: $totalSize MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test the organized project locally" -ForegroundColor White
Write-Host "2. If everything works, use it for deployment" -ForegroundColor White
Write-Host "3. Upload to Hostinger from: $dest" -ForegroundColor White
Write-Host ""
Write-Host "To test locally:" -ForegroundColor Yellow
Write-Host "  cd '$dest'" -ForegroundColor Cyan
Write-Host "  npm install" -ForegroundColor Cyan
Write-Host "  node server/server.js" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green

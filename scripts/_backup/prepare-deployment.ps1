# PowerShell Script: Prepare files for Hostinger deployment

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Preparing files for Hostinger..." -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Create deployment folder
$deployPath = "..\link-call-deploy"
Write-Host "Creating deployment folder..." -ForegroundColor Yellow
if (Test-Path $deployPath) {
    Remove-Item $deployPath -Recurse -Force
}
New-Item -ItemType Directory -Path $deployPath | Out-Null

# Files to copy
$filesToCopy = @(
    "*.html",
    "manifest.json",
    "server.js",
    "package.json",
    "migrate-firebase-to-mysql.js",
    ".env"
)

Write-Host "Copying essential files..." -ForegroundColor Yellow

foreach ($pattern in $filesToCopy) {
    Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | ForEach-Object {
        Copy-Item $_.FullName -Destination $deployPath
        Write-Host "  + $($_.Name)" -ForegroundColor Green
    }
}

# Directories to copy
$dirsToCopy = @(
    "api",
    "utils",
    "css",
    "js",
    "handlers",
    "scripts"
)

Write-Host ""
Write-Host "Copying folders..." -ForegroundColor Yellow

foreach ($dir in $dirsToCopy) {
    if (Test-Path $dir) {
        Copy-Item $dir -Destination $deployPath -Recurse -Force
        $fileCount = (Get-ChildItem -Path "$deployPath\$dir" -Recurse -File).Count
        Write-Host "  + $dir ($fileCount files)" -ForegroundColor Green
    }
}

# Count total files
$totalFiles = (Get-ChildItem -Path $deployPath -Recurse -File).Count
$totalSize = [math]::Round((Get-ChildItem -Path $deployPath -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB, 2)

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "Done! Files ready to upload" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host "Path: $((Get-Item $deployPath).FullName)" -ForegroundColor Cyan
Write-Host "Files: $totalFiles" -ForegroundColor Cyan
Write-Host "Size: $totalSize MB" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open File Manager in Hostinger" -ForegroundColor White
Write-Host "2. Go to: domains/linkcall.elosool.com/public_html/" -ForegroundColor White
Write-Host "3. Delete old files (if any)" -ForegroundColor White
Write-Host "4. Upload all files from: link-call-deploy" -ForegroundColor White
Write-Host "5. Open Terminal in Hostinger and run:" -ForegroundColor White
Write-Host "   cd public_html" -ForegroundColor Cyan
Write-Host "   npm install" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Green

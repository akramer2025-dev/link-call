# Fix API URLs in app.js
$filePath = "d:\موقع خاص بيا\linkcall\app.js"
$content = Get-Content $filePath -Raw -Encoding UTF8

# Replace window.location.origin with API_BASE_URL in baseUrl declarations
$content = $content -replace 'const baseUrl = window\.location\.origin;', 'const baseUrl = API_BASE_URL;'

# Save with UTF-8 encoding
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($filePath, $content, $utf8NoBom)

Write-Host "✅ Fixed API URLs successfully!" -ForegroundColor Green

Write-Host "===== IPO SNIPER PROJECT INSPECTOR =====" -ForegroundColor Cyan

Write-Host "`n=== Root ===" -ForegroundColor Yellow
Get-ChildItem -Force | Select-Object Mode,Name

Write-Host "`n=== Important Directories ===" -ForegroundColor Yellow
Get-ChildItem -Directory |
Where-Object { $_.Name -ne "node_modules" } |
Select-Object Name

Write-Host "`n=== Package Files ===" -ForegroundColor Yellow
Get-ChildItem -File |
Where-Object {
    $_.Name -match "package|tsconfig|next|tailwind|eslint"
} |
Select-Object Name

Write-Host "`n=== Source Tree (excluding node_modules/.next) ===" -ForegroundColor Yellow

Get-ChildItem -Directory -Recurse |
Where-Object {
    $_.FullName -notmatch "node_modules|\.next|\.git"
} |
Select-Object FullName

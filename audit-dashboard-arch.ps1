Set-Location "$env:USERPROFILE\dev\IPO_Sniper_AI_v4"

Write-Host "=== 1. Current /workstation page.tsx full structure ===" -ForegroundColor Cyan
Get-Content "app\(app)\workstation\page.tsx"

Write-Host "`n=== 2. All real panels in components/workstation/panels ===" -ForegroundColor Cyan
Get-ChildItem "components\workstation\panels" -Recurse -File -Include *.tsx | Select-Object Name, @{N='Lines';E={(Get-Content $_.FullName).Count}}

Write-Host "`n=== 3. Does a watchlist/recent-search data source already exist? ===" -ForegroundColor Cyan
Get-ChildItem "engine","app" -Recurse -File -Include *.ts,*.tsx | Select-String -SimpleMatch -Pattern "getWatchlist","recentSearches","ContinueResearchPanel" | Select-Object Path -Unique

Write-Host "`n=== 4. Real IPO-related panels/routes already built ===" -ForegroundColor Cyan
Get-ChildItem "components","app" -Recurse -File -Include *.tsx | Where-Object { $_.Name -like "*IPO*" } | Select-Object FullName

Write-Host "`n=== 5. Real Academy page, if it exists ===" -ForegroundColor Cyan
Get-ChildItem "app" -Recurse -File -Filter "page.tsx" | Where-Object { $_.FullName -like "*academy*" } | Select-Object FullName

Read-Host "`nDone. Press Enter to close"
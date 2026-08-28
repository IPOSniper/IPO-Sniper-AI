Set-Location "$env:USERPROFILE\dev\IPO_Sniper_AI_v4"

Write-Host "=== 1. EXCHANGE DATA: does Finnhub profile data include exchange anywhere? ===" -ForegroundColor Cyan
Get-ChildItem "engine" -Recurse -File -Include *.ts |
    Select-String -SimpleMatch -Pattern "exchange","primaryExchange","mic","finnhubIndustry" |
    Select-Object Path, LineNumber, Line

Write-Host "`n=== 2. FINNHUB PROFILE PROVIDER: real interface shape ===" -ForegroundColor Cyan
Get-ChildItem "engine" -Recurse -File -Include "*Profile*.ts","*Finnhub*.ts" |
    Select-Object FullName

Write-Host "`n=== 3. OPPORTUNITIES CRON: is it in vercel.json? ===" -ForegroundColor Cyan
Get-Content "vercel.json" -ErrorAction SilentlyContinue

Write-Host "`n=== 4. GITHUB ACTIONS: any workflow for quant-opportunities? ===" -ForegroundColor Cyan
Get-ChildItem ".github\workflows" -Recurse -File -ErrorAction SilentlyContinue | Select-Object FullName

Write-Host "`n=== 5. OPPORTUNITIES CRON ROUTE: real content, does it reveal last_seen_at semantics? ===" -ForegroundColor Cyan
Get-Content "app\api\cron\quant-opportunities\route.ts" -ErrorAction SilentlyContinue | Select-String -Pattern "last_seen_at|detected_at|updated_at" -Context 2,2

Read-Host "`nDone. Press Enter to close"
$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " IPO SNIPER AI — DASHBOARD BOOTSTRAP AUDIT" -ForegroundColor Cyan
Write-Host " Step 5: Real Data Population Readiness" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$root = Get-Location

Write-Host ""
Write-Host "=== 1. DASHBOARD STRUCTURE ===" -ForegroundColor Yellow

Get-Content "app\(app)\workstation\page.tsx" |
    Select-String -Pattern "Market Today|Your Market Pulse|Your Market|IPO Intelligence|Quant|Live Intelligence|Supporting" |
    ForEach-Object {
        Write-Host $_.Line.Trim()
    }

Write-Host ""
Write-Host "=== 2. DASHBOARD PANELS ===" -ForegroundColor Yellow

Get-Content "app\(app)\workstation\page.tsx" |
    Select-String -Pattern "<[A-Z][A-Za-z0-9]+" |
    ForEach-Object {
        Write-Host $_.Line.Trim()
    }

Write-Host ""
Write-Host "=== 3. DATA/API REFERENCES IN WORKSTATION ===" -ForegroundColor Yellow

Get-ChildItem "app\(app)\workstation","components\workstation" `
    -Recurse -File -Include *.ts,*.tsx |
    Select-String -Pattern `
        "fetch\(",
        "/api/",
        "supabase",
        "finnhub",
        "alpaca",
        "gdelt",
        "edgar",
        "13f",
        "institutional" |
    ForEach-Object {
        Write-Host "$($_.Path):$($_.LineNumber): $($_.Line.Trim())"
    }

Write-Host ""
Write-Host "=== 4. PLACEHOLDER / HONEST-STATE AUDIT ===" -ForegroundColor Yellow

Get-ChildItem "app\(app)\workstation","components\workstation" `
    -Recurse -File -Include *.ts,*.tsx |
    Select-String -Pattern `
        "Unavailable",
        "Unknown",
        "placeholder",
        "coming soon",
        "TODO",
        "mock",
        "sample",
        "fake",
        "hardcoded" |
    ForEach-Object {
        Write-Host "$($_.Path):$($_.LineNumber): $($_.Line.Trim())"
    }

Write-Host ""
Write-Host "=== 5. MARKET PULSE / YOUR MARKET CONNECTION ===" -ForegroundColor Yellow

Get-ChildItem "app","components","engine" `
    -Recurse -File -Include *.ts,*.tsx |
    Select-String -Pattern `
        "Your Market Pulse",
        "MarketPulse",
        "market-pulse",
        "watchlist",
        "recent search",
        "recentSearch" |
    ForEach-Object {
        Write-Host "$($_.Path):$($_.LineNumber): $($_.Line.Trim())"
    }

Write-Host ""
Write-Host "=== 6. ANALYST / INTERPRETATION CAPABILITIES ===" -ForegroundColor Yellow

Get-ChildItem "app","components","engine" `
    -Recurse -File -Include *.ts,*.tsx |
    Select-String -Pattern `
        "analyst",
        "interpret",
        "outlook",
        "regime",
        "volatility",
        "economic",
        "sector",
        "strategy",
        "thesis" |
    ForEach-Object {
        Write-Host "$($_.Path):$($_.LineNumber): $($_.Line.Trim())"
    }

Write-Host ""
Write-Host "=== 7. QUANT BOUNDARY CHECK ===" -ForegroundColor Yellow

Get-ChildItem "app\(app)\workstation","components\workstation" `
    -Recurse -File -Include *.ts,*.tsx |
    Select-String -Pattern `
        "QuantAwareness",
        "quant",
        "decision",
        "threshold",
        "weight",
        "score",
        "execution" |
    ForEach-Object {
        Write-Host "$($_.Path):$($_.LineNumber): $($_.Line.Trim())"
    }

Write-Host ""
Write-Host "=== 8. DYNAMIC RENDERING ===" -ForegroundColor Yellow

Select-String `
    -Path "app\(app)\workstation\page.tsx" `
    -Pattern "force-dynamic|revalidate|force-static" |
    ForEach-Object {
        Write-Host "$($_.LineNumber): $($_.Line.Trim())"
    }

Write-Host ""
Write-Host "=== 9. TYPE CHECK ===" -ForegroundColor Yellow

npm run type-check

Write-Host ""
Write-Host "=== 10. PRODUCTION BUILD ===" -ForegroundColor Yellow

npm run build

Write-Host ""
Write-Host "=== 11. GIT STATUS ===" -ForegroundColor Yellow

git status --short

Write-Host ""
Write-Host "=== 12. RECENT COMMITS ===" -ForegroundColor Yellow

git log -5 --oneline --decorate

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " DASHBOARD BOOTSTRAP AUDIT COMPLETE" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

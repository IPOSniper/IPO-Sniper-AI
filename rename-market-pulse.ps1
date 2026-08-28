Set-Location "$env:USERPROFILE\dev\IPO_Sniper_AI_v4"

# --- File 1: MarketPulseSection.tsx ---
$path1 = "components\education\MarketPulseSection.tsx"
$content1 = Get-Content -LiteralPath $path1 -Raw

# Fix mojibake "Loading market pulse..." (byte-level, safe regardless of exact corrupted bytes)
$bytes1 = [System.IO.File]::ReadAllBytes((Resolve-Path $path1))
$latin1 = [System.Text.Encoding]::GetEncoding("ISO-8859-1")
$text1 = $latin1.GetString($bytes1)
$mojiPattern = "[\x80-\xFF]{1,15}"
$moji1 = [regex]::Matches($text1, $mojiPattern)
if ($moji1.Count -gt 0) {
    $text1 = [regex]::Replace($text1, $mojiPattern, "...")
    [System.IO.File]::WriteAllText((Resolve-Path $path1), $text1, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "PATCHED: $($moji1.Count) mojibake sequence(s) fixed in MarketPulseSection.tsx" -ForegroundColor Green
}

# Rename "Loading market pulse" text and alt text (re-read after mojibake fix)
$content1 = Get-Content -LiteralPath $path1 -Raw
$content1 = $content1.Replace("Loading market pulse...", "Loading your market pulse...")
$content1 = $content1.Replace('alt="Market Pulse share card"', 'alt="Your Market Pulse share card"')
[System.IO.File]::WriteAllText((Resolve-Path $path1), $content1, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "PATCHED: text renamed in MarketPulseSection.tsx" -ForegroundColor Green

# --- File 2: workstation/page.tsx - the real link label ---
$path2 = "app\(app)\workstation\page.tsx"
$content2 = Get-Content -LiteralPath $path2 -Raw

$oldLabel = ">Market Pulse<"
$matchCount = ([regex]::Matches($content2, [regex]::Escape($oldLabel))).Count
Write-Host "Workstation link label match count: $matchCount" -ForegroundColor Cyan
if ($matchCount -eq 1) {
    $content2 = $content2.Replace($oldLabel, ">Your Market Pulse<")
    [System.IO.File]::WriteAllText((Resolve-Path $path2), $content2, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "PATCHED: Workstation link renamed to Your Market Pulse" -ForegroundColor Green
} else {
    Write-Host "ABORT: unexpected match count on workstation link label." -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

Write-Host "`n=== VERIFY (no remaining bare 'Market Pulse' without 'Your') ===" -ForegroundColor Cyan
Select-String -LiteralPath $path1,$path2 -Pattern "Market Pulse" | Where-Object { $_.Line -notmatch "Your Market Pulse" }

Write-Host "`n=== TYPE CHECK ===" -ForegroundColor Cyan
npm run type-check
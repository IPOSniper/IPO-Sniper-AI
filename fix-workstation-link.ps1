Set-Location "$env:USERPROFILE\dev\IPO_Sniper_AI_v4"

$path = "app\(app)\workstation\page.tsx"
$content = Get-Content -LiteralPath $path -Raw

$pattern = "(?m)^([ \t]*)Market Pulse[ \t]*$"
$match = [regex]::Match($content, $pattern)

Write-Host "Match found: $($match.Success)" -ForegroundColor Cyan
if ($match.Success) {
    $indent = $match.Groups[1].Value
    $content = [regex]::Replace($content, $pattern, "${indent}Your Market Pulse")
    [System.IO.File]::WriteAllText((Resolve-Path $path), $content, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "PATCHED: Workstation link renamed to Your Market Pulse" -ForegroundColor Green
} else {
    Write-Host "ABORT: still no match. Showing real context for inspection:" -ForegroundColor Red
    Select-String -LiteralPath $path -Pattern "Market Pulse" -Context 2,2
    Read-Host "Press Enter to close"
    exit 1
}

Write-Host "`n=== VERIFY ===" -ForegroundColor Cyan
Select-String -LiteralPath $path -Pattern "Market Pulse"

Write-Host "`n=== TYPE CHECK (both files) ===" -ForegroundColor Cyan
npm run type-check
Set-Location "$env:USERPROFILE\dev\IPO_Sniper_AI_v4"

$path = "app\education\page.tsx"
$content = Get-Content -LiteralPath $path -Raw

# Fix 1: rename the h1
$oldHeading = '<h1 className="text-2xl font-bold">Market Pulse</h1>'
$matchCount = ([regex]::Matches($content, [regex]::Escape($oldHeading))).Count
Write-Host "Heading match count: $matchCount" -ForegroundColor Cyan
if ($matchCount -eq 1) {
    $content = $content.Replace($oldHeading, '<h1 className="text-2xl font-bold">Your Market Pulse</h1>')
    [System.IO.File]::WriteAllText((Resolve-Path $path), $content, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "PATCHED: heading renamed." -ForegroundColor Green
} else {
    Write-Host "ABORT: heading match count wrong." -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

# Fix 2: clean mojibake, byte-level (same proven technique as before)
$bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $path))
$latin1 = [System.Text.Encoding]::GetEncoding("ISO-8859-1")
$text = $latin1.GetString($bytes)
$mojiPattern = "[\x80-\xFF]{1,15}"
$moji = [regex]::Matches($text, $mojiPattern)
if ($moji.Count -gt 0) {
    $text = [regex]::Replace($text, $mojiPattern, "-")
    $text = [regex]::Replace($text, "  +", " ")
    [System.IO.File]::WriteAllText((Resolve-Path $path), $text, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "PATCHED: $($moji.Count) mojibake sequence(s) fixed." -ForegroundColor Green
} else {
    Write-Host "No mojibake found." -ForegroundColor Yellow
}

# Final verify
$bytesCheck = [System.IO.File]::ReadAllBytes((Resolve-Path $path))
$textCheck = $latin1.GetString($bytesCheck)
$remaining = [regex]::Matches($textCheck, "[\x80-\xFF]")
Write-Host "Remaining non-ASCII bytes: $($remaining.Count)"

Write-Host "`n=== TYPE CHECK ===" -ForegroundColor Cyan
npm run type-check
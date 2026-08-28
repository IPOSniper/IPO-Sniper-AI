Set-Location "$env:USERPROFILE\dev\IPO_Sniper_AI_v4"

# --- Fix 1: WorkstationShell.tsx - add real "Workstation" heading ---
$shellPath = "components\workstation\shell\WorkstationShell.tsx"
$shellContent = Get-Content -LiteralPath $shellPath -Raw

$shellPattern = "(?m)^([ \t]*)<CommandBar research=\{research\} />"
$shellMatch = [regex]::Match($shellContent, $shellPattern)

Write-Host "Shell anchor found: $($shellMatch.Success)" -ForegroundColor Cyan
if (-not $shellMatch.Success) {
    Write-Host "ABORT: could not find CommandBar line." -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

if ($shellContent -notmatch "Workstation</h1>") {
    $indent = $shellMatch.Groups[1].Value
    $heading = "$indent<h1 className=`"text-2xl font-bold mb-1`">Workstation</h1>`r`n"
    $insertPos = $shellMatch.Index
    $shellContent = $shellContent.Insert($insertPos, $heading)
    [System.IO.File]::WriteAllText((Resolve-Path $shellPath), $shellContent, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "PATCHED: WorkstationShell.tsx heading added." -ForegroundColor Green
} else {
    Write-Host "Heading already present, skipping." -ForegroundColor Yellow
}

# --- Fix 2: workstation/page.tsx - rename h1 text from "IPO Sniper AI" to "Dashboard" ---
$pagePath = "app\(app)\workstation\page.tsx"
$pageContent = Get-Content -LiteralPath $pagePath -Raw

$pagePattern = "(?s)<h1 className=`"text-2xl font-bold mb-1`">\s*IPO Sniper AI\s*</h1>"
$pageMatch = [regex]::Match($pageContent, $pagePattern)

Write-Host "Page h1 anchor found: $($pageMatch.Success)" -ForegroundColor Cyan
if ($pageMatch.Success) {
    $pageContent = [regex]::Replace($pageContent, $pagePattern, "<h1 className=`"text-2xl font-bold mb-1`">`r`n                Dashboard`r`n            </h1>")
    [System.IO.File]::WriteAllText((Resolve-Path $pagePath), $pageContent, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "PATCHED: page.tsx heading changed to Dashboard." -ForegroundColor Green
} else {
    Write-Host "ABORT: could not find page h1." -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

# --- Fix 3: clean Market Pulse mojibake, byte-level ---
$bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $pagePath))
$latin1 = [System.Text.Encoding]::GetEncoding("ISO-8859-1")
$text = $latin1.GetString($bytes)
$mojiPattern = "[\x80-\xFF]{1,15}"
$moji = [regex]::Matches($text, $mojiPattern)
if ($moji.Count -gt 0) {
    $text = [regex]::Replace($text, $mojiPattern, "-")
    $text = [regex]::Replace($text, "  +", " ")
    [System.IO.File]::WriteAllText((Resolve-Path $pagePath), $text, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "PATCHED: Market Pulse mojibake cleaned ($($moji.Count) sequence(s))." -ForegroundColor Green
} else {
    Write-Host "No mojibake found." -ForegroundColor Yellow
}

$bytesCheck = [System.IO.File]::ReadAllBytes((Resolve-Path $pagePath))
$textCheck = $latin1.GetString($bytesCheck)
$remaining = [regex]::Matches($textCheck, "[\x80-\xFF]")
Write-Host "Remaining non-ASCII bytes in page.tsx: $($remaining.Count)"

Write-Host "`n=== TYPE CHECK ===" -ForegroundColor Cyan
npm run type-check
Set-Location "$env:USERPROFILE\dev\IPO_Sniper_AI_v4"

# --- Fix 1: WorkstationShell.tsx - add real "Workstation" heading ---
$shellPath = "components\workstation\shell\WorkstationShell.tsx"
$shellContent = Get-Content -LiteralPath $shellPath -Raw

$shellAnchor = @'
        <div className="space-y-4 text-white">
            <CommandBar research={research} />
'@

$shellMatchCount = ([regex]::Matches($shellContent, [regex]::Escape($shellAnchor))).Count
Write-Host "Shell anchor match count: $shellMatchCount" -ForegroundColor Cyan
if ($shellMatchCount -ne 1) {
    Write-Host "ABORT: shell anchor mismatch." -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

$shellReplacement = @'
        <div className="space-y-4 text-white">
            <h1 className="text-2xl font-bold mb-1">Workstation</h1>
            <CommandBar research={research} />
'@

$shellContent = $shellContent.Replace($shellAnchor, $shellReplacement)
[System.IO.File]::WriteAllText((Resolve-Path $shellPath), $shellContent, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "PATCHED: WorkstationShell.tsx heading added." -ForegroundColor Green

# --- Fix 2: workstation/page.tsx - rename h1 to "Dashboard" ---
$pagePath = "app\(app)\workstation\page.tsx"
$pageContent = Get-Content -LiteralPath $pagePath -Raw

$pageAnchor = @'
            <h1 className="text-2xl font-bold mb-1">
                IPO Sniper AI
            </h1>
'@

$pageMatchCount = ([regex]::Matches($pageContent, [regex]::Escape($pageAnchor))).Count
Write-Host "Page h1 anchor match count: $pageMatchCount" -ForegroundColor Cyan
if ($pageMatchCount -ne 1) {
    Write-Host "ABORT: page h1 anchor mismatch." -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

$pageReplacement = @'
            <h1 className="text-2xl font-bold mb-1">
                Dashboard
            </h1>
'@

$pageContent = $pageContent.Replace($pageAnchor, $pageReplacement)

# --- Fix 3: same file - clean the Market Pulse mojibake (byte-level, same technique as before) ---
[System.IO.File]::WriteAllText((Resolve-Path $pagePath), $pageContent, (New-Object System.Text.UTF8Encoding($false)))

$bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $pagePath))
$latin1 = [System.Text.Encoding]::GetEncoding("ISO-8859-1")
$text = $latin1.GetString($bytes)
$pattern = "[\x80-\xFF]{1,15}"
$moji = [regex]::Matches($text, $pattern)
if ($moji.Count -gt 0) {
    $text = [regex]::Replace($text, $pattern, "-")
    $text = [regex]::Replace($text, "  +", " ")
    [System.IO.File]::WriteAllText((Resolve-Path $pagePath), $text, (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "PATCHED: Market Pulse mojibake cleaned ($($moji.Count) sequence(s))." -ForegroundColor Green
} else {
    Write-Host "No mojibake found in workstation/page.tsx." -ForegroundColor Yellow
}

# --- Final byte-level verify on page.tsx ---
$bytesCheck = [System.IO.File]::ReadAllBytes((Resolve-Path $pagePath))
$textCheck = $latin1.GetString($bytesCheck)
$remaining = [regex]::Matches($textCheck, "[\x80-\xFF]")
Write-Host "Remaining non-ASCII bytes in page.tsx: $($remaining.Count)"

Write-Host "`n=== TYPE CHECK ===" -ForegroundColor Cyan
npm run type-check
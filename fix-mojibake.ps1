Set-Location "$env:USERPROFILE\dev\IPO_Sniper_AI_v4"

function Fix-File($path, [string[]]$replacements) {
    $content = Get-Content -LiteralPath $path -Raw
    $changed = 0
    for ($i = 0; $i -lt $replacements.Length; $i += 2) {
        $old = $replacements[$i]
        $new = $replacements[$i + 1]
        $count = ([regex]::Matches($content, [regex]::Escape($old))).Count
        if ($count -gt 0) {
            $content = $content.Replace($old, $new)
            $changed += $count
            Write-Host "  Replaced $count occurrence(s) of corrupted sequence in $path" -ForegroundColor Green
        }
    }
    if ($changed -gt 0) {
        [System.IO.File]::WriteAllText(
            (Resolve-Path $path),
            $content,
            (New-Object System.Text.UTF8Encoding($false))
        )
    }
    return $changed
}

$batchPath = "components\hedge-fund\BatchScannerPanel.tsx"
$oppPath = "components\hedge-fund\CurrentOpportunitiesPanel.tsx"

Write-Host "=== Fixing BatchScannerPanel.tsx ===" -ForegroundColor Cyan
Fix-File $batchPath @(
    "Ã¢Å“â€¦ Execute", "Execute",
    "Ã¢ÂÂ¸ Skip", "Skip",
    "Ã¢ÂÂ³ Wait", "Wait",
    "Ã¢â‚¬â€", "-",
    "â€¦", "...",
    "â€"", "-"
)

Write-Host "`n=== Fixing CurrentOpportunitiesPanel.tsx ===" -ForegroundColor Cyan
Fix-File $oppPath @(
    "ÃƒÂ¢Ã¢â‚¬â€", "-"
)

Write-Host "`n=== VERIFY (should show ZERO remaining matches in both files) ===" -ForegroundColor Cyan
Get-ChildItem "components\hedge-fund" -Recurse -File -Include *.tsx | Select-String -Pattern "â€|Ã¢" | Select-Object Path, LineNumber, Line

Write-Host "`n=== TYPE CHECK ===" -ForegroundColor Cyan
npm run type-check
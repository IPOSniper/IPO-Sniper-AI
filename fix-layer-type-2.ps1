Set-Location "$env:USERPROFILE\dev\IPO_Sniper_AI_v4"

$path = "engine\quant\decisionMatrix\types.ts"
$content = Get-Content -LiteralPath $path -Raw

$oldUnion = '    | "universe"'
$matchCount = ([regex]::Matches($content, [regex]::Escape($oldUnion))).Count
if ($matchCount -ne 1) {
    Write-Host "ABORT: match count = $matchCount, expected 1." -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

$newUnion = "    | `"data_quality`"`r`n    | `"universe`""
$content = $content.Replace($oldUnion, $newUnion)

[System.IO.File]::WriteAllText(
    (Resolve-Path $path),
    $content,
    (New-Object System.Text.UTF8Encoding($false))
)

Write-Host "PATCHED: DecisionLayerName now includes data_quality." -ForegroundColor Green

Write-Host "`n=== VERIFY ===" -ForegroundColor Cyan
Select-String -LiteralPath $path -Pattern '"data_quality"' -Context 1,1

Write-Host "`n=== TYPE CHECK ===" -ForegroundColor Cyan
npm run type-check
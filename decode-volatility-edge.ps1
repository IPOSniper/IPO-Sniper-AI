Set-Location "$env:USERPROFILE\dev\IPO_Sniper_AI_v4"

$base64 = "CI_WILL_PROVIDE_THIS_SEPARATELY"

$bytes = [System.Convert]::FromBase64String($base64)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

[System.IO.File]::WriteAllText(
    (Resolve-Path "engine\quant\decisionMatrix" | Join-Path -ChildPath "volatilityEdge.ts"),
    $content,
    (New-Object System.Text.UTF8Encoding($false))
)

Write-Host "PATCHED: volatilityEdge.ts rebuilt from base64." -ForegroundColor Green

Write-Host "`n=== TYPE CHECK ===" -ForegroundColor Cyan
npm run type-check
Set-Location "$env:USERPROFILE\dev\IPO_Sniper_AI_v4"

Write-Host "=== 1. Full logBatchDecision() implementation ===" -ForegroundColor Cyan
Get-Content "app\(app)\hedge-fund\batch-scanner\actions.ts" | Select-String -Pattern "function logBatchDecision" -Context 0,60

Write-Host "`n=== 2. BatchScanner.evaluate() - real evaluation shape ===" -ForegroundColor Cyan
Get-Content "engine\quant\BatchScanner.ts" -ErrorAction SilentlyContinue | Select-String -Pattern "evaluate\(" -Context 5,40

Write-Host "`n=== 3. TradePlan type - real plan shape ===" -ForegroundColor Cyan
Get-ChildItem "engine" -Recurse -File -Include *.ts | Select-String -Pattern "interface TradePlan" -Context 0,30

Write-Host "`n=== 4. OptionContract type - real selectedContract shape ===" -ForegroundColor Cyan
Get-Content "engine\trading\providers\AlpacaOptionsProvider.ts" | Select-String -Pattern "interface OptionContract" -Context 0,20

Write-Host "`n=== 5. Confirm quant_decision_layers is reachable ===" -ForegroundColor Cyan
Get-Content "engine\quant\decisionMatrix\recordLayer.ts"

Write-Host "`n=== 6. Full DecisionLayerRecord type (reference) ===" -ForegroundColor Cyan
Get-Content "engine\quant\decisionMatrix\types.ts"

Read-Host "`nDone. Press Enter to close"
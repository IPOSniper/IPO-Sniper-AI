Set-Location "$env:USERPROFILE\dev\IPO_Sniper_AI_v4"

$path = "app\(app)\hedge-fund\batch-scanner\actions.ts"
$content = Get-Content -LiteralPath $path -Raw

if ($content -match "detectVolatilityEdge") {
    Write-Host "Already wired. No edit needed." -ForegroundColor Yellow
} else {
    $importAnchor = 'import { notEvaluated, type DecisionLayerRecord } from "@/engine/quant/decisionMatrix/types";'
    $importMatchCount = ([regex]::Matches($content, [regex]::Escape($importAnchor))).Count
    if ($importMatchCount -ne 1) {
        Write-Host "ABORT: import anchor match count = $importMatchCount, expected 1." -ForegroundColor Red
        Read-Host "Press Enter to close"
        exit 1
    }
    $newImport = $importAnchor + "`r`nimport { detectVolatilityEdge } from `"@/engine/quant/decisionMatrix/volatilityEdge`";"
    $content = $content.Replace($importAnchor, $newImport)

    $insertAnchor = 'notEvaluated(runId, ticker, "opportunity"),'
    $matchCount = ([regex]::Matches($content, [regex]::Escape($insertAnchor))).Count
    if ($matchCount -ne 1) {
        Write-Host "ABORT: insert anchor match count = $matchCount, expected 1." -ForegroundColor Red
        Read-Host "Press Enter to close"
        exit 1
    }

    $newBlock = @'
notEvaluated(runId, ticker, "opportunity"),
                await (async () => {
                    const volResult = await detectVolatilityEdge(ticker);
                    return {
                        runId, decisionId: null, ticker, layer: "volatility",
                        decision: volResult.decision, confidence: null,
                        status: volResult.status,
                        reasonCode: volResult.reasonCode,
                        evidenceRefs: {
                            realizedVolPercent: volResult.realizedVolPercent,
                            impliedVolPercent: volResult.impliedVolPercent,
                            gapPercent: volResult.gapPercent,
                        },
                        modelVersion: "v1",
                    } as DecisionLayerRecord;
                })(),
'@

    $content = $content.Replace($insertAnchor, $newBlock)

    [System.IO.File]::WriteAllText(
        (Resolve-Path $path),
        $content,
        (New-Object System.Text.UTF8Encoding($false))
    )

    Write-Host "PATCHED: volatility edge now recorded alongside directional edge." -ForegroundColor Green
}

Write-Host "`n=== VERIFY ===" -ForegroundColor Cyan
Select-String -LiteralPath $path -Pattern "detectVolatilityEdge|layer: `"volatility`"" -Context 1,1

Write-Host "`n=== TYPE CHECK ===" -ForegroundColor Cyan
npm run type-check
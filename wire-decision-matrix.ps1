Set-Location "$env:USERPROFILE\dev\IPO_Sniper_AI_v4"

$path = "app\(app)\hedge-fund\batch-scanner\actions.ts"
$content = Get-Content -LiteralPath $path -Raw

if ($content -match "recordDecisionLayers") {
    Write-Host "Already wired. No edit needed." -ForegroundColor Yellow
} else {
    $importAnchor = 'import { DEFAULT_AUTO_EXECUTION_GATES } from "@/engine/quant/BatchScanner";'
    $importMatchCount = ([regex]::Matches($content, [regex]::Escape($importAnchor))).Count
    if ($importMatchCount -ne 1) {
        Write-Host "ABORT: import anchor match count = $importMatchCount, expected 1." -ForegroundColor Red
        Read-Host "Press Enter to close"
        exit 1
    }
    $newImport = $importAnchor + "`r`nimport { recordDecisionLayers } from `"@/engine/quant/decisionMatrix/recordLayer`";`r`nimport { notEvaluated, type DecisionLayerRecord } from `"@/engine/quant/decisionMatrix/types`";"
    $content = $content.Replace($importAnchor, $newImport)

    $insertAnchor = @'
        if (error) {
            console.error("quant_trade_decisions insert failed:", error.message);
        }
'@

    $matchCount = ([regex]::Matches($content, [regex]::Escape($insertAnchor))).Count
    if ($matchCount -ne 1) {
        Write-Host "ABORT: insert anchor match count = $matchCount, expected 1." -ForegroundColor Red
        Read-Host "Press Enter to close"
        exit 1
    }

    $newBlock = @'
        if (error) {
            console.error("quant_trade_decisions insert failed:", error.message);
        }

        // Decision Matrix v1 -- observation only. Recording these
        // records has zero effect on the real gates above; this is
        // purely for future measurement, per the non-negotiable rule
        // in decisionMatrix/types.ts. Never blocks the real pipeline
        // (recordDecisionLayers is itself best-effort/non-throwing).
        try {
            const hasDirection = plan.direction !== "none";
            const layerRecords: DecisionLayerRecord[] = [
                {
                    runId, decisionId: null, ticker, layer: "universe",
                    decision: ticker, confidence: null, status: "PASS",
                    reasonCode: "EVALUATED", evidenceRefs: null, modelVersion: "v1",
                },
                notEvaluated(runId, ticker, "opportunity"),
                {
                    runId, decisionId: null, ticker, layer: "edge",
                    decision: plan.direction, confidence: plan.confidence,
                    status: hasDirection ? "PASS" : "FAIL",
                    reasonCode: hasDirection ? "DIRECTIONAL_EDGE_FORMED" : "NO_DIRECTIONAL_EDGE",
                    evidenceRefs: { agreement: plan.agreement, evidenceQuality: plan.evidenceQuality },
                    modelVersion: "v1",
                },
                hasDirection
                    ? {
                        runId, decisionId: null, ticker, layer: "strategy",
                        decision: "directional_options", confidence: plan.confidence,
                        status: "PASS", reasonCode: "ONLY_STRATEGY_IMPLEMENTED",
                        evidenceRefs: null, modelVersion: "v1",
                    }
                    : notEvaluated(runId, ticker, "strategy"),
                hasDirection
                    ? {
                        runId, decisionId: null, ticker, layer: "instrument",
                        decision: "option", confidence: null,
                        status: "PASS", reasonCode: "ONLY_INSTRUMENT_IMPLEMENTED",
                        evidenceRefs: null, modelVersion: "v1",
                    }
                    : notEvaluated(runId, ticker, "instrument"),
                {
                    runId, decisionId: null, ticker, layer: "contract",
                    decision: selectedContract?.symbol ?? null, confidence: null,
                    status: selectedContract ? "PASS" : (hasDirection ? "FAIL" : "SKIP"),
                    reasonCode: selectedContract ? "CONTRACT_MATCHED" : "NO_CONTRACT_MATCHED",
                    evidenceRefs: selectedContract ? { delta: selectedContract.delta, iv: selectedContract.impliedVolatility } : null,
                    modelVersion: "v1",
                },
                notEvaluated(runId, ticker, "timing"),
                {
                    runId, decisionId: null, ticker, layer: "risk",
                    decision: evaluation.outcome, confidence: null,
                    status: evaluation.outcome === "reject" ? "FAIL" : (evaluation.outcome === "skip" ? "SKIP" : "PASS"),
                    reasonCode: evaluation.outcome.toUpperCase(),
                    evidenceRefs: { reason: evaluation.reason },
                    modelVersion: "v1",
                },
                {
                    runId, decisionId: null, ticker, layer: "execution",
                    decision: executed ? "executed" : "not_executed", confidence: null,
                    status: executed ? "EXECUTE" : (evaluation.outcome === "skip" ? "SKIP" : "FAIL"),
                    reasonCode: executed ? "AUTONOMOUS_EXECUTE" : "NOT_EXECUTED",
                    evidenceRefs: null, modelVersion: "v1",
                },
            ];
            await recordDecisionLayers(layerRecords);
        } catch {
            // Decision Matrix recording must never affect the real pipeline.
        }
'@

    $content = $content.Replace($insertAnchor, $newBlock)

    [System.IO.File]::WriteAllText(
        (Resolve-Path $path),
        $content,
        (New-Object System.Text.UTF8Encoding($false))
    )

    Write-Host "PATCHED: Decision Matrix layers now recorded alongside quant_trade_decisions." -ForegroundColor Green
}

Write-Host "`n=== VERIFY ===" -ForegroundColor Cyan
Select-String -LiteralPath $path -Pattern "recordDecisionLayers|DecisionLayerRecord" -Context 1,1

Write-Host "`n=== TYPE CHECK ===" -ForegroundColor Cyan
npm run type-check

if ($LASTEXITCODE -ne 0) {
    Write-Host "ABORT: type-check failed. Reverting." -ForegroundColor Red
    git checkout -- "$path"
    Read-Host "Press Enter to close"
    exit 1
}

Write-Host "`n=== DEPLOY ===" -ForegroundColor Cyan
vercel --prod --token $env:VERCEL_TOKEN
git add "$path"
git commit -m "feat: Decision Matrix Phase 2 - wire real pipeline into layer records (observation only)"
git push origin HEAD:main

Read-Host "`nDone. Press Enter to close"
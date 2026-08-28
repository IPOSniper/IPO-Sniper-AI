Set-Location "$env:USERPROFILE\dev\IPO_Sniper_AI_v4"

$path = "app\(app)\hedge-fund\batch-scanner\actions.ts"
$content = Get-Content -LiteralPath $path -Raw

if ($content -match "checkDataFreshness") {
    Write-Host "Already wired. No edit needed." -ForegroundColor Yellow
} else {
    # 1. Add imports
    $importAnchor = 'import { detectVolatilityEdge } from "@/engine/quant/decisionMatrix/volatilityEdge";'
    $importMatchCount = ([regex]::Matches($content, [regex]::Escape($importAnchor))).Count
    if ($importMatchCount -ne 1) {
        Write-Host "ABORT: import anchor match count = $importMatchCount, expected 1." -ForegroundColor Red
        Read-Host "Press Enter to close"
        exit 1
    }
    $newImport = $importAnchor + "`r`nimport { checkDataFreshness } from `"@/engine/quant/decisionMatrix/dataQuality`";"
    $content = $content.Replace($importAnchor, $newImport)

    # 2. Insert data-quality lookup + gate right after ticker normalization,
    #    before the existing research/plan logic runs at all.
    $loopAnchor = @'
        for (const rawTicker of tickers) {
        const ticker = rawTicker.trim().toUpperCase();
        if (!ticker) continue;

        try {
'@

    $matchCount = ([regex]::Matches($content, [regex]::Escape($loopAnchor))).Count
    if ($matchCount -ne 1) {
        Write-Host "ABORT: loop anchor match count = $matchCount, expected 1." -ForegroundColor Red
        Read-Host "Press Enter to close"
        exit 1
    }

    $newLoopStart = @'
        for (const rawTicker of tickers) {
        const ticker = rawTicker.trim().toUpperCase();
        if (!ticker) continue;

        try {
            // Data Quality Gate v1 -- hard prerequisite, evaluated
            // before anything else. A manually-typed ticker with no
            // opportunities row has no real last_seen_at -- that's a
            // genuine DATA_UNAVAILABLE, not an error, per the same
            // honesty discipline used everywhere else in this app.
            const oppLookup = await supabase
                .from("opportunities")
                .select("last_seen_at")
                .eq("ticker", ticker)
                .order("last_seen_at", { ascending: false })
                .limit(1)
                .maybeSingle();
            const dataQuality = checkDataFreshness(oppLookup.data?.last_seen_at ?? null);

            await recordDecisionLayer({
                runId, decisionId: null, ticker, layer: "data_quality",
                decision: dataQuality.reasonCode, confidence: null,
                status: dataQuality.status === "SKIP" ? "SKIP" : "PASS",
                reasonCode: dataQuality.reasonCode,
                evidenceRefs: {
                    dataAgeMinutes: dataQuality.dataAgeMinutes,
                    thresholdMinutes: dataQuality.thresholdMinutes,
                    lastSeenAt: dataQuality.lastSeenAt,
                },
                modelVersion: "v1",
            });

            if (dataQuality.status === "SKIP") {
                for (const layer of ["universe", "opportunity", "edge", "volatility", "strategy", "instrument", "contract", "risk", "execution"] as const) {
                    await recordDecisionLayer(notEvaluated(runId, ticker, layer));
                }
                results.push({
                    ticker,
                    outcome: "unavailable",
                    reason: `Data quality gate: ${dataQuality.reasonCode} (age: ${dataQuality.dataAgeMinutes ?? "unknown"} min)`,
                    plan: null,
                    selectedContract: null,
                    suggestedQty: null,
                    executed: false,
                    orderStatus: null,
                });
                continue;
            }

'@

    $content = $content.Replace($loopAnchor, $newLoopStart)

    [System.IO.File]::WriteAllText(
        (Resolve-Path $path),
        $content,
        (New-Object System.Text.UTF8Encoding($false))
    )

    Write-Host "PATCHED: Data Quality Gate wired as first check in the batch loop." -ForegroundColor Green
}

Write-Host "`n=== VERIFY ===" -ForegroundColor Cyan
Select-String -LiteralPath $path -Pattern "checkDataFreshness|data_quality|DATA_QUALITY" -Context 1,1

Write-Host "`n=== TYPE CHECK ===" -ForegroundColor Cyan
npm run type-check
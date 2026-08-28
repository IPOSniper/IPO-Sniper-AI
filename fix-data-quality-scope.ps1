Set-Location "$env:USERPROFILE\dev\IPO_Sniper_AI_v4"

$path = "app\(app)\hedge-fund\batch-scanner\actions.ts"
$content = Get-Content -LiteralPath $path -Raw

# Fix 1: recordDecisionLayer (singular) missing from import
$oldImport = 'import { recordDecisionLayers } from "@/engine/quant/decisionMatrix/recordLayer";'
$importMatchCount = ([regex]::Matches($content, [regex]::Escape($oldImport))).Count
if ($importMatchCount -ne 1) {
    Write-Host "ABORT: recordLayer import match count = $importMatchCount, expected 1." -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}
$newImport = 'import { recordDecisionLayer, recordDecisionLayers } from "@/engine/quant/decisionMatrix/recordLayer";'
$content = $content.Replace($oldImport, $newImport)

# Fix 2: supabase not in scope -- construct it once per run, right after
# the existing setup block, same pattern as logBatchDecision().
$setupAnchor = @"
    const runId = crypto.randomUUID();
    const startedAt = new Date().toISOString();
    const strategist = new QuantStrategist();
    const scanner = new BatchScanner();
    const results: BatchRunResult[] = [];
"@

$matchCount = ([regex]::Matches($content, [regex]::Escape($setupAnchor))).Count
if ($matchCount -ne 1) {
    Write-Host "ABORT: setup anchor match count = $matchCount, expected 1." -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

$newSetup = @"
    const runId = crypto.randomUUID();
    const startedAt = new Date().toISOString();
    const strategist = new QuantStrategist();
    const scanner = new BatchScanner();
    const results: BatchRunResult[] = [];

    // Data Quality Gate v1 needs a Supabase client to look up each
    // ticker's real last_seen_at -- same client-selection pattern as
    // logBatchDecision() below: service role for the autonomous/cron
    // path, the real session client for a manual UI-triggered run.
    let dataQualitySupabase;
    if (overrideUserId) {
        dataQualitySupabase = createServiceRoleClient();
    } else {
        dataQualitySupabase = await createClient();
    }
"@

$content = $content.Replace($setupAnchor, $newSetup)

# Fix 3: the lookup inside the loop currently calls a bare "supabase" --
# point it at the one we just constructed above.
$oldLookup = 'const oppLookup = await supabase'
$lookupMatchCount = ([regex]::Matches($content, [regex]::Escape($oldLookup))).Count
if ($lookupMatchCount -ne 1) {
    Write-Host "ABORT: oppLookup anchor match count = $lookupMatchCount, expected 1." -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}
$content = $content.Replace($oldLookup, 'const oppLookup = await dataQualitySupabase')

[System.IO.File]::WriteAllText(
    (Resolve-Path $path),
    $content,
    (New-Object System.Text.UTF8Encoding($false))
)

Write-Host "PATCHED: recordDecisionLayer import fixed, dataQualitySupabase client added and wired." -ForegroundColor Green

Write-Host "`n=== VERIFY ===" -ForegroundColor Cyan
Select-String -LiteralPath $path -Pattern "dataQualitySupabase|recordDecisionLayer," -Context 1,1

Write-Host "`n=== TYPE CHECK ===" -ForegroundColor Cyan
npm run type-check
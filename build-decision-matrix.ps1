Set-Location "$env:USERPROFILE\dev\IPO_Sniper_AI_v4"

New-Item -ItemType Directory -Force -Path "engine\quant\decisionMatrix" | Out-Null

$typesContent = @'
/**
 * Quant Decision Matrix v1 -- scaffolding only.
 *
 * This is an orchestration/evidence layer, NOT a replacement for
 * existing safety gates. Recording a layer decision here has zero
 * effect on committee thresholds, risk gates, contract resolution,
 * or execution authority -- those remain governed entirely by the
 * existing pipeline (QuantStrategist, RiskEngine, BatchScanner)
 * until each capability is separately authorized.
 *
 * A layer that hasn't been built yet MUST record status
 * NOT_EVALUATED / ENGINE_NOT_ACTIVE -- never a fabricated
 * confidence or decision.
 */

export type DecisionLayerName =
    | "universe"
    | "opportunity"
    | "edge"
    | "strategy"
    | "instrument"
    | "contract"
    | "timing"
    | "risk"
    | "execution";

export type DecisionLayerStatus =
    | "NOT_EVALUATED"
    | "PASS"
    | "FAIL"
    | "SKIP"
    | "EXECUTE";

export interface DecisionLayerRecord {
    runId: string;
    decisionId: string | null;
    ticker: string;
    layer: DecisionLayerName;
    decision: string | null;
    confidence: number | null;
    status: DecisionLayerStatus;
    reasonCode: string | null;
    evidenceRefs: Record<string, unknown> | null;
    modelVersion: string;
}

/** Standard "not built yet" record -- never fake a real evaluation. */
export function notEvaluated(
    runId: string,
    ticker: string,
    layer: DecisionLayerName,
    decisionId: string | null = null
): DecisionLayerRecord {
    return {
        runId,
        decisionId,
        ticker,
        layer,
        decision: null,
        confidence: null,
        status: "NOT_EVALUATED",
        reasonCode: "ENGINE_NOT_ACTIVE",
        evidenceRefs: null,
        modelVersion: "v1",
    };
}
'@

[System.IO.File]::WriteAllText(
    (Resolve-Path "engine\quant\decisionMatrix" | Join-Path -ChildPath "types.ts"),
    $typesContent,
    (New-Object System.Text.UTF8Encoding($false))
)

$recorderContent = @'
"use server";

import { createServiceRoleClient } from "@/lib/supabase/serviceRole";
import type { DecisionLayerRecord } from "./types";

/**
 * Best-effort persistence for a single Decision Matrix layer record.
 * Never throws -- a logging failure here must not block the real
 * trading pipeline. Mirrors the discipline already used for
 * paper_trade_orders audit logging elsewhere in this codebase.
 */
export async function recordDecisionLayer(record: DecisionLayerRecord): Promise<void> {
    try {
        const supabase = createServiceRoleClient();
        await supabase.from("quant_decision_layers").insert({
            run_id: record.runId,
            decision_id: record.decisionId,
            ticker: record.ticker,
            layer: record.layer,
            decision: record.decision,
            confidence: record.confidence,
            status: record.status,
            reason_code: record.reasonCode,
            evidence_refs: record.evidenceRefs,
            model_version: record.modelVersion,
        });
    } catch {
        // Best-effort only -- see docstring.
    }
}

export async function recordDecisionLayers(records: DecisionLayerRecord[]): Promise<void> {
    for (const record of records) {
        await recordDecisionLayer(record);
    }
}
'@

[System.IO.File]::WriteAllText(
    (Resolve-Path "engine\quant\decisionMatrix" | Join-Path -ChildPath "recordLayer.ts"),
    $recorderContent,
    (New-Object System.Text.UTF8Encoding($false))
)

Write-Host "PATCHED: Decision Matrix v1 scaffolding created." -ForegroundColor Green

Write-Host "`n=== VERIFY ===" -ForegroundColor Cyan
Get-ChildItem "engine\quant\decisionMatrix" | Select-Object Name, Length

Write-Host "`n=== TYPE CHECK ===" -ForegroundColor Cyan
npm run type-check

if ($LASTEXITCODE -ne 0) {
    Write-Host "ABORT: type-check failed." -ForegroundColor Red
    Read-Host "Press Enter to close"
    exit 1
}

Write-Host "`n=== AUDIT: where does the real pipeline write quant_trade_decisions? ===" -ForegroundColor Cyan
Get-ChildItem "engine","app" -Recurse -File -Include *.ts | Select-String -SimpleMatch -Pattern 'from("quant_trade_decisions")' | Select-Object Path, LineNumber

Write-Host "`n=== DEPLOY ===" -ForegroundColor Cyan
vercel --prod --token $env:VERCEL_TOKEN
git add "engine\quant\decisionMatrix"
git commit -m "feat: Decision Matrix v1 scaffolding (types + recorder, not yet wired)"
git push origin HEAD:main

Read-Host "`nDone. Press Enter to close"
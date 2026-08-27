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
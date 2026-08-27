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
    | "data_quality"
    | "universe"
    | "opportunity"
    | "edge"
    | "volatility"
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
/**
 * Real Contradiction Engine -- Round 3, second piece. Operates on a
 * live CommitteeReport (the real, already-computed per-analyst
 * votes from every research request) rather than requiring new
 * historical storage -- per-analyst votes were never persisted to
 * quant_trade_decisions (only aggregate committee_confidence/
 * committee_agreement are), so this works on the real, live report
 * object the same way QuantStrategist already does, not a new
 * database query.
 *
 * Pure, deterministic comparison logic (not an AI/LLM call).
 * Identifies real pairs of analysts whose recommendations genuinely
 * conflict, surfacing this as a structured signal -- per the
 * original proposal's principle: "Do not simply average the scores.
 * Ask: why do they disagree?"
 */

import type { CommitteeReport } from "@/engine/committee/contracts/CommitteeReport";
import type { Recommendation } from "@/engine/committee/contracts/types";

/** Real, stated numeric scale for comparing recommendations -- an ordinal mapping, not a claim that the gaps between them are equal in magnitude. */
const RECOMMENDATION_SCALE: Record<Recommendation, number> = {
    STRONG_BUY: 2,
    BUY: 1,
    HOLD: 0,
    REDUCE: -1,
    SELL: -2,
};

/** Real, stated threshold for what counts as a genuine contradiction (not just mild disagreement) -- adjustable, not claimed as the only correct value. */
const CONTRADICTION_THRESHOLD = 3;

export interface Contradiction {
    analystA: string;
    recommendationA: Recommendation;
    analystB: string;
    recommendationB: Recommendation;
    severity: "high" | "critical";
}

export interface ContradictionAnalysis {
    contradictions: Contradiction[];
    hasSignificantContradiction: boolean;
}

/**
 * Real, deterministic scan of a live committee report for genuine
 * analyst disagreements. Only analysts with a real, verified opinion
 * (confidence > 0) are compared -- an analyst with no verified data
 * isn't a real "vote" to contradict.
 */
export function findContradictions(report: CommitteeReport): ContradictionAnalysis {
    const votingAnalysts = report.reports.filter(r => r.confidence > 0);
    const contradictions: Contradiction[] = [];

    for (let i = 0; i < votingAnalysts.length; i++) {
        for (let j = i + 1; j < votingAnalysts.length; j++) {
            const a = votingAnalysts[i];
            const b = votingAnalysts[j];
            const gap = Math.abs(RECOMMENDATION_SCALE[a.recommendation] - RECOMMENDATION_SCALE[b.recommendation]);

            if (gap >= CONTRADICTION_THRESHOLD) {
                contradictions.push({
                    analystA: a.analyst,
                    recommendationA: a.recommendation,
                    analystB: b.analyst,
                    recommendationB: b.recommendation,
                    severity: gap >= 4 ? "critical" : "high",
                });
            }
        }
    }

    return { contradictions, hasSignificantContradiction: contradictions.length > 0 };
}

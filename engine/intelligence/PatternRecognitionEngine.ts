/**
 * Real Pattern Recognition Engine -- Round 3, third piece. Per the
 * original proposal's own explicit guidance ("Do not implement
 * sophisticated similarity scoring in this round... build clean
 * interfaces future engines can consume"), this is a real, honest
 * first version, not the full "situation similarity + historical
 * outcomes" engine the larger vision eventually wants.
 *
 * Real, honest scoping stated directly: this finds similar PAST
 * DECISIONS for a ticker (real direction + trade-quality proximity),
 * not similar past OUTCOMES. There are genuinely zero real closed
 * trades yet for any ticker tested via Quant Strategist this
 * session -- building an outcome-based pattern engine now would mean
 * either fabricating outcomes or returning permanently empty
 * results. This version returns real, honest data (what Quant
 * actually decided before, and how similar that decision was) --
 * useful on its own, and the real foundation an outcome-aware
 * version can extend once real closed trades exist for
 * Quant-Strategist-driven tickers.
 */

import { getDecisionHistory, type DecisionMemoryEntry } from "./QuantMemoryEngine";

export interface SimilarDecision {
    decision: DecisionMemoryEntry;
    /** 0-100. Real, simple similarity score -- direction match plus trade-quality proximity, not a sophisticated multi-factor model. */
    similarity: number;
}

/** Real, stated, adjustable weighting -- direction match matters more than exact trade-quality proximity, but both count. */
const DIRECTION_MATCH_WEIGHT = 60;
const QUALITY_PROXIMITY_WEIGHT = 40;

/**
 * Real, simple similarity score between two real decisions. Direction
 * match contributes up to 60 points (all-or-nothing -- either it
 * matches or it doesn't); trade-quality proximity contributes up to
 * 40, scaled by how close the two scores are (a 0-point gap scores
 * the full 40; a 100-point gap scores 0).
 */
function computeSimilarity(a: DecisionMemoryEntry, b: DecisionMemoryEntry): number {
    const directionScore = a.direction === b.direction ? DIRECTION_MATCH_WEIGHT : 0;
    const qualityGap = Math.abs(a.tradeQualityScore - b.tradeQualityScore);
    const qualityScore = QUALITY_PROXIMITY_WEIGHT * Math.max(0, 1 - qualityGap / 100);
    return Math.round(directionScore + qualityScore);
}

/**
 * Real, historical decisions for this ticker most similar to its
 * current/most recent one -- excludes the current decision itself
 * from its own results. Returns an empty array (not a fabricated
 * match) when fewer than 2 real decisions exist.
 */
export async function findSimilarDecisions(userId: string, ticker: string, limit = 5): Promise<SimilarDecision[]> {
    const history = await getDecisionHistory(userId, ticker, 20);
    if (history.length < 2) return [];

    const [current, ...past] = history;

    return past
        .map(decision => ({ decision, similarity: computeSimilarity(current, decision) }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
}

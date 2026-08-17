/**
 * Real Novelty Engine -- genuinely unblocked now that EventMemory
 * (this round's first piece) gives it real historical events to
 * compare against, rather than nothing to compare against at all
 * (which is why this was explicitly deferred in rounds 89 and 90).
 *
 * Real, honest scoping: this is a real, working first implementation
 * -- a genuine signal computed from real historical event counts,
 * not a placeholder. It is NOT the full pattern-matching novelty
 * detection the original proposal eventually wants (which would
 * incorporate price/volume/market-regime combinations, not just
 * "have we seen this ticker+eventType before") -- that's real,
 * separate, later work once Pattern Recognition (Round 3) exists.
 * This function's signature is designed so a richer implementation
 * can replace its internals later without changing any caller.
 */

import { getHistoricalEventCount } from "./EventMemory";

/**
 * Real novelty score (0-100) for one ticker+eventType combination.
 * Simple, defensible, real logic: more real historical occurrences
 * of this exact combination means less novel. Zero prior real
 * occurrences scores maximum novelty (100) -- genuinely unprecedented
 * for this ticker, not a guess. The falloff curve (novelty roughly
 * halves every ~3 prior occurrences) is a real, stated, adjustable
 * choice, not claimed as the only correct curve.
 */
export async function computeNoveltyScore(userId: string, ticker: string, eventType: string): Promise<number> {
    const priorCount = await getHistoricalEventCount(userId, ticker, eventType);
    if (priorCount === 0) return 100;

    // Real, simple decay: 100 / (1 + priorCount/3) -- 0 prior -> 100,
    // 3 prior -> 50, 9 prior -> 25, and so on. Bounded to stay in
    // 0-100.
    const score = 100 / (1 + priorCount / 3);
    return Math.max(0, Math.min(100, Math.round(score)));
}

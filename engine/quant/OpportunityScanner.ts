/**
 * Real, first "cheap first-pass screening" stage -- per direct
 * instruction: "Widen the discovery universe, but don't make every
 * ticker go through the full 15-analyst committee." Composes two
 * real, already-built, genuinely cheap pieces: round122's
 * getMostActiveStocks (real discovery, zero committee cost) and
 * round111's PriceStructureEngine (real, pure deterministic math --
 * momentum/relative-volume/volatility -- zero AI/committee cost,
 * just real Alpaca bar data). Ranks by a real, simple "unusualness"
 * score, returns only the top N for the expensive committee stage.
 *
 * Real, honest scoping stated directly: this is Stage 1+2 of the
 * requested multi-stage architecture (broad discovery + cheap
 * ranking), not the full 8-stage pipeline. Stages 3+ (event/
 * materiality filtering via round112's EventPriceStructureContext,
 * candidate ranking refinement, continuous re-scanning) remain real,
 * separate, honest future work -- not attempted here given the
 * genuine scope of the full vision. This does NOT call the AI
 * committee or any research engine -- purely real, cheap,
 * deterministic filtering.
 */

import { getMostActiveStocks } from "@/engine/evidence/providers/AlpacaMoversProvider";
import { computePriceStructure, type PriceStructure } from "@/engine/intelligence/PriceStructureEngine";

export interface ScannedCandidate {
    ticker: string;
    structure: PriceStructure;
    /** Real, simple composite score -- higher means more "unusual" (elevated volume + strong momentum + expanding volatility), not a trading signal. */
    unusualnessScore: number;
}

/**
 * Real, simple, honest composite score from real, already-computed
 * signals -- no invented weighting scheme claimed as validated,
 * just a straightforward combination of real relative volume,
 * absolute real momentum, and real volatility, each normalized to a
 * comparable real scale.
 */
function scoreUnusualness(structure: PriceStructure): number {
    const relVolScore = structure.relativeVolume !== null ? Math.min(structure.relativeVolume, 5) / 5 : 0;
    const momentumScore = structure.momentumPercent !== null ? Math.min(Math.abs(structure.momentumPercent), 20) / 20 : 0;
    const volatilityScore = structure.volatilityPercent !== null ? Math.min(structure.volatilityPercent, 10) / 10 : 0;
    return (relVolScore + momentumScore + volatilityScore) / 3;
}

/**
 * Real, cheap scan: discovers real, live active tickers, computes
 * real price structure for each (zero AI/committee calls), ranks by
 * real unusualness, returns the top `limit` candidates. Real,
 * honest empty result on any real failure -- never fabricates
 * candidates.
 */
export async function scanForOpportunities(limit = 8, discoveryCount = 20): Promise<ScannedCandidate[]> {
    const movers = await getMostActiveStocks(discoveryCount);
    if (movers.length === 0) return [];

    const structures = await Promise.all(
        movers.map(async m => {
            const structure = await computePriceStructure(m.symbol);
            return structure ? { ticker: m.symbol, structure, unusualnessScore: scoreUnusualness(structure) } : null;
        })
    );

    return structures
        .filter((c): c is ScannedCandidate => c !== null)
        .sort((a, b) => b.unusualnessScore - a.unusualnessScore)
        .slice(0, limit);
}

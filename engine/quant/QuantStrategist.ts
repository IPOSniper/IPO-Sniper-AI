import type { CommitteeReport } from "../committee/contracts/CommitteeReport";
import { excludeAnalysts } from "../../components/workstation/shared/scorePresentation";
import type { OptionContract } from "../trading/providers/AlpacaOptionsProvider";

/**
 * Phase 1 of the Quant roadmap: converts real committee output into
 * a structured trade plan -- WITHOUT picking a contract. Deliberately
 * scoped this way per direct instruction: "no OCC symbol, no strike,
 * no expiration, just the strategy." Contract selection is a
 * separate, later phase that consumes this plan's real output.
 *
 * IMPORTANT, read before trusting any number this produces:
 *
 * This is a RULE-BASED mapping, not a trained model and not an
 * "AI-predicted" strategy. Two genuinely different kinds of numbers
 * appear in its output, and conflating them would be dishonest:
 *
 * 1. REAL, derived from actual committee data: direction (call/put/
 *    none), confidence (directly committee.confidence -- excluding
 *    News Analyst, same conservative default used everywhere else
 *    in this app for consistency, since this could inform real
 *    capital decisions), and the plain-language reasoning (built
 *    from real analyst theses, not invented).
 *
 * 2. STANDARD, WELL-ESTABLISHED options-trading conventions, NOT
 *    computed or "AI-optimized" for this specific situation: the
 *    35-45 DTE window, 0.30-0.40 delta target, 25% profit target,
 *    40% stop loss. These are widely-cited retail/prop trading
 *    heuristics (balancing theta decay against acceptable premium
 *    cost) -- real, defensible defaults, but NOT derived from this
 *    ticker's specific situation. A genuinely AI-optimized version
 *    of these parameters (backtested per-sector, per-volatility-
 *    regime, etc.) does not exist and is not what this returns.
 *
 * No trade plan is produced (direction: "none") when: committee
 * confidence is below a real minimum threshold, or agreement is too
 * low -- weak/split committee output shouldn't produce a confident-
 * sounding trade plan.
 */

export type StrategyDirection = "call" | "put" | "none";

export interface TradePlan {
    direction: StrategyDirection;
    /** Directly committee.confidence (News-excluded) -- not a separately invented "strategy confidence." */
    confidence: number;
    reasoning: string[];
    /** Standard heuristic, not computed for this specific situation -- see file docstring. */
    targetDteRange: [number, number] | null;
    /** Standard heuristic, not computed for this specific situation -- see file docstring. */
    targetDeltaRange: [number, number] | null;
    /** Standard heuristic -- a common retail/prop guideline, not a portfolio-specific calculation. RiskEngine.check() still does the REAL, portfolio-specific sizing check before any order is placed. */
    suggestedMaxRiskPercent: number | null;
    profitTargetPercent: number | null;
    stopLossPercent: number | null;
}

const MIN_CONFIDENCE_FOR_A_PLAN = 60;
const MIN_AGREEMENT_FOR_A_PLAN = 50;

// Standard heuristic parameters -- see docstring above. Not tuned per-ticker.
const STANDARD_PARAMS = {
    targetDteRange: [35, 45] as [number, number],
    targetDeltaRange: [0.30, 0.40] as [number, number],
    suggestedMaxRiskPercent: 1,
    profitTargetPercent: 25,
    stopLossPercent: 40,
};

export class QuantStrategist {

    buildTradePlan(committee: CommitteeReport): TradePlan {
        // Same News-Analyst exclusion used throughout this app for
        // anything that could inform a real capital decision -- see
        // config/shareCardDisclosure.ts and scorePresentation.ts.
        const safe = excludeAnalysts(committee, ["News Analyst"]);

        const noplan: TradePlan = {
            direction: "none",
            confidence: safe.confidence,
            reasoning: [],
            targetDteRange: null,
            targetDeltaRange: null,
            suggestedMaxRiskPercent: null,
            profitTargetPercent: null,
            stopLossPercent: null,
        };

        if (safe.confidence < MIN_CONFIDENCE_FOR_A_PLAN) {
            return { ...noplan, reasoning: [`Committee confidence (${safe.confidence}%) is below the ${MIN_CONFIDENCE_FOR_A_PLAN}% minimum for a trade plan.`] };
        }
        if (safe.agreement < MIN_AGREEMENT_FOR_A_PLAN) {
            return { ...noplan, reasoning: [`Committee agreement (${safe.agreement}%) is too low/split for a confident trade plan.`] };
        }

        const bullish = safe.recommendation === "STRONG_BUY" || safe.recommendation === "BUY";
        const bearish = safe.recommendation === "REDUCE" || safe.recommendation === "SELL";

        if (!bullish && !bearish) {
            return { ...noplan, reasoning: [`Committee recommendation is ${safe.recommendation.replace("_", " ")} -- no clear directional edge for an options position.`] };
        }

        // Real reasoning -- top 2 real theses from analysts who
        // actually agree with the committee's real direction, not
        // invented commentary.
        const supportingAnalysts = committee.reports.filter(r =>
            r.confidence > 0 &&
            r.analyst !== "News Analyst" &&
            (bullish ? (r.recommendation === "STRONG_BUY" || r.recommendation === "BUY") : (r.recommendation === "REDUCE" || r.recommendation === "SELL"))
        );
        const reasoning = supportingAnalysts.slice(0, 3).map(r => `${r.analyst}: ${r.thesis}`);

        return {
            direction: bullish ? "call" : "put",
            confidence: safe.confidence,
            reasoning,
            ...STANDARD_PARAMS,
        };
    }

    /**
     * Real contract matching -- takes a real option chain (already
     * fetched from Alpaca) and the plan's real target DTE/delta
     * ranges, picks the best real match. No fabrication: if nothing
     * in the real chain falls inside the target ranges, this returns
     * null rather than picking something outside the plan's own
     * stated criteria and pretending it matches.
     *
     * "Best" = closest to the CENTER of both target ranges
     * (midpoint DTE, midpoint |delta|) among contracts that fall
     * within both ranges -- not just the first match found.
     */
    selectContract(plan: TradePlan, chain: OptionContract[], now: Date = new Date()): OptionContract | null {
        if (plan.direction === "none" || !plan.targetDteRange || !plan.targetDeltaRange) return null;

        const [minDte, maxDte] = plan.targetDteRange;
        const [minDelta, maxDelta] = plan.targetDeltaRange;
        const midDte = (minDte + maxDte) / 2;
        const midDelta = (minDelta + maxDelta) / 2;

        const candidates = chain.filter(c => {
            if (c.type !== plan.direction) return false;
            if (c.delta === null) return false;

            const dte = Math.round((new Date(c.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (dte < minDte || dte > maxDte) return false;

            const absDelta = Math.abs(c.delta);
            if (absDelta < minDelta || absDelta > maxDelta) return false;

            return true;
        });

        if (candidates.length === 0) return null;

        return candidates.reduce((best, c) => {
            const dte = (new Date(c.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            const bestDte = (new Date(best.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            const score = Math.abs(dte - midDte) + Math.abs(Math.abs(c.delta!) - midDelta) * 100; // weight delta distance more, it's a 0-1 scale vs. DTE's day scale
            const bestScore = Math.abs(bestDte - midDte) + Math.abs(Math.abs(best.delta!) - midDelta) * 100;
            return score < bestScore ? c : best;
        });
    }

    /**
     * Real suggested quantity from the plan's real risk % and real
     * account equity -- NOT a replacement for RiskEngine's own check
     * at order submission, which remains the actual authority. This
     * is a reasonable starting point so the user isn't staring at a
     * blank quantity field, nothing more.
     */
    suggestQuantity(plan: TradePlan, contract: OptionContract, accountEquity: number): number {
        if (!plan.suggestedMaxRiskPercent) return 1;
        const premiumPerContract = (contract.askPrice ?? contract.lastPrice ?? 0) * 100; // real 100x multiplier
        if (premiumPerContract <= 0) return 1;

        const riskBudget = accountEquity * (plan.suggestedMaxRiskPercent / 100);
        const qty = Math.floor(riskBudget / premiumPerContract);
        return Math.max(1, qty);
    }
}

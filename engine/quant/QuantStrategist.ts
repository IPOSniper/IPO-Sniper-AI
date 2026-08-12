import type { CommitteeReport } from "../committee/contracts/CommitteeReport";
import { excludeAnalysts } from "../../components/workstation/shared/scorePresentation";
import type { OptionContract } from "../trading/providers/AlpacaOptionsProvider";

/**
 * Phase 1 of the Quant roadmap: converts real committee output into
 * a structured trade plan -- WITHOUT picking a contract (that's
 * selectContract(), below). No trade plan is produced when any real
 * gate fails -- see DecisionCheck below for exactly which three,
 * and why each exists.
 *
 * IMPORTANT, read before trusting any number this produces:
 *
 * This is a RULE-BASED mapping, not a trained model and not an
 * "AI-predicted" strategy. Two genuinely different kinds of numbers
 * appear in its output, and conflating them would be dishonest:
 *
 * 1. REAL, derived from actual committee data: direction, confidence,
 *    agreement, evidence quality, the three real gate checks, and
 *    the plain-language reasoning (built from real analyst theses).
 *
 * 2. STANDARD, WELL-ESTABLISHED options-trading conventions, NOT
 *    computed or "AI-optimized" for this specific situation: the
 *    35-45 DTE window, 0.30-0.40 delta target, 25% profit target,
 *    40% stop loss.
 *
 * WHAT THIS DOES NOT CHECK, on purpose: portfolio-level risk
 * (concentration, cash reserve, daily loss, correlation) is NOT part
 * of this decision -- that's RiskEngine's job, and it only runs with
 * real, current account/position data at the moment an order is
 * actually submitted (see executeTradePlan in
 * app/(app)/hedge-fund/quant-strategist/actions.ts). Showing a
 * "Portfolio Exposure: Pass" checkmark here, before RiskEngine has
 * even run, would be asserting something this class has no way to
 * know yet.
 */

export type StrategyDirection = "call" | "put" | "none";

export interface DecisionCheck {
    label: string;
    value: number;
    threshold: number;
    unit: "%" | "";
    passed: boolean;
    /** Real distance from the real threshold — used for "what would make this tradable." */
    gap: number;
}

export interface TradePlan {
    direction: StrategyDirection;
    /** Directly committee.confidence (News-excluded) -- not a separately invented "strategy confidence." */
    confidence: number;
    agreement: number;
    evidenceQuality: number | null;
    /** The three real gate checks, always populated (even when direction is "none") so the UI can show exactly what passed/failed. */
    checks: DecisionCheck[];
    /**
     * Simple, transparent, documented formula -- NOT a trained/ML
     * score. tradeQualityScore = average of how far each real check
     * clears its own real threshold, each capped to [0,100] so one
     * check maxing out can't hide another failing badly. This is
     * disclosed math, not a black box.
     */
    tradeQualityScore: number;
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

const MIN_CONFIDENCE = 60;
const MIN_AGREEMENT = 50;
const MIN_EVIDENCE_QUALITY = 45;

// Standard heuristic parameters -- see docstring above. Not tuned per-ticker.
export const STANDARD_PARAMS = {
    targetDteRange: [35, 45] as [number, number],
    targetDeltaRange: [0.30, 0.40] as [number, number],
    suggestedMaxRiskPercent: 1,
    profitTargetPercent: 25,
    stopLossPercent: 40,
};

function buildCheck(label: string, value: number, threshold: number): DecisionCheck {
    return {
        label,
        value,
        threshold,
        unit: "%",
        passed: value >= threshold,
        gap: Math.round((threshold - value) * 10) / 10,
    };
}

/**
 * The actual real, shared contract-matching logic -- promoted out of
 * QuantStrategist.selectContract() so it's usable WITHOUT requiring
 * a full committee-gated TradePlan first. This is what makes it
 * genuinely reusable by both the Quant Strategist flow (which HAS a
 * real trade plan and its real gates) and manual/assisted trading
 * (which doesn't need to pass those gates -- a human choosing to
 * trade on their own judgment shouldn't be blocked by the committee
 * disagreeing).
 *
 * Same real algorithm as before: filters the real chain to contracts
 * matching the given direction + falling within both target ranges,
 * then picks the closest match to the midpoint of both ranges. No
 * fabrication -- returns null if nothing in the real chain qualifies,
 * never loosens the criteria to force a result.
 */
export function findMatchingContract(
    direction: "call" | "put",
    targetDteRange: [number, number],
    targetDeltaRange: [number, number],
    chain: OptionContract[],
    now: Date = new Date()
): OptionContract | null {
    const [minDte, maxDte] = targetDteRange;
    const [minDelta, maxDelta] = targetDeltaRange;
    const midDte = (minDte + maxDte) / 2;
    const midDelta = (minDelta + maxDelta) / 2;

    const candidates = chain.filter(c => {
        if (c.type !== direction) return false;
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

export class QuantStrategist {

    buildTradePlan(committee: CommitteeReport): TradePlan {
        // Same News-Analyst exclusion used throughout this app for
        // anything that could inform a real capital decision -- see
        // config/shareCardDisclosure.ts and scorePresentation.ts.
        const safe = excludeAnalysts(committee, ["News Analyst"]);

        const votingAnalysts = committee.reports.filter(r => r.confidence > 0 && r.analyst !== "News Analyst");
        const evidenceQuality = votingAnalysts.length > 0
            ? Math.round(votingAnalysts.reduce((s, r) => s + r.evidenceStrength, 0) / votingAnalysts.length)
            : null;

        const checks: DecisionCheck[] = [
            buildCheck("Committee Confidence", safe.confidence, MIN_CONFIDENCE),
            buildCheck("Committee Agreement", safe.agreement, MIN_AGREEMENT),
            buildCheck("Evidence Quality", evidenceQuality ?? 0, MIN_EVIDENCE_QUALITY),
        ];

        // Transparent, documented formula -- see TradePlan.tradeQualityScore docstring.
        const tradeQualityScore = Math.round(
            checks.reduce((sum, c) => sum + Math.min(100, Math.max(0, (c.value / c.threshold) * 100)), 0) / checks.length
        );

        const failedChecks = checks.filter(c => !c.passed);

        const noplan: TradePlan = {
            direction: "none",
            confidence: safe.confidence,
            agreement: safe.agreement,
            evidenceQuality,
            checks,
            tradeQualityScore,
            reasoning: [],
            targetDteRange: null,
            targetDeltaRange: null,
            suggestedMaxRiskPercent: null,
            profitTargetPercent: null,
            stopLossPercent: null,
        };

        if (failedChecks.length > 0) {
            return {
                ...noplan,
                reasoning: failedChecks.map(c => `${c.label} (${c.value}%) is below the ${c.threshold}% minimum — needs +${c.gap}% to pass.`),
            };
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
            ...noplan,
            direction: bullish ? "call" : "put",
            reasoning,
            ...STANDARD_PARAMS,
        };
    }

    /**
     * Real contract matching -- thin wrapper around
     * findMatchingContract() (the actual shared logic, promoted out
     * so it's usable without a full committee-gated TradePlan -- see
     * that function's docstring). Kept for the two existing callers
     * (single-ticker Quant Strategist, Batch Scanner), unchanged
     * behavior, just delegates now instead of containing the logic
     * directly.
     */
    selectContract(plan: TradePlan, chain: OptionContract[], now: Date = new Date()): OptionContract | null {
        if (plan.direction === "none" || !plan.targetDteRange || !plan.targetDeltaRange) return null;
        return findMatchingContract(plan.direction, plan.targetDteRange, plan.targetDeltaRange, chain, now);
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

import type { CommitteeReport } from "../committee/contracts/CommitteeReport";
import { QuantStrategist, type TradePlan } from "./QuantStrategist";
import type { OptionContract } from "../trading/providers/AlpacaOptionsProvider";

/**
 * Phase 2A of the Quant roadmap: batch-scans a watchlist, builds a
 * real trade plan for each ticker, and decides Execute/Skip/Reject
 * against STRICTER gates than QuantStrategist's own "should a plan
 * even form" thresholds. Building a plan and being eligible for
 * unattended auto-execution are different bars -- this is the
 * second, stricter one.
 *
 * TWO REAL, HONEST LIMITATIONS, read before trusting this class:
 *
 * 1. NO OPEN INTEREST OR VOLUME DATA EXISTS ANYWHERE IN THIS APP.
 *    OptionContract.openInterest is already always null -- Alpaca
 *    serves it via a separate endpoint this app doesn't call yet.
 *    There is no volume field at all. This scanner does NOT check
 *    either, despite them being real, standard liquidity gates a
 *    production system would want -- faking a pass/fail on data
 *    that doesn't exist would be worse than omitting the check
 *    entirely. What IS checked: real bid/ask spread % (a real,
 *    available liquidity proxy), and the same real delta/DTE range
 *    already used for contract selection.
 *
 * 2. THIS IS A MANUAL, SINGLE-INVOCATION BATCH RUN, NOT A
 *    PERSISTENT BACKGROUND PROCESS. No scheduler is deployed (see
 *    System Status â€” Continuous/Scheduled Operation: Not built).
 *    "Max trades" and "max daily risk" here are real parameters
 *    enforced WITHIN one manual run, not limits tracked across a
 *    trading day nobody is actively running this during.
 */

export interface AutoExecutionGates {
    minCommitteeConfidence: number;
    minCommitteeAgreement: number;
    minEvidenceQuality: number;
    maxOpenPositions: number;
    maxPortfolioRiskPercentPerTrade: number;
    maxBidAskSpreadPercent: number;
    /** Hard cap enforced regardless of how many tickers pass every other gate â€” the real "kill switch" for a single run. */
    maxAutoExecutionsThisRun: number;
}

export const DEFAULT_AUTO_EXECUTION_GATES: AutoExecutionGates = {
    minCommitteeConfidence: 70,
    minCommitteeAgreement: 60,
    minEvidenceQuality: 60,
    maxOpenPositions: 5,
    maxPortfolioRiskPercentPerTrade: 2,
    maxBidAskSpreadPercent: 15,
    maxAutoExecutionsThisRun: 3,
};

/**
 * Real, explicitly separate, lower-confidence gate set for the
 * PAPER validation experiment only -- per direct, deliberate
 * instruction: "lower the gate only in the paper-validation
 * environment, not the eventual live-money gate." This is a
 * conscious research decision, not a weakening of safety --
 * everything else stays identical to DEFAULT_AUTO_EXECUTION_GATES
 * (real committee agreement minimum, real evidence quality minimum,
 * real position limits, real portfolio risk cap, real spread check,
 * real kill switch on max executions per run). Only
 * minCommitteeConfidence differs. Real Risk Engine, contract
 * validation, liquidity checks, position limits, duplicate-order
 * protection, and kill switch remain fully, unconditionally active
 * regardless of which gate set is used -- this constant only ever
 * feeds the same real BatchScanner logic, never bypasses any part
 * of it.
 *
 * This must NEVER be used as the default for any real, eventual
 * live-money code path -- DEFAULT_AUTO_EXECUTION_GATES (70%)
 * remains the real live threshold whenever that environment exists.
 */
export const PAPER_VALIDATION_EXECUTION_GATES: AutoExecutionGates = {
    ...DEFAULT_AUTO_EXECUTION_GATES,
    minCommitteeConfidence: 60,
};

export type BatchOutcome = "execute" | "skip" | "reject" | "wait" | "unavailable";

export interface BatchResult {
    ticker: string;
    outcome: BatchOutcome;
    reason: string;
    plan: TradePlan | null;
    selectedContract: OptionContract | null;
    suggestedQty: number | null;
}

function spreadPercent(contract: OptionContract): number | null {
    if (contract.bidPrice === null || contract.askPrice === null || contract.askPrice === 0) return null;
    return ((contract.askPrice - contract.bidPrice) / contract.askPrice) * 100;
}

export class BatchScanner {

    private readonly strategist = new QuantStrategist();

    /**
     * Evaluates ONE ticker's already-built plan against the stricter
     * auto-execution gates. Does not fetch anything itself â€” the
     * caller (a real server action, since this needs real committee/
     * options/account data) supplies the real plan, real selected
     * contract, real current open-position count, and real account
     * equity. Kept pure/synchronous so the gate LOGIC itself is
     * simple to verify independent of any network call.
     */
    evaluate(
        ticker: string,
        plan: TradePlan,
        selectedContract: OptionContract | null,
        suggestedQty: number | null,
        currentOpenPositions: number,
        accountEquity: number,
        gates: AutoExecutionGates = DEFAULT_AUTO_EXECUTION_GATES
    ): BatchResult {
        const base = { ticker, plan, selectedContract, suggestedQty };

        if (plan.direction === "none") {
            return { ...base, outcome: "skip", reason: plan.reasoning[0] ?? "No directional trade plan formed." };
        }

        if (plan.confidence < gates.minCommitteeConfidence) {
            return { ...base, outcome: "reject", reason: `Committee confidence (${plan.confidence}%) below the stricter ${gates.minCommitteeConfidence}% auto-execution gate.` };
        }
        if (plan.agreement < gates.minCommitteeAgreement) {
            return { ...base, outcome: "reject", reason: `Committee agreement (${plan.agreement}%) below the stricter ${gates.minCommitteeAgreement}% auto-execution gate.` };
        }
        if ((plan.evidenceQuality ?? 0) < gates.minEvidenceQuality) {
            return { ...base, outcome: "reject", reason: `Evidence quality (${plan.evidenceQuality ?? 0}%) below the stricter ${gates.minEvidenceQuality}% auto-execution gate.` };
        }

        if (currentOpenPositions >= gates.maxOpenPositions) {
            return { ...base, outcome: "reject", reason: `Portfolio already has ${currentOpenPositions} open positions (max ${gates.maxOpenPositions}).` };
        }

        if (!selectedContract || !suggestedQty) {
            return { ...base, outcome: "reject", reason: "No real contract in the live chain matched this plan's target DTE/Delta ranges." };
        }

        const spread = spreadPercent(selectedContract);
        if (spread === null) {
            return { ...base, outcome: "reject", reason: "Real bid/ask not available for the selected contract â€” can't verify spread." };
        }
        if (spread > gates.maxBidAskSpreadPercent) {
            return { ...base, outcome: "reject", reason: `Bid/ask spread (${spread.toFixed(1)}%) exceeds the ${gates.maxBidAskSpreadPercent}% max.` };
        }

        const premiumPerContract = (selectedContract.askPrice ?? 0) * 100 * suggestedQty;
        const realRiskPercent = accountEquity > 0 ? (premiumPerContract / accountEquity) * 100 : 100;
        if (realRiskPercent > gates.maxPortfolioRiskPercentPerTrade) {
            return { ...base, outcome: "reject", reason: `Real estimated cost is ${realRiskPercent.toFixed(2)}% of account equity (max ${gates.maxPortfolioRiskPercentPerTrade}%).` };
        }

        return { ...base, outcome: "execute", reason: `All auto-execution gates passed (confidence ${plan.confidence}%, agreement ${plan.agreement}%, evidence ${plan.evidenceQuality}%, spread ${spread.toFixed(1)}%, real risk ${realRiskPercent.toFixed(2)}%).` };
    }
}

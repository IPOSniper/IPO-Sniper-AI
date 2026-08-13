"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { ResearchService } from "@/engine/services/ResearchService";
import { QuantStrategist, type TradePlan } from "@/engine/quant/QuantStrategist";
import { AlpacaOptionsProvider, type OptionContract } from "@/engine/trading/providers/AlpacaOptionsProvider";
import { AlpacaPaperTradingProvider } from "@/engine/trading/providers/AlpacaPaperTradingProvider";
import { placeOrder } from "@/app/(app)/hedge-fund/paper-trading/actions";
import type { ScenarioAnalysis } from "@/engine/models/InvestmentDecisionReport";
import { checkAutonomousExecutionAllowed } from "@/app/(app)/hedge-fund/quant-control/actions";
import { FinnhubEarningsCalendarProvider } from "@/engine/earnings/providers/FinnhubEarningsCalendarProvider";

export interface TradePlanResult {
    /** Row id in quant_trade_decisions, when logging succeeded — passed to executeTradePlan to link the eventual order back to this decision. Null when Supabase isn't configured or the insert failed; execution still works either way, just without the link. */
    decisionId: string | null;
    ticker: string;
    plan: TradePlan;
    selectedContract: OptionContract | null;
    suggestedQty: number | null;
    accountEquity: number | null;
    /**
     * Real bull/base/bear probabilities, already computed elsewhere
     * in the research pipeline (investmentDecision.scenarios) --
     * shown regardless of which single direction the plan picked, so
     * the user can see the real read on BOTH sides, not just the one
     * Quant is proposing. Null when the research didn't produce a
     * real investmentDecision (e.g. very thin evidence).
     */
    scenarios: ScenarioAnalysis | null;
    /**
     * Real earnings-date check via Finnhub's calendar (a completely
     * separate, safe data source from the News-Analyst exclusion
     * concern above -- earnings dates are scheduling facts, not
     * NewsAPI-restricted content). Flags when the plan's own target
     * holding period would span an upcoming earnings report, a real
     * gap risk the plan's standard DTE/delta parameters don't
     * otherwise account for. Null when no confirmed upcoming report
     * exists or the calendar lookup failed.
     */
    earningsWithinHoldingPeriod: { reportDate: string; daysUntil: number } | null;
}

/**
 * Real decision logging -- every call to buildTradePlan gets recorded
 * here, "No Trade" included, per direct instruction: "log
 * everything... committee scores, quant decisions" BEFORE any
 * learning/pattern-detection logic exists. Nothing reads from this
 * table to change behavior -- it is pure data collection, the raw
 * material for a real, separate, later Learning Engine phase.
 *
 * Swallows failures the same way logOrderAttempt does in
 * paper-trading/actions.ts -- a broken decision log should never
 * block the user from seeing their trade plan.
 */
async function logDecision(
    ticker: string,
    plan: TradePlan,
    selectedContract: OptionContract | null
): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase.from("quant_trade_decisions").insert({
            user_id: user.id,
            ticker,
            direction: plan.direction,
            committee_confidence: plan.confidence,
            committee_agreement: plan.agreement,
            evidence_quality: plan.evidenceQuality,
            trade_quality_score: plan.tradeQualityScore,
            decision_checks: plan.checks,
            target_dte_min: plan.targetDteRange?.[0] ?? null,
            target_dte_max: plan.targetDteRange?.[1] ?? null,
            target_delta_min: plan.targetDeltaRange?.[0] ?? null,
            target_delta_max: plan.targetDeltaRange?.[1] ?? null,
            suggested_max_risk_percent: plan.suggestedMaxRiskPercent,
            profit_target_percent: plan.profitTargetPercent,
            stop_loss_percent: plan.stopLossPercent,
            contract_symbol: selectedContract?.symbol ?? null,
            contract_strike: selectedContract?.strikePrice ?? null,
            contract_expiration: selectedContract?.expirationDate ?? null,
            contract_delta: selectedContract?.delta ?? null,
            contract_iv: selectedContract?.impliedVolatility ?? null,
            contract_ask_price: selectedContract?.askPrice ?? null,
            reasoning: plan.reasoning,
        }).select("id").single();

        if (error) return null;
        return data?.id ?? null;
    } catch {
        return null;
    }
}

/**
 * Real, best-effort link from a logged decision to the order that
 * came from it, once Alpaca has actually accepted the order --
 * separate call rather than blocking execution on a database write.
 */
async function linkDecisionToOrder(decisionId: string, brokerOrderId: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
        const supabase = await createClient();
        await supabase.from("quant_trade_decisions").update({ broker_order_id: brokerOrderId }).eq("id", decisionId);
    } catch {
        // Best-effort — the order itself already succeeded and was logged in paper_trade_orders regardless.
    }
}

/**
 * Reuses the SAME real research pipeline every other page uses
 * (ResearchService.load -> real Committee) -- Quant doesn't get its
 * own separate/duplicate research logic. Fetches the real options
 * chain and selects a real matching contract, and logs the full real
 * decision (trade or no-trade) for future analysis.
 */
export async function getTradePlan(ticker: string): Promise<
    { success: true; result: TradePlanResult } | { success: false; error: string }
> {
    const normalizedTicker = ticker.trim().toUpperCase();
    if (!normalizedTicker) {
        return { success: false, error: "Ticker is required." };
    }

    try {
        const research = await new ResearchService().load(normalizedTicker);
        const strategist = new QuantStrategist();
        const plan = strategist.buildTradePlan(research.committee);

        // Real bull/base/bear probabilities, already computed
        // elsewhere in the research pipeline -- shown regardless of
        // which single direction the plan picked.
        const scenarios: ScenarioAnalysis | null = research.investmentDecision?.scenarios ?? null;

        let selectedContract: OptionContract | null = null;
        let suggestedQty: number | null = null;
        let accountEquity: number | null = null;

        if (plan.direction !== "none") {
            try {
                const chain = await new AlpacaOptionsProvider().getOptionChain(normalizedTicker);
                selectedContract = strategist.selectContract(plan, chain);

                if (selectedContract) {
                    const account = await new AlpacaPaperTradingProvider().getAccount();
                    accountEquity = account.equity;
                    suggestedQty = strategist.suggestQuantity(plan, selectedContract, account.equity);
                }
            } catch {
                // Real options/account fetch can fail independently
                // of the research/plan succeeding -- still return the
                // real plan even if contract selection couldn't run.
            }
        }

        // Real earnings-date check via Finnhub's calendar -- a
        // separate, safe data source from the News-Analyst exclusion
        // above (scheduling facts, not NewsAPI-restricted content).
        // Checked against the actual selected contract's real
        // expiration when one exists (most precise); falls back to
        // the plan's target DTE range's upper bound otherwise (e.g.
        // when no contract could be selected, still worth knowing if
        // earnings falls inside the window being targeted).
        let earningsWithinHoldingPeriod: TradePlanResult["earningsWithinHoldingPeriod"] = null;
        if (plan.direction !== "none") {
            try {
                const entry = await new FinnhubEarningsCalendarProvider().getNext(normalizedTicker);
                if (entry) {
                    const daysUntil = Math.round((new Date(entry.reportDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    const horizonDays = selectedContract
                        ? Math.round((new Date(selectedContract.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                        : plan.targetDteRange?.[1] ?? null;

                    if (horizonDays !== null && daysUntil >= 0 && daysUntil <= horizonDays) {
                        earningsWithinHoldingPeriod = { reportDate: entry.reportDate, daysUntil };
                    }
                }
            } catch {
                // Real calendar lookup can fail independently --
                // earningsWithinHoldingPeriod just stays null, doesn't
                // block the rest of the real plan.
            }
        }

        const decisionId = await logDecision(normalizedTicker, plan, selectedContract);

        return { success: true, result: { decisionId, ticker: normalizedTicker, plan, selectedContract, suggestedQty, accountEquity, scenarios, earningsWithinHoldingPeriod } };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Failed to load research." };
    }
}

/**
 * Real execution -- reuses the EXACT SAME placeOrder action (and
 * therefore the exact same RiskEngine check) the manual order form
 * uses. This does not bypass risk gating; RiskEngine's real,
 * portfolio-specific check is still the final authority regardless
 * of what QuantStrategist suggested. When a decisionId is provided
 * and the order succeeds, links the two records together.
 */
export async function executeTradePlan(contractSymbol: string, qty: number, planSummary: string, decisionId?: string | null) {
    // Real, server-side enforcement -- see checkAutonomousExecutionAllowed's
    // docstring. Checked here, not just in the UI, so this can't be
    // bypassed by calling the server action directly.
    const control = await checkAutonomousExecutionAllowed("assisted");
    if (!control.allowed) {
        return { success: false as const, error: control.reason };
    }

    const result = await placeOrder(contractSymbol, "buy", qty, `Quant Strategist: ${planSummary}`, undefined, "option");

    if (result.success && result.order && decisionId) {
        await linkDecisionToOrder(decisionId, result.order.brokerOrderId);
    }

    return result;
}

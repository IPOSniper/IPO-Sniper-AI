"use server";

import { ResearchService } from "@/engine/services/ResearchService";
import { QuantStrategist, type TradePlan } from "@/engine/quant/QuantStrategist";
import { AlpacaOptionsProvider, type OptionContract } from "@/engine/trading/providers/AlpacaOptionsProvider";
import { AlpacaPaperTradingProvider } from "@/engine/trading/providers/AlpacaPaperTradingProvider";
import { placeOrder } from "@/app/(app)/hedge-fund/paper-trading/actions";

export interface TradePlanResult {
    ticker: string;
    plan: TradePlan;
    selectedContract: OptionContract | null;
    suggestedQty: number | null;
    accountEquity: number | null;
}

/**
 * Reuses the SAME real research pipeline every other page uses
 * (ResearchService.load -> real Committee) -- Quant doesn't get its
 * own separate/duplicate research logic. Now also fetches the real
 * options chain and selects a real matching contract, closing the
 * gap between "here's a trade plan" and "here's an actual order" --
 * still requires an explicit Execute click, never auto-submits.
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

        return { success: true, result: { ticker: normalizedTicker, plan, selectedContract, suggestedQty, accountEquity } };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Failed to load research." };
    }
}

/**
 * Real execution -- reuses the EXACT SAME placeOrder action (and
 * therefore the exact same RiskEngine check) the manual order form
 * uses. This does not bypass risk gating; RiskEngine's real,
 * portfolio-specific check is still the final authority regardless
 * of what QuantStrategist suggested.
 */
export async function executeTradePlan(contractSymbol: string, qty: number, planSummary: string) {
    return placeOrder(contractSymbol, "buy", qty, `Quant Strategist: ${planSummary}`, undefined, "option");
}

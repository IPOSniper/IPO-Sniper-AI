"use server";

import { AlpacaOptionsProvider, type OptionContract } from "@/engine/trading/providers/AlpacaOptionsProvider";
import { AlpacaPaperTradingProvider } from "@/engine/trading/providers/AlpacaPaperTradingProvider";
import { findMatchingContract, STANDARD_PARAMS } from "@/engine/quant/QuantStrategist";

export interface ContractRecommendation {
    contract: OptionContract;
    estimatedQty: number;
    estimatedCost: number;
}

/**
 * Real contract finder for MANUAL trading -- uses the exact same
 * shared findMatchingContract() the Quant Strategist flow uses, with
 * the same real, labeled standard DTE/delta conventions
 * (STANDARD_PARAMS -- 35-45 DTE, 0.30-0.40 delta), but WITHOUT
 * requiring a real committee-gated trade plan first. A human
 * choosing to trade on their own judgment isn't blocked by the
 * committee disagreeing -- that's the actual point of a separate
 * manual flow existing at all.
 *
 * Real quantity suggestion reuses the same real formula as
 * QuantStrategist.suggestQuantity() -- real account equity x the
 * same standard risk %. RiskEngine still performs the real, final
 * sizing check at order submission; this is a starting suggestion,
 * not an override.
 */
export async function findBestContract(ticker: string, direction: "call" | "put"): Promise<
    { success: true; recommendation: ContractRecommendation | null } | { success: false; error: string }
> {
    const normalizedTicker = ticker.trim().toUpperCase();
    if (!normalizedTicker) {
        return { success: false, error: "Ticker is required." };
    }

    try {
        const chain = await new AlpacaOptionsProvider().getOptionChain(normalizedTicker);
        const contract = findMatchingContract(direction, STANDARD_PARAMS.targetDteRange, STANDARD_PARAMS.targetDeltaRange, chain);

        if (!contract) {
            return { success: true, recommendation: null };
        }

        const account = await new AlpacaPaperTradingProvider().getAccount();
        const premiumPerContract = (contract.askPrice ?? contract.lastPrice ?? 0) * 100;
        const riskBudget = account.equity * (STANDARD_PARAMS.suggestedMaxRiskPercent / 100);
        const estimatedQty = premiumPerContract > 0 ? Math.max(1, Math.floor(riskBudget / premiumPerContract)) : 1;
        const estimatedCost = premiumPerContract * estimatedQty;

        return { success: true, recommendation: { contract, estimatedQty, estimatedCost } };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Failed to find a matching contract." };
    }
}

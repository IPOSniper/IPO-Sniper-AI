"use server";

import { AlpacaOptionsProvider, type OptionContract } from "@/engine/trading/providers/AlpacaOptionsProvider";
import { AlpacaPaperTradingProvider } from "@/engine/trading/providers/AlpacaPaperTradingProvider";
import { findMatchingContract, STANDARD_PARAMS } from "@/engine/quant/QuantStrategist";

export interface ContractRecommendation {
    contract: OptionContract;
    estimatedQty: number;
    estimatedCost: number;
}

/** Real diagnostic info from the actual chain, shown when nothing matches the standard params — so "no match" is explained, not just stated. */
export interface ChainDiagnostics {
    availableExpirations: string[];
    deltaRange: [number, number] | null;
    contractsOfDirection: number;
}

function buildDiagnostics(chain: OptionContract[], direction: "call" | "put"): ChainDiagnostics {
    const relevant = chain.filter(c => c.type === direction);
    const deltas = relevant.map(c => c.delta).filter((d): d is number => d !== null).map(Math.abs);
    const expirations = [...new Set(relevant.map(c => c.expirationDate))].sort();

    return {
        availableExpirations: expirations,
        deltaRange: deltas.length > 0 ? [Math.min(...deltas), Math.max(...deltas)] : null,
        contractsOfDirection: relevant.length,
    };
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
 *
 * When nothing in the real chain falls within the standard target
 * ranges (a real, honest outcome -- e.g. a ticker that only has
 * weeklies or LEAPS, not standard-window monthlies), this now also
 * returns real diagnostics from the actual chain (real available
 * expirations, real delta range that DOES exist) instead of just
 * "no match" with no way to understand why or what to try instead.
 */
export async function findBestContract(ticker: string, direction: "call" | "put"): Promise<
    { success: true; recommendation: ContractRecommendation | null; diagnostics?: ChainDiagnostics } | { success: false; error: string }
> {
    const normalizedTicker = ticker.trim().toUpperCase();
    if (!normalizedTicker) {
        return { success: false, error: "Ticker is required." };
    }

    try {
        const chain = await new AlpacaOptionsProvider().getOptionChain(normalizedTicker);
        const contract = findMatchingContract(direction, STANDARD_PARAMS.targetDteRange, STANDARD_PARAMS.targetDeltaRange, chain);

        if (!contract) {
            return { success: true, recommendation: null, diagnostics: buildDiagnostics(chain, direction) };
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

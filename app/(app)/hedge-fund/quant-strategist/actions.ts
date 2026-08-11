"use server";

import { ResearchService } from "@/engine/services/ResearchService";
import { QuantStrategist, type TradePlan } from "@/engine/quant/QuantStrategist";

/**
 * Reuses the SAME real research pipeline every other page uses
 * (ResearchService.load -> real Committee) -- Quant doesn't get its
 * own separate/duplicate research logic, it consumes the same real
 * evidence-based committee everything else does.
 */
export async function getTradePlan(ticker: string): Promise<
    { success: true; ticker: string; plan: TradePlan } | { success: false; error: string }
> {
    const normalizedTicker = ticker.trim().toUpperCase();
    if (!normalizedTicker) {
        return { success: false, error: "Ticker is required." };
    }

    try {
        const research = await new ResearchService().load(normalizedTicker);
        const plan = new QuantStrategist().buildTradePlan(research.committee);
        return { success: true, ticker: normalizedTicker, plan };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Failed to load research." };
    }
}

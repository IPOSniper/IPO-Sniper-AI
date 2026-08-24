"use server";

import { AlpacaPaperTradingProvider } from "@/engine/trading/providers/AlpacaPaperTradingProvider";
import type { PortfolioHistoryPoint } from "@/engine/trading/contracts/TradeOrder";

/**
 * Real equity curve data from Alpaca's real portfolio history
 * endpoint. Returns null on failure rather than throwing -- the
 * page decides how to render "no data yet" (e.g. a brand-new
 * account with no history) versus a real fetch error.
 */
export async function getEquityCurve(period = "1M", timeframe = "1D"): Promise<PortfolioHistoryPoint[] | null> {
    try {
        return await new AlpacaPaperTradingProvider().getPortfolioHistory(period, timeframe);
    } catch {
        return null;
    }
}

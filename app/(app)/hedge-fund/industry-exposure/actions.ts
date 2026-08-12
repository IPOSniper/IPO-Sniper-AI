"use server";

import { AlpacaPaperTradingProvider } from "@/engine/trading/providers/AlpacaPaperTradingProvider";
import { fetchIndustry, aggregateIndustryExposure, type IndustryExposureEntry } from "@/engine/portfolio/IndustryExposure";

/**
 * Real industry exposure across real Alpaca positions -- fetches
 * each held ticker's real industry classification (Finnhub, cached
 * 1hr) and aggregates real market value by industry. See
 * IndustryExposure.ts's docstring for why this is "Industry," not
 * "Sector" -- no real broad-sector data source exists in this app.
 */
export async function getIndustryExposure(): Promise<IndustryExposureEntry[]> {
    try {
        const positions = await new AlpacaPaperTradingProvider().getPositions();
        if (positions.length === 0) return [];

        const industries = await Promise.all(positions.map(p => fetchIndustry(p.ticker)));

        return aggregateIndustryExposure(
            positions.map(p => ({ ticker: p.ticker, marketValue: p.marketValue })),
            industries
        );
    } catch {
        return [];
    }
}

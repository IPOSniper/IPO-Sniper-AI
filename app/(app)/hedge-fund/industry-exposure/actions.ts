"use server";

import { AlpacaPaperTradingProvider } from "@/engine/trading/providers/AlpacaPaperTradingProvider";
import { fetchIndustry, aggregateIndustryExposure, type IndustryExposureEntry } from "@/engine/portfolio/IndustryExposure";
import { extractUnderlyingFromOccSymbol } from "@/engine/trading/contracts/occSymbol";

/**
 * Real industry exposure across real Alpaca positions -- fetches
 * each held ticker's real industry classification (Finnhub, cached
 * 1hr) and aggregates real market value by industry. See
 * IndustryExposure.ts's docstring for why this is "Industry," not
 * "Sector" -- no real broad-sector data source exists in this app.
 *
 * Real fix: an option position's ticker is an OCC symbol (e.g.
 * "IREN260821P00038500"), which Finnhub's /stock/profile2 doesn't
 * recognize -- same root cause already fixed in
 * PortfolioRiskAggregator.ts. Extracts the real underlying before
 * fetching industry classification, so option positions correctly
 * show their real company's industry instead of "Unknown."
 */
export async function getIndustryExposure(): Promise<IndustryExposureEntry[]> {
    try {
        const positions = await new AlpacaPaperTradingProvider().getPositions();
        if (positions.length === 0) return [];

        const industries = await Promise.all(
            positions.map(p => fetchIndustry(extractUnderlyingFromOccSymbol(p.ticker) ?? p.ticker))
        );

        // Real fix: fetchIndustry was called with the real underlying
        // ticker above, but the aggregation must still be keyed by
        // the position's own real ticker (the OCC symbol) -- not the
        // underlying -- so each real position's real market value
        // maps back correctly. Overwrite each industry result's
        // ticker field with the real position ticker it actually
        // belongs to before aggregating.
        const industriesByPosition = industries.map((industry, i) => ({
            ticker: positions[i].ticker,
            industry: industry.industry,
        }));

        return aggregateIndustryExposure(
            positions.map(p => ({ ticker: p.ticker, marketValue: p.marketValue })),
            industriesByPosition
        );
    } catch {
        return [];
    }
}

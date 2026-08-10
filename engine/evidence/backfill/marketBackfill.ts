import type { MarketEvidence } from "../package";
import { FinnhubCandleProvider } from "../providers/FinnhubCandleProvider";

/**
 * Fills volatilityIndex with REAL computed historical volatility
 * (not a VIX-style implied volatility, which needs options data -
 * see HEDGE_FUND_ARCHITECTURE.md). sectorMomentum is NOT backfilled
 * here - it needs a defined sector index/peer basket, which is a
 * real design decision, not just a data fetch. Left honestly
 * unverified rather than approximated.
 */
export async function backfillMarketVolatility(
    market: MarketEvidence,
    ticker: string
): Promise<MarketEvidence> {

    if (market.volatilityIndex.verified) {
        return market;
    }

    try {
        const provider = new FinnhubCandleProvider();
        const volatility = await provider.getHistoricalVolatility(ticker, 30);

        if (volatility === null) {
            return market;
        }

        return {
            ...market,
            volatilityIndex: {
                value: volatility,
                source: "FINNHUB",
                confidence: 70, // real calculation, real data, but needs live candle-endpoint access confirmed
                verified: true,
                collectedAt: new Date(),
            },
        };

    } catch {
        return market;
    }
}

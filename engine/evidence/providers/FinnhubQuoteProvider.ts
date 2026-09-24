/**
 * Real Finnhub /quote client — documented, requires FINNHUB_API_KEY
 * (already required elsewhere). Returns current price and % change.
 * Reused both for the researched company's own quote and for market
 * index context (SPY/QQQ/VIX) — same endpoint works for both.
 *
 * Written against documented response shape, not run live.
 */

import { fetchWithRetry } from "../../api/fetchWithRetry";

export interface Quote {
    price: number;
    change: number;
    changePercent: number;
    previousClose: number;
    /** Unix timestamp (seconds) of this quote, per Finnhub's documented `t` field --
     * added for the Session-Aware Multi-Asset Execution Bootstrap's quote-freshness
     * check (RiskEngine). Not previously captured by this wrapper even though
     * Finnhub's response includes it. */
    timestampSeconds?: number | null;
}

export class FinnhubQuoteProvider {

    async getQuote(symbol: string): Promise<Quote> {

        const apiKey = process.env.FINNHUB_API_KEY;

        if (!apiKey) {
            throw new Error("FINNHUB_API_KEY is missing.");
        }

        const response = await fetchWithRetry(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error(`Finnhub quote request failed: ${response.status}`);
        }

        const data = await response.json();

        // Finnhub returns all zeros (not an error) for an invalid/
        // unlisted symbol — treat that as "no quote" rather than a
        // real zero price.
        if (!data.c || data.c === 0) {
            throw new Error(`No quote available for ${symbol}.`);
        }

        return {
            price: data.c,
            change: data.d,
            changePercent: data.dp,
            previousClose: data.pc,
            // Finnhub returns 0 for `t` on some edge cases the same way it returns
            // 0 for `c` on an invalid symbol -- treat 0/missing as "unknown", not
            // as a real 1970 timestamp, so a freshness check can't be fooled into
            // treating an unknown age as infinitely fresh.
            timestampSeconds: data.t && data.t > 0 ? data.t : null,
        };
    }

    async getMarketCap(symbol: string): Promise<number> {

        const apiKey = process.env.FINNHUB_API_KEY;

        if (!apiKey) {
            throw new Error("FINNHUB_API_KEY is missing.");
        }

        const response = await fetchWithRetry(
            `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`,
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error(`Finnhub profile request failed: ${response.status}`);
        }

        const data = await response.json();

        // Finnhub returns marketCapitalization in millions of USD.
        if (!data.marketCapitalization) {
            throw new Error(`No market cap available for ${symbol}.`);
        }

        return data.marketCapitalization * 1_000_000;
    }

    /**
     * Real Finnhub /stock/recommendation-trends -- real sell-side
     * analyst Buy/Hold/Sell counts, most recent period only. Documented,
     * free-tier endpoint, not run live before this build.
     */
    async getRecommendationTrends(symbol: string): Promise<{
        strongBuy: number; buy: number; hold: number; sell: number; strongSell: number; period: string;
    } | null> {
        const apiKey = process.env.FINNHUB_API_KEY;
        if (!apiKey) return null;

        const response = await fetchWithRetry(
            `https://finnhub.io/api/v1/stock/recommendation-trends?symbol=${symbol}&token=${apiKey}`,
            { cache: "no-store" }
        );
        if (!response.ok) return null;

        const data = await response.json();
        const latest = Array.isArray(data) ? data[0] : null;
        if (!latest) return null;

        return {
            strongBuy: latest.strongBuy ?? 0,
            buy: latest.buy ?? 0,
            hold: latest.hold ?? 0,
            sell: latest.sell ?? 0,
            strongSell: latest.strongSell ?? 0,
            period: latest.period ?? "",
        };
    }

    /**
     * Real Finnhub /stock/price-target -- real consensus analyst
     * price target (high/low/mean/median). Documented, free-tier
     * endpoint, not run live before this build.
     */
    async getPriceTarget(symbol: string): Promise<{
        high: number; low: number; mean: number; median: number; lastUpdated: string;
    } | null> {
        const apiKey = process.env.FINNHUB_API_KEY;
        if (!apiKey) return null;

        const response = await fetchWithRetry(
            `https://finnhub.io/api/v1/stock/price-target?symbol=${symbol}&token=${apiKey}`,
            { cache: "no-store" }
        );
        if (!response.ok) return null;

        const data = await response.json();
        if (!data.targetMean) return null;

        return {
            high: data.targetHigh,
            low: data.targetLow,
            mean: data.targetMean,
            median: data.targetMedian,
            lastUpdated: data.lastUpdated ?? "",
        };
    }
}

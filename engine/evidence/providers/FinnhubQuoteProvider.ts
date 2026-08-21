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

}

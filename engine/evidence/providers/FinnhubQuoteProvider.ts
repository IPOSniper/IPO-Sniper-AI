/**
 * Real Finnhub /quote client — documented, requires FINNHUB_API_KEY
 * (already required elsewhere). Returns current price and % change.
 * Reused both for the researched company's own quote and for market
 * index context (SPY/QQQ/VIX) — same endpoint works for both.
 *
 * Written against documented response shape, not run live.
 */

export interface Quote {
    price: number;
    change: number;
    changePercent: number;
    previousClose: number;
}

export class FinnhubQuoteProvider {

    async getQuote(symbol: string): Promise<Quote> {

        const apiKey = process.env.FINNHUB_API_KEY;

        if (!apiKey) {
            throw new Error("FINNHUB_API_KEY is missing.");
        }

        const response = await fetch(
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
        };
    }

    async getMarketCap(symbol: string): Promise<number> {

        const apiKey = process.env.FINNHUB_API_KEY;

        if (!apiKey) {
            throw new Error("FINNHUB_API_KEY is missing.");
        }

        const response = await fetch(
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

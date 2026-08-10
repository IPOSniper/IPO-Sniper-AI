/**
 * Real Finnhub historical price candles (/stock/candle), used to
 * compute genuine historical volatility — standard deviation of
 * daily returns, annualized — rather than leaving volatilityIndex
 * unverified. This is a real statistical calculation on real price
 * data, not a VIX-style implied-volatility number (that needs
 * options data, which is a separate, paid-tier problem — see
 * HEDGE_FUND_ARCHITECTURE.md).
 *
 * Honest caveat: Finnhub's /stock/candle endpoint is restricted on
 * some free-tier plans (unlike /quote and /stock/metric, which this
 * app already confirmed working). If yours doesn't have access,
 * this fails closed to unverified, same as everything else.
 */

export class FinnhubCandleProvider {

    /**
     * Returns the annualized historical volatility (%) computed from
     * the last `days` daily closes, or null if insufficient data.
     */
    async getHistoricalVolatility(ticker: string, days = 30): Promise<number | null> {

        const apiKey = process.env.FINNHUB_API_KEY;

        if (!apiKey) {
            throw new Error("FINNHUB_API_KEY is missing.");
        }

        const to = Math.floor(Date.now() / 1000);
        const from = to - (days + 10) * 24 * 60 * 60; // buffer for weekends/holidays

        const url = `https://finnhub.io/api/v1/stock/candle?symbol=${ticker}&resolution=D&from=${from}&to=${to}&token=${apiKey}`;

        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
            throw new Error(`Finnhub candle request failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.s !== "ok" || !Array.isArray(data.c) || data.c.length < 5) {
            return null;
        }

        const closes: number[] = data.c;

        const dailyReturns: number[] = [];
        for (let i = 1; i < closes.length; i++) {
            if (closes[i - 1] !== 0) {
                dailyReturns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
            }
        }

        if (dailyReturns.length < 5) return null;

        const mean = dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length;
        const variance = dailyReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / dailyReturns.length;
        const dailyStdDev = Math.sqrt(variance);

        // Annualize: daily stddev * sqrt(trading days per year), as a percentage.
        return dailyStdDev * Math.sqrt(252) * 100;
    }

}

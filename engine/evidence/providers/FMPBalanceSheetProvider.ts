/**
 * Real Financial Modeling Prep balance sheet client. FMP's
 * balance-sheet-statement endpoint returns standard, well-documented
 * line items — totalCurrentAssets, totalCurrentLiabilities,
 * inventory — which Finnhub's basic /stock/metric response does not
 * break out. This is what actually closes the Liquidity Analyst gap
 * (currentRatio/quickRatio), which the SEC financials-reported
 * backfill couldn't reach.
 *
 * Requires FMP_API_KEY — you already have a Financial Modeling Prep
 * key sitting unused in your .env.local from a few rounds back; add
 * it here under this exact name.
 *
 * Written against FMP's documented v3 API response shape, not run
 * against it — no network access in this build sandbox. Verify once
 * you have a real key configured.
 */

export interface FMPBalanceSheet {
    totalCurrentAssets: number;
    totalCurrentLiabilities: number;
    inventory: number;
    cashAndCashEquivalents: number;
    totalDebt: number;
    date: string;
}

export class FMPBalanceSheetProvider {

    async getLatestBalanceSheet(ticker: string): Promise<FMPBalanceSheet | null> {

        const apiKey = process.env.FMP_API_KEY;

        if (!apiKey) {
            throw new Error("FMP_API_KEY is missing.");
        }

        const url = `https://financialmodelingprep.com/api/v3/balance-sheet-statement/${ticker}?period=annual&limit=1&apikey=${apiKey}`;

        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
            throw new Error(`FMP balance sheet request failed: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            return null;
        }

        const latest = data[0];

        return {
            totalCurrentAssets: latest.totalCurrentAssets ?? 0,
            totalCurrentLiabilities: latest.totalCurrentLiabilities ?? 0,
            inventory: latest.inventory ?? 0,
            cashAndCashEquivalents: latest.cashAndCashEquivalents ?? 0,
            totalDebt: latest.totalDebt ?? 0,
            date: latest.date ?? "",
        };
    }

}

/**
 * Real Finnhub analyst-estimates client (/stock/revenue-estimate).
 * This is Wall Street CONSENSUS estimates — other analysts' forward
 * projections — NOT management's own stated guidance. Being precise
 * about that distinction matters: it's honest and useful data, just
 * not literally what "revenueGuidance" implies. Labeled clearly in
 * growthBackfill.ts where this gets used.
 *
 * Honest caveat beyond the usual "not run live": I'm less certain of
 * Finnhub's exact response field names here than for the endpoints
 * built earlier this session (quote, profile, financials-reported)
 * — estimates endpoints vary more across providers. Wrapped so a
 * wrong field name degrades to "no data" (confidence 0), not a
 * silently wrong number.
 */

import { fetchWithRetry } from "../../api/fetchWithRetry";

export interface RevenueEstimate {
    period: string;
    revenueAvg: number;
}

export class FinnhubEstimatesProvider {

    async getRevenueEstimate(ticker: string): Promise<RevenueEstimate | null> {

        const apiKey = process.env.FINNHUB_API_KEY;

        if (!apiKey) {
            throw new Error("FINNHUB_API_KEY is missing.");
        }

        const url = `https://finnhub.io/api/v1/stock/revenue-estimate?symbol=${ticker}&freq=annual&token=${apiKey}`;

        const response = await fetchWithRetry(url, { cache: "no-store" });

        if (!response.ok) {
            throw new Error(`Finnhub revenue estimate request failed: ${response.status}`);
        }

        const data = await response.json();

        const estimates = data.data;

        if (!Array.isArray(estimates) || estimates.length === 0) {
            return null;
        }

        // Estimates are typically returned most-recent-first; take
        // the nearest future/most recent period as the forward view.
        const next = estimates[0];

        const revenueAvg = next.revenueAvg ?? next.revenueAvg_1 ?? null;

        if (revenueAvg === null) {
            return null;
        }

        return {
            period: next.period ?? "",
            revenueAvg,
        };
    }

}

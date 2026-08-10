import type { Company } from "../../../models/Company";

/**
 * Real Finnhub /stock/profile2 client, following the same pattern as
 * FinnhubFinancialProvider (env-var key, fetch, error on failure).
 *
 * Caveat: this sandbox has no network access, so this has been
 * written correctly against Finnhub's documented profile2 response
 * shape but has NOT been run against a live response. Verify field
 * names once you run it with a real FINNHUB_API_KEY.
 *
 * Known limitation: Finnhub's profile2 endpoint only returns a single
 * `finnhubIndustry` classification — there is no separate GICS
 * "sector" field. `sector` is honestly left as "Unknown" rather than
 * guessing a sector from the industry string. If you need a real
 * sector, that requires either a GICS mapping table keyed off
 * finnhubIndustry, or a different provider (e.g. FMP's profile
 * endpoint, which does return sector separately).
 */
export class CompanyBuilder {

    async build(ticker: string): Promise<Company> {

        const apiKey = process.env.FINNHUB_API_KEY;

        if (!apiKey) {
            throw new Error("FINNHUB_API_KEY is missing.");
        }

        const response = await fetch(
            `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${apiKey}`,
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error(`Finnhub profile request failed: ${response.status}`);
        }

        const data = await response.json();

        if (!data || !data.ticker) {
            throw new Error(`No Finnhub profile found for ${ticker}.`);
        }

        return {
            ticker: data.ticker ?? ticker,
            name: data.name ?? ticker,
            exchange: data.exchange ?? "Unknown",
            sector: "Unknown", // see class comment — not available from profile2
            industry: data.finnhubIndustry ?? "Unknown",
        };

    }

}

/**
 * ARK Invest publishes a daily holdings CSV for each of its actively
 * managed ETFs — no API key, no auth. Confirmed live via web search
 * (Aug 2026); URL pattern has been stable since at least 2021 per
 * multiple independent trackers, though ARK could change it without
 * notice since it's not a documented/versioned API — if this starts
 * 404ing, check https://www.ark-funds.com/our-etfs for the current
 * fund list and https://ark-funds.com/ (view source on a holdings
 * page) for the current CSV path.
 *
 * These files are ARK's own disclosure of what they hold as of the
 * previous close — NOT the same thing as a 13F (which is quarterly,
 * SEC-mandated, and covers all institutions). This is faster and
 * ARK-specific; 13F coverage of BlackRock/Vanguard/etc. is still a
 * separate, unbuilt piece — see docs for the roadmap.
 */

export interface ARKHolding {
    ticker: string;
    companyName: string;
    shares: number;
    marketValue: number;
    weightPercent: number;
}

export const ARK_FUNDS = {
    ARKK: "ARK_INNOVATION_ETF_ARKK_HOLDINGS",
    ARKQ: "ARK_AUTONOMOUS_TECHNOLOGY_&_ROBOTICS_ETF_ARKQ_HOLDINGS",
    ARKW: "ARK_NEXT_GENERATION_INTERNET_ETF_ARKW_HOLDINGS",
    ARKG: "ARK_GENOMIC_REVOLUTION_MULTISECTOR_ETF_ARKG_HOLDINGS",
    ARKF: "ARK_FINTECH_INNOVATION_ETF_ARKF_HOLDINGS",
    ARKX: "ARK_SPACE_EXPLORATION_&_INNOVATION_ETF_ARKX_HOLDINGS",
} as const;

export type ARKFundSymbol = keyof typeof ARK_FUNDS;

export class ARKHoldingsProvider {

    async getHoldings(fund: ARKFundSymbol): Promise<ARKHolding[]> {
        const filename = ARK_FUNDS[fund];
        const url = `https://assets.ark-funds.com/fund-documents/funds-etf-csv/${encodeURIComponent(filename)}.csv`;

        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
            throw new Error(`ARK holdings fetch failed for ${fund}: ${response.status}`);
        }

        const csv = await response.text();
        return this.parseCSV(csv);
    }

    /** Convenience: does `ticker` show up in this fund's current holdings, and at what size. */
    async findHolding(fund: ARKFundSymbol, ticker: string): Promise<ARKHolding | null> {
        const holdings = await this.getHoldings(fund);
        return holdings.find(h => h.ticker.toUpperCase() === ticker.toUpperCase()) ?? null;
    }

    /**
     * Checks `ticker` across every ARK fund at once — for a single
     * research-page lookup where fetching one fund at a time would
     * mean up to 6 sequential CSV fetches for one card. Funds that
     * don't hold the ticker are simply absent from the result, not
     * an error each fund a ticker isn't in.
     */
    async findAcrossFunds(ticker: string): Promise<{ fund: ARKFundSymbol; holding: ARKHolding }[]> {
        const funds = Object.keys(ARK_FUNDS) as ARKFundSymbol[];
        const results = await Promise.allSettled(funds.map(f => this.findHolding(f, ticker)));

        return funds
            .map((fund, i) => {
                const result = results[i];
                if (result.status !== "fulfilled" || !result.value) return null;
                return { fund, holding: result.value };
            })
            .filter((r): r is { fund: ARKFundSymbol; holding: ARKHolding } => r !== null);
    }

    /**
     * ARK's CSV columns (as of the sources checked): date,fund,company,
     * ticker,cusip,shares,market value ($),weight (%). Written against
     * that documented shape — verify column order once you run this
     * live, since ARK doesn't version this file format.
     */
    private parseCSV(csv: string): ARKHolding[] {
        const lines = csv.trim().split("\n");
        const header = lines[0].split(",").map(h => h.trim().toLowerCase());

        const idx = {
            company: header.findIndex(h => h.includes("company")),
            ticker: header.findIndex(h => h === "ticker"),
            shares: header.findIndex(h => h.includes("shares")),
            marketValue: header.findIndex(h => h.includes("market value")),
            weight: header.findIndex(h => h.includes("weight")),
        };

        return lines.slice(1)
            .map(line => line.split(","))
            .filter(cols => cols.length >= header.length && cols[idx.ticker]?.trim())
            .map(cols => ({
                ticker: cols[idx.ticker].trim(),
                companyName: cols[idx.company]?.trim() ?? "",
                shares: Number(cols[idx.shares]?.replace(/[^0-9.-]/g, "")) || 0,
                marketValue: Number(cols[idx.marketValue]?.replace(/[^0-9.-]/g, "")) || 0,
                weightPercent: Number(cols[idx.weight]?.replace(/[^0-9.-]/g, "")) || 0,
            }));
    }
}

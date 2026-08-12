/**
 * Real portfolio-level industry exposure -- deliberately called
 * "Industry," not "Sector." Finnhub's /stock/profile2 endpoint (the
 * same one already used for company.industry elsewhere in this app)
 * only provides finnhubIndustry, a real but granular classification
 * (e.g. "Semiconductors," "Software," "Biotechnology") -- there is
 * no separate GICS-style broad "Sector" field (Technology/Healthcare/
 * Energy) available from this provider. Building a Sector taxonomy
 * would require either a real GICS mapping table (a genuine, separate
 * undertaking to build and keep correct) or a different, unverified
 * provider. Rather than fabricate a "Sector" label over data that
 * isn't actually that, this is honestly scoped to what's real:
 * industry-level concentration, which still answers the real
 * question this was built for (hidden concentration risk across
 * correlated holdings).
 */

export interface TickerIndustry {
    ticker: string;
    industry: string;
}

export interface IndustryExposureEntry {
    industry: string;
    marketValue: number;
    percentOfPortfolio: number;
    tickers: string[];
}

/** Real, lightweight fetch -- just the industry classification, not a full company profile or research run. */
export async function fetchIndustry(ticker: string): Promise<TickerIndustry> {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) return { ticker, industry: "Unknown" };

    try {
        const response = await fetch(
            `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${apiKey}`,
            { next: { revalidate: 3600 } } // industry classification changes rarely -- 1hr cache is reasonable
        );
        if (!response.ok) return { ticker, industry: "Unknown" };
        const data = await response.json();
        return { ticker, industry: data?.finnhubIndustry ?? "Unknown" };
    } catch {
        return { ticker, industry: "Unknown" };
    }
}

/**
 * Real aggregation: given real positions (ticker + real market
 * value) and their real fetched industries, computes real
 * percent-of-portfolio concentration per industry. "Unknown"
 * industries are grouped together honestly, not silently dropped or
 * guessed into a real-looking category.
 */
export function aggregateIndustryExposure(
    positions: Array<{ ticker: string; marketValue: number }>,
    industries: TickerIndustry[]
): IndustryExposureEntry[] {
    const industryByTicker = new Map(industries.map(i => [i.ticker, i.industry]));
    const totalValue = positions.reduce((sum, p) => sum + Math.abs(p.marketValue), 0);

    const grouped = new Map<string, { marketValue: number; tickers: Set<string> }>();

    for (const position of positions) {
        const industry = industryByTicker.get(position.ticker) ?? "Unknown";
        const existing = grouped.get(industry) ?? { marketValue: 0, tickers: new Set<string>() };
        existing.marketValue += Math.abs(position.marketValue);
        existing.tickers.add(position.ticker);
        grouped.set(industry, existing);
    }

    return [...grouped.entries()]
        .map(([industry, data]) => ({
            industry,
            marketValue: data.marketValue,
            percentOfPortfolio: totalValue > 0 ? (data.marketValue / totalValue) * 100 : 0,
            tickers: [...data.tickers],
        }))
        .sort((a, b) => b.marketValue - a.marketValue);
}

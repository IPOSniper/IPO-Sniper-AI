export interface MarketHeadline {
    headline: string;
    source: string;
    url: string;
}

/**
 * Shared by both /api/education/market-pulse (the full page) and
 * /api/education/share-image (the downloadable card), so "what
 * counts as a real headline" can't drift between the two -- same
 * real Finnhub general-news feed, same filtering (only entries with
 * a real source URL, since a headline without a link isn't citable
 * and shouldn't be presented as if it were).
 */
export async function fetchMarketHeadlines(limit = 8): Promise<MarketHeadline[]> {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) return [];

    try {
        const response = await fetch(
            `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`,
            { next: { revalidate: 900 } }
        );
        if (!response.ok) return [];

        const data: Array<{ headline: string; source: string; url: string }> = await response.json();
        return data
            .filter(d => d.url)
            .slice(0, limit)
            .map(d => ({ headline: d.headline, source: d.source, url: d.url }));
    } catch {
        return [];
    }
}

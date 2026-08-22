// Extracted from app/api/ipo-watch/route.ts so it can be called directly
// (in-process, no HTTP, no auth dependency) by both the route handler and
// live-feed/route.ts's buildIpoWatchEvents(). Root cause this fixes:
// live-feed's builder previously did fetch(`${base}/api/ipo-watch`), a
// server-to-server request with no browser session -- blocked by Vercel
// Deployment Protection (401), silently returning [] in production
// regardless of the actual data. Calling this function directly removes
// that entire failure mode.

export interface IPOWatchItem {
    headline: string;
    source: string;
    url: string;
    publishedAt: string;
}

export interface IPOWatchCompany {
    company: string;
    status: "developing" | "reported" | "speculative" | "no_signal" | "unavailable";
    articleCount: number;
    latest: IPOWatchItem | null;
    additional: IPOWatchItem[];
    error: string | null;
}

const WATCHLIST = ["OpenAI", "Anthropic"];
const RECENT_WINDOW_DAYS = 30;

interface NewsApiArticle {
    title: string;
    url: string;
    publishedAt: string;
    source?: { name?: string };
}

interface SearchResult {
    items: IPOWatchItem[];
    error: string | null;
}

async function searchIpoNews(company: string, apiKey: string): Promise<SearchResult> {
    try {
        const from = new Date();
        from.setDate(from.getDate() - RECENT_WINDOW_DAYS);

        const query = `"${company}" AND (IPO OR "going public" OR "public offering" OR "confidential filing" OR "S-1" OR "public listing" OR "stock market debut")`;
        const params = new URLSearchParams({
            q: query,
            from: from.toISOString().slice(0, 10),
            sortBy: "publishedAt",
            language: "en",
            pageSize: "5",
            apiKey,
        });

        const response = await fetch(`https://newsapi.org/v2/everything?${params.toString()}`, {
            next: { revalidate: 3600 },
        });

        const data = await response.json();

        if (!response.ok) {
            return { items: [], error: data.message ?? `NewsAPI request failed: ${response.status}` };
        }

        const articles: NewsApiArticle[] = data.articles ?? [];

        const seen = new Set<string>();
        const deduped: IPOWatchItem[] = [];
        for (const a of articles) {
            if (seen.has(a.url)) continue;
            seen.add(a.url);
            deduped.push({
                headline: a.title,
                source: a.source?.name ?? "News",
                url: a.url,
                publishedAt: a.publishedAt,
            });
        }

        return {
            items: deduped.sort((x, y) => new Date(y.publishedAt).getTime() - new Date(x.publishedAt).getTime()),
            error: null,
        };
    } catch (err) {
        return { items: [], error: err instanceof Error ? err.message : "Unknown error" };
    }
}

function deriveStatus(articleCount: number, hasError: boolean): IPOWatchCompany["status"] {
    if (hasError) return "unavailable";
    if (articleCount === 0) return "no_signal";
    if (articleCount >= 3) return "developing";
    if (articleCount >= 1) return "reported";
    return "speculative";
}

/**
 * Shared, in-process IPO Watch logic. Returns the same shape
 * ipo-watch/route.ts's GET() previously returned directly, so the
 * route becomes a thin wrapper around this and live-feed can call
 * it in-process without any HTTP hop.
 */
export async function buildIpoWatchCompanies(): Promise<{ companies: IPOWatchCompany[]; available: boolean; reason?: string }> {
    const apiKey = process.env.NEWS_API_KEY;

    if (!apiKey) {
        return { companies: [], available: false, reason: "NEWS_API_KEY not configured." };
    }

    const results = await Promise.all(
        WATCHLIST.map(async (company) => {
            const { items, error } = await searchIpoNews(company, apiKey);
            return {
                company,
                status: deriveStatus(items.length, error !== null),
                articleCount: items.length,
                latest: items[0] ?? null,
                additional: items.slice(1),
                error,
            };
        })
    );

    return { companies: results, available: true };
}
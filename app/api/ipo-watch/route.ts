import { NextResponse } from "next/server";

export interface IPOWatchItem {
    headline: string;
    source: string;
    url: string;
    publishedAt: string;
}

export interface IPOWatchCompany {
    company: string;
    /** "unavailable" means the provider call itself failed (rate limit, network,
     * etc.) -- distinct from "no_signal", which means the call succeeded and
     * genuinely found nothing. Conflating these was the root cause of the
     * dashboard silently showing 0 during a real NewsAPI quota exhaustion. */
    status: "developing" | "reported" | "speculative" | "no_signal" | "unavailable";
    articleCount: number;
    latest: IPOWatchItem | null;
    additional: IPOWatchItem[];
    error: string | null;
}

const WATCHLIST = ["OpenAI", "Anthropic"];

const RECENT_WINDOW_DAYS = 30;

export const revalidate = 3600;

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
            next: { revalidate },
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

export async function GET() {
    const apiKey = process.env.NEWS_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ companies: [], available: false, reason: "NEWS_API_KEY not configured." });
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

    return NextResponse.json({ companies: results, available: true });
}

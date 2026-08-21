import { NextResponse } from "next/server";

export interface IPOWatchItem {
    headline: string;
    source: string;
    url: string;
    publishedAt: string;
}

export interface IPOWatchCompany {
    company: string;
    status: "developing" | "reported" | "speculative" | "no_signal";
    articleCount: number;
    latest: IPOWatchItem | null;
    additional: IPOWatchItem[];
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

async function searchIpoNews(company: string, apiKey: string): Promise<IPOWatchItem[]> {
    try {
        const from = new Date();
        from.setDate(from.getDate() - RECENT_WINDOW_DAYS);

        const query = `"${company}" AND (IPO OR "going public" OR "public offering")`;
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

        if (!response.ok) return [];

        const data = await response.json();
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

        return deduped.sort((x, y) => new Date(y.publishedAt).getTime() - new Date(x.publishedAt).getTime());
    } catch {
        return [];
    }
}

function deriveStatus(articleCount: number): IPOWatchCompany["status"] {
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
        WATCHLIST.map(async (company): Promise<IPOWatchCompany> => {
            const items = await searchIpoNews(company, apiKey);
            return {
                company,
                status: deriveStatus(items.length),
                articleCount: items.length,
                latest: items[0] ?? null,
                additional: items.slice(1),
            };
        })
    );

    return NextResponse.json({ companies: results, available: true });
}

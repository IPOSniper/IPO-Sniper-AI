import { NextResponse } from "next/server";

/**
 * Feeds the Workstation landing page's news rail — a general,
 * ticker-agnostic stream shown before the user has entered anything
 * into Research Target. This is deliberately separate from
 * engine/evidence/providers (SECEdgarProvider, NewsAPIProvider),
 * which are per-ticker research inputs for a running analysis, not a
 * homepage feed. Do not point this at engine/news/* — that directory
 * is an earlier, unfinished parallel attempt at a news layer (stub
 * classes, unreferenced anywhere) and should eventually be deleted
 * rather than built on.
 *
 * Every item is honestly labeled with its real source and a working
 * link, in keeping with the "real data, never faked" product story —
 * no placeholder headlines if a provider fails or a key is missing;
 * that provider's items are just silently omitted instead.
 */

export interface MarketNewsItem {
    id: string;
    category: "breaking" | "sec" | "markets";
    headline: string;
    snippet: string | null;
    source: string;
    url: string;
    publishedAt: string; // ISO 8601
}

// Revalidate at most every 2 minutes — this route is hit by every
// visitor landing on /workstation, so cache instead of re-fetching
// three upstream APIs per page view.
export const revalidate = 120;

// Form types worth surfacing on an IPO/institutional research feed.
// The unfiltered getcurrent feed is dominated by Form 4 (individual
// insider trades) — real data, but noise for this product's purpose.
// SEC's getcurrent only accepts one `type` per request, so these run
// in parallel and get merged rather than one combined call.
const RELEVANT_SEC_FORM_TYPES = ["S-1", "424B4", "8-K", "13F-HR"];

async function fetchSecFilings(): Promise<MarketNewsItem[]> {
    const userAgent = process.env.SEC_EDGAR_USER_AGENT;
    if (!userAgent) return [];

    try {
        const results = await Promise.all(
            RELEVANT_SEC_FORM_TYPES.map(type =>
                fetch(
                    `https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=${encodeURIComponent(type)}&company=&dateb=&owner=include&count=8&output=atom`,
                    { headers: { "User-Agent": userAgent }, next: { revalidate } }
                ).then(res => res.ok ? res.text() : null).catch(() => null)
            )
        );

        const items: MarketNewsItem[] = [];

        results.forEach((xml, typeIndex) => {
            if (!xml) return;

            // Lightweight Atom parsing via regex rather than pulling in an
            // XML dependency for one feed — SEC's <entry> shape here is
            // stable and simple. Swap for a real parser (e.g. fast-xml-parser)
            // if this needs to get more robust later.
            const entries = xml.split("<entry>").slice(1);

            entries.forEach((entry, i) => {
                const title = entry.match(/<title>([^<]*)<\/title>/)?.[1] ?? "SEC filing";
                const link = entry.match(/<link[^>]*href="([^"]*)"/)?.[1] ?? "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent";
                const updated = entry.match(/<updated>([^<]*)<\/updated>/)?.[1] ?? new Date().toISOString();

                items.push({
                    id: `sec-${typeIndex}-${i}-${updated}`,
                    category: "sec" as const,
                    headline: decodeXmlEntities(title),
                    snippet: null,
                    source: "SEC EDGAR",
                    url: link,
                    publishedAt: updated,
                });
            });
        });

        return items;
    } catch {
        return [];
    }
}

async function fetchNewsApiHeadlines(): Promise<MarketNewsItem[]> {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) return [];

    try {
        const params = new URLSearchParams({
            category: "business",
            language: "en",
            pageSize: "12",
            apiKey,
        });

        const response = await fetch(
            `https://newsapi.org/v2/top-headlines?${params.toString()}`,
            { next: { revalidate } }
        );

        if (!response.ok) return [];

        const data = await response.json();
        const articles: Array<{
            title: string;
            description: string | null;
            url: string;
            publishedAt: string;
            source?: { name?: string };
        }> = data.articles ?? [];

        return articles.map((a, i) => ({
            id: `newsapi-${i}-${a.url}`,
            category: "breaking" as const,
            headline: a.title,
            snippet: a.description,
            source: a.source?.name ?? "News",
            url: a.url,
            publishedAt: a.publishedAt,
        }));
    } catch {
        return [];
    }
}

async function fetchFinnhubMarketNews(): Promise<MarketNewsItem[]> {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) return [];

    try {
        const response = await fetch(
            `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`,
            { next: { revalidate } }
        );

        if (!response.ok) return [];

        const data: Array<{
            id: number;
            headline: string;
            summary: string;
            source: string;
            url: string;
            datetime: number; // unix seconds
        }> = await response.json();

        return data.slice(0, 12).map(item => ({
            id: `finnhub-${item.id}`,
            category: "markets" as const,
            headline: item.headline,
            snippet: item.summary || null,
            source: item.source,
            url: item.url,
            publishedAt: new Date(item.datetime * 1000).toISOString(),
        }));
    } catch {
        return [];
    }
}

function decodeXmlEntities(s: string): string {
    return s
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

export async function GET() {
    const [sec, breaking, markets] = await Promise.all([
        fetchSecFilings(),
        fetchNewsApiHeadlines(),
        fetchFinnhubMarketNews(),
    ]);

    const items = [...breaking, ...sec, ...markets]
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 30);

    // Tell the client which sources actually returned something, so
    // the UI can say "SEC feed unavailable" honestly instead of just
    // showing fewer items with no explanation.
    const sources = {
        sec: sec.length > 0,
        breaking: breaking.length > 0,
        markets: markets.length > 0,
    };

    return NextResponse.json({ items, sources, fetchedAt: new Date().toISOString() });
}

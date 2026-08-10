import type { NewsArticle } from "../package";

/**
 * Real client against NewsAPI.org's /v2/everything endpoint —
 * documented, well-known, requires NEWS_API_KEY. Written against
 * their documented response shape, not run live (no network access
 * in the sandbox this was built in).
 *
 * NOTE ON PROVIDER CHOICE: the original product notes mentioned
 * "Ground News" as an intended source. Ground News is a consumer
 * bias-comparison product — I could not confirm it has a public
 * developer API from what I know, so I did not build against it
 * rather than guess at an API that may not exist. NewsAPI.org is a
 * real, documented alternative. If Ground News does have a
 * developer API, swap the implementation here — NewsProvider below
 * is the interface any provider needs to satisfy.
 */

export interface RawArticle {
    title: string;
    source: string;
    url: string;
    publishedAt: string;
    description: string | null;
}

export interface NewsProvider {
    search(query: string, fromDate?: string): Promise<RawArticle[]>;
}

export class NewsAPIProvider implements NewsProvider {

    async search(query: string, fromDate?: string): Promise<RawArticle[]> {

        const apiKey = process.env.NEWS_API_KEY;

        if (!apiKey) {
            throw new Error("NEWS_API_KEY is missing.");
        }

        const params = new URLSearchParams({
            q: query,
            sortBy: "publishedAt",
            language: "en",
            apiKey,
        });

        if (fromDate) {
            params.set("from", fromDate);
        }

        const response = await fetch(
            `https://newsapi.org/v2/everything?${params.toString()}`,
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error(`NewsAPI request failed: ${response.status}`);
        }

        const data = await response.json();

        const articles = data.articles ?? [];

        return articles.map((a: {
            title: string;
            source?: { name?: string };
            url: string;
            publishedAt: string;
            description: string | null;
        }) => ({
            title: a.title,
            source: a.source?.name ?? "Unknown source",
            url: a.url,
            publishedAt: a.publishedAt,
            description: a.description,
        }));
    }

}

export function toNewsArticle(raw: RawArticle): NewsArticle {
    return {
        title: raw.title,
        source: raw.source,
        url: raw.url,
        publishedAt: raw.publishedAt,
    };
}

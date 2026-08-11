import type { RawArticle, NewsProvider } from "./NewsAPIProvider";

/**
 * Real client against Currents API's /v1/search endpoint --
 * documented at https://currentsapi.services/en/docs/, requires
 * CURRENTS_API_KEY. Written against their documented response shape
 * (confirmed via a real fetch of their docs page, not guessed), not
 * run live.
 *
 * WHY THIS EXISTS ALONGSIDE NewsAPIProvider: NewsAPI.org's free
 * Developer tier has a documented, hard 24-hour article delay (their
 * own terms) -- confirmed via web search when a real breaking story
 * (RIOT/Anthropic deal, Aug 10 2026) didn't appear in this app's news
 * feed for hours after major outlets had it. Currents advertises
 * "newly indexed stories... without an artificial plan delay" on
 * their own pricing page.
 *
 * IMPORTANT, READ BEFORE RELYING ON THIS COMMERCIALLY: Currents'
 * own documentation (currentsapi.services/en/docs, "Getting
 * Started" section) states plainly: "We provide free plans for
 * development, open-source, and non-commercial use." That is
 * DIRECTLY CONTRADICTED by several third-party blog posts (some
 * self-promotional, e.g. a competing API's own blog) claiming
 * Currents' free tier permits commercial use -- this file trusts
 * Currents' own first-party terms over those secondhand claims.
 * If IPO Sniper AI is a commercial product (it is), confirm
 * commercial terms directly with Currents before relying on the
 * free tier in production, or budget for their Builder plan
 * ($69/mo) before public launch.
 *
 * Response field names differ from NewsAPI.org: "published" not
 * "publishedAt", space-separated format ("2019-09-18 21:08:58
 * +0000") not ISO 8601 -- normalized to ISO in toRawArticle() below
 * so NewsBuilder.ts can treat both providers identically.
 */

interface CurrentsArticle {
    id: string;
    title: string;
    description: string | null;
    url: string;
    author: string;
    image: string;
    language: string;
    category: string[];
    published: string;
}

interface CurrentsResponse {
    status: string;
    news: CurrentsArticle[];
}

function extractDomain(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return "Unknown source";
    }
}

function toRawArticle(a: CurrentsArticle): RawArticle {
    // "2019-09-18 21:08:58 +0000" -> valid ISO-parseable string.
    // Date's constructor actually handles this space-separated
    // format fine in modern JS engines, but normalizing explicitly
    // here avoids depending on that being true forever.
    const isoGuess = a.published.replace(" ", "T").replace(" +0000", "Z");
    const parsed = new Date(isoGuess);
    const publishedAt = Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();

    return {
        title: a.title,
        // Currents' documented response has no dedicated
        // outlet-name field (unlike NewsAPI.org's source.name) --
        // "author" is inconsistently a person or an outlet handle
        // in their own examples, so it's not reliable either.
        // Extracting the real domain from the URL is honest and
        // verifiable; hardcoding "Currents" here would mislabel
        // every real outlet (Reuters, Bloomberg, etc.) as the
        // aggregator's own name.
        source: extractDomain(a.url),
        url: a.url,
        publishedAt,
        description: a.description,
    };
}

export class CurrentsAPIProvider implements NewsProvider {

    async search(query: string, fromDate?: string): Promise<RawArticle[]> {

        const apiKey = process.env.CURRENTS_API_KEY;

        if (!apiKey) {
            throw new Error("CURRENTS_API_KEY is missing.");
        }

        const params = new URLSearchParams({
            keywords: query,
            language: "en",
            apiKey,
        });

        // Currents' documented endpoints are /latest-news (no query
        // filter) and /search (keyword-filterable) -- /search is the
        // right one here since we need results scoped to a specific
        // company. Their docs page doesn't show a documented
        // start_date param for /search, so fromDate is accepted for
        // interface compatibility with NewsProvider but not sent --
        // results are filtered by recency via sort in NewsBuilder.ts
        // instead. Revisit if Currents adds/documents a date param.
        void fromDate;

        const response = await fetch(
            `https://api.currentsapi.services/v1/search?${params.toString()}`,
            { next: { revalidate: 300 } } // 5 min -- this is the real-time-leaning source, cache it shorter than a 24h-delayed one
        );

        if (!response.ok) {
            throw new Error(`Currents API request failed: ${response.status}`);
        }

        const data: CurrentsResponse = await response.json();

        if (data.status !== "ok") {
            throw new Error("Currents API returned a non-ok status.");
        }

        return data.news.map(toRawArticle);
    }
}

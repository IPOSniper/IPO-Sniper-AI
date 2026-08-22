/**
 * Real client against GDELT's DOC 2.0 API -- documented at
 * https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/ and
 * https://blog.gdeltproject.org/doc-2-0-api-now-supports-near-and-repeat-operators/
 * (confirmed via direct search of GDELT's own project blog). No API key
 * required -- GDELT is a free, publicly funded project.
 *
 * Shared Intelligence Bootstrap, Phase B: this is a discovery/event layer,
 * NOT a content source. GDELT's DOC API returns only metadata (title, url,
 * domain, language, publish time) -- never full article text. The actual
 * article still lives at the source URL.
 *
 * Real, honest limitations stated directly:
 * - DOC API searches only the last 24 hours by default (extendable via
 *   timespan, but GDELT's own docs describe reliable historical reach as
 *   roughly the last 3 months, not a full archive).
 * - Bare query terms and OR-blocks are implicitly ANDed together -- there
 *   is no explicit AND keyword.
 * - Returns at most 250 records per request, no pagination.
 */

export interface GdeltArticle {
    title: string;
    url: string;
    domain: string;
    language: string;
    publishedAt: string;
}

export type GdeltSearchStatus = "ok" | "error";

export interface GdeltSearchResult {
    articles: GdeltArticle[];
    status: GdeltSearchStatus;
    error: string | null;
}

const GDELT_BASE_URL = "https://api.gdeltproject.org/api/v2/doc/doc";
const DEFAULT_TIMESPAN = "3d";
const DEFAULT_MAX_RECORDS = 50;
const REQUEST_TIMEOUT_MS = 8000;

interface GdeltRawArticle {
    url: string;
    title: string;
    seendate: string;
    domain: string;
    language: string;
    sourcecountry: string;
}

interface GdeltRawResponse {
    articles?: GdeltRawArticle[];
}

function normalizeGdeltTimestamp(seendate: string): string {
    const match = seendate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    if (!match) {
        return new Date().toISOString();
    }
    const [, year, month, day, hour, minute, second] = match;
    return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
}

function extractDomain(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return "Unknown source";
    }
}

/**
 * Real query against GDELT's DOC API article-list mode.
 * @param query   A real GDELT query string using documented operators --
 *                e.g. `"OpenAI" (IPO OR "going public" OR "S-1")`.
 */
export async function searchGdelt(
    query: string,
    timespan: string = DEFAULT_TIMESPAN,
    maxRecords: number = DEFAULT_MAX_RECORDS
): Promise<GdeltSearchResult> {
    const boundedMaxRecords = Math.min(Math.max(1, maxRecords), 250);

    const params = new URLSearchParams({
        query,
        mode: "artlist",
        format: "json",
        timespan,
        maxrecords: String(boundedMaxRecords),
        sort: "datedesc",
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(`${GDELT_BASE_URL}?${params.toString()}`, {
            signal: controller.signal,
            cache: "no-store",
        });

        if (!response.ok) {
            return { articles: [], status: "error", error: `GDELT request failed: ${response.status}` };
        }

        const data: GdeltRawResponse = await response.json();
        const rawArticles = data.articles ?? [];

        const seen = new Set<string>();
        const articles: GdeltArticle[] = [];
        for (const a of rawArticles) {
            if (seen.has(a.url)) continue;
            seen.add(a.url);
            articles.push({
                title: a.title,
                url: a.url,
                domain: a.domain || extractDomain(a.url),
                language: a.language || "unknown",
                publishedAt: normalizeGdeltTimestamp(a.seendate),
            });
        }

        return { articles, status: "ok", error: null };
    } catch (err) {
        const message = err instanceof Error
            ? (err.name === "AbortError" ? `GDELT request timed out after ${REQUEST_TIMEOUT_MS}ms` : err.message)
            : "Unknown GDELT error";
        return { articles: [], status: "error", error: message };
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Builds an IPO-relevance query for a given company using GDELT's real
 * exact-phrase and OR-block operators -- mirrors the query shape already
 * used against NewsAPI in buildIpoWatchCompanies.ts, adapted to GDELT's
 * documented syntax.
 */
export function buildIpoRelevanceQuery(company: string): string {
    return `"${company}" (IPO OR "going public" OR "public offering" OR "S-1" OR "confidential filing" OR "stock market debut") sourcelang:english`;
}
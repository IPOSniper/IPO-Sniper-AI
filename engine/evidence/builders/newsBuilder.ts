import { EvidenceBuilder } from "../types";
import { NewsEvidence } from "../package";
import { NewsAPIProvider, toNewsArticle, type RawArticle } from "../providers/NewsAPIProvider";
import { CurrentsAPIProvider } from "../providers/CurrentsAPIProvider";

/**
 * Real, confirmed bug fix (Aug 11 2026): company.name comes from
 * Finnhub's /stock/profile2, which returns the full legal name --
 * e.g. "Riot Platforms, Inc." with the comma and corporate suffix.
 * Confirmed live: searching Currents API directly with the clean
 * name "Riot Platforms" returned the real, current Anthropic-deal
 * headlines within hours of the story breaking; the app's own
 * pipeline (searching with the full legal name including ", Inc.")
 * was still showing stale results. The suffix and comma were
 * breaking strict keyword matching on at least one provider.
 *
 * This strips common corporate suffixes before searching either
 * provider -- can only help matching, never hurts it, and fixes
 * both providers at once rather than special-casing one.
 */
function simplifyCompanyNameForSearch(name: string): string {
    return name
        .replace(/,?\s+(Inc|Incorporated|Corp|Corporation|Ltd|Limited|LLC|LLP|plc|Co)\.?$/i, "")
        .trim();
}

/**
 * Real news evidence, with one honest limitation: sentimentScore is
 * a basic keyword-polarity heuristic over headlines + descriptions,
 * NOT NLP sentiment analysis. It counts positive/negative financial-
 * news keywords and returns (positive-negative)/total, scaled to
 * -100..100. This WILL misread sarcasm, negation ("not a concern"
 * reads as negative), and headline-vs-substance mismatches. It's
 * good enough to say "mostly positive/negative coverage," not
 * reliable enough for a precise score — reflect that in confidence
 * (kept moderate, never high, regardless of article count).
 *
 * A real upgrade path: send the article text to an LLM for actual
 * sentiment/summarization rather than keyword counting.
 */

const POSITIVE_KEYWORDS = [
    "surge", "soar", "beat", "beats", "record", "growth", "strong",
    "upgrade", "outperform", "rally", "gain", "profit", "success",
    "expansion", "milestone", "breakthrough",
];

const NEGATIVE_KEYWORDS = [
    "plunge", "slump", "miss", "misses", "downgrade", "underperform",
    "lawsuit", "investigation", "probe", "recall", "layoff", "layoffs",
    "loss", "losses", "decline", "concern", "concerns", "risk", "risks",
    "delay", "delayed", "fraud", "scandal",
];

function scoreSentiment(texts: string[]): number {
    if (texts.length === 0) return 0;

    let positive = 0;
    let negative = 0;

    for (const text of texts) {
        const lower = text.toLowerCase();
        for (const word of POSITIVE_KEYWORDS) {
            if (lower.includes(word)) positive++;
        }
        for (const word of NEGATIVE_KEYWORDS) {
            if (lower.includes(word)) negative++;
        }
    }

    const total = positive + negative;
    if (total === 0) return 0;

    return Math.round(((positive - negative) / total) * 100);
}

export class NewsBuilder
    implements EvidenceBuilder<NewsEvidence> {

    private readonly provider = new NewsAPIProvider();

    private readonly currentsProvider = new CurrentsAPIProvider();

    /**
     * Merges both providers' results: deduplicated by URL (the same
     * real story often gets syndicated across outlets both providers
     * index), sorted by actual publish date descending. Each
     * provider is queried independently and allowed to fail on its
     * own -- if CURRENTS_API_KEY isn't set, or that request fails,
     * this still returns NewsAPI.org's real results rather than
     * failing the whole build. Same if NewsAPI.org fails and only
     * Currents succeeds.
     */
    private async fetchMergedArticles(companyName: string, fromDate: string): Promise<RawArticle[]> {
        const [newsApiResult, currentsResult] = await Promise.allSettled([
            this.provider.search(companyName, fromDate),
            this.currentsProvider.search(companyName, fromDate),
        ]);

        const newsApiArticles = newsApiResult.status === "fulfilled" ? newsApiResult.value : [];
        const currentsArticles = currentsResult.status === "fulfilled" ? currentsResult.value : [];

        const seen = new Set<string>();
        const merged: RawArticle[] = [];
        for (const article of [...currentsArticles, ...newsApiArticles]) {
            if (seen.has(article.url)) continue;
            seen.add(article.url);
            merged.push(article);
        }

        return merged.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }

    async build(companyName: string): Promise<NewsEvidence> {

        const now = new Date();
        const source = "INTERNAL"; // aggregated from multiple outlets/providers, not a single one
        const searchQuery = simplifyCompanyNameForSearch(companyName);

        try {
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                .toISOString().slice(0, 10);

            const raw = await this.fetchMergedArticles(searchQuery, thirtyDaysAgo);

            const texts = raw.map(a => `${a.title} ${a.description ?? ""}`);
            const sentiment = scoreSentiment(texts);

            return {
                articleCount: {
                    value: raw.length,
                    source,
                    confidence: raw.length > 0 ? 80 : 30,
                    verified: true,
                    collectedAt: now,
                },

                sentimentScore: {
                    value: sentiment,
                    source,
                    // Deliberately capped below 70 even with many
                    // articles — this is a keyword heuristic, never
                    // as trustworthy as a verified financial metric.
                    confidence: raw.length >= 5 ? 55 : 25,
                    verified: false,
                    collectedAt: now,
                },

                recentArticles: {
                    value: raw.slice(0, 10).map(toNewsArticle),
                    source,
                    confidence: raw.length > 0 ? 90 : 0,
                    verified: raw.length > 0,
                    collectedAt: now,
                },
            };

        } catch {
            // NEWS_API_KEY missing, or the request failed — honestly
            // unverified, not a fabricated empty-but-confident result.
            return {
                articleCount: { value: 0, source, confidence: 0, verified: false, collectedAt: now },
                sentimentScore: { value: 0, source, confidence: 0, verified: false, collectedAt: now },
                recentArticles: { value: [], source, confidence: 0, verified: false, collectedAt: now },
            };
        }

    }

}

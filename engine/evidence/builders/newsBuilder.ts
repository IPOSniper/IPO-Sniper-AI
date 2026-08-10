import { EvidenceBuilder } from "../types";
import { NewsEvidence } from "../package";
import { NewsAPIProvider, toNewsArticle } from "../providers/NewsAPIProvider";

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

    async build(companyName: string): Promise<NewsEvidence> {

        const now = new Date();
        const source = "INTERNAL"; // aggregated from multiple outlets, not a single provider

        try {
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                .toISOString().slice(0, 10);

            const raw = await this.provider.search(companyName, thirtyDaysAgo);

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

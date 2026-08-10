import type { Analyst } from "../contracts/Analyst";
import type { AnalystReport } from "../contracts/AnalystReport";
import type { EvidencePackage } from "../../evidence/package";
import { MIN_USABLE_CONFIDENCE, insufficientDataReport } from "./shared/insufficientData";

/**
 * Unblocked as of the real NewsBuilder (engine/evidence/builders/
 * newsBuilder.ts) wiring in NewsAPI.org. Read that file's comment
 * before trusting this analyst's output — sentimentScore is a
 * keyword-polarity heuristic, not real NLP sentiment, and this
 * analyst's confidence is capped accordingly. It will not catch
 * sarcasm, negation, or headline/substance mismatches.
 */
export class NewsAnalyst implements Analyst<EvidencePackage> {

  readonly name = "News Analyst";
  readonly version = "1.0.0";

  async analyze(
    input: EvidencePackage
  ): Promise<AnalystReport> {

    if (input.news.sentimentScore.confidence < MIN_USABLE_CONFIDENCE) {
      return insufficientDataReport(this.name, ["sentimentScore", "articleCount"]);
    }

    const sentiment = input.news.sentimentScore.value;
    const articleCount = input.news.articleCount.value;
    const recentArticles = input.news.recentArticles.value ?? [];
    // Most recent first, capped at 2 -- enough to make the thesis
    // concrete without turning it into a headline dump.
    const citedArticles = [...recentArticles]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 2);

    const recommendation =
      sentiment >= 40
        ? "STRONG_BUY"
        : sentiment >= 15
        ? "BUY"
        : sentiment >= -15
        ? "HOLD"
        : sentiment >= -40
        ? "REDUCE"
        : "SELL";

    const score = Math.max(0, Math.min(100, Math.round(50 + sentiment / 2)));

    const headlineClause = citedArticles.length > 0
      ? ` Most recent: "${citedArticles[0].title}" (${citedArticles[0].source})${
          citedArticles.length > 1 ? `, and "${citedArticles[1].title}" (${citedArticles[1].source})` : ""
        }.`
      : "";

    return {

      analyst: this.name,

      recommendation,

      score,

      confidence: input.news.sentimentScore.confidence,

      evidenceStrength: input.news.articleCount.confidence,

      thesis:
        `Coverage over the last 30 days (${articleCount} articles) reads ${
          sentiment > 15 ? "net positive" : sentiment < -15 ? "net negative" : "mixed/neutral"
        } on a keyword basis (score ${sentiment}).${headlineClause}`,

      evidence: [
        {
          category: "News",
          metric: "Sentiment Score (keyword heuristic)",
          value: sentiment,
          source: input.news.sentimentScore.source,
          confidence: input.news.sentimentScore.confidence,
          verified: input.news.sentimentScore.verified,
          collectedAt: input.news.sentimentScore.collectedAt
        },
        {
          category: "News",
          metric: "Article Count (30d)",
          value: articleCount,
          source: input.news.articleCount.source,
          confidence: input.news.articleCount.confidence,
          verified: input.news.articleCount.verified,
          collectedAt: input.news.articleCount.collectedAt
        },
        // Real cited headlines, not just the aggregate count -- lets
        // anyone reading this analyst's report see exactly which
        // real articles the sentiment number is actually summarizing.
        ...citedArticles.map(article => ({
          category: "News",
          metric: "Cited Headline",
          value: `${article.title} — ${article.source}`,
          source: input.news.recentArticles.source,
          confidence: input.news.recentArticles.confidence,
          verified: input.news.recentArticles.verified,
          collectedAt: input.news.recentArticles.collectedAt
        }))
      ],

      assumptions: [
        {
          statement: "Sentiment is keyword-based, not true NLP — treat as directional only, not precise.",
          confidence: 40
        }
      ],

      risks:
        sentiment < -15
          ? [
              {
                category: "News",
                severity: sentiment < -40 ? "HIGH" : "MEDIUM",
                description: "Recent coverage skews negative on a keyword basis."
              }
            ]
          : [],

      unknowns: articleCount < 3
        ? ["Low article volume — sentiment read may not be representative."]
        : [],

      monitoring: [
        {
          title: "News Sentiment Trend",
          description: "Re-run and compare sentiment week over week rather than trusting a single snapshot.",
          priority: "MEDIUM"
        }
      ]

    };

  }

}

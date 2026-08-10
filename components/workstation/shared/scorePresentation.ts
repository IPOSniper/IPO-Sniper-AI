import type { CommitteeReport } from "@/engine/committee/contracts/CommitteeReport";
import type { AnalystReport } from "@/engine/committee/contracts/AnalystReport";
import type { Recommendation } from "@/engine/committee/contracts/types";

/**
 * Recomputes a committee view EXCLUDING specific analysts — used by
 * the Share Card generator to exclude News Analyst (NewsAPI's free
 * tier ToS forbids any production/public use, see newsBuilder.ts)
 * without needing a second, real committee run. Deliberately
 * mirrors ChiefInvestmentOfficer's own aggregation logic exactly
 * (same average/determineRecommendation/calculateAgreement
 * thresholds) rather than inventing different math for the "safe"
 * view — the two numbers should only differ by which analysts are
 * included, not by using a different formula.
 */
export function excludeAnalysts(
    committee: CommitteeReport,
    excludeNames: string[]
): { score: number; confidence: number; agreement: number; recommendation: Recommendation } {

    const included = committee.reports.filter(
        r => r.confidence > 0 && !excludeNames.includes(r.analyst)
    );

    const average = (values: number[]) =>
        values.length === 0 ? 0 : Math.round(values.reduce((s, v) => s + v, 0) / values.length);

    const score = average(included.map(r => r.score));
    const confidence = average(included.map(r => r.confidence));

    const votes = new Map<Recommendation, number>();
    for (const r of included) {
        votes.set(r.recommendation, (votes.get(r.recommendation) ?? 0) + 1);
    }
    const agreement = included.length === 0
        ? 0
        : Math.round((Math.max(...votes.values(), 0) / included.length) * 100);

    const recommendation: Recommendation =
        score >= 90 ? "STRONG_BUY" :
        score >= 80 ? "BUY" :
        score >= 65 ? "HOLD" :
        score >= 50 ? "REDUCE" :
        "SELL";

    return { score, confidence, agreement, recommendation };
}

/**
 * Maps the internal BUY/SELL/HOLD vocabulary to the plain-language
 * Bullish/Neutral/Bearish framing.
 */
export function recommendationToRating(recommendation: Recommendation): "Bullish" | "Neutral" | "Bearish" {
    if (recommendation === "STRONG_BUY" || recommendation === "BUY") return "Bullish";
    if (recommendation === "REDUCE" || recommendation === "SELL") return "Bearish";
    return "Neutral";
}

/**
 * Buckets a 0-100 confidence/strength number into a plain-language
 * label. Thresholds are a presentation choice, not derived from
 * anything — documented here so they're easy to find and adjust.
 */
export function strengthLabel(pct: number): "Low" | "Moderate" | "High" | "Strong" {
    if (pct >= 75) return "Strong";
    if (pct >= 50) return "High";
    if (pct >= 25) return "Moderate";
    return "Low";
}

export function averageEvidenceStrength(reports: AnalystReport[]): number {
    const scored = reports.filter(r => r.confidence > 0);
    if (scored.length === 0) return 0;
    return Math.round(scored.reduce((s, r) => s + r.evidenceStrength, 0) / scored.length);
}

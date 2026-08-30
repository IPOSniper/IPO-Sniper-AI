/**
 * Real, deliberate risk-mitigation change (Aug 29): the raw internal
 * recommendation values (STRONG_BUY, BUY, HOLD, REDUCE, SELL) are
 * literal transaction-instruction verbs attached to named securities
 * -- exactly the pattern the Public Intelligence Contract's content
 * rules exist to prevent for Quant-derived content, and a real,
 * unreviewed risk for this product's own native committee verdicts.
 *
 * Internal values are UNCHANGED -- they remain STRONG_BUY/BUY/HOLD/
 * REDUCE/SELL everywhere in scoring logic, database storage
 * (research_history.recommendation), and internal comparisons.
 * Only the DISPLAY label changes, at the single point every real
 * UI component should render from, so this can't silently regress
 * if a new panel is added later without going through this function.
 *
 * Parameter typed as `string`, not the stricter Recommendation type,
 * deliberately -- at least two separate Recommendation-style types
 * exist in this codebase (engine/committee/contracts/types.ts and
 * types/recommendation.ts), and this function needs to work safely
 * from both without assuming they're identical.
 *
 * Never render a recommendation value directly in JSX for user-facing
 * display. Always call getRecommendationLabel(recommendation) instead.
 */
export function getRecommendationLabel(recommendation: string): string {
    switch (recommendation) {
        case "STRONG_BUY":
            return "Strong Bullish Evidence";
        case "BUY":
            return "Bullish Evidence";
        case "HOLD":
            return "Mixed Evidence";
        case "REDUCE":
            return "Bearish Evidence";
        case "SELL":
            return "Strong Bearish Evidence";
        default:
            // Exhaustiveness guard -- if a new recommendation value is
            // ever added without updating this function, fail loudly
            // in development rather than silently showing a raw
            // internal value (e.g. "BUY") to a real user.
            return recommendation;
    }
}

/**
 * Short label variant for tight spaces (badges, compact rows) where
 * the full phrase doesn't fit. Still never a raw transaction verb.
 */
export function getRecommendationShortLabel(recommendation: string): string {
    switch (recommendation) {
        case "STRONG_BUY":
            return "Strong Bullish";
        case "BUY":
            return "Bullish";
        case "HOLD":
            return "Mixed";
        case "REDUCE":
            return "Bearish";
        case "SELL":
            return "Strong Bearish";
        default:
            return recommendation;
    }
}

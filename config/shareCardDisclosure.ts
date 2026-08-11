/**
 * Governs exactly what News Analyst content is allowed onto the
 * public Share Card. Real, checkable defaults -- not a guess at
 * what's "probably fine."
 *
 * Every flag defaults to false (fully excluded) TODAY, matching the
 * card's existing behavior. This is a code-quality/future-proofing
 * change, not a behavior change -- with every flag false, output is
 * identical to before this file existed.
 *
 * The proposed distinction between "derived output" (vote,
 * confidence, impact score) and "underlying licensed data"
 * (headlines, source excerpts, full reasoning) is a real, sensible
 * one -- but it's also a genuine legal judgment call about what
 * counts as "redistribution" under NewsAPI.org's and Currents API's
 * terms, not something to decide by flipping a default in code. Flip
 * includeNewsVote/includeNewsScore to true only after that
 * distinction has actually been confirmed (by the provider directly,
 * or by counsel) -- not as an engineering decision made here.
 *
 * When a commercial license is obtained from either provider (see
 * docs/MIGRATION_MATRIX.md's News data sourcing section), that's the
 * point to revisit includeLicensedHeadlines too.
 */
export interface ShareCardDisclosureConfig {
    /** The News Analyst's own written reasoning/thesis text on the public card. */
    includeNewsReasoning: boolean;
    /** The News Analyst's BUY/HOLD/SELL vote counted in the public card's aggregate recommendation. */
    includeNewsVote: boolean;
    /** The News Analyst's confidence/evidence-strength score shown on the public card. */
    includeNewsScore: boolean;
    /** Actual headlines/source excerpts/article text from NewsAPI.org or Currents API on the public card. */
    includeLicensedHeadlines: boolean;
}

export const SHARE_CARD_DISCLOSURE: ShareCardDisclosureConfig = {
    includeNewsReasoning: false,
    includeNewsVote: false,
    includeNewsScore: false,
    includeLicensedHeadlines: false,
};

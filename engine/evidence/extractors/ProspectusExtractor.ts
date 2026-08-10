/**
 * Heuristic, regex-based extraction from raw prospectus text (S-1/
 * 424B4). This is NOT NLP and NOT a substitute for actually reading
 * the filing — it's pattern-matching on boilerplate SEC filing
 * conventions that are common but not universal. Every method here
 * can legitimately return nothing on a filing that's formatted
 * differently than expected; callers must treat that as "couldn't
 * extract," not "no underwriters" / "no risks."
 *
 * A materially better version of this would call an LLM to actually
 * read and summarize the filing (Anthropic's API supports this —
 * see docs.claude.com — feeding it the extracted plain text from
 * SECEdgarProvider.getFilingText() and asking for structured
 * underwriters/risk-factor output). That's a real, worthwhile
 * upgrade path; this version is regex-only.
 */
export class ProspectusExtractor {

    /**
     * Underwriters are conventionally listed on the cover page near
     * phrases like "Joint Book-Running Managers" or "Underwriters".
     * This looks for capitalized multi-word sequences within a
     * window after those phrases — a real heuristic, but it WILL
     * miss unconventional formatting and can pick up false positives
     * from nearby boilerplate.
     */
    extractUnderwriters(text: string): string[] {

        const anchors = [
            /Joint Book-Running Managers?/i,
            /Book-Running Managers?/i,
            /Underwriters?\s+for\s+the\s+offering/i,
        ];

        for (const anchor of anchors) {
            const match = anchor.exec(text);
            if (!match) continue;

            const window = text.slice(match.index, match.index + 500);

            // Sequences of 2+ capitalized words (e.g. "Goldman Sachs",
            // "Morgan Stanley & Co."), deduplicated.
            const nameMatches = window.match(
                /\b([A-Z][a-zA-Z&.]+(?:\s+[A-Z][a-zA-Z&.]+){1,3})\b/g
            );

            if (nameMatches && nameMatches.length > 0) {
                return [...new Set(nameMatches)].slice(0, 6);
            }
        }

        return [];
    }

    /**
     * Splits the "Item 1A. Risk Factors" section (if found) into
     * paragraph-like chunks and returns a count. Filings vary
     * enough in formatting that this undercounts more often than it
     * overcounts — treat the number as "at least this many," not
     * exact.
     */
    countRiskFactorParagraphs(text: string): number {

        const startMatch = /Item\s+1A\.?\s+Risk\s+Factors/i.exec(text);
        const endMatch = /Item\s+1B\.?\s+Unresolved\s+Staff\s+Comments/i.exec(text);

        if (!startMatch) return 0;

        const start = startMatch.index;
        const end = endMatch ? endMatch.index : Math.min(text.length, start + 50_000);

        const section = text.slice(start, end);

        // Heuristic paragraph boundary: a capital-letter sentence
        // start following at least two newline-equivalent spaces —
        // since HTML has already been stripped to a single space run,
        // this is approximate.
        const paragraphs = section
            .split(/(?<=\.)\s{2,}(?=[A-Z])/)
            .filter(p => p.trim().length > 100);

        return paragraphs.length;
    }

}

import { SECEdgarProvider } from "@/engine/evidence/providers/SECEdgarProvider";

export interface UseOfProceedsExtraction {
    found: boolean;
    excerpt: string | null;
    filingUrl: string | null;
    filingDate: string | null;
}

const MILESTONE_FORMS = ["S-1", "S-1/A"] as const;

export async function extractUseOfProceeds(ticker: string): Promise<UseOfProceedsExtraction> {
    const provider = new SECEdgarProvider();

    try {
        const cik = await provider.getCIK(ticker);
        if (!cik) return { found: false, excerpt: null, filingUrl: null, filingDate: null };

        const filings = await provider.getFilings(cik);
        const s1 = filings
            .filter(f => MILESTONE_FORMS.includes(f.formType as typeof MILESTONE_FORMS[number]))
            .sort((a, b) => new Date(b.filedAt).getTime() - new Date(a.filedAt).getTime())[0];

        if (!s1) return { found: false, excerpt: null, filingUrl: null, filingDate: null };

        const text = await provider.getFilingText(cik, s1);

        // "Use of Proceeds" is a standard, mandated S-1 section heading.
        // It typically runs until "Dividend Policy" or "Capitalization" follows.
        // Real bug fixed: .match() only finds the FIRST occurrence
        // of this heading anywhere in the filing - and a real S-1's
        // own Table of Contents lists this exact heading (confirmed
        // live: "USE OF PROCEEDS ... 38", a real page number, not
        // real body text), which sits BEFORE the actual section.
        // That TOC hit was what got captured, producing a broken
        // one-word "excerpt" like "38". Real fix: find every real
        // occurrence and use the LAST one - a filing lists a heading
        // once in its TOC, but the real section body is the other
        // (typically final) place that exact heading text appears.
        const allMatches1 = [...text.matchAll(/use\s+of\s+proceeds/gi)];
        const startMatch = allMatches1.length > 0 ? allMatches1[allMatches1.length - 1] : null;
        if (!startMatch || startMatch.index === undefined) {
            return { found: false, excerpt: null, filingUrl: provider.buildFilingUrl(cik, s1), filingDate: s1.filedAt };
        }

        const afterStart = text.slice(startMatch.index + startMatch[0].length);
        const endMatch = afterStart.match(/dividend\s+policy|capitalization/i);
        const sectionText = endMatch && endMatch.index !== undefined
            ? afterStart.slice(0, endMatch.index)
            : afterStart.slice(0, 2000);

        const excerpt = sectionText.trim().slice(0, 1500);

        return {
            found: true,
            excerpt,
            filingUrl: provider.buildFilingUrl(cik, s1),
            filingDate: s1.filedAt,
        };
    } catch {
        return { found: false, excerpt: null, filingUrl: null, filingDate: null };
    }
}

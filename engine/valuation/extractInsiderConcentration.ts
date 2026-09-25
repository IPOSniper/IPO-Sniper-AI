import { SECEdgarProvider } from "@/engine/evidence/providers/SECEdgarProvider";

export interface InsiderConcentrationExtraction {
    found: boolean;
    excerpt: string | null;
    filingUrl: string | null;
    filingDate: string | null;
}

const MILESTONE_FORMS = ["S-1", "S-1/A"] as const;

export async function extractInsiderConcentration(ticker: string): Promise<InsiderConcentrationExtraction> {
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

        // "Security Ownership of Certain Beneficial Owners and Management"
        // is the standard, mandated S-1 heading; some filings shorten it
        // to "Principal Stockholders" in the table of contents but still
        // use the full heading at the actual section.
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
        const allMatches2 = [...text.matchAll(/security\s+ownership\s+of\s+certain\s+beneficial\s+owners|principal\s+stockholders/gi)];
        const startMatch = allMatches2.length > 0 ? allMatches2[allMatches2.length - 1] : null;
        if (!startMatch || startMatch.index === undefined) {
            return { found: false, excerpt: null, filingUrl: provider.buildFilingUrl(cik, s1), filingDate: s1.filedAt };
        }

        const afterStart = text.slice(startMatch.index + startMatch[0].length);
        const endMatch = afterStart.match(/certain\s+relationships|related\s+party\s+transactions|description\s+of\s+capital\s+stock/i);
        const sectionText = endMatch && endMatch.index !== undefined
            ? afterStart.slice(0, endMatch.index)
            : afterStart.slice(0, 3000);

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

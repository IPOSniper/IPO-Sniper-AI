import { SECEdgarProvider } from "@/engine/evidence/providers/SECEdgarProvider";

export interface LockUpExtraction {
    found: boolean;
    excerpt: string | null;
    filingUrl: string | null;
    filingDate: string | null;
}

const MILESTONE_FORMS = ["S-1", "S-1/A"] as const;

export async function extractLockUpInfo(ticker: string): Promise<LockUpExtraction> {
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

        // Lock-up terms are typically disclosed under "Shares Eligible for
        // Future Sale" (which covers lock-up agreements directly) rather
        // than a standalone "Lock-Up" heading in most S-1s.
        const startMatch = text.match(/shares\s+eligible\s+for\s+future\s+sale/i);
        if (!startMatch || startMatch.index === undefined) {
            return { found: false, excerpt: null, filingUrl: provider.buildFilingUrl(cik, s1), filingDate: s1.filedAt };
        }

        const afterStart = text.slice(startMatch.index + startMatch[0].length);
        const endMatch = afterStart.match(/material\s+u\.?s\.?\s+federal|underwriting/i);
        const sectionText = endMatch && endMatch.index !== undefined
            ? afterStart.slice(0, endMatch.index)
            : afterStart.slice(0, 2500);

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

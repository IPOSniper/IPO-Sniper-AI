import { SECEdgarProvider } from "@/engine/evidence/providers/SECEdgarProvider";

export interface RiskFactorExtraction {
    found: boolean;
    excerpt: string | null;
    filingUrl: string | null;
    filingDate: string | null;
}

const MILESTONE_FORMS = ["S-1", "S-1/A"] as const;

export async function extractRiskFactors(ticker: string): Promise<RiskFactorExtraction> {
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

        // Item 1A (Risk Factors) runs until Item 1B or Item 2 in a standard S-1.
        // Case-insensitive, since filings vary in capitalization.
        const startMatch = text.match(/item\s+1a\.?\s+risk\s+factors/i);
        if (!startMatch || startMatch.index === undefined) {
            return { found: false, excerpt: null, filingUrl: provider.buildFilingUrl(cik, s1), filingDate: s1.filedAt };
        }

        const afterStart = text.slice(startMatch.index + startMatch[0].length);
        const endMatch = afterStart.match(/item\s+1b\.|item\s+2\./i);
        const sectionText = endMatch && endMatch.index !== undefined
            ? afterStart.slice(0, endMatch.index)
            : afterStart.slice(0, 3000);

        // Excerpt only -- this is a long, legally dense section. Show the
        // opening of the company's own stated risks, not the full text.
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

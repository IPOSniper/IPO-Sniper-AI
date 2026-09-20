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
        const startMatch = text.match(/security\s+ownership\s+of\s+certain\s+beneficial\s+owners|principal\s+stockholders/i);
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

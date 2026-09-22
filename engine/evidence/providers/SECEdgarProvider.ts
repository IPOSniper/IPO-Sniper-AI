/**
 * Real SEC EDGAR client — full-text filings, no API key required,
 * but SEC requires a descriptive User-Agent header identifying the
 * requester (app name + contact) or it will reject requests with a
 * 403. Set SEC_EDGAR_USER_AGENT in your environment, e.g.
 * "IPO Sniper AI research@yourcompany.com" — see SEC's fair-access
 * policy at https://www.sec.gov/os/webmaster-faq#developers.
 *
 * Written against documented EDGAR endpoints, not run against them —
 * no network access in the sandbox this was built in. Verify field
 * names once you run it live.
 */

export interface SECFiling {
    formType: string;
    filedAt: string;
    accessionNumber: string;
    primaryDocument: string;
}

interface SECSubmissionsResponse {
    cik: string;
    filings: {
        recent: {
            form: string[];
            filingDate: string[];
            accessionNumber: string[];
            primaryDocument: string[];
        };
    };
}

interface CompanyTickerEntry {
    cik_str: number;
    ticker: string;
    title: string;
}

/**
 * SEC filings are HTML, so extracted text is full of named and numeric HTML
 * entities (curly quotes, em-dashes, ampersands, non-breaking spaces) that
 * getFilingText's tag-stripping regex passes through untouched. Only &nbsp;
 * was previously decoded, so text like "we" and "our" rendered literally as
 * "&ldquo;we&rdquo;" and "&ldquo;our&rdquo;" -- fixed here, once, for every
 * caller of getFilingText rather than patching each extractor separately.
 */
const NAMED_ENTITIES: Record<string, string> = {
    "&amp;": "&", "&nbsp;": " ", "&quot;": "\"", "&apos;": "'",
    "&ldquo;": "\u201C", "&rdquo;": "\u201D",
    "&lsquo;": "\u2018", "&rsquo;": "\u2019",
    "&mdash;": "\u2014", "&ndash;": "\u2013",
    "&hellip;": "\u2026", "&lt;": "<", "&gt;": ">",
};

function decodeHtmlEntities(text: string): string {
    let result = text;
    for (const [entity, char] of Object.entries(NAMED_ENTITIES)) {
        result = result.split(entity).join(char);
    }
    // Numeric entities: &#8220; and hex &#x2019;
    result = result.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
    result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
    return result;
}

export class SECEdgarProvider {

    private readonly userAgent: string;

    constructor() {
        const configured = process.env.SEC_EDGAR_USER_AGENT;

        if (!configured) {
            throw new Error(
                "SEC_EDGAR_USER_AGENT is missing. SEC requires a " +
                "descriptive User-Agent (app name + contact email) " +
                "or it will reject requests with a 403."
            );
        }

        this.userAgent = configured;
    }

    private headers() {
        return { "User-Agent": this.userAgent };
    }

    /**
     * Looks up a company's 10-digit zero-padded CIK from its ticker.
     * SEC publishes the full ticker->CIK map as one ~1MB JSON file —
     * there's no per-ticker lookup endpoint, so this fetches the
     * whole map and searches it. Worth caching at the call site if
     * this runs per-request in production.
     */
    async getCIK(ticker: string): Promise<string | null> {

        const response = await fetch(
            "https://www.sec.gov/files/company_tickers.json",
            { headers: this.headers(), cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error(`SEC ticker lookup failed: ${response.status}`);
        }

        const data: Record<string, CompanyTickerEntry> = await response.json();

        const match = Object.values(data).find(
            entry => entry.ticker.toUpperCase() === ticker.toUpperCase()
        );

        if (!match) return null;

        return String(match.cik_str).padStart(10, "0");
    }

    /**
     * Full filing history for a CIK. SEC returns this as parallel
     * arrays (filings.recent.form[i] / filingDate[i] /
     * accessionNumber[i] all correspond to filing i), not an array
     * of objects — this reshapes it into one.
     */
    async getFilings(cik: string): Promise<SECFiling[]> {

        const response = await fetch(
            `https://data.sec.gov/submissions/CIK${cik}.json`,
            { headers: this.headers(), cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error(`SEC submissions request failed: ${response.status}`);
        }

        const data: SECSubmissionsResponse = await response.json();
        const recent = data.filings.recent;

        return recent.form.map((formType, i) => ({
            formType,
            filedAt: recent.filingDate[i],
            accessionNumber: recent.accessionNumber[i],
            primaryDocument: recent.primaryDocument[i],
        }));
    }

    /**
     * Finds the most recent filing matching any of the given form
     * types (e.g. ["S-1", "424B4"] to find the IPO prospectus,
     * checking the final prospectus first since S-1 is often
     * amended multiple times before it).
     */
    async findLatestFiling(
        cik: string,
        formTypes: string[]
    ): Promise<SECFiling | null> {

        const filings = await this.getFilings(cik);

        const matches = filings
            .filter(f => formTypes.includes(f.formType))
            .sort((a, b) => b.filedAt.localeCompare(a.filedAt));

        return matches[0] ?? null;
    }

    /**
     * Fetches the raw text of a filing document. Returns plain text
     * with HTML tags stripped via a basic regex — good enough for
     * keyword/section extraction (see ProspectusExtractor), not a
     * faithful rendering of the original document.
     */
    async getFilingText(
        cik: string,
        filing: SECFiling
    ): Promise<string> {

        const cikNoLeadingZeros = String(Number(cik));
        const accessionNoDashes = filing.accessionNumber.replace(/-/g, "");

        const url = `https://www.sec.gov/Archives/edgar/data/${cikNoLeadingZeros}/${accessionNoDashes}/${filing.primaryDocument}`;

        const response = await fetch(url, { headers: this.headers(), cache: "no-store" });

        if (!response.ok) {
            throw new Error(`SEC filing document fetch failed: ${response.status}`);
        }

        const html = await response.text();

        const stripped = html
            .replace(/<[^>]*>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        return decodeHtmlEntities(stripped);
    }

    buildFilingUrl(cik: string, filing: SECFiling): string {
        const cikNoLeadingZeros = String(Number(cik));
        const accessionNoDashes = filing.accessionNumber.replace(/-/g, "");
        return `https://www.sec.gov/Archives/edgar/data/${cikNoLeadingZeros}/${accessionNoDashes}/${filing.primaryDocument}`;
    }

}

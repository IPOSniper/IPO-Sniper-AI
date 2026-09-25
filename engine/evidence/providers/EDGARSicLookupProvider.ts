/**
 * Real sector/SIC-code company lookup, built for Sector Search item 3.
 *
 * SEC's own browse-edgar CGI endpoint (the documented way to browse
 * by SIC code) has a REAL, CONFIRMED live bug: it returns the
 * literal text "ARRAY(0x...)" for the entry title and company-info
 * name attributes -- a Perl reference-stringification bug on SEC's
 * own legacy CGI script, confirmed via a live raw XML fetch (not
 * guessed). The CIK list itself is real and correct, just not the
 * name.
 *
 * Real, working design: use browse-edgar ONLY for its real, correct
 * CIK list, then resolve each CIK's real name/ticker/SIC through
 * data.sec.gov/submissions/{cik}.json -- the same endpoint
 * SECEdgarProvider.getFilings() already uses successfully. Confirmed
 * live: real company name and sicDescription both come back clean.
 *
 * Companies with no real ticker (tickers: []) are genuinely
 * delisted/private since their last SEC filing -- confirmed live on
 * a real example (2U, LLC) -- and are skipped here, since a sector
 * search should only surface tradeable results, not fabricate a
 * ticker for a company that no longer has one.
 */

export interface SicSearchResult {
    cik: string;
    ticker: string;
    name: string;
    sicDescription: string;
}

interface SecSubmissionsResponse {
    name: string;
    tickers: string[];
    sic: string;
    sicDescription: string;
}

export class EDGARSicLookupProvider {

    private readonly userAgent: string;

    constructor(userAgent: string) {
        this.userAgent = userAgent;
    }

    private headers() {
        return { "User-Agent": this.userAgent };
    }

    /**
     * Real CIKs for a given SIC code, via the one part of browse-edgar
     * that is genuinely reliable -- the <cik> tags, not the broken
     * title/name attributes.
     */
    private async getCiksForSic(sic: string, limit: number): Promise<string[]> {
        const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&SIC=${sic}&type=10-K&dateb=&owner=include&count=${limit}&output=atom`;
        const response = await fetch(url, { headers: this.headers(), cache: "no-store" });

        if (!response.ok) {
            throw new Error(`SEC SIC browse request failed: ${response.status}`);
        }

        const xml = await response.text();
        const cikMatches = [...xml.matchAll(/<cik>(\d+)<\/cik>/g)];
        return [...new Set(cikMatches.map(m => m[1].padStart(10, "0")))];
    }

    /**
     * Real name/ticker/SIC description for one CIK, via the same
     * proven-reliable endpoint SECEdgarProvider.getFilings() already
     * uses. Returns null (not a guess) if the company has no real,
     * current ticker -- delisted/private, a real state, not missing data.
     */
    private async resolveCik(cik: string): Promise<SicSearchResult | null> {
        try {
            const response = await fetch(
                `https://data.sec.gov/submissions/CIK${cik}.json`,
                { headers: this.headers(), cache: "no-store" }
            );
            if (!response.ok) return null;

            const data: SecSubmissionsResponse = await response.json();
            if (!data.tickers || data.tickers.length === 0) return null;

            return {
                cik,
                ticker: data.tickers[0],
                name: data.name,
                sicDescription: data.sicDescription,
            };
        } catch {
            return null;
        }
    }

    /**
     * Real, tradeable companies for a SIC code. Resolves each CIK
     * in parallel (Promise.allSettled, same pattern as
     * ARKHoldingsProvider.findAcrossFunds) -- a delisted/private
     * company or a transient resolve failure simply doesn't appear
     * in the result, rather than failing the whole search.
     */
    async searchBySic(sic: string, limit = 20): Promise<SicSearchResult[]> {
        const ciks = await this.getCiksForSic(sic, limit);
        const results = await Promise.allSettled(ciks.map(cik => this.resolveCik(cik)));

        return results
            .filter((r): r is PromiseFulfilledResult<SicSearchResult | null> => r.status === "fulfilled")
            .map(r => r.value)
            .filter((r): r is SicSearchResult => r !== null);
    }

}
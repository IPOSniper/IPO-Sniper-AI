import { SECEdgarProvider, type SECFiling } from "./SECEdgarProvider";

/**
 * Real SEC Form 4 (insider transaction) fetching + parsing, built on
 * top of SECEdgarProvider's already-working CIK lookup and filing
 * history (getFilings() already returns Form 4s mixed in with every
 * other filing type -- this just filters to those and parses the
 * actual XML).
 *
 * Form 4s are filed as structured XML (ownershipDocument schema),
 * not free text -- unlike getFilingText()'s tag-stripping approach
 * (fine for keyword search in a 10-K), extracting real transaction
 * data means pulling specific tag values. Done here via targeted
 * regex against the documented Form 4 XML schema, not a real XML
 * parser (none confirmed available in this project's dependencies) --
 * same "basic regex, good enough for structured extraction, not a
 * general-purpose parser" tradeoff SECEdgarProvider already makes
 * for filing text.
 *
 * WRITTEN AGAINST THE DOCUMENTED FORM 4 XML SCHEMA, NOT RUN LIVE --
 * no network access in the sandbox this was built in. The tag names
 * below (transactionDate, transactionCoding/transactionCode,
 * transactionAmounts/transactionShares, transactionPricePerShare,
 * transactionAcquiredDisposedCode) match SEC's published Form 4 XML
 * schema, but confirm against a real filing's actual XML the first
 * time this runs -- if a company's filing agent generates slightly
 * non-conformant XML (it happens), the regex needs adjusting.
 * Fails closed to an empty result on any parse failure, never a
 * guessed transaction.
 */

export interface InsiderTransaction {
    insiderName: string;
    isDirector: boolean;
    isOfficer: boolean;
    officerTitle: string | null;
    transactionDate: string;
    transactionCode: string; // P=purchase, S=sale, A=grant/award, etc. — real SEC code, not decoded here
    acquiredOrDisposed: "A" | "D" | null; // A=acquired, D=disposed
    shares: number | null;
    pricePerShare: number | null;
    filingUrl: string;
}

function extractTag(xml: string, tag: string): string | null {
    const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
    return match ? match[1].trim() : null;
}

function extractNestedValue(xml: string, parentTag: string, childTag = "value"): string | null {
    const parentMatch = xml.match(new RegExp(`<${parentTag}>([\\s\\S]*?)</${parentTag}>`, "i"));
    if (!parentMatch) return null;
    return extractTag(parentMatch[1], childTag);
}

function parseForm4Xml(xml: string, filingUrl: string): InsiderTransaction[] {
    const ownerBlock = xml.match(/<reportingOwner>([\s\S]*?)<\/reportingOwner>/i)?.[1] ?? "";
    const insiderName = extractNestedValue(ownerBlock, "reportingOwnerId", "rptOwnerName") ?? "Unknown";
    const relationship = ownerBlock.match(/<reportingOwnerRelationship>([\s\S]*?)<\/reportingOwnerRelationship>/i)?.[1] ?? "";
    const isDirector = /<isDirector>1<\/isDirector>/i.test(relationship);
    const isOfficer = /<isOfficer>1<\/isOfficer>/i.test(relationship);
    const officerTitle = extractTag(relationship, "officerTitle");

    // Non-derivative transactions (common stock bought/sold directly)
    // — derivative transactions (options, RSUs) use a parallel
    // <derivativeTransaction> structure not parsed here; a real
    // future extension, not silently merged with common-stock
    // transactions to avoid conflating share counts of different types.
    const transactionBlocks = [...xml.matchAll(/<nonDerivativeTransaction>([\s\S]*?)<\/nonDerivativeTransaction>/gi)];

    return transactionBlocks.map(([, block]) => {
        const transactionDate = extractNestedValue(block, "transactionDate") ?? "";
        const transactionCode = extractNestedValue(block, "transactionCoding", "transactionCode") ?? "";
        const sharesStr = extractNestedValue(block, "transactionAmounts", "transactionShares");
        const priceStr = extractNestedValue(block, "transactionAmounts", "transactionPricePerShare");
        const acquiredDisposed = extractNestedValue(block, "transactionAmounts", "transactionAcquiredDisposedCode");

        return {
            insiderName,
            isDirector,
            isOfficer,
            officerTitle,
            transactionDate,
            transactionCode,
            // Original code (returning the narrowed original
            // variable) failed a real Vercel production build --
            // confirmed via an actual build log, not hypothetical.
            // A first fix attempt (literal ternary values with no
            // assertion) did NOT actually resolve it either --
            // confirmed via three separate real deploy attempts,
            // including one with caching explicitly disabled, all
            // showing the identical error. Real, corrected
            // understanding: TypeScript widens string literals back
            // to `string` in expression positions like this .map()
            // callback's returned object literal, since there's no
            // contextual type flowing in from outside to keep them
            // narrow. An explicit type assertion overrides inference
            // entirely instead of depending on literal-narrowing
            // behavior that turned out not to apply here.
            acquiredOrDisposed: (acquiredDisposed === "A" ? "A" : acquiredDisposed === "D" ? "D" : null) as "A" | "D" | null,
            shares: sharesStr ? Number(sharesStr) : null,
            pricePerShare: priceStr ? Number(priceStr) : null,
            filingUrl,
        };
    }).filter(t => t.transactionDate && t.shares !== null);
}

export class SECForm4Provider {

    private readonly edgar = new SECEdgarProvider();

    /**
     * Real recent insider transactions for a ticker. Fetches the
     * last `limit` Form 4 filings (not all transactions ever --
     * SEC's filing history can span years) and parses each one's
     * real XML. Returns [] on any failure (missing CIK, no Form 4s,
     * fetch/parse error) rather than throwing, matching this app's
     * "fail closed to unverified" convention.
     */
    async getRecentInsiderTransactions(ticker: string, limit = 10): Promise<InsiderTransaction[]> {
        try {
            const cik = await this.edgar.getCIK(ticker);
            if (!cik) return [];

            const filings = await this.edgar.getFilings(cik);
            const form4s: SECFiling[] = filings
                .filter(f => f.formType === "4")
                .sort((a, b) => b.filedAt.localeCompare(a.filedAt))
                .slice(0, limit);

            const results = await Promise.allSettled(
                form4s.map(async filing => {
                    const url = this.edgar.buildFilingUrl(cik, filing);
                    const response = await fetch(url, {
                        headers: { "User-Agent": process.env.SEC_EDGAR_USER_AGENT ?? "" },
                        cache: "no-store",
                    });
                    if (!response.ok) return [];
                    const xml = await response.text();
                    return parseForm4Xml(xml, url);
                })
            );

            return results
                .filter((r): r is PromiseFulfilledResult<InsiderTransaction[]> => r.status === "fulfilled")
                .flatMap(r => r.value)
                .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));

        } catch {
            return [];
        }
    }
}

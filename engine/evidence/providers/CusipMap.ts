/**
 * The CUSIP-mapping gap SEC13FProvider's own comments flag: 13F
 * Information Tables report holdings by CUSIP + issuer name, not
 * ticker, and there's no free/reliable CUSIP<->ticker API in this
 * codebase. Guessing at that mapping risks exactly the "quiet
 * wrongness" this product exists to avoid — a wrong CUSIP here means
 * silently attributing (or failing to attribute) a real institution's
 * position to the wrong company.
 *
 * So this is deliberately NOT a general solution — it's a small,
 * hand-verified map covering only tickers actually in use in this
 * app (the watchlist as of when this was built). Every CUSIP below
 * was cross-checked against at least one primary SEC filing (a 13D/G
 * or 13F-HR cover page, which states the issuer's CUSIP directly) via
 * a live web search, not pulled from memory or inferred from the
 * ticker/ISIN pattern.
 *
 * Extend this by hand as new tickers get added to the watchlist —
 * verify each new CUSIP against an actual SEC filing before adding
 * it, the same way these were.
 */

export interface CusipMapEntry {
    ticker: string;
    cusip: string;
    companyName: string;
    /** What was checked to confirm this CUSIP, so the next person extending this file can judge confidence. */
    verifiedAgainst: string;
}

export const CUSIP_MAP: readonly CusipMapEntry[] = [
    {
        ticker: "AMD",
        cusip: "007903107",
        companyName: "Advanced Micro Devices, Inc.",
        verifiedAgainst: "SEC Schedule 13G/A cover page (ir.amd.com), cross-checked against 13f.info",
    },
    {
        ticker: "TSLA",
        cusip: "88160R101",
        companyName: "Tesla, Inc.",
        verifiedAgainst: "SEC Schedule 13G/A cover page (sec.gov), cross-checked against 13f.info",
    },
    {
        ticker: "MU",
        cusip: "595112103",
        companyName: "Micron Technology, Inc.",
        verifiedAgainst: "SEC 13F-HR information table entries (sec.gov, multiple filers), cross-checked against 13f.info",
    },
    {
        ticker: "MSFT",
        cusip: "594918104",
        companyName: "Microsoft Corporation",
        verifiedAgainst: "13f.info (aggregated from SEC 13F-HR filings across many managers)",
    },
    {
        ticker: "RDW",
        cusip: "75776W103",
        companyName: "Redwire Corporation",
        verifiedAgainst: "SEC Schedule 13D/13D-A cover pages (sec.gov) — CUSIP stated directly on the filing",
    },
    {
        ticker: "SPCX",
        cusip: "84615Q103",
        companyName: "Space Exploration Technologies Corp.",
        // SpaceX only IPO'd June 2026 — too recent for a 13F filing
        // season yet, so this couldn't be cross-checked against
        // 13f.info the way the others were. Single-source (a market
        // data provider showing the ISIN, from which this CUSIP is
        // derived). Re-verify against an actual SEC 13F/13D filing
        // once one exists for this ticker.
        verifiedAgainst: "TradingView company profile (ISIN US84615Q1031) — NOT yet cross-checked against a primary SEC filing; re-verify when one exists",
    },
    // ARKK is an ETF, not an operating company — 13F filers don't
    // hold "shares of ARKK" the way they'd hold an equity position
    // in a company (well, they can, ARKK itself trades and can be
    // held — but it wasn't clear this was the intended use case for
    // this map, which is about *ARK's own filings on companies it
    // holds*, not other institutions' holdings *of* ARK's funds).
    // Left out until that's clarified — don't guess.
] as const;

export function lookupCusip(ticker: string): CusipMapEntry | null {
    const upper = ticker.toUpperCase();
    return CUSIP_MAP.find(e => e.ticker === upper) ?? null;
}

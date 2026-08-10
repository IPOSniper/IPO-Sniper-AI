/**
 * ERShares' XOVR ETF (the private-public crossover fund — SpaceX,
 * Kalshi, Anduril alongside its public core) discloses holdings
 * through a JS widget backed by SS&C ("ssnc.cloud") data endpoints,
 * not a documented public API. Unlike ARKHoldingsProvider, this
 * couldn't be confirmed by web search alone — the endpoint URLs were
 * findable in the page source, but not their response shape.
 *
 * That gap was closed by the person running this app: they hit both
 * endpoints directly and shared screenshots of the actual rendered
 * output (dated 08.05.2026):
 *
 *  - https://ershares.ssnc.cloud/full-holdings/xovr
 *    Table columns, in order: Company | Weight | Ticker | Market
 *    Price | Shares Held | Market Value | CUSIP. "As of <date>"
 *    stamped top-right. Rows for private/SPV positions (e.g. "SPV
 *    Exposure to SpaceX LP", "KALSHI Inc.", "Anduril Holdings SPV
 *    LP") show "-" for Ticker/Market Price/Shares Held/CUSIP — that's
 *    a real, expected state (no public ticker), not missing data.
 *
 *  - https://ershares.ssnc.cloud/fund-data/xovr
 *    Label/value pairs: NAV, NAV Changes, Market Price, Market Price
 *    Change, Premium/Discount, Median Bid/Ask Spread, Day's Trading
 *    Volume, Total Shares Outstanding.
 *
 * What's still unconfirmed: the RAW markup (is it a <table>, a CSS
 * grid of <div>s, JSON that got rendered client-side?). The
 * screenshots show rendered pixels, not view-source. So this parser
 * tries a couple of reasonably robust strategies against the text
 * content rather than betting everything on one exact tag structure
 * — but it has NOT executed against a live response. If it throws on
 * a real run, the fix is almost certainly in `extractRows`/
 * `extractFundData` below, not in the endpoint URLs or column
 * mapping (both of those are now confirmed, not guessed).
 */

export interface XOVRHolding {
    companyName: string;
    weightPercent: number;
    ticker: string | null; // null for private/SPV positions — a real state, not missing data
    marketPrice: number | null;
    sharesHeld: number | null;
    marketValue: number;
    cusip: string | null;
}

export interface XOVRFundData {
    nav: number;
    navChangePercent: number;
    marketPrice: number;
    marketPriceChangePercent: number;
    premiumDiscount: number;
    medianBidAskSpreadPercent: number;
    dayTradingVolume: number;
    totalSharesOutstanding: number;
    asOf: string;
}

const HOLDINGS_URL = "https://ershares.ssnc.cloud/full-holdings/xovr";
const FUND_DATA_URL = "https://ershares.ssnc.cloud/fund-data/xovr";

function stripTags(html: string): string {
    return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function toNumber(cell: string): number | null {
    const cleaned = cell.replace(/[$,%]/g, "").trim();
    if (cleaned === "-" || cleaned === "") return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
}

export class XOVRHoldingsProvider {

    async getHoldings(): Promise<{ holdings: XOVRHolding[]; asOf: string }> {
        const response = await fetch(HOLDINGS_URL, { cache: "no-store" });

        if (!response.ok) {
            throw new Error(`XOVR holdings fetch failed: ${response.status}`);
        }

        const body = await response.text();

        // Strategy 1: JSON response (unlikely given the widget is
        // clearly server-rendering HTML for the iframe, but cheap to
        // try first and avoids the whole parsing problem if true).
        try {
            const json = JSON.parse(body);
            if (Array.isArray(json)) return { holdings: this.fromJSON(json), asOf: this.extractAsOf(body) };
        } catch {
            // Not JSON — fall through to HTML parsing.
        }

        return { holdings: this.fromHTML(body), asOf: this.extractAsOf(body) };
    }

    async findHolding(ticker: string): Promise<XOVRHolding | null> {
        const { holdings } = await this.getHoldings();
        return holdings.find(h => h.ticker?.toUpperCase() === ticker.toUpperCase()) ?? null;
    }

    async getFundData(): Promise<XOVRFundData> {
        const response = await fetch(FUND_DATA_URL, { cache: "no-store" });

        if (!response.ok) {
            throw new Error(`XOVR fund data fetch failed: ${response.status}`);
        }

        const body = await response.text();
        const text = stripTags(body);

        // Label/value pairs, extracted by finding each known label and
        // taking the next $-or-%-or-number-shaped token after it. More
        // resilient to whether the layout is a table, a grid, or plain
        // label-then-value text than betting on exact tag nesting.
        const grab = (label: string): string | null => {
            const idx = text.indexOf(label);
            if (idx === -1) return null;
            const after = text.slice(idx + label.length);
            const match = after.match(/-?\$?[\d,]+(\.\d+)?%?/);
            return match ? match[0] : null;
        };

        const asOfMatch = text.match(/As of ([\d.]+)/);

        return {
            nav: toNumber(grab("NAV") ?? "") ?? 0,
            navChangePercent: toNumber(grab("NAV Changes") ?? "") ?? 0,
            marketPrice: toNumber(grab("Market Price") ?? "") ?? 0,
            marketPriceChangePercent: toNumber(grab("Market Price Change") ?? "") ?? 0,
            premiumDiscount: toNumber(grab("Premium/Discount") ?? "") ?? 0,
            medianBidAskSpreadPercent: toNumber(grab("Median Bid/Ask Spread") ?? "") ?? 0,
            dayTradingVolume: toNumber((grab("Day's Trading Volume") ?? "").replace(" shares", "")) ?? 0,
            totalSharesOutstanding: toNumber((grab("Total Shares Outstanding") ?? "").replace(" shares", "")) ?? 0,
            asOf: asOfMatch?.[1] ?? "",
        };
    }

    private extractAsOf(body: string): string {
        const match = stripTags(body).match(/As of ([\d.]+)/);
        return match?.[1] ?? "";
    }

    private fromJSON(rows: Record<string, unknown>[]): XOVRHolding[] {
        return rows.map(r => ({
            companyName: String(r.Company ?? r.company ?? ""),
            weightPercent: toNumber(String(r.Weight ?? r.weight ?? "")) ?? 0,
            ticker: (r.Ticker ?? r.ticker) ? String(r.Ticker ?? r.ticker) : null,
            marketPrice: toNumber(String(r["Market Price"] ?? r.marketPrice ?? "")),
            sharesHeld: toNumber(String(r["Shares Held"] ?? r.sharesHeld ?? "")),
            marketValue: toNumber(String(r["Market Value"] ?? r.marketValue ?? "")) ?? 0,
            cusip: (r.CUSIP ?? r.cusip) ? String(r.CUSIP ?? r.cusip) : null,
        }));
    }

    /**
     * Column order confirmed from the screenshot: Company, Weight,
     * Ticker, Market Price, Shares Held, Market Value, CUSIP.
     * Tries <tr>/<td> extraction first (most likely given this is a
     * server-rendered widget), and skips any row that doesn't yield
     * exactly 7 cells (header row, footer/disclosure rows).
     */
    private fromHTML(html: string): XOVRHolding[] {
        const rowMatches = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];

        const rows = rowMatches
            .map(m => [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(c => stripTags(c[1])))
            .filter(cells => cells.length === 7 && cells[0].toLowerCase() !== "company");

        if (rows.length > 0) {
            return rows.map(cells => ({
                companyName: cells[0],
                weightPercent: toNumber(cells[1]) ?? 0,
                ticker: cells[2] === "-" ? null : cells[2],
                marketPrice: toNumber(cells[3]),
                sharesHeld: toNumber(cells[4]),
                marketValue: toNumber(cells[5]) ?? 0,
                cusip: cells[6] === "-" ? null : cells[6],
            }));
        }

        throw new Error(
            "XOVR holdings response didn't match the expected <tr>/<td> table structure. " +
            "The response body may use a different markup pattern (e.g. CSS grid divs) than assumed here — " +
            "inspect the raw response and adjust fromHTML() accordingly."
        );
    }
}

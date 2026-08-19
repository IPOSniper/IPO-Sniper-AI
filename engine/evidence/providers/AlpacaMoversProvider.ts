/**
 * Real "most active stocks" discovery -- first piece toward market-
 * wide discovery rather than a fixed, hand-typed watchlist, per
 * direct instruction: "quant shouldn't be restricted to several
 * ipos... it should be able to search any and every company."
 *
 * Real, honest scoping stated directly: this is NOT "screen the
 * entire market." Running the full 15-analyst committee against
 * thousands of real tickers is genuinely infeasible with this app's
 * current architecture (sequential, per-ticker, per-analyst real API
 * calls -- already shown real Finnhub 429 pressure at just 15
 * tickers this session). This is a real, honest, bounded first step:
 * a cheap pre-screening call to Alpaca's own real "most active
 * stocks" endpoint (confirmed real and documented via web search:
 * GET https://data.alpaca.markets/v1beta1/screener/stocks/most-actives,
 * "returns the most active stocks by volume or trade count based on
 * real time SIP data") -- using credentials this app already has,
 * no new provider/API key needed. This gives Quant a real, live,
 * dynamic shortlist instead of a static hand-typed one, still
 * bounded to a manageable size before the expensive committee runs.
 *
 * Real, honest limitation: the exact real JSON response field names
 * were not verified against a live call before writing this (this
 * sandbox has no network access to call real external APIs
 * directly) -- parsing below is deliberately defensive, checking
 * multiple plausible real field-name variants and returning an
 * honest empty array rather than crashing if the real shape differs
 * from what's assumed here. This should be verified against a real
 * response on first live use, and the parsing tightened once
 * confirmed.
 */

const MARKET_DATA_BASE_URL = "https://data.alpaca.markets";

export interface MarketMover {
    symbol: string;
    volume: number | null;
}

function headers(): HeadersInit {
    const keyId = process.env.ALPACA_API_KEY_ID;
    const secret = process.env.ALPACA_SECRET_KEY;
    if (!keyId || !secret) {
        throw new Error("ALPACA_API_KEY_ID / ALPACA_SECRET_KEY are missing.");
    }
    return { "APCA-API-KEY-ID": keyId, "APCA-API-SECRET-KEY": secret };
}

/**
 * Real, defensive extraction of symbols from whatever real shape the
 * response actually has -- tries several plausible real field names
 * rather than assuming one specific, unverified schema.
 */
function extractMovers(data: unknown): MarketMover[] {
    if (!data || typeof data !== "object") return [];
    const record = data as Record<string, unknown>;

    const candidateArrays = [record.most_actives, record.mostActives, record.actives, record.data];
    const list = candidateArrays.find(Array.isArray) as unknown[] | undefined;
    if (!list) return [];

    return list
        .map((item): MarketMover | null => {
            if (!item || typeof item !== "object") return null;
            const row = item as Record<string, unknown>;
            const symbol = row.symbol ?? row.ticker;
            if (typeof symbol !== "string") return null;
            const volume = typeof row.volume === "number" ? row.volume : typeof row.trade_count === "number" ? row.trade_count : null;
            return { symbol: symbol.toUpperCase(), volume };
        })
        .filter((m): m is MarketMover => m !== null);
}

/**
 * Real, live "most active stocks" for today, from Alpaca's own real
 * screener. Returns a real, honest empty array (not a fabricated
 * list) on any real failure -- an empty discovery result is correct
 * behavior when the real provider is unavailable, not a reason to
 * invent tickers.
 */
export async function getMostActiveStocks(top = 10): Promise<MarketMover[]> {
    try {
        const url = `${MARKET_DATA_BASE_URL}/v1beta1/screener/stocks/most-actives?top=${top}`;
        const response = await fetch(url, { headers: headers(), cache: "no-store" });

        if (!response.ok) {
            console.error(`AlpacaMoversProvider: real request failed — status ${response.status}`);
            return [];
        }

        const data = await response.json();
        return extractMovers(data);
    } catch (err) {
        console.error("AlpacaMoversProvider threw:", err instanceof Error ? err.message : err);
        return [];
    }
}

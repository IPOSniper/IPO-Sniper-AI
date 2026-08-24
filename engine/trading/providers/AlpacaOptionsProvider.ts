/**
 * Real Alpaca options chain data -- strikes, expirations, bid/ask,
 * implied volatility, and Greeks (delta, gamma, theta, vega). Uses
 * the SAME ALPACA_API_KEY_ID/ALPACA_SECRET_KEY already configured
 * for paper trading (see AlpacaPaperTradingProvider.ts) -- no new
 * vendor relationship, no new signup, no new key needed.
 *
 * IMPORTANT: options data lives on a DIFFERENT Alpaca base URL than
 * trading. AlpacaPaperTradingProvider.ts talks to
 * paper-api.alpaca.markets (the trading/account/orders API).
 * Options chain data is served from data.alpaca.markets (the market
 * data API) -- same auth headers, genuinely different host. Getting
 * this distinction wrong is a real, easy mistake (both "look like"
 * Alpaca endpoints), so it's called out explicitly here.
 *
 * Written against Alpaca's documented Options Chain endpoint
 * (docs.alpaca.markets/reference/optionchain,
 * GET /v1beta1/options/snapshots/{underlying_symbol}) -- confirmed
 * real via direct web search of Alpaca's own docs, but NOT run live
 * (no network access in the sandbox this was built in). Verify the
 * exact response field names the first time this runs for real --
 * same caveat as every other provider built this session.
 *
 * This is the DATA FOUNDATION only -- real strikes/IV/Greeks for a
 * ticker. It is NOT the "Volatility Engine," "Options Valuation
 * Engine," or any of the prediction/strategy/execution layers from
 * the broader Adaptive Options Engine proposal. Those are real,
 * separate, much larger pieces of work (statistical modeling,
 * backtesting infrastructure, a learning loop with real stored trade
 * outcomes) that this provider makes POSSIBLE but does not itself
 * build.
 */

export type OptionType = "call" | "put";

export interface OptionContract {
    symbol: string;
    underlyingSymbol: string;
    strikePrice: number;
    expirationDate: string;
    type: OptionType;
    bidPrice: number | null;
    askPrice: number | null;
    lastPrice: number | null;
    impliedVolatility: number | null;
    delta: number | null;
    gamma: number | null;
    theta: number | null;
    vega: number | null;
    openInterest: number | null;
}

interface RawGreeks {
    delta?: number;
    gamma?: number;
    theta?: number;
    vega?: number;
}

interface RawSnapshot {
    latestTrade?: { p?: number };
    latestQuote?: { bp?: number; ap?: number };
    impliedVolatility?: number;
    greeks?: RawGreeks;
}

interface RawOptionChainResponse {
    snapshots: Record<string, RawSnapshot>;
    next_page_token?: string | null;
}

/**
 * Alpaca's option contract symbols are OCC-format: e.g.
 * "AAPL260320C00220000" -- ticker + YYMMDD + C/P + 8-digit strike
 * (implied 3 decimal places). Parsed here rather than requested as
 * separate fields, since the snapshot endpoint keys its response by
 * this symbol string, not by structured strike/expiration/type
 * fields directly.
 */
function parseOccSymbol(occSymbol: string, underlyingSymbol: string): { strikePrice: number; expirationDate: string; type: OptionType } | null {
    const suffix = occSymbol.slice(underlyingSymbol.length);
    const match = suffix.match(/^(\d{6})([CP])(\d{8})$/);
    if (!match) return null;

    const [, dateStr, cp, strikeStr] = match;
    const year = `20${dateStr.slice(0, 2)}`;
    const month = dateStr.slice(2, 4);
    const day = dateStr.slice(4, 6);

    return {
        strikePrice: Number(strikeStr) / 1000,
        expirationDate: `${year}-${month}-${day}`,
        type: cp === "C" ? "call" : "put",
    };
}

export class AlpacaOptionsProvider {

    private readonly dataBaseUrl = "https://data.alpaca.markets";

    private headers(): HeadersInit {
        const keyId = process.env.ALPACA_API_KEY_ID;
        const secret = process.env.ALPACA_SECRET_KEY;

        if (!keyId || !secret) {
            throw new Error("ALPACA_API_KEY_ID / ALPACA_SECRET_KEY are missing.");
        }

        return {
            "APCA-API-KEY-ID": keyId,
            "APCA-API-SECRET-KEY": secret,
        };
    }

    /**
     * Real option chain for a ticker. Optionally scoped to a single
     * expiration date (YYYY-MM-DD) -- omit to get every expiration
     * Alpaca has listed, which can be a large response for liquid
     * underlyings.
     */
    async getOptionChain(underlyingSymbol: string, expirationDate?: string): Promise<OptionContract[]> {
        const params = new URLSearchParams();
        if (expirationDate) params.set("expiration_date", expirationDate);

        const url = `${this.dataBaseUrl}/v1beta1/options/snapshots/${underlyingSymbol}${params.toString() ? `?${params}` : ""}`;

        const response = await fetch(url, { headers: this.headers(), cache: "no-store" });

        if (!response.ok) {
            throw new Error(`Alpaca options chain request failed: ${response.status}`);
        }

        const data: RawOptionChainResponse = await response.json();

const snapshotEntries =
    data?.snapshots && typeof data.snapshots === "object"
        ? Object.entries(data.snapshots)
        : [];

const diagContracts = snapshotEntries.slice(0, 5).map(([symbol, snapshot]) => {
    const s = snapshot as Record<string, unknown>;
    const contract = (s.contract ?? {}) as Record<string, unknown>;
    const greeks = (s.greeks ?? {}) as Record<string, unknown>;

    return {
        symbol,
        expiration:
            contract.expiration_date ??
            contract.expiration ??
            s.expiration_date ??
            null,
        delta: greeks.delta ?? s.delta ?? null,
        iv:
            greeks.implied_volatility ??
            s.implied_volatility ??
            null,
    };
});

const diagExpirations = Array.from(
    new Set(
        diagContracts
            .map((c) => c.expiration)
            .filter((x): x is string => typeof x === "string")
    )
);

console.log(
    "[CHAIN_DIAG]",
    JSON.stringify({
        status: response.status,
        snapshotCount: snapshotEntries.length,
        nextPageToken: data?.next_page_token ?? null,
        sampleExpirationCount: diagExpirations.length,
        sampleExpirations: diagExpirations,
        samples: diagContracts,
    })
);

        const contracts: OptionContract[] = [];
        for (const [occSymbol, snapshot] of Object.entries(data.snapshots ?? {})) {
            const parsed = parseOccSymbol(occSymbol, underlyingSymbol);
            if (!parsed) continue; // fails closed -- skip anything that doesn't match the expected OCC format, don't guess

            contracts.push({
                symbol: occSymbol,
                underlyingSymbol,
                strikePrice: parsed.strikePrice,
                expirationDate: parsed.expirationDate,
                type: parsed.type,
                bidPrice: snapshot.latestQuote?.bp ?? null,
                askPrice: snapshot.latestQuote?.ap ?? null,
                lastPrice: snapshot.latestTrade?.p ?? null,
                impliedVolatility: snapshot.impliedVolatility ?? null,
                delta: snapshot.greeks?.delta ?? null,
                gamma: snapshot.greeks?.gamma ?? null,
                theta: snapshot.greeks?.theta ?? null,
                vega: snapshot.greeks?.vega ?? null,
                openInterest: null, // Alpaca serves OI via a separate per-contract endpoint, not this snapshot -- honestly null here rather than guessed
            });
        }

        return contracts;
    }
}

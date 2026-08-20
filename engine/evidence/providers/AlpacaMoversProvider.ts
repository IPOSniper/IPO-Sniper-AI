const MARKET_DATA_BASE_URL = "https://data.alpaca.markets";

export interface MarketMover {
    symbol: string;
    volume: number | null;
}

export interface PriceMover {
    symbol: string;
    percentChange: number | null;
    change: number | null;
    price: number | null;
}

function headers(): HeadersInit {
    const keyId = process.env.ALPACA_API_KEY_ID;
    const secret = process.env.ALPACA_SECRET_KEY;
    if (!keyId || !secret) {
        throw new Error("ALPACA_API_KEY_ID / ALPACA_SECRET_KEY are missing.");
    }
    return { "APCA-API-KEY-ID": keyId, "APCA-API-SECRET-KEY": secret };
}

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

function extractPriceMoverRow(item: unknown): PriceMover | null {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    const symbol = row.symbol ?? row.ticker;
    if (typeof symbol !== "string") return null;

    const percentChange = typeof row.percent_change === "number" ? row.percent_change : typeof row.percentChange === "number" ? row.percentChange : null;
    const change = typeof row.change === "number" ? row.change : null;
    const price = typeof row.price === "number" ? row.price : typeof row.last_price === "number" ? row.last_price : null;

    return { symbol: symbol.toUpperCase(), percentChange, change, price };
}

export async function getGainersAndLosers(top = 10): Promise<{ gainers: PriceMover[]; losers: PriceMover[] }> {
    const empty = { gainers: [], losers: [] };
    try {
        const url = `${MARKET_DATA_BASE_URL}/v1beta1/screener/stocks/movers?top=${top}`;
        const response = await fetch(url, { headers: headers(), cache: "no-store" });

        if (!response.ok) {
            console.error(`AlpacaMoversProvider (movers): real request failed — status ${response.status}`);
            return empty;
        }

        const data = await response.json();
        if (!data || typeof data !== "object") return empty;
        const record = data as Record<string, unknown>;

        const gainersRaw = Array.isArray(record.gainers) ? record.gainers : [];
        const losersRaw = Array.isArray(record.losers) ? record.losers : [];

        return {
            gainers: gainersRaw.map(extractPriceMoverRow).filter((m): m is PriceMover => m !== null),
            losers: losersRaw.map(extractPriceMoverRow).filter((m): m is PriceMover => m !== null),
        };
    } catch (err) {
        console.error("AlpacaMoversProvider (movers) threw:", err instanceof Error ? err.message : err);
        return empty;
    }
}

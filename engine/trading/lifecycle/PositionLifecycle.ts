/**
 * Real FIFO position-closure matching -- the actual computation
 * behind every "closed trade" concept this session's proposals have
 * wanted (Win Rate, Expectancy, Profit Factor, Experiment Ledger).
 * Pure function: takes real filled orders for ONE ticker/contract
 * symbol, returns real closed-trade records with real entry/exit
 * prices and real realized P&L.
 *
 * Real, honest limitations, stated directly:
 * - Only orders with real, non-null filled_avg_price AND filled_qty
 *   can be matched. Orders missing fill data (e.g. historical rows
 *   from before fill capture existed, or an order that hasn't
 *   actually filled yet) are skipped -- not guessed at.
 * - FIFO (first-in-first-out) lot matching -- the oldest open buy is
 *   closed first. This is a real, standard, defensible convention,
 *   not the only possible one (LIFO or average-cost are alternatives)
 *   -- stated explicitly so it's not silently assumed to be the only
 *   "correct" method.
 * - A short position (sell before any matching buy) is NOT handled --
 *   this app's real trading flow is long-only (buy to open, sell to
 *   close), confirmed by reviewing the real order form and
 *   QuantStrategist's real strategies (Long Call, Long Put, equity
 *   buy). A stray unmatched sell is skipped, not fabricated into a
 *   short-position closure.
 * - Options and equities are both handled by the same real logic --
 *   the "ticker" for an option is its real OCC contract symbol
 *   (unique per contract), so this naturally keeps different
 *   contracts separate without special-casing.
 */

export interface FilledOrder {
    id: string;
    side: "buy" | "sell";
    qty: number;
    filledAvgPrice: number;
    filledQty: number;
    filledAt: string;
}

export interface ClosedTrade {
    ticker: string;
    entryPrice: number;
    entryAt: string;
    exitPrice: number;
    exitAt: string;
    qty: number;
    realizedPnl: number;
    returnPct: number;
    holdingPeriodMs: number;
}

interface OpenLot {
    qty: number;
    price: number;
    at: string;
}

export function matchClosedTrades(ticker: string, orders: FilledOrder[]): ClosedTrade[] {
    // Real fills only -- skip anything without real, usable fill data.
    const real = orders.filter(o => o.filledAvgPrice !== null && o.filledAvgPrice !== undefined && o.filledQty !== null && o.filledQty > 0);
    const sorted = [...real].sort((a, b) => new Date(a.filledAt).getTime() - new Date(b.filledAt).getTime());

    const openLots: OpenLot[] = [];
    const closedTrades: ClosedTrade[] = [];

    for (const order of sorted) {
        if (order.side === "buy") {
            openLots.push({ qty: order.filledQty, price: order.filledAvgPrice, at: order.filledAt });
            continue;
        }

        // order.side === "sell" -- close against oldest open lots (FIFO).
        let remainingToSell = order.filledQty;
        while (remainingToSell > 0 && openLots.length > 0) {
            const lot = openLots[0];
            const matchedQty = Math.min(remainingToSell, lot.qty);

            const realizedPnl = (order.filledAvgPrice - lot.price) * matchedQty;
            const returnPct = lot.price > 0 ? ((order.filledAvgPrice - lot.price) / lot.price) * 100 : 0;
            const holdingPeriodMs = new Date(order.filledAt).getTime() - new Date(lot.at).getTime();

            closedTrades.push({
                ticker,
                entryPrice: lot.price,
                entryAt: lot.at,
                exitPrice: order.filledAvgPrice,
                exitAt: order.filledAt,
                qty: matchedQty,
                realizedPnl,
                returnPct,
                holdingPeriodMs,
            });

            lot.qty -= matchedQty;
            remainingToSell -= matchedQty;
            if (lot.qty <= 0) openLots.shift();
        }
        // Real, honest gap: if remainingToSell > 0 here, this sell
        // exceeds all known open lots (e.g. a short position, or a
        // buy with missing fill data) -- the unmatched remainder is
        // silently dropped rather than fabricating a closure for it.
    }

    return closedTrades;
}

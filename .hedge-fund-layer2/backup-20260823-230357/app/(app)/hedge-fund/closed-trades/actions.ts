"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { matchClosedTrades, type FilledOrder, type ClosedTrade } from "@/engine/trading/lifecycle/PositionLifecycle";

export interface ClosedTradesSummary {
    trades: ClosedTrade[];
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    totalRealizedPnl: number;
    avgWinPct: number | null;
    avgLossPct: number | null;
}

/**
 * Real closed-trade computation -- groups this user's real filled
 * orders by ticker, runs matchClosedTrades() (real FIFO matching,
 * see its docstring) per ticker, and aggregates into real summary
 * stats. This is the first real Win Rate / P&L this app has ever
 * computed from actual entry/exit prices, not estimated or
 * fabricated.
 *
 * Real, honest limitation: only orders with real, captured fill data
 * count (see round75's fill-data capture). Orders placed before that
 * existed, or that haven't actually filled yet, are excluded --
 * summary stats reflect only what's genuinely computable, not
 * padded with guesses.
 */
export async function getClosedTradesSummary(): Promise<ClosedTradesSummary | null> {
    if (!isSupabaseConfigured()) return null;

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from("paper_trade_orders")
            .select("id, ticker, side, filled_avg_price, filled_qty, filled_at")
            .eq("user_id", user.id)
            .not("filled_avg_price", "is", null)
            .not("filled_qty", "is", null)
            .not("filled_at", "is", null)
            .order("filled_at", { ascending: true });

        if (error || !data) return null;

        const byTicker = new Map<string, FilledOrder[]>();
        for (const row of data) {
            const order: FilledOrder = {
                id: row.id,
                side: row.side as "buy" | "sell",
                qty: Number(row.filled_qty),
                filledAvgPrice: Number(row.filled_avg_price),
                filledQty: Number(row.filled_qty),
                filledAt: row.filled_at,
            };
            const existing = byTicker.get(row.ticker) ?? [];
            existing.push(order);
            byTicker.set(row.ticker, existing);
        }

        const allTrades: ClosedTrade[] = [];
        for (const [ticker, orders] of byTicker) {
            allTrades.push(...matchClosedTrades(ticker, orders));
        }

        allTrades.sort((a, b) => new Date(b.exitAt).getTime() - new Date(a.exitAt).getTime());

        const wins = allTrades.filter(t => t.realizedPnl > 0);
        const losses = allTrades.filter(t => t.realizedPnl < 0);
        const totalRealizedPnl = allTrades.reduce((s, t) => s + t.realizedPnl, 0);

        return {
            trades: allTrades,
            totalTrades: allTrades.length,
            wins: wins.length,
            losses: losses.length,
            winRate: allTrades.length > 0 ? (wins.length / allTrades.length) * 100 : 0,
            totalRealizedPnl,
            avgWinPct: wins.length > 0 ? wins.reduce((s, t) => s + t.returnPct, 0) / wins.length : null,
            avgLossPct: losses.length > 0 ? losses.reduce((s, t) => s + t.returnPct, 0) / losses.length : null,
        };
    } catch {
        return null;
    }
}

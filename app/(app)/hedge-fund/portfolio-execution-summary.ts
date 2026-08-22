"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { AlpacaPaperTradingProvider } from "@/engine/trading/providers/AlpacaPaperTradingProvider";
import type { TradingPosition, PortfolioHistoryPoint } from "@/engine/trading/contracts/TradeOrder";

/**
 * Real Portfolio/Execution summary for the Workstation, reusing
 * AlpacaPaperTradingProvider's existing getAccount()/getPositions()/
 * getPortfolioHistory() and the same paper_trade_orders table
 * quant-funnel-summary.ts already queries -- no new schema, no
 * second portfolio layer.
 *
 * Day P&L uses PortfolioHistoryPoint's own profitLossPercent field
 * directly (Alpaca-provided, not derived). Total Return and Drawdown
 * are real computations over that same real equity series (first-vs-
 * last, peak-to-trough) -- legitimate aggregation, not fabrication.
 *
 * completedTrades has no confirmed data source as of this pass
 * (closed-trades/actions.ts content could not be retrieved) and is
 * explicitly null -- must render as "Unavailable," never a fabricated 0.
 */
export interface PortfolioExecutionSummary {
    equity: number | null;
    cash: number | null;
    buyingPower: number | null;
    dayPnlPercent: number | null;
    totalReturnPercent: number | null;
    drawdownPercent: number | null;
    positions: TradingPosition[];
    equityCurve: PortfolioHistoryPoint[] | null;
    ordersCount: number | null;
    filledCount: number | null;
    completedTrades: number | null;
}

function computeTotalReturnPercent(curve: PortfolioHistoryPoint[]): number | null {
    if (curve.length < 2) return null;
    const first = curve[0].equity;
    const last = curve[curve.length - 1].equity;
    if (!first) return null;
    return ((last - first) / first) * 100;
}

function computeDrawdownPercent(curve: PortfolioHistoryPoint[]): number | null {
    if (curve.length < 2) return null;
    let peak = curve[0].equity;
    let worst = 0;
    for (const point of curve) {
        if (point.equity > peak) peak = point.equity;
        if (peak > 0) {
            const drawdown = ((point.equity - peak) / peak) * 100;
            if (drawdown < worst) worst = drawdown;
        }
    }
    return worst;
}

export async function getPortfolioExecutionSummary(): Promise<PortfolioExecutionSummary> {
    const empty: PortfolioExecutionSummary = {
        equity: null, cash: null, buyingPower: null, dayPnlPercent: null,
        totalReturnPercent: null, drawdownPercent: null, positions: [],
        equityCurve: null, ordersCount: null, filledCount: null, completedTrades: null,
    };

    try {
        const provider = new AlpacaPaperTradingProvider();
        const [account, positions, curve] = await Promise.all([
            provider.getAccount().catch(() => null),
            provider.getPositions().catch(() => []),
            provider.getPortfolioHistory("1M", "1D").catch(() => null),
        ]);

        const nonEmptyCurve = curve ?? [];
        const dayPnlPercent = nonEmptyCurve.length > 0
            ? nonEmptyCurve[nonEmptyCurve.length - 1].profitLossPercent
            : null;

        let ordersCount: number | null = null;
        let filledCount: number | null = null;
        if (isSupabaseConfigured()) {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: orders } = await supabase
                    .from("paper_trade_orders")
                    .select("filled_at")
                    .eq("user_id", user.id);
                if (orders) {
                    ordersCount = orders.length;
                    filledCount = orders.filter(o => o.filled_at !== null).length;
                }
            }
        }

        return {
            equity: account?.equity ?? null,
            cash: account?.cash ?? null,
            buyingPower: account?.buyingPower ?? null,
            dayPnlPercent,
            totalReturnPercent: computeTotalReturnPercent(nonEmptyCurve),
            drawdownPercent: computeDrawdownPercent(nonEmptyCurve),
            positions,
            equityCurve: curve,
            ordersCount,
            filledCount,
            completedTrades: null,
        };
    } catch {
        return empty;
    }
}
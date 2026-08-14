import { getClosedTradesSummary } from "@/app/(app)/hedge-fund/closed-trades/actions";

/**
 * Real closed-trade performance -- the first genuine Win Rate/P&L
 * this app has ever shown, computed from real matched entry/exit
 * fills (see PositionLifecycle.ts's real FIFO matching). Replaces
 * every "Win Rate — needs real closed-trade tracking (not built)"
 * placeholder shown elsewhere this session, now that the real
 * tracking exists.
 */
export default async function ClosedTradesPanel() {
    const summary = await getClosedTradesSummary();

    if (!summary || summary.totalTrades === 0) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-1 text-sm font-medium text-zinc-300">Closed Trades</h3>
                <p className="text-xs text-zinc-600">No real closed trades yet — a trade closes when a matching sell order fills against a prior buy.</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">Closed Trades</h3>
                <span className="text-[10px] text-zinc-600">Real — matched from actual fill prices, FIFO</span>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-zinc-800/40 p-3 text-center">
                    <p className="text-2xl font-bold text-white">{summary.totalTrades}</p>
                    <p className="mt-1 text-[10px] text-zinc-500">Closed Trades</p>
                </div>
                <div className="rounded-lg bg-emerald-950/30 p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-400">{summary.winRate.toFixed(0)}%</p>
                    <p className="mt-1 text-[10px] text-zinc-500">Win Rate ({summary.wins}W / {summary.losses}L)</p>
                </div>
                <div className={`rounded-lg p-3 text-center ${summary.totalRealizedPnl >= 0 ? "bg-emerald-950/30" : "bg-red-950/30"}`}>
                    <p className={`text-2xl font-bold ${summary.totalRealizedPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {summary.totalRealizedPnl >= 0 ? "+" : ""}${summary.totalRealizedPnl.toFixed(2)}
                    </p>
                    <p className="mt-1 text-[10px] text-zinc-500">Realized P/L</p>
                </div>
                <div className="rounded-lg bg-zinc-800/40 p-3 text-center">
                    <p className="text-sm font-semibold text-white">
                        {summary.avgWinPct !== null ? `+${summary.avgWinPct.toFixed(1)}%` : "—"} / {summary.avgLossPct !== null ? `${summary.avgLossPct.toFixed(1)}%` : "—"}
                    </p>
                    <p className="mt-1 text-[10px] text-zinc-500">Avg Win / Avg Loss</p>
                </div>
            </div>

            <div className="space-y-1.5">
                {summary.trades.slice(0, 10).map((trade, i) => (
                    <div key={`${trade.ticker}-${trade.exitAt}-${i}`} className="flex items-center justify-between rounded-md bg-zinc-950/50 px-2.5 py-1.5 text-xs">
                        <span className="text-zinc-300">{trade.ticker} — {trade.qty}</span>
                        <span className="text-zinc-500">${trade.entryPrice.toFixed(2)} → ${trade.exitPrice.toFixed(2)}</span>
                        <span className={trade.realizedPnl >= 0 ? "font-semibold text-emerald-400" : "font-semibold text-red-400"}>
                            {trade.realizedPnl >= 0 ? "+" : ""}${trade.realizedPnl.toFixed(2)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

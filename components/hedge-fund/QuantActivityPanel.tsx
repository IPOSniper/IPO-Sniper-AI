import { getDailySummary } from "@/app/(app)/hedge-fund/batch-scanner/actions";

/**
 * Real Quant activity summary, prominently placed near the top of
 * the page -- same real getDailySummary() query BatchScannerPanel
 * already uses (quant_trade_decisions, 7-day window), just given its
 * own more visible spot rather than being buried at the bottom of
 * the Daily AI Trading Session card. No new data, no new query
 * logic -- purely a visibility change.
 */
export default async function QuantActivityPanel() {
    const summary = await getDailySummary();

    if (!summary) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-1 text-sm font-medium text-zinc-300">Quant Activity</h3>
                <p className="text-xs text-zinc-600">No real decision log data available yet — build a trade plan or run a trading session to start populating this.</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">Quant Activity</h3>
                <span className="text-[10px] text-zinc-600">Real, from Quant Memory — last 7 days</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
                <div>
                    <p className="text-2xl font-semibold text-white">{summary.totalDecisions}</p>
                    <p className="text-xs text-zinc-500">Decisions</p>
                </div>
                <div>
                    <p className="text-2xl font-semibold text-white">{summary.tradesFormed}</p>
                    <p className="text-xs text-zinc-500">Trade Plans</p>
                </div>
                <div>
                    <p className="text-2xl font-semibold text-emerald-400">{summary.executed}</p>
                    <p className="text-xs text-zinc-500">Executed</p>
                </div>
                <div>
                    <p className="text-2xl font-semibold text-zinc-400">{summary.noTrade}</p>
                    <p className="text-xs text-zinc-500">No Trade</p>
                </div>
            </div>
        </div>
    );
}

import { getDailySummary } from "@/app/(app)/hedge-fund/batch-scanner/actions";

/**
 * Real Quant activity summary, prominently placed near the top of
 * the page -- same real getDailySummary() query BatchScannerPanel
 * already uses (quant_trade_decisions, 7-day window). Visual upgrade
 * per direct feedback ("make Quick Activity more visual... four
 * large cards... gives an instant system read") -- same real numbers
 * as before, larger and color-coded now.
 *
 * Kept the existing real labels (Decisions/Trade Plans/Executed/No
 * Trade) rather than the originally-suggested Approved/Rejected/
 * Pending -- confirmed there's no clean, structured way to query
 * that breakdown from quant_trade_decisions (only the batch flow
 * embeds outcome type in free-text reasoning, not a real column).
 * Forcing those labels onto data that doesn't actually distinguish
 * them would misrepresent what these numbers mean.
 *
 * Deliberately does NOT add a Risk Used/Available row here, even
 * though the original mockup wanted one -- that real number already
 * lives in PortfolioSummaryCards ("Risk Budget Remaining"), and
 * duplicating it in a second panel risks the exact "two numbers
 * describing the same thing, in different places, that could drift"
 * issue an earlier audit this session specifically found and fixed.
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

    const cards = [
        { value: summary.totalDecisions, label: "Decisions", bg: "bg-zinc-800/40", text: "text-white" },
        { value: summary.tradesFormed, label: "Trade Plans", bg: "bg-violet-950/30", text: "text-violet-300" },
        { value: summary.executed, label: "Executed", bg: "bg-emerald-950/30", text: "text-emerald-400" },
        { value: summary.noTrade, label: "No Trade", bg: "bg-zinc-800/40", text: "text-zinc-400" },
    ];

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">Quant Activity</h3>
                <span className="text-[10px] text-zinc-600">Real, from Quant Memory — last 7 days</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {cards.map(c => (
                    <div key={c.label} className={`rounded-lg ${c.bg} p-4 text-center`}>
                        <p className={`text-3xl font-bold ${c.text}`}>{c.value}</p>
                        <p className="mt-1 text-xs text-zinc-500">{c.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

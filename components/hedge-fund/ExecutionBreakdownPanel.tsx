import { getExecutionBreakdown } from "@/app/(app)/hedge-fund/trade-timeline/actions";

/**
 * Real "Automation" measurement, distinct from "Capability" (System
 * Status) and "Effectiveness" (blocked on real trade-outcome
 * tracking -- not built). Answers: of what actually got executed,
 * how much required a human click vs. zero human involvement.
 *
 * Real 3-way source: Manual (typed/found a contract, no AI
 * suggestion involved), Assisted (human reviewed a real Quant
 * Strategist suggestion and clicked Execute), Autonomous (Batch
 * Scanner executed with zero human click). Only counts orders that
 * actually reached Alpaca (real broker_order_id), not risk-blocked
 * attempts -- those aren't "executions" by any of these categories.
 */
export default async function ExecutionBreakdownPanel() {
    const breakdown = await getExecutionBreakdown();

    if (!breakdown || breakdown.total === 0) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-1 text-sm font-medium text-zinc-300">Execution Breakdown</h3>
                <p className="text-xs text-zinc-600">No real executed orders yet.</p>
            </div>
        );
    }

    const rows = [
        { label: "Autonomous", value: breakdown.autonomous, color: "bg-emerald-500" },
        { label: "Assisted", value: breakdown.assisted, color: "bg-violet-500" },
        { label: "Manual", value: breakdown.manual, color: "bg-zinc-500" },
    ];

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-1 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">Execution Breakdown</h3>
                <span className="text-[10px] text-zinc-600">Real — "Automation," not "Effectiveness"</span>
            </div>
            <p className="mb-3 text-[10px] text-zinc-600">
                Of {breakdown.total} real executed orders: how much required a human click vs. zero human involvement.
            </p>
            <div className="space-y-2">
                {rows.map(r => {
                    const pct = breakdown.total > 0 ? (r.value / breakdown.total) * 100 : 0;
                    return (
                        <div key={r.label}>
                            <div className="mb-1 flex items-center justify-between text-xs">
                                <span className="text-zinc-300">{r.label}</span>
                                <span className="text-zinc-500">{r.value} ({pct.toFixed(0)}%)</span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                                <div className={`h-full rounded-full ${r.color}`} style={{ width: `${pct}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

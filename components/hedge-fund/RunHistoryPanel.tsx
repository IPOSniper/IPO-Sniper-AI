import { getRecentRuns } from "@/app/(app)/hedge-fund/batch-scanner/actions";

/**
 * Real Quant Run Ledger -- the actual, persisted answer to "did
 * Quant run, and what happened," not just the transient in-page
 * results table (which disappears on navigation). One real row per
 * runBatchScan() invocation, whether triggered manually (current
 * reality -- no scheduler exists yet) or eventually by a real
 * scheduler, once one exists.
 */
export default async function RunHistoryPanel() {
    const runs = await getRecentRuns(10);

    if (runs.length === 0) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-1 text-sm font-medium text-zinc-300">Run History</h3>
                <p className="text-xs text-zinc-600">No real Daily AI Trading Session runs logged yet.</p>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">Run History</h3>
                <span className="text-[10px] text-zinc-600">Real — each "Run Trading Session" click, persisted</span>
            </div>
            <div className="space-y-2">
                {runs.map(run => (
                    <div key={run.id} className="rounded-md bg-zinc-950/50 p-2.5 text-xs">
                        <div className="mb-1 flex items-center justify-between">
                            <span className={run.status === "completed" ? "font-medium text-emerald-400" : "font-medium text-red-400"}>
                                {run.status === "completed" ? "● Completed" : "● Failed"}
                            </span>
                            <span className="text-zinc-600">{new Date(run.startedAt).toLocaleString()}</span>
                        </div>
                        <p className="text-zinc-400">
                            {run.tickersCount} tickers · {run.decisionsCount} decisions · {run.tradePlansCount} trade plans · {run.riskApprovedCount} risk-approved · {run.ordersSubmittedCount} submitted ({run.ordersFilledCount} filled)
                        </p>
                        {run.error && <p className="mt-1 text-red-400">Error: {run.error}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}

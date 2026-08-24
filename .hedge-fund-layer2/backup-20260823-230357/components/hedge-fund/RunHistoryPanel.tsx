import { getRecentRuns } from "@/app/(app)/hedge-fund/batch-scanner/actions";
import RunHistoryRow from "@/components/hedge-fund/RunHistoryRow";

/**
 * Real Quant Run Ledger -- the actual, persisted answer to "did
 * Quant run, and what happened," not just the transient in-page
 * results table (which disappears on navigation). One real row per
 * runBatchScan() invocation, whether triggered manually (current
 * reality -- no scheduler exists yet) or eventually by a real
 * scheduler, once one exists. Each row is clickable (RunHistoryRow)
 * to drill into that specific run's real per-ticker decisions.
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
                <span className="text-[10px] text-zinc-600">Real — click a run to see its decisions</span>
            </div>
            <div className="space-y-2">
                {runs.map(run => (
                    <RunHistoryRow key={run.id} run={run} />
                ))}
            </div>
        </div>
    );
}

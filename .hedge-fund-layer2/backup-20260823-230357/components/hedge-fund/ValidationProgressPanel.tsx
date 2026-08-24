import { getTotalRunsCount } from "@/app/(app)/hedge-fund/batch-scanner/actions";
import { getClosedTradesSummary } from "@/app/(app)/hedge-fund/closed-trades/actions";

const TARGET = 100;

/**
 * Real, explicitly separate 100-cycle validation metrics --
 * "Autonomous Runs" (how many times the batch scanner actually ran)
 * vs. "Completed Trade Cycles" (how many trades went entry -> exit
 * -> realized outcome). These are deliberately NOT combined into one
 * number: a system that ran 50 times and correctly found no
 * opportunity 50 times is behaving completely differently from a
 * system that only ran 5 times because it kept failing to run at
 * all -- the same "5 trades" total would mean opposite things
 * depending on which of these is true, and only tracking them
 * separately can tell them apart.
 */
export default async function ValidationProgressPanel() {
    const [runsCount, closedSummary] = await Promise.all([
        getTotalRunsCount(),
        getClosedTradesSummary(),
    ]);

    const closedCount = closedSummary?.totalTrades ?? 0;
    const runsPct = Math.min(100, (runsCount / TARGET) * 100);
    const closedPct = Math.min(100, (closedCount / TARGET) * 100);

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">100-Cycle Validation Progress</h3>
                <span className="text-[10px] text-zinc-600">Real — two distinct counters, not combined</span>
            </div>

            <div className="mb-4">
                <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-zinc-300">Autonomous Runs</span>
                    <span className="font-semibold text-white">{runsCount} / {TARGET}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full rounded-full bg-violet-600" style={{ width: `${runsPct}%` }} />
                </div>
                <p className="mt-1 text-[10px] text-zinc-600">How many times the Daily AI Trading Session actually ran — whether or not it traded.</p>
            </div>

            <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-zinc-300">Completed Trade Cycles</span>
                    <span className="font-semibold text-white">{closedCount} / {TARGET}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: `${closedPct}%` }} />
                </div>
                <p className="mt-1 text-[10px] text-zinc-600">Real trades that went entry → exit → realized outcome. This is the number that determines whether Quant is actually effective.</p>
            </div>
        </div>
    );
}

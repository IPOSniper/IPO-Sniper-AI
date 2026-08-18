import { getWhileYouWereAway } from "@/app/(app)/hedge-fund/while-you-were-away/actions";

/**
 * Real "While You Were Away" panel -- Round 118's first piece.
 * Shows real, honest activity since the user's last real visit --
 * genuinely nothing fabricated. Returns null (renders nothing) on a
 * first-ever visit, since there's honestly nothing to compare
 * against yet.
 */
export default async function WhileYouWereAwayPanel() {
    const summary = await getWhileYouWereAway();

    if (!summary.lastVisitedAt) return null;

    const hasActivity = summary.materialEventsCount > 0 || summary.decisionsCount > 0;

    return (
        <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">While You Were Away</h3>
                <span className="text-[10px] text-zinc-600">Since {new Date(summary.lastVisitedAt).toLocaleString()}</span>
            </div>

            {!hasActivity ? (
                <p className="text-xs text-zinc-500">No new material events or decisions since your last visit.</p>
            ) : (
                <>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                            <p className="text-xl font-bold text-white">{summary.materialEventsCount}</p>
                            <p className="text-[10px] text-zinc-500">Material Events</p>
                        </div>
                        <div>
                            <p className="text-xl font-bold text-white">{summary.decisionsCount}</p>
                            <p className="text-[10px] text-zinc-500">Decisions</p>
                        </div>
                        <div>
                            <p className="text-xl font-bold text-white">{summary.tradePlansCount}</p>
                            <p className="text-[10px] text-zinc-500">Trade Plans</p>
                        </div>
                    </div>

                    {summary.biggestConvictionChange && (
                        <div className="mt-3 rounded-md bg-zinc-950/50 p-2.5 text-xs">
                            <p className="text-zinc-500">Biggest change</p>
                            <p className="mt-0.5 text-white">
                                <span className="font-medium">{summary.biggestConvictionChange.ticker}</span>
                                {" — confidence "}
                                {summary.biggestConvictionChange.previousConfidence} → {summary.biggestConvictionChange.currentConfidence}
                                <span className={summary.biggestConvictionChange.delta >= 0 ? "ml-1 text-emerald-400" : "ml-1 text-red-400"}>
                                    ({summary.biggestConvictionChange.delta >= 0 ? "+" : ""}{summary.biggestConvictionChange.delta})
                                </span>
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

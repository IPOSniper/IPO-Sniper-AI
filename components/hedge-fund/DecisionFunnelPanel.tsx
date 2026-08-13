import { getDailySummary } from "@/app/(app)/hedge-fund/batch-scanner/actions";

/**
 * Real decision funnel -- same real getDailySummary() data
 * QuantActivityPanel already shows, given a funnel visual instead of
 * flat cards, since a funnel specifically shows WHERE opportunities
 * get filtered out (a different real question than raw counts).
 *
 * Deliberately stops at 3 real stages (Decisions -> Trade Plans ->
 * Executed), not the full Research -> Committee -> Risk Engine ->
 * Position Monitoring -> Closed pipeline from the original proposal
 * -- those additional stages either aren't separately queryable as
 * structured counts (batch-scan reject/skip reasons are only shown
 * per-run, not stored as categorized counts) or depend on real
 * trade-closure tracking that doesn't exist. Real data only, no
 * placeholder stages.
 */
export default async function DecisionFunnelPanel() {
    const summary = await getDailySummary();

    if (!summary || summary.totalDecisions === 0) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <h3 className="mb-1 text-sm font-medium text-zinc-300">Decision Funnel</h3>
                <p className="text-xs text-zinc-600">No real decisions logged yet.</p>
            </div>
        );
    }

    const stages = [
        { label: "Decisions", value: summary.totalDecisions },
        { label: "Trade Plans Formed", value: summary.tradesFormed },
        { label: "Executed", value: summary.executed },
    ];
    const maxValue = stages[0].value;

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">Decision Funnel</h3>
                <span className="text-[10px] text-zinc-600">Real — last 7 days, from Quant Memory</span>
            </div>
            <p className="mb-3 text-[10px] text-zinc-600">
                "Trade Plans Formed" → "Executed" isn&apos;t an automatic gate — for single-ticker plans, execution requires an explicit human click by design (Assisted mode). Low or 0% here means plans are awaiting review, not that a filter is rejecting them.
            </p>
            <div className="space-y-3">
                {stages.map((stage, i) => {
                    const widthPct = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
                    return (
                        <div key={stage.label}>
                            <div className="mb-1 flex items-center justify-between text-xs">
                                <span className="text-zinc-300">{stage.label}</span>
                                <span className="font-semibold text-white">{stage.value}</span>
                            </div>
                            <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
                                <div
                                    className="h-full rounded-full bg-violet-600"
                                    style={{ width: `${Math.max(widthPct, stage.value > 0 ? 4 : 0)}%` }}
                                />
                            </div>
                            {i < stages.length - 1 && (
                                <p className="mt-1 text-[10px] text-zinc-600">
                                    {stages[i + 1].value} of {stage.value} continued ({stage.value > 0 ? ((stages[i + 1].value / stage.value) * 100).toFixed(0) : 0}%)
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

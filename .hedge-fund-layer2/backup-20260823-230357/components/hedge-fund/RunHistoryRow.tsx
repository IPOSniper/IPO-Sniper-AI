"use client";

import { useState } from "react";
import { getRunDetail, type QuantRun, type RunDecisionDetail } from "@/app/(app)/hedge-fund/batch-scanner/actions";

/**
 * Real, clickable drill-down for one run -- fetches the actual
 * per-ticker decisions linked to this run (via run_id, round82's
 * migration) on expand, not pre-loaded for every row up front. A
 * run with zero rows here (empty after loading) means either
 * genuinely nothing was decided, or -- for runs before round82 --
 * the historical decisions exist but have no run_id to link back to,
 * which the empty state below says directly rather than implying
 * "nothing happened."
 */
export default function RunHistoryRow({ run }: { run: QuantRun }) {
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [decisions, setDecisions] = useState<RunDecisionDetail[] | null>(null);

    async function handleToggle() {
        if (expanded) {
            setExpanded(false);
            return;
        }
        setExpanded(true);
        if (decisions === null) {
            setLoading(true);
            const result = await getRunDetail(run.id);
            setLoading(false);
            setDecisions(result);
        }
    }

    return (
        <div className="rounded-md bg-zinc-950/50 p-2.5 text-xs">
            <button type="button" onClick={handleToggle} className="w-full text-left">
                <div className="mb-1 flex items-center justify-between">
                    <span className={run.status === "completed" ? "font-medium text-emerald-400" : "font-medium text-red-400"}>
                        {run.status === "completed" ? "● Completed" : "● Failed"}
                        <span className="ml-2 text-zinc-600">{expanded ? "▾" : "▸"}</span>
                    </span>
                    <span className="text-zinc-600">{new Date(run.startedAt).toLocaleString()}</span>
                </div>
                <p className="text-zinc-400">
                    {run.tickersCount} tickers · {run.decisionsCount} decisions · {run.tradePlansCount} trade plans · {run.riskApprovedCount} risk-approved · {run.ordersSubmittedCount} submitted ({run.ordersFilledCount} filled)
                </p>
                {run.error && <p className="mt-1 text-red-400">Error: {run.error}</p>}
            </button>

            {expanded && (
                <div className="mt-2 space-y-1.5 border-t border-zinc-800 pt-2">
                    {loading && <p className="text-zinc-600">Loading real decisions…</p>}
                    {!loading && decisions && decisions.length === 0 && (
                        <p className="text-zinc-600">No individual decisions linked to this run — either it logged none, or (for runs before this drill-down existed) they can't be attributed back to it.</p>
                    )}
                    {!loading && decisions && decisions.map((d, i) => (
                        <div key={`${d.ticker}-${i}`} className="rounded bg-zinc-900 px-2 py-1.5">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-zinc-200">{d.ticker}</span>
                                <span className="text-zinc-500">
                                    {d.direction === "none" ? "No Trade" : d.direction} {d.tradeQualityScore !== null && `· Quality ${d.tradeQualityScore}/100`}
                                </span>
                            </div>
                            <p className="mt-0.5 text-[10px] text-zinc-600">
                                Confidence {d.committeeConfidence ?? "—"}% · Agreement {d.committeeAgreement ?? "—"}%
                            </p>
                            {d.reasoning && d.reasoning[0] && <p className="mt-0.5 text-[10px] text-zinc-500">{d.reasoning[0]}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

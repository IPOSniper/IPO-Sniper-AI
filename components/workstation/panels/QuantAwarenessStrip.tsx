"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getQuantControlState, type QuantControlStatus } from "@/app/(app)/hedge-fund/quant-control/actions";
import { getQuantFunnelSummary, type QuantFunnelSummary } from "@/app/(app)/hedge-fund/quant-funnel-summary";

/**
 * Corrects a scope error: the Workstation previously duplicated
 * Hedge Fund's full Quant Live Desk (funnel, rejection breakdown,
 * activity feed) and Portfolio/Execution sections. Workstation's job
 * is "what is happening," not "what is Quant doing" -- that detailed
 * operational view belongs on /hedge-fund, which already has it in
 * full. This strip is Workstation-appropriate: status + a couple of
 * headline numbers + a link out, nothing more.
 *
 * No opportunities list here -- there is still no confirmed
 * UI-facing accessor for Opportunity Engine data (same gap flagged
 * when Quant Live Desk was first built). Never fabricate one.
 */
function statusColor(state: QuantControlStatus["state"]): string {
    if (state === "AUTONOMOUS") return "bg-emerald-500";
    if (state === "ASSISTED") return "bg-amber-500";
    if (state === "SAFE_MODE") return "bg-amber-600";
    if (state === "EMERGENCY_STOP") return "bg-red-600";
    return "bg-zinc-600";
}

export default function QuantAwarenessStrip() {
    const [status, setStatus] = useState<QuantControlStatus | null>(null);
    const [summary, setSummary] = useState<QuantFunnelSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getQuantControlState(), getQuantFunnelSummary()])
            .then(([s, f]) => {
                setStatus(s);
                setSummary(f);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Quant</p>
                <Link href="/hedge-fund" className="text-[11px] text-violet-400 hover:text-violet-300">
                    Open Hedge Fund &rarr;
                </Link>
            </div>
            {loading || !status ? (
                <p className="mt-2 text-sm text-zinc-600">Loading...</p>
            ) : (
                <div className="mt-2 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${statusColor(status.state)}`} />
                        <span className="text-sm font-semibold text-zinc-300">{status.state}</span>
                    </div>
                    {summary && (
                        <>
                            <div className="text-sm text-zinc-500">
                                Decisions <span className="text-zinc-300">{summary.decisions ?? "Unavailable"}</span>
                            </div>
                            <div className="text-sm text-zinc-500">
                                Plans <span className="text-zinc-300">{summary.plans ?? "Unavailable"}</span>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}